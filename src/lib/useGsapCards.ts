"use client";

import { useEffect, useRef, type RefObject } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { usePageReady } from "@/lib/pageReady";

gsap.registerPlugin(ScrollTrigger);

/**
 * useGsapCards — GSAP ScrollTrigger-powered staggered card reveals.
 *
 * FLASH PREVENTION:
 * - Phase 1: On mount (before pageReady), cards are immediately hidden via gsap.set().
 * - Phase 2: When pageReady fires, ScrollTrigger.batch animates them to visible.
 *
 * SAFETY:
 * - Reduced motion: cards set visible immediately.
 * - Cleanup: gsap.context kills only its own tweens/triggers.
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

export function useGsapCards<T extends HTMLElement = HTMLDivElement>(
  options: GsapCardsOptions = {}
): RefObject<T> {
  const ref = useRef<T>(null);
  const pageReady = usePageReady();
  const { y = 24, cardSelector } = options;

  // PHASE 1: Immediately hide cards on mount (prevents flash)
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion()) return;

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

    const {
      stagger = 0.08,
      duration = 0.48,
      y: yVal = 24,
      start = "top 85%",
      cardSelector: sel,
    } = options;

    const cards = sel
      ? Array.from(el.querySelectorAll<HTMLElement>(sel))
      : (Array.from(el.children) as HTMLElement[]);

    if (cards.length === 0) return;

    // Reduced motion: set all visible
    if (prefersReducedMotion()) {
      gsap.set(cards, { opacity: 1, y: 0, clearProps: "all" });
      return;
    }

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
