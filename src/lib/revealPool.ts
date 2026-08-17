"use client";

import { useEffect, useRef, type RefObject } from "react";
import { usePageReady } from "@/lib/pageReady";

/**
 * SHARED OBSERVER POOL — single IntersectionObserver for ALL reveal elements.
 *
 * Previously, every useReveal + useWordReveal call created its own
 * IntersectionObserver instance (50+ observers on the page). This caused
 * unnecessary overhead and scroll jank.
 *
 * Now there is ONE shared observer that manages all registered elements.
 * Elements are added/removed via register()/unregister() calls.
 */

type RevealCallback = () => void;

let sharedObserver: IntersectionObserver | null = null;
const registeredElements = new Map<Element, RevealCallback>();

function getSharedObserver(): IntersectionObserver | null {
  if (typeof IntersectionObserver === "undefined") return null;
  if (sharedObserver) return sharedObserver;

  sharedObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const callback = registeredElements.get(entry.target);
          if (callback) {
            callback();
            registeredElements.delete(entry.target);
          }
          sharedObserver?.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -10% 0px" }
  );

  return sharedObserver;
}

function register(el: Element, callback: RevealCallback): () => void {
  const observer = getSharedObserver();
  if (!observer) {
    // Fallback: no IntersectionObserver, reveal immediately
    callback();
    return () => {};
  }
  registeredElements.set(el, callback);
  observer.observe(el);
  return () => {
    registeredElements.delete(el);
    observer.unobserve(el);
  };
}

export { register };
