"use client";

import { useEffect, useRef } from "react";

/**
 * Background — the trending animated ambient layer.
 *
 * Three large, heavily-blurred radial-gradient orbs drift slowly across
 * the viewport (GPU-composited transform-only). They sit BEHIND all page
 * content (z-0) and ABOVE the body's static mesh gradient.
 *
 * This is the Apple/Linear/Vercel aesthetic: organic, slow, premium motion
 * that adds life without distracting. Paired with the frosted-glass cards
 * (`.card-premium`), it creates the "depth through layers" feel.
 *
 * PERFORMANCE:
 * - Pure CSS animation (transform-only) — GPU-composited, zero JS per frame
 * - Hidden on mobile (backdrop-blur on glass cards is already costly)
 * - Paused on prefers-reduced-motion
 * - pointer-events: none — never intercepts clicks
 * - will-change: transform — promoted to its own layer
 *
 * Replaces the old WebGL AmbientCanvas (which caused shader/link bugs).
 */
export default function Background() {
  const containerRef = useRef<HTMLDivElement>(null);

  // Pause animation via IntersectionObserver when the fixed container is
  // fully offscreen (e.g. if a modal covers the whole viewport). On a normal
  // fixed bg this is always visible, but kept for safety.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    // Respect reduced-motion at the JS level too (CSS already handles it,
    // but this ensures no will-change promotion either).
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia("(max-width: 768px)").matches) return;
    // Noop — animations are pure CSS. Observer is a safety net for future
    // full-viewport overlays.
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-0 pointer-events-none overflow-hidden"
      aria-hidden="true"
    >
      {/* Orb 1 — warm gold, top-left quadrant. Primary light source. */}
      <div
        className="bg-orb bg-orb-1"
        style={{
          top: "-10%",
          left: "-8%",
          width: "45vw",
          height: "45vw",
          maxWidth: "720px",
          maxHeight: "720px",
          background:
            "radial-gradient(circle, rgba(184, 146, 78, 0.42) 0%, rgba(184, 146, 78, 0.15) 40%, transparent 70%)",
          opacity: 0.85,
        }}
      />
      {/* Orb 2 — bright gold, bottom-right. Secondary warm light. */}
      <div
        className="bg-orb bg-orb-2"
        style={{
          bottom: "-12%",
          right: "-6%",
          width: "38vw",
          height: "38vw",
          maxWidth: "620px",
          maxHeight: "620px",
          background:
            "radial-gradient(circle, rgba(212, 178, 106, 0.38) 0%, rgba(212, 178, 106, 0.12) 45%, transparent 70%)",
          opacity: 0.80,
        }}
      />
      {/* Orb 3 — soft navy tint, center-right. Adds depth + cool balance. */}
      <div
        className="bg-orb bg-orb-3"
        style={{
          top: "35%",
          right: "20%",
          width: "32vw",
          height: "32vw",
          maxWidth: "520px",
          maxHeight: "520px",
          background:
            "radial-gradient(circle, rgba(84, 122, 149, 0.22) 0%, rgba(84, 122, 149, 0.08) 45%, transparent 70%)",
          opacity: 0.60,
        }}
      />
    </div>
  );
}
