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
    // Best-in-class: is-revealing lifecycle, --reveal-delay custom property,
    // rootMargin pre-fires, no getBoundingClientRect() for the in-view check.
    if (isTouchDevice()) {
      // Mark each card for CSS reveal with staggered delay via custom property
      const staggerSec = options.stagger ?? 0.08;
      cards.forEach((card, index) => {
        card.setAttribute("data-reveal", "");
        card.style.setProperty("--reveal-delay", `${index * staggerSec}s`);
      });

      // The reveal lifecycle: add is-visible + is-revealing, then remove
      // is-revealing after transition completes. Scopes will-change to
      // only the animating elements → minimal memory.
      const revealCards = () => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            cards.forEach((card) => {
              card.classList.add("is-visible", "is-revealing");
            });
            // Remove is-revealing after transition completes (600ms + buffer
            // for the last staggered card: 5 * 80ms = 400ms + 600ms = 1000ms)
            const maxStagger = cards.length * staggerSec * 1000;
            const cleanupDelay = Math.max(700, maxStagger + 700);
            const cleanupTimer = setTimeout(() => {
              cards.forEach((card) => card.classList.remove("is-revealing"));
            }, cleanupDelay);
            (el as unknown as { _revealCleanupTimer?: ReturnType<typeof setTimeout> })._revealCleanupTimer = cleanupTimer;
          });
        });
      };

      // IntersectionObserver on the container — when it enters, reveal all cards
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

