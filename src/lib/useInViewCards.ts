"use client";

import { useEffect, useRef, type RefObject } from "react";
import { usePageReady } from "@/lib/pageReady";

/**
 * useInViewCards — best-in-class staggered card grid reveal.
 *
 * IntersectionObserver-based (no GSAP), works on mobile + desktop.
 * Staggers the reveal of child cards as the grid enters the viewport.
 *
 * PERFORMANCE OPTIMIZATIONS (same as useInViewReveal):
 * - NO getBoundingClientRect() for in-view check
 * - is-revealing lifecycle: will-change scoped to animating elements only
 * - --reveal-delay CSS custom property (set inline, no attribute parsing)
 * - rootMargin pre-fires reveals before element is fully visible
 * - threshold: 0 = fire as soon as ANY part of the container is visible
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

    // Mark each card for CSS reveal with staggered delay via custom property
    cards.forEach((card, index) => {
      card.setAttribute("data-reveal", "");
      card.style.setProperty("--reveal-delay", `${index * stagger}s`);
    });

    // Reduced motion: show all immediately
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      cards.forEach((card) => card.classList.add("is-visible"));
      return;
    }

    // The reveal lifecycle: add is-visible + is-revealing, then remove
    // is-revealing after transition completes. Scopes will-change to
    // only the animating elements → minimal memory pressure.
    const revealCards = () => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          cards.forEach((card) => {
            card.classList.add("is-visible", "is-revealing");
          });
          // Remove is-revealing after transition completes.
          // Account for stagger: last card starts at (count * stagger) seconds,
          // then takes 0.6s to animate. Add 100ms buffer.
          const maxStagger = cards.length * stagger * 1000;
          const cleanupDelay = Math.max(700, maxStagger + 700);
          const cleanupTimer = setTimeout(() => {
            cards.forEach((card) => card.classList.remove("is-revealing"));
          }, cleanupDelay);
          (el as unknown as { _revealCleanupTimer?: ReturnType<typeof setTimeout> })._revealCleanupTimer = cleanupTimer;
        });
      });
    };

    // IntersectionObserver on the CONTAINER — when it enters, reveal all cards
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            revealCards();
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0, rootMargin: "0px 0px -10% 0px" }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
      const timer = (el as unknown as { _revealCleanupTimer?: ReturnType<typeof setTimeout> })._revealCleanupTimer;
      if (timer) clearTimeout(timer);
    };
  }, [pageReady, stagger, cardSelector]);

  return ref;
}

export default useInViewCards;
