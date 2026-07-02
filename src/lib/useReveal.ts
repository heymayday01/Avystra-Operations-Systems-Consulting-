"use client";

import { useEffect, useRef, type RefObject } from "react";
import { usePageReady } from "@/lib/pageReady";
import { register } from "@/lib/revealPool";

/**
 * useReveal — the site-wide scroll-reveal primitive.
 *
 * SAFETY DESIGN:
 * This hook NEVER sets opacity:0 or any hidden state in JavaScript.
 * It only ADDS the `.is-revealed` class when an element enters the viewport.
 * The initial hidden state is controlled purely by CSS (`.reveal` class),
 * which is gated behind a `.js` + `.page-ready` class on <html>.
 *
 * PERFORMANCE:
 * Uses a SHARED IntersectionObserver (revealPool.ts) — one observer for
 * ALL reveal elements on the page, not one per element. Previously each
 * useReveal call created its own observer (50+ instances).
 *
 * SPEC:
 * - opacity 0→1 + translateY(16px→0) [var(--reveal-distance)]
 * - Duration: 480ms cubic-bezier(0.16, 1, 0.3, 1) [var(--dur-entrance)]
 * - Stagger: 60ms between child elements [var(--stagger)]
 * - IntersectionObserver threshold: 0.15
 * - prefers-reduced-motion: skip transforms, keep opacity only
 */

export interface RevealOptions {
  /** Enable per-child stagger (60ms). Children must have `data-reveal` attribute. */
  stagger?: boolean;
  /** Custom stagger interval in ms (default 60). */
  staggerInterval?: number;
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function useReveal<T extends HTMLElement = HTMLDivElement>(
  options: RevealOptions = {}
): RefObject<T> {
  const ref = useRef<T>(null);
  const pageReady = usePageReady();
  const { stagger = false, staggerInterval = 60 } = options;

  useEffect(() => {
    // Wait for pageReady (loading screen done) before observing.
    if (!pageReady) return;

    const el = ref.current;
    if (!el) return;

    // Reduced motion: reveal everything immediately.
    if (prefersReducedMotion()) {
      el.classList.add("is-revealed");
      if (stagger) {
        el.querySelectorAll("[data-reveal]").forEach((child) => {
          child.classList.add("is-revealed");
        });
      }
      return;
    }

    // Build the target list: the container itself (if it has .reveal) + its
    // [data-reveal] children. Apply stagger delays to children via CSS var.
    const targets: HTMLElement[] = [];
    if (el.classList.contains("reveal")) targets.push(el);

    if (stagger) {
      const children = Array.from(el.querySelectorAll<HTMLElement>("[data-reveal]"));
      children.forEach((child, i) => {
        child.style.setProperty("--reveal-delay", `${i * staggerInterval}ms`);
      });
      targets.push(...children);
    }

    if (targets.length === 0) return;

    // Fallback: if IntersectionObserver isn't supported, reveal immediately.
    if (typeof IntersectionObserver === "undefined") {
      targets.forEach((t) => t.classList.add("is-revealed"));
      return;
    }

    // Register all targets with the shared observer pool (1 observer for all).
    const cleanups: (() => void)[] = [];
    targets.forEach((t) => {
      cleanups.push(register(t, () => t.classList.add("is-revealed")));
    });

    return () => cleanups.forEach((cleanup) => cleanup());
  }, [pageReady, stagger, staggerInterval]);

  return ref;
}

export default useReveal;
