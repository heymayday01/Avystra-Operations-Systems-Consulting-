"use client";

import { useEffect, useRef, type RefObject } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { usePageReady } from "@/lib/pageReady";

/**
 * useParallax — subtle scroll-linked parallax using GSAP ScrollTrigger.
 *
 * SAFETY DESIGN:
 * - NEVER sets opacity:0 or any hidden state (unlike the old useScrollReveal).
 * - Only applies a subtle translateY based on scroll progress.
 * - Elements are always visible — parallax is purely additive movement.
 * - Uses `scrub: true` for buttery scroll-linked motion (no jitter).
 * - Respects prefers-reduced-motion (no movement).
 * - Cleans up ScrollTrigger on unmount.
 *
 * Usage:
 *   const ref = useParallax<HTMLDivElement>({ distance: 30 });
 *   <div ref={ref}>...</div>
 *
 * The element will translate up to ±distance/2 px based on its scroll
 * position relative to the viewport. At viewport center → 0px translate.
 * Approaching top/bottom of viewport → ±distance/2 translate.
 *
 * @param distance Total travel distance in px (default 30 = ±15px movement)
 */

export interface ParallaxOptions {
  /** Total travel distance in px (default 30 = ±15px). Keep subtle. */
  distance?: number;
  /** ScrollTrigger start position (default "top bottom" = when element enters viewport) */
  start?: string;
  /** ScrollTrigger end position (default "bottom top" = when element leaves viewport) */
  end?: string;
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function useParallax<T extends HTMLElement = HTMLDivElement>(
  options: ParallaxOptions = {}
): RefObject<T> {
  const ref = useRef<T>(null);
  const pageReady = usePageReady();

  useEffect(() => {
    // Wait for pageReady (loading screen done) before starting parallax.
    if (!pageReady) return;

    const el = ref.current;
    if (!el) return;

    // Reduced motion: no parallax
    if (prefersReducedMotion()) return;

    const {
      distance = 30,
      start = "top bottom",
      end = "bottom top",
    } = options;

    // Use gsap.context for automatic cleanup
    const ctx = gsap.context(() => {
      gsap.to(el, {
        y: () => -distance,
        ease: "none",
        scrollTrigger: {
          trigger: el,
          start,
          end,
          scrub: 0.5, // 0.5s lag = smooth, not instant
        },
      });
    }, el);

    return () => ctx.revert();
  }, [pageReady]);

  return ref;
}

export default useParallax;
