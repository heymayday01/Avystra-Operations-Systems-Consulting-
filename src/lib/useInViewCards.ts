"use client";

import { useEffect, useRef, type RefObject } from "react";
import { usePageReady } from "@/lib/pageReady";

/**
 * useInViewCards — Apple-style staggered card grid reveal.
 *
 * IntersectionObserver-based (no GSAP), works on mobile + desktop.
 * Staggers the reveal of child cards as the grid enters the viewport.
 *
 * HOW IT WORKS:
 * - Each child card gets `data-reveal` + a `data-reveal-delay` based on index
 * - When the GRID container enters the viewport, all cards are marked
 *   `is-visible` — the CSS transition-delay handles the stagger
 * - GPU-composited, zero JS per frame after the initial reveal
 *
 * APPLE-INSPIRED:
 * - Stagger 80ms per card (premium cascade feel)
 * - Same cubic-bezier easing as useInViewReveal (consistency)
 * - Fire-once (unobserves after first intersection)
 */
export function useInViewCards<T extends HTMLElement = HTMLDivElement>(
  options: { stagger?: number; cardSelector?: string } = {}
): RefObject<T | null> {
  const ref = useRef<T>(null);
  const pageReady = usePageReady();
  const { stagger = 0.08, cardSelector } = options;

  useEffect(() => {
    if (!pageReady) return;
    const el = ref.current;
    if (!el) return;

    const cards = cardSelector
      ? Array.from(el.querySelectorAll<HTMLElement>(cardSelector))
      : (Array.from(el.children) as HTMLElement[]);

    if (cards.length === 0) return;

    // Mark each card for CSS reveal with staggered delay
    cards.forEach((card, index) => {
      card.setAttribute("data-reveal", "");
      // Stagger: 80ms per card, capped at 5 slots (400ms max)
      const slot = Math.min(5, Math.max(1, Math.round((index * stagger * 1000) / 80) + 1));
      card.setAttribute("data-reveal-delay", String(slot));
    });

    // Reduced motion: show all immediately
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      cards.forEach((card) => card.classList.add("is-visible"));
      return;
    }

    // Check if any card is already in viewport (above the fold)
    const anyInView = cards.some((card) => {
      const rect = card.getBoundingClientRect();
      return rect.top < window.innerHeight * 0.85 && rect.bottom > 0;
    });

    if (anyInView) {
      // Reveal all with double-rAF so transition plays
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          cards.forEach((card) => card.classList.add("is-visible"));
        });
      });
      return;
    }

    // IntersectionObserver on the CONTAINER — when it enters, reveal all cards
    // (the CSS transition-delay handles the stagger)
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
      {
        threshold: 0.1,
        rootMargin: "0px 0px -10% 0px",
      }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, [pageReady, stagger, cardSelector]);

  return ref;
}

export default useInViewCards;
