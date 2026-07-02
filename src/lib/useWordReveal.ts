"use client";

import { useEffect, useRef, type RefObject } from "react";

/**
 * useWordReveal — splits text content into word spans for staggered reveal.
 *
 * Unlike TextReveal (which only accepts a string), this hook works on ANY
 * element — including headings with nested colored spans, italic text, etc.
 * It walks the DOM tree, finds text nodes, and wraps each word in a
 * <span class="word"> with a --word-index CSS variable for stagger.
 *
 * SAFETY DESIGN:
 * - Never hides content in JS. The hidden state is CSS-only (.js .reveal-words .word).
 * - Progressive enhancement: only splits when <html> has .js class.
 * - Uses IntersectionObserver to add .is-revealed (same as useReveal).
 * - No-JS: text renders normally (no splitting, always visible).
 *
 * Usage:
 *   const ref = useWordReveal<HTMLHeadingElement>();
 *   <h2 ref={ref} className="reveal-words ...">
 *     The Four Pillars of <span className="text-gold">Organizational Excellence</span>
 *   </h2>
 *
 * The hook splits "The", "Four", "Pillars", "of", "Organizational", "Excellence"
 * into individual word spans, preserving the gold color on "Organizational Excellence".
 */

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function useWordReveal<T extends HTMLElement = HTMLElement>(
  options: { threshold?: number; rootMargin?: string } = {}
): RefObject<T> {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Only split when JS is enabled (progressive enhancement)
    if (!document.documentElement.classList.contains("js")) return;

    const { threshold = 0.15, rootMargin = "0px 0px -10% 0px" } = options;

    // Walk the DOM tree and split text nodes into word spans.
    // Preserves nested elements (spans, etc.) — only splits text content.
    let wordIndex = 0;

    function splitTextNodes(node: Node) {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent;
        if (!text || !text.trim()) return;

        const words = text.split(/(\s+)/); // keep whitespace
        const fragment = document.createDocumentFragment();

        for (const part of words) {
          if (part.trim()) {
            // It's a word — wrap in a span
            const span = document.createElement("span");
            span.className = "word";
            span.style.setProperty("--word-index", String(wordIndex));
            span.textContent = part;
            fragment.appendChild(span);
            wordIndex++;
          } else if (part.length > 0) {
            // It's whitespace — keep it as a text node
            fragment.appendChild(document.createTextNode(part));
          }
        }

        node.parentNode?.replaceChild(fragment, node);
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        // Don't split inside SVGs or elements with data-no-split
        const element = node as Element;
        if (
          element.tagName === "SVG" ||
          element.hasAttribute("data-no-split") ||
          element.classList.contains("word")
        ) {
          return;
        }
        // Clone childNodes array before iterating (DOM changes during iteration)
        const children = Array.from(node.childNodes);
        for (const child of children) {
          splitTextNodes(child);
        }
      }
    }

    splitTextNodes(el);
    el.classList.add("reveal-words");

    // Reduced motion: reveal immediately
    if (prefersReducedMotion()) {
      el.classList.add("is-revealed");
      return;
    }

    // IntersectionObserver to add .is-revealed when in view
    if (typeof IntersectionObserver === "undefined") {
      el.classList.add("is-revealed");
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-revealed");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold, rootMargin }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return ref;
}

export default useWordReveal;
