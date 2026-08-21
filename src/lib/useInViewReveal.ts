"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { usePageReady } from "@/lib/pageReady";

/**
 * useInViewReveal — Apple-style IntersectionObserver scroll reveal.
 *
 * This is the mobile-first reveal system. It works WITHOUT GSAP ScrollTrigger
 * or Lenis, so it works on touch devices where Lenis is disabled and where
 * `content-visibility: auto` would break ScrollTrigger's getBoundingClientRect.
 *
 * HOW IT WORKS:
 * - The element gets `data-reveal` attribute (CSS hides it: opacity 0 + translateY 24px)
 * - When IntersectionObserver sees the element enter the viewport, it adds
 *   the `is-visible` class → CSS transition plays (opacity 1 + translateY 0)
 * - GPU-composited (transform + opacity only), zero JS per frame
 * - Fire-once (unobserves after first intersection)
 *
 * APPLE-INSPIRED:
 * - cubic-bezier(0.16, 1, 0.3, 1) easing — the "expo-out" Apple uses everywhere
 * - 0.7s duration — premium, not rushed
 * - 24px translateY — subtle, not jumpy
 * - threshold 0.15 — fires when 15% of the element is visible (feels natural)
 * - rootMargin "0px 0px -10% 0px" — fires slightly before fully in view
 *
 * REDUCED MOTION: CSS handles it — [data-reveal] is forced visible.
 */
export function useInViewReveal<T extends HTMLElement = HTMLElement>(
  options: { delay?: number; stagger?: number } = {}
): RefObject<T | null> {
  const ref = useRef<T>(null);
  const pageReady = usePageReady();
  const { delay = 0, stagger = 0 } = options;

  useEffect(() => {
    if (!pageReady) return;
    const el = ref.current;
    if (!el) return;

    // Mark for CSS reveal
    el.setAttribute("data-reveal", "");
    if (delay > 0) {
      // Map delay (seconds) to the closest stagger slot (1-5 = 80-400ms)
      const slot = Math.min(5, Math.max(1, Math.round((delay * 1000) / 80)));
      el.setAttribute("data-reveal-delay", String(slot));
    }

    // Reduced motion: show immediately
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.classList.add("is-visible");
      return;
    }

    // If already in viewport (above the fold after pageReady), reveal immediately
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.85 && rect.bottom > 0) {
      // Small rAF delay so the transition plays (not instant)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => el.classList.add("is-visible"));
      });
      return;
    }

    // IntersectionObserver — fire once when element enters viewport
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Double-rAF ensures the browser paints the hidden state first,
            // so the transition plays instead of jumping to visible.
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                entry.target.classList.add("is-visible");
              });
            });
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.15,
        rootMargin: "0px 0px -10% 0px",
      }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, [pageReady, delay, stagger]);

  return ref;
}

export default useInViewReveal;
