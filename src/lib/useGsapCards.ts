"use client";

import { useEffect, useRef, type RefObject } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { usePageReady } from "@/lib/pageReady";

/**
 * useGsapCards — staggered card grid reveal that works on ALL devices.
 *
 * DUAL-MODE (Apple-inspired):
 * - DESKTOP (non-touch): GSAP ScrollTrigger.batch (synced with Lenis).
 *   Premium lerp-smoothed staggered card reveals.
 * - MOBILE/TOUCH: IntersectionObserver on the container — when it enters
 *   the viewport, all cards are marked is-visible. CSS transition-delay
 *   handles the stagger. GPU-cheap, no scroll listener, works on native.
 *
 * FLASH PREVENTION:
 * - Phase 1: On mount (before pageReady), cards are hidden (desktop: gsap.set,
 *   mobile: CSS [data-reveal] attribute).
 * - Phase 2: When pageReady fires, the appropriate reveal system animates them.
 *
 * SAFETY:
 * - Reduced motion: cards set visible immediately.
 * - Cleanup: gsap.context kills only its own tweens/triggers (desktop only).
 */

export interface GsapCardsOptions {
  stagger?: number;
  duration?: number;
  y?: number;
  start?: string;
  cardSelector?: string;
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

export function useGsapCards<T extends HTMLElement = HTMLDivElement>(
  options: GsapCardsOptions = {}
): RefObject<T | null> {
  const ref = useRef<T>(null);
  const pageReady = usePageReady();
  const { y = 24, cardSelector } = options;

  // PHASE 1: Immediately hide cards on mount (prevents flash)
  // Desktop: gsap.set. Mobile: CSS [data-reveal] (handled in phase 2).
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion()) return;
    if (isTouchDevice()) return; // Mobile uses CSS [data-reveal] set in phase 2

    const cards = cardSelector
      ? Array.from(el.querySelectorAll<HTMLElement>(cardSelector))
      : (Array.from(el.children) as HTMLElement[]);

    gsap.set(cards, { opacity: 0, y });
  }, [cardSelector, y]);

  // PHASE 2: Animate to visible when pageReady fires
  useEffect(() => {
    if (!pageReady) return;
    const el = ref.current;
    if (!el) return;

    const cards = cardSelector
      ? Array.from(el.querySelectorAll<HTMLElement>(cardSelector))
      : (Array.from(el.children) as HTMLElement[]);

    if (cards.length === 0) return;

    // Reduced motion: set all visible
    if (prefersReducedMotion()) {
      gsap.set(cards, { opacity: 1, y: 0, clearProps: "all" });
      return;
    }

    // ── MOBILE/TOUCH: IntersectionObserver + CSS stagger ──
    if (isTouchDevice()) {
      // Mark each card for CSS reveal with staggered delay
      cards.forEach((card, index) => {
        card.setAttribute("data-reveal", "");
        const slot = Math.min(5, Math.max(1, Math.round((index * (options.stagger ?? 0.08) * 1000) / 80) + 1));
        card.setAttribute("data-reveal-delay", String(slot));
      });

      // Check if any card is already in viewport (above the fold)
      const anyInView = cards.some((card) => {
        const rect = card.getBoundingClientRect();
        return rect.top < window.innerHeight * 0.85 && rect.bottom > 0;
      });

      if (anyInView) {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            cards.forEach((card) => card.classList.add("is-visible"));
          });
        });
        return;
      }

      // IntersectionObserver on the container — when it enters, reveal all cards
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                  cards.forEach((card) => card.classList.add("is-visible"));
                });
              });
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.1, rootMargin: "0px 0px -10% 0px" }
      );

      observer.observe(el);
      return () => observer.disconnect();
    }

    // ── DESKTOP: GSAP ScrollTrigger.batch ──
    const {
      stagger = 0.08,
      duration = 0.48,
      y: yVal = 24,
      start = "top 85%",
    } = options;

    const ctx = gsap.context(() => {
      ScrollTrigger.batch(cards, {
        start,
        onEnter: (batch) => {
          gsap.to(batch, {
            opacity: 1,
            y: 0,
            duration,
            ease: "power3.out",
            stagger,
            clearProps: "transform",
          });
        },
        once: true,
      });
    }, el);

    return () => ctx.revert();
  }, [pageReady]);

  return ref;
}

export default useGsapCards;

