"use client";

import { useEffect, useRef, type RefObject } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { usePageReady } from "@/lib/pageReady";

gsap.registerPlugin(ScrollTrigger);

/**
 * useGsapReveal — GSAP ScrollTrigger-powered scroll reveal.
 *
 * FLASH PREVENTION:
 * - On mount (before pageReady), elements are immediately hidden via gsap.set().
 *   This prevents the flash where content appears, then disappears, then animates in.
 * - When pageReady fires (after loading screen), gsap.to() animates them to visible.
 * - For below-the-fold elements, ScrollTrigger handles the timing.
 *
 * SAFETY:
 * - If pageReady never fires, elements stay hidden (but the loading screen
 *   timeout at 1.3s ensures pageReady always fires).
 * - Reduced motion: elements set visible immediately, no tweens.
 * - Cleanup: gsap.context kills only its own tweens/triggers.
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
): RefObject<T> {
  const ref = useRef<T>(null);
  const pageReady = usePageReady();

  // PHASE 1: Immediately hide the element on mount (prevents flash).
  // This runs before pageReady — the element is hidden from the first paint.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion()) return; // Don't hide for reduced-motion users

    if (mode === "words") {
      // For words mode, we can't split yet (text nodes need to be ready).
      // Just hide the container — splitting happens in phase 2.
      gsap.set(el, { opacity: 0 });
    } else {
      gsap.set(el, { opacity: 0, y: options.y ?? 16 });
    }
  }, [mode]);

  // PHASE 2: Animate to visible when pageReady fires.
  useEffect(() => {
    if (!pageReady) return;

    const el = ref.current;
    if (!el) return;

    // Reduced motion: set visible immediately
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
          // Fallback to fade
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
        // Show the container, animate words from hidden
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
        // fade — animate from hidden (set in phase 1) to visible
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
      }
    }, el);

    return () => ctx.revert();
  }, [pageReady, mode]);

  return ref;
}

export default useGsapReveal;
