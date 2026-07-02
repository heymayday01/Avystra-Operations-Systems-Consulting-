"use client";

import { useEffect, useRef, type RefObject } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { usePageReady } from "@/lib/pageReady";

gsap.registerPlugin(ScrollTrigger);

/**
 * useGsapReveal — GSAP ScrollTrigger-powered scroll reveal.
 *
 * Replaces the old useReveal + useWordReveal + revealPool system.
 * ONE hook handles both block fades and word-by-word slide reveals.
 *
 * SAFETY DESIGN:
 * - Never sets opacity:0 in JS on mount. GSAP's from() tweens handle the
 *   initial state, but only fire when pageReady is true (after loading screen).
 * - Before pageReady: elements are at their natural state (visible).
 * - Reduced motion: sets elements visible immediately, no tweens.
 * - Cleanup: kills only its own tweens + ScrollTriggers (via gsap.context).
 *
 * MODES:
 * - mode="fade": element fades up (y:16px, opacity 0→1, 480ms power3.out)
 * - mode="words": word-by-word slide reveal (each word yPercent 110→0,
 *   480ms power4.out, 60ms stagger). Splits text nodes preserving nested spans.
 *
 * USAGE:
 *   // Block fade:
 *   const ref = useGsapReveal<HTMLDivElement>("fade");
 *   <div ref={ref}>...</div>
 *
 *   // Word-by-word (for h2 headings):
 *   const ref = useGsapReveal<HTMLHeadingElement>("words");
 *   <h2 ref={ref}>The Four Pillars of <span className="text-gold">Excellence</span></h2>
 *
 *   // With delay:
 *   const ref = useGsapReveal<HTMLDivElement>("fade", { delay: 0.2 });
 */

export type RevealMode = "fade" | "words";

export interface GsapRevealOptions {
  /** Delay before animation starts (seconds). Default: 0 */
  delay?: number;
  /** Duration override (seconds). Default: 0.48 for fade, 0.6 for words */
  duration?: number;
  /** Stagger between words (seconds). Default: 0.06. Only for mode="words" */
  stagger?: number;
  /** ScrollTrigger start position. Default: "top 87%" */
  start?: string;
  /** Y distance for fade (px). Default: 16 */
  y?: number;
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Split text nodes into word spans for GSAP animation.
 * Preserves nested elements (gold spans, italic, SVGs).
 * Returns the array of inner spans to animate.
 */
function splitWords(el: HTMLElement): HTMLElement[] {
  const wordInners: HTMLElement[] = [];

  function walk(node: Node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent;
      if (!text || !text.trim()) return;

      const parts = text.split(/(\s+)/);
      const frag = document.createDocumentFragment();

      for (const part of parts) {
        if (part.trim()) {
          const outer = document.createElement("span");
          outer.style.cssText =
            "display:inline-block;overflow:hidden;vertical-align:bottom";
          const inner = document.createElement("span");
          inner.style.cssText = "display:inline-block";
          inner.textContent = part;
          outer.appendChild(inner);
          frag.appendChild(outer);
          wordInners.push(inner);
        } else if (part.length > 0) {
          frag.appendChild(document.createTextNode(part));
        }
      }
      node.parentNode?.replaceChild(frag, node);
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const elem = node as Element;
      // Skip SVGs (UnderlineSquiggle) and already-split words
      if (elem.tagName === "SVG" || elem.hasAttribute("data-no-split")) return;
      Array.from(node.childNodes).forEach(walk);
    }
  }

  Array.from(el.childNodes).forEach(walk);
  return wordInners;
}

export function useGsapReveal<T extends HTMLElement = HTMLElement>(
  mode: RevealMode = "fade",
  options: GsapRevealOptions = {}
): RefObject<T> {
  const ref = useRef<T>(null);
  const pageReady = usePageReady();

  useEffect(() => {
    if (!pageReady) return;

    const el = ref.current;
    if (!el) return;

    // Reduced motion: set visible immediately
    if (prefersReducedMotion()) {
      gsap.set(el, { opacity: 1, y: 0, clearProps: "all" });
      return;
    }

    const {
      delay = 0,
      duration,
      stagger = 0.06,
      start = "top 87%",
      y = 16,
    } = options;

    // gsap.context ensures cleanup kills only THIS component's tweens/triggers
    const ctx = gsap.context(() => {
      if (mode === "words") {
        const wordInners = splitWords(el);
        if (wordInners.length === 0) {
          // Fallback to fade if no text
          gsap.from(el, {
            y,
            opacity: 0,
            duration: duration || 0.48,
            ease: "power3.out",
            delay,
            scrollTrigger: {
              trigger: el,
              start,
              toggleActions: "play none none none",
            },
          });
          return;
        }
        gsap.from(wordInners, {
          yPercent: 110,
          duration: duration || 0.6,
          ease: "power4.out",
          stagger,
          delay,
          scrollTrigger: {
            trigger: el,
            start,
            toggleActions: "play none none none",
          },
        });
      } else {
        // fade
        gsap.from(el, {
          y,
          opacity: 0,
          duration: duration || 0.48,
          ease: "power3.out",
          delay,
          scrollTrigger: {
            trigger: el,
            start,
            toggleActions: "play none none none",
          },
        });
      }
    }, el);

    return () => ctx.revert();
  }, [pageReady, mode]);

  return ref;
}

export default useGsapReveal;
