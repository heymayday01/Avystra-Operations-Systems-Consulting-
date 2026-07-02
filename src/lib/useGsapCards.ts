"use client";

import { useEffect, useRef, type RefObject } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { usePageReady } from "@/lib/pageReady";

gsap.registerPlugin(ScrollTrigger);

/**
 * useGsapCards — GSAP ScrollTrigger-powered staggered card reveals.
 *
 * Uses ScrollTrigger.batch() for premium staggered card entrances.
 * Cards animate in as they enter the viewport, with per-card stagger.
 *
 * SAFETY DESIGN:
 * - Gated on pageReady (waits for loading screen).
 * - Reduced motion: sets all cards visible immediately.
 * - Cleanup: gsap.context kills only its own tweens/triggers.
 *
 * USAGE:
 *   const gridRef = useGsapCards<HTMLDivElement>();
 *   <div ref={gridRef}>
 *     <div className="card">Card 1</div>
 *     <div className="card">Card 2</div>
 *     <div className="card">Card 3</div>
 *   </div>
 *
 * The hook animates direct children of the ref'd element.
 */

export interface GsapCardsOptions {
  /** Stagger between cards (seconds). Default: 0.08 */
  stagger?: number;
  /** Duration per card (seconds). Default: 0.48 */
  duration?: number;
  /** Y distance (px). Default: 24 */
  y?: number;
  /** ScrollTrigger start position. Default: "top 85%" */
  start?: string;
  /** Selector for card elements (default: direct children) */
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

  useEffect(() => {
    if (!pageReady) return;

    const el = ref.current;
    if (!el) return;

    const {
      stagger = 0.08,
      duration = 0.48,
      y = 24,
      start = "top 85%",
      cardSelector,
    } = options;

    const cards = cardSelector
      ? Array.from(el.querySelectorAll<HTMLElement>(cardSelector))
      : Array.from(el.children) as HTMLElement[];

    if (cards.length === 0) return;

    // Reduced motion: set all visible
    if (prefersReducedMotion()) {
      gsap.set(cards, { opacity: 1, y: 0, clearProps: "all" });
      return;
    }

    // Set initial state (hidden)
    gsap.set(cards, { opacity: 0, y });

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
