"use client";

import { useEffect, useRef, type RefObject } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { usePageReady } from "@/lib/pageReady";

/**
 * useGsapReveal — scroll reveal that works on ALL devices.
 *
 * DUAL-MODE (Apple-inspired):
 * - DESKTOP (non-touch): GSAP ScrollTrigger (synced with Lenis via scrollerProxy).
 *   Premium lerp-smoothed reveals that match the smooth-scroll feel.
 * - MOBILE/TOUCH: IntersectionObserver via useInViewReveal.
 *   Works without Lenis, without ScrollTrigger, without getBoundingClientRect
 *   dependencies — so it works perfectly on native touch scrolling.
 *
 * FLASH PREVENTION:
 * - On mount (before pageReady), elements are immediately hidden.
 * - When pageReady fires, the appropriate reveal system animates them to visible.
 *
 * SAFETY:
 * - Reduced motion: elements set visible immediately.
 * - Cleanup: gsap.context kills only its own tweens/triggers (desktop only).
 */

export type RevealMode = "fade" | "words";

export interface GsapRevealOptions {
  delay?: number;
  duration?: number;
  stagger?: number;
  start?: string;
  y?: number;
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function isTouchDevice(): boolean {
  if (typeof window === "undefined") return false;
  return (
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0 ||
    window.matchMedia("(pointer: coarse)").matches
  );
}

function splitWords(el: HTMLElement): HTMLElement[] {
  const wordInners: HTMLElement[] = [];

  function walk(node: Node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent;
      if (!text || !text.trim()) return;

      const parts = text.split(/(\s+)/);
      const frag = document.createDocumentFragment();

      for (const part of parts) {
        if (part.trim()) {
          const outer = document.createElement("span");
          outer.style.cssText =
            "display:inline-block;overflow:hidden;vertical-align:bottom";
          const inner = document.createElement("span");
          inner.style.cssText = "display:inline-block";
          inner.textContent = part;
          outer.appendChild(inner);
          frag.appendChild(outer);
          wordInners.push(inner);
        } else if (part.length > 0) {
          frag.appendChild(document.createTextNode(part));
        }
      }
      node.parentNode?.replaceChild(frag, node);
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const elem = node as Element;
      if (elem.tagName === "SVG" || elem.hasAttribute("data-no-split")) return;
      Array.from(node.childNodes).forEach(walk);
    }
  }

  Array.from(el.childNodes).forEach(walk);
  return wordInners;
}

export function useGsapReveal<T extends HTMLElement = HTMLElement>(
  mode: RevealMode = "fade",
  options: GsapRevealOptions = {}
): RefObject<T | null> {
  // Single ref that both systems can use. On touch, useInViewReveal's
  // IntersectionObserver attaches to the same element. On desktop, GSAP
  // gsap.set() + ScrollTrigger attach to the same element.
  const ref = useRef<T>(null);
  const pageReady = usePageReady();

  // ── MOBILE/TOUCH: IntersectionObserver-based reveal ──
  // We run useInViewReveal's logic inline here (not via the hook) so we
  // share the SAME ref. This avoids the dual-ref problem.
  useEffect(() => {
    if (!pageReady) return;
    if (!isTouchDevice()) return; // Desktop uses GSAP below
    if (prefersReducedMotion()) return;

    const el = ref.current;
    if (!el) return;

    // Mark for CSS reveal
    el.setAttribute("data-reveal", "");
    if (options.delay && options.delay > 0) {
      const slot = Math.min(5, Math.max(1, Math.round((options.delay * 1000) / 80)));
      el.setAttribute("data-reveal-delay", String(slot));
    }

    // If already in viewport (above the fold), reveal immediately
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.85 && rect.bottom > 0) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => el.classList.add("is-visible"));
      });
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                entry.target.classList.add("is-visible");
              });
            });
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -10% 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [pageReady, options.delay]);

  // ── DESKTOP: GSAP ScrollTrigger reveal ──
  // PHASE 1: Immediately hide the element on mount (prevents flash).
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion()) return;
    if (isTouchDevice()) return; // Mobile uses IntersectionObserver above

    if (mode === "words") {
      gsap.set(el, { opacity: 0 });
    } else {
      gsap.set(el, { opacity: 0, y: options.y ?? 16 });
    }
  }, [mode]);

  // PHASE 2: Animate to visible when pageReady fires (DESKTOP ONLY).
  useEffect(() => {
    if (!pageReady) return;
    if (isTouchDevice()) return;

    const el = ref.current;
    if (!el) return;

    if (prefersReducedMotion()) {
      gsap.set(el, { opacity: 1, y: 0, clearProps: "all" });
      return;
    }

    const {
      delay = 0,
      duration,
      stagger = 0.06,
      start = "top 87%",
      y = 16,
    } = options;

    const ctx = gsap.context(() => {
      if (mode === "words") {
        const wordInners = splitWords(el);
        if (wordInners.length === 0) {
          gsap.to(el, {
            opacity: 1,
            y: 0,
            duration: duration || 0.48,
            ease: "power3.out",
            delay,
            scrollTrigger: {
              trigger: el,
              start,
              toggleActions: "play none none none",
            },
          });
          return;
        }
        gsap.set(el, { opacity: 1 });
        gsap.set(wordInners, { yPercent: 110 });
        gsap.to(wordInners, {
          yPercent: 0,
          duration: duration || 0.6,
          ease: "power4.out",
          stagger,
          delay,
          scrollTrigger: {
            trigger: el,
            start,
            toggleActions: "play none none none",
          },
        });
      } else {
        gsap.to(el, {
          opacity: 1,
          y: 0,
          duration: duration || 0.48,
          ease: "power3.out",
          delay,
          clearProps: "transform",
          scrollTrigger: {
            trigger: el,
            start,
            toggleActions: "play none none none",
          },
        });
      }
    }, el);

    return () => ctx.revert();
  }, [pageReady, mode]);

  return ref;
}

export default useGsapReveal;

