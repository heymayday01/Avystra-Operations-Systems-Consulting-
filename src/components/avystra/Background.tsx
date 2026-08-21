"use client";

import { useEffect, useRef } from "react";

/**
 * Background — the trending animated ambient layer.
 *
 * Two layers:
 *   1. IMMERSIVE GRID — a subtle premium grid pattern (Linear/Vercel-style)
 *      with a radial fade mask. Most visible at the viewport edges, fades to
 *      transparent in the center so content stays the focal point. The grid
 *      is a static CSS background-image (zero runtime cost).
 *   2. DRIFTING ORBS — three large, heavily-blurred radial-gradient orbs
 *      that drift slowly across the viewport (GPU-composited transform-only).
 *
 * Both sit BEHIND all page content (z-0) and ABOVE the body's static mesh
 * gradient.
 *
 * PERFORMANCE:
 * - Grid: pure CSS background-image, no JS, no animation
 * - Orbs: pure CSS animation (transform-only) — GPU-composited
 * - Orbs hidden on mobile (backdrop-blur on glass cards is already costly);
 *   GRID stays on mobile (it's zero-cost + adds premium structure)
 * - Paused on prefers-reduced-motion
 * - pointer-events: none — never intercepts clicks
 *
 * Replaces the old WebGL AmbientCanvas (which caused shader/link bugs).
 */
export default function Background() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia("(max-width: 768px)").matches) return;
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-0 pointer-events-none overflow-hidden"
      aria-hidden="true"
    >
      {/* ═══ IMMERSIVE GRID ═══
          A subtle premium grid (40px cells, 1px lines at 4% navy opacity).
          The radial mask fades the grid to transparent in the center so it
          frames content rather than competing with it — strongest at the top
          and edges, invisible behind the hero/content area.
          Visible on ALL viewports (mobile included) — zero cost, adds structure. */}
      <div
        className="bg-grid-layer absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(11, 27, 46, 0.045) 1px, transparent 1px), linear-gradient(to bottom, rgba(11, 27, 46, 0.045) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          maskImage:
            "radial-gradient(ellipse 90% 70% at 50% 30%, transparent 0%, transparent 35%, rgba(0,0,0,0.5) 70%, rgba(0,0,0,1) 100%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 90% 70% at 50% 30%, transparent 0%, transparent 35%, rgba(0,0,0,0.5) 70%, rgba(0,0,0,1) 100%)",
        }}
      />
      {/* Smaller finer grid overlay (8px cells at 2% opacity) for extra texture
          depth — only visible on desktop (perf). */}
      <div
        className="bg-grid-fine-layer absolute inset-0 hidden md:block"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(11, 27, 46, 0.02) 1px, transparent 1px), linear-gradient(to bottom, rgba(11, 27, 46, 0.02) 1px, transparent 1px)",
          backgroundSize: "8px 8px",
          maskImage:
            "radial-gradient(ellipse 80% 60% at 50% 20%, transparent 0%, transparent 40%, rgba(0,0,0,0.4) 75%, rgba(0,0,0,0.8) 100%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 80% 60% at 50% 20%, transparent 0%, transparent 40%, rgba(0,0,0,0.4) 75%, rgba(0,0,0,0.8) 100%)",
        }}
      />

      {/* ═══ DRIFTING ORBS ═══ */}
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
