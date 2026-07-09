"use client";

import { useEffect } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { usePageReady } from "@/lib/pageReady";

gsap.registerPlugin(ScrollTrigger);

/**
 * TIMING — the single source of truth for all scroll-triggered animation.
 * data-reveal-* attributes override these per element.
 */
const TIMING = {
  fade: {
    duration: 0.85,
    ease: "power3.out",
    y: 32,
    start: "top 87%",
  },
  slide: {
    duration: 1.05,
    ease: "power4.out",
    stagger: 0.058,
    start: "top 87%",
  },
  chars: {
    duration: 0.7,
    ease: "power4.out",
    stagger: 0.025,
    start: "top 88%",
  },
} as const;

/**
 * Split an element's text into word spans for "slide" reveals.
 * Preserves nested elements (gold spans, italic, etc.) by walking the DOM tree
 * and only splitting text nodes — never replacing innerHTML wholesale.
 *
 * Each word gets:
 *   <span style="display:inline-block;overflow:hidden;vertical-align:bottom">
 *     <span class="word-inner" style="display:inline-block">{word}</span>
 *   </span>
 */
function splitWordsPreservingNested(el: HTMLElement): HTMLElement[] {
  const wordInners: HTMLElement[] = [];
  let wordIndex = 0;

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
          inner.className = "word-inner";
          inner.style.cssText = "display:inline-block";
          inner.textContent = part;
          outer.appendChild(inner);
          frag.appendChild(outer);
          wordInners.push(inner);
          wordIndex++;
        } else if (part.length > 0) {
          frag.appendChild(document.createTextNode(part));
        }
      }
      node.parentNode?.replaceChild(frag, node);
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const elem = node as Element;
      // Skip SVGs (UnderlineSquiggle etc.) and already-split words
      if (
        elem.tagName === "SVG" ||
        elem.classList.contains("word-inner") ||
        elem.getAttribute("data-no-split") !== null
      ) {
        return;
      }
      Array.from(node.childNodes).forEach(walk);
    }
  }

  Array.from(el.childNodes).forEach(walk);
  return wordInners;
}

/**
 * useGlobalTextReveal — the SINGLE entry point for all scroll-triggered text
 * reveals on the site. Runs once at the App level. Finds every [data-reveal]
 * element in the DOM and applies the correct GSAP animation.
 *
 * Supported data-reveal types:
 *   data-reveal="fade"    → fades up from y:32px, opacity 0→1
 *   data-reveal="slide"   → word-by-word mask reveal (yPercent 110→0)
 *   data-reveal="chars"   → character-by-character fade+rise
 *
 * Modifier attributes:
 *   data-reveal-delay="0.2"     → delay in seconds
 *   data-reveal-stagger="0.06"  → override stagger between words/chars
 *   data-reveal-duration="1.2"  → override duration
 *   data-reveal-start="top 80%" → override ScrollTrigger start position
 *
 * RULES:
 * - toggleActions: 'play none none none' (play once, never reverse)
 * - No overflow:hidden on parent containers (only on per-word wrappers)
 * - Word wrappers: display:inline-block, vertical-align:bottom (prevent baseline jump)
 * - Cleanup: kills only its own tweens, never ScrollTrigger.getAll()
 * - MutationObserver: detects new [data-reveal] elements from lazy-loaded components
 */
export function useGlobalTextReveal() {
  const pageReady = usePageReady();

  useEffect(() => {
    if (!pageReady) return;

    // ── Reduced motion: set everything visible immediately ──
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      document.querySelectorAll("[data-reveal]").forEach((el) => {
        (el as HTMLElement).dataset.revealProcessed = "true";
        gsap.set(el, { opacity: 1, y: 0, clearProps: "all" });
      });
      return;
    }

    const tweens: gsap.core.Tween[] = [];
    const processed = new WeakSet<HTMLElement>();

    function processElement(el: HTMLElement) {
      if (processed.has(el)) return;
      if (el.dataset.revealProcessed === "true") return;
      processed.add(el);
      el.dataset.revealProcessed = "true";

      const type = el.dataset.reveal || "fade";
      const delay = parseFloat(el.dataset.revealDelay || "0");
      const staggerOverride = parseFloat(el.dataset.revealStagger || "0");
      const durationOverride = parseFloat(el.dataset.revealDuration || "0");
      const startOverride = el.dataset.revealStart || "";

      const config =
        TIMING[type as keyof typeof TIMING] || TIMING.fade;
      const duration = durationOverride || config.duration;
      const start = startOverride || config.start;

      const stConfig = {
        trigger: el,
        start,
        toggleActions: "play none none none" as const,
      };

      if (type === "slide") {
        // Word-by-word mask reveal. Preserves nested styling (gold spans, etc.)
        const wordInners = splitWordsPreservingNested(el);
        if (wordInners.length === 0) {
          // Fallback to fade if no text found
          const t = gsap.from(el, {
            y: config.y,
            opacity: 0,
            duration,
            ease: config.ease,
            delay,
            scrollTrigger: stConfig,
          });
          if (t) tweens.push(t);
          return;
        }
        const t = gsap.from(wordInners, {
          yPercent: 110,
          duration,
          ease: config.ease,
          stagger: staggerOverride || (config as any).stagger,
          delay,
          scrollTrigger: stConfig,
        });
        if (t) tweens.push(t);
      } else if (type === "chars") {
        // Character-by-character reveal
        const text = el.textContent || "";
        const chars = text.split("");
        el.innerHTML = chars
          .map(
            (c) =>
              `<span style="display:inline-block">${c === " " ? "&nbsp;" : c}</span>`
          )
          .join("");
        const charSpans = el.querySelectorAll("span");
        const t = gsap.from(charSpans, {
          y: 20,
          opacity: 0,
          duration,
          ease: config.ease,
          stagger: staggerOverride || (config as any).stagger,
          delay,
          scrollTrigger: stConfig,
        });
        if (t) tweens.push(t);
      } else {
        // fade — default
        const t = gsap.from(el, {
          y: config.y,
          opacity: 0,
          duration,
          ease: config.ease,
          delay,
          scrollTrigger: stConfig,
        });
        if (t) tweens.push(t);
      }
    }

    // ── Initial scan: process all [data-reveal] elements in the DOM ──
    document.querySelectorAll<HTMLElement>("[data-reveal]").forEach(processElement);

    // ── MutationObserver: detect new [data-reveal] elements from lazy-loaded components ──
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType !== Node.ELEMENT_NODE) return;
          const elem = node as HTMLElement;
          // Check the node itself
          if (elem.hasAttribute("data-reveal")) {
            processElement(elem);
          }
          // Check descendants
          elem
            .querySelectorAll<HTMLElement>("[data-reveal]")
            .forEach(processElement);
        });
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // ── Refresh ScrollTrigger after mount (handles Lenis height calculation) ──
    const refreshTimer = setTimeout(() => ScrollTrigger.refresh(), 100);

    // ── Refresh on font load (prevents layout-shift trigger misalignment) ──
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => ScrollTrigger.refresh());
    }

    // ── Refresh on window load ──
    const loadHandler = () => ScrollTrigger.refresh();
    window.addEventListener("load", loadHandler);

    return () => {
      tweens.forEach((tween) => tween.kill());
      observer.disconnect();
      clearTimeout(refreshTimer);
      window.removeEventListener("load", loadHandler);
    };
  }, [pageReady]);
}
