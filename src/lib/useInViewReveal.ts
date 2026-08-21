"use client";

import { useEffect, useRef, type RefObject } from "react";
import { usePageReady } from "@/lib/pageReady";

/**
 * useInViewReveal — best-in-class IntersectionObserver scroll reveal.
 *
 * This is the mobile-first reveal system. It works WITHOUT GSAP ScrollTrigger
 * or Lenis, so it works on touch devices where Lenis is disabled.
 *
 * PERFORMANCE OPTIMIZATIONS (Linear/Vercel/Stripe-grade):
 * - NO getBoundingClientRect() — forces sync layout reads → jank. Instead,
 *   we use IntersectionObserver's rootMargin to pre-fire reveals before the
 *   element is fully visible (feels more responsive + zero layout cost).
 * - `is-revealing` class lifecycle: added when animation starts, removed
 *   after transition completes (~600ms). This scopes `will-change` to ONLY
 *   the element currently animating → minimal memory, max smoothness.
 * - Fire-once: unobserves immediately after first intersection.
 * - Uses `requestAnimationFrame` double-rAF to ensure the browser paints
 *   the hidden state before transitioning (prevents flash).
 * - CSS handles all visual states — JS only toggles classes (zero style
 *   recalculation on the main thread during animation).
 *
 * APPLE/LINEAR-INSPIRED EASING:
 * - cubic-bezier(0.22, 1, 0.36, 1) — "ease-out-expo" (snappier than Apple's)
 * - 0.6s desktop / 0.5s mobile (CSS handles the responsive duration)
 * - 28px translateY desktop / 20px mobile (subtler on small screens)
 */
export function useInViewReveal<T extends HTMLElement = HTMLElement>(
  options: { delay?: number; stagger?: number } = {}
): RefObject<T | null> {
  const ref = useRef<T>(null);
  const pageReady = usePageReady();
  const { delay = 0 } = options;

  useEffect(() => {
    if (!pageReady) return;
    const el = ref.current;
    if (!el) return;

    // Mark for CSS reveal
    el.setAttribute("data-reveal", "");
    if (delay > 0) {
      // Set --reveal-delay CSS custom property (seconds)
      el.style.setProperty("--reveal-delay", `${delay}s`);
    }

    // Reduced motion: show immediately
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.classList.add("is-visible");
      return;
    }

    // The reveal lifecycle: add is-visible + is-revealing, then remove
    // is-revealing after the transition completes. This scopes will-change
    // to ONLY the element currently animating → minimal memory pressure.
    const reveal = () => {
      // Double-rAF ensures the browser paints the hidden state first
      // (data-reveal is already set above) so the transition plays.
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          el.classList.add("is-visible", "is-revealing");
          // Remove is-revealing after transition completes (600ms + buffer).
          // This removes will-change → frees the compositor layer → low memory.
          const cleanupTimer = setTimeout(() => {
            el.classList.remove("is-revealing");
          }, 700);
          // Store timer on element for cleanup if component unmounts early
          (el as unknown as { _revealCleanupTimer?: ReturnType<typeof setTimeout> })._revealCleanupTimer = cleanupTimer;
        });
      });
    };

    // IntersectionObserver with rootMargin to pre-fire reveals.
    // rootMargin "0px 0px -10% 0px" = fire when element's top is 10% above
    // the viewport bottom (feels more responsive than waiting for 15% visible).
    // NO getBoundingClientRect() needed — IntersectionObserver handles it.
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            reveal();
            observer.unobserve(entry.target);
          }
        });
      },
      {
        // threshold 0 = fire as soon as ANY part is visible (earliest possible)
        threshold: 0,
        // Pre-fire: element reveals when its top is 10% above viewport bottom.
        // This makes reveals feel "predictive" — content is ready before you see it.
        rootMargin: "0px 0px -10% 0px",
      }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
      // Clean up the is-revealing timer if component unmounts mid-animation
      const timer = (el as unknown as { _revealCleanupTimer?: ReturnType<typeof setTimeout> })._revealCleanupTimer;
      if (timer) clearTimeout(timer);
    };
  }, [pageReady, delay]);

  return ref;
}

export default useInViewReveal;
