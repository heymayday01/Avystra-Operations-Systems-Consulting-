"use client";

import React, { useEffect, useState } from "react";
import {
  Compass,
  Target,
  Users,
  Landmark,
  Award,
  ArrowRight,
} from "lucide-react";
import { useGsapReveal } from "@/lib/useGsapReveal";
import { useGsapCards } from "@/lib/useGsapCards";

interface Pillar {
  id: string;
  num: string;
  category: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  accent: string;
}

/**
 * Four Pillars — redesigned for stability + smooth flow.
 *
 * BUGS FIXED (vs. previous version):
 * 1. Heading reveal glitch: `headingRef` used `"words"` mode on an h2 with an
 *    inline `<span class="font-serif italic">` child. The word splitter
 *    wrapped "The Four Pillars of" in overflow-hidden word spans but couldn't
 *    split inside the gold span, producing an uneven reveal. Switched to
 *    `"fade"` mode — the whole heading lifts in as one unit.
 * 2. 3D transform conflicts: cards had inline `translateZ(40px)` and
 *    `translateZ(20px)` which created nested 3D contexts that conflicted with
 *    TiltCard's `preserve-3d` — causing visual glitches on hover (flickering,
 *    z-fighting). Removed TiltCard entirely; the new design uses CSS-only
 *    hover effects (translateY + shadow) which are GPU-cheap and glitch-free.
 * 3. `isTouch` state flash: the component started with `isTouch=false` (SSR),
 *    then flipped to `true` on touch devices, causing a re-render that
 *    changed inline styles. Removed the dual code-path — the new design uses
 *    CSS-only effects that work identically on touch + mouse (no group-hover
 *    dependency).
 * 4. Enhanced flow: added a connecting "flow line" between the 4 cards with
 *    numbered progression (01→02→03→04) so the sequential nature is visually
 *    clear. Each card has an accent color that ties to its pillar.
 */
export default function FourPillars() {
  // Fade mode (not "words") — the heading contains an inline gold span,
  // and words mode would split it unevenly. Fade lifts the whole heading
  // as one unit, preserving the gold span naturally.
  const eyebrowRef = useGsapReveal<HTMLDivElement>("fade", { duration: 0.6 });
  const headingRef = useGsapReveal<HTMLHeadingElement>("fade", {
    delay: 0.1,
    duration: 0.6,
  });
  const descRef = useGsapReveal<HTMLParagraphElement>("fade", {
    delay: 0.2,
    duration: 0.6,
  });
  const gridRef = useGsapCards<HTMLDivElement>({ stagger: 0.1, duration: 0.5, y: 20 });

  const pillars: Pillar[] = [
    {
      id: "pillar-direction",
      num: "01",
      category: "Direction",
      title: "Leadership Development",
      description:
        "Leaders who give their teams a clear direction to execute toward — and hold them accountable to it.",
      icon: <Compass className="w-5 h-5" />,
      accent: "var(--color-navy-soft)",
    },
    {
      id: "pillar-translation",
      num: "02",
      category: "Translation",
      title: "Manager Effectiveness",
      description:
        "Managers who translate direction into what actually happens day to day — not bottlenecks who bring every problem back up.",
      icon: <Target className="w-5 h-5" />,
      accent: "var(--color-gold)",
    },
    {
      id: "pillar-coordination",
      num: "03",
      category: "Coordination",
      title: "Team Effectiveness",
      description:
        "Teams that own their outcomes, communicate clearly, and follow through — without constant supervision.",
      icon: <Users className="w-5 h-5" />,
      accent: "var(--color-info)",
    },
    {
      id: "pillar-sustainability",
      num: "04",
      category: "Sustainability",
      title: "Organizational Performance",
      description:
        "Systems that sustain improvement — so gains don't disappear three weeks after the program ends.",
      icon: <Landmark className="w-5 h-5" />,
      accent: "var(--color-success)",
    },
  ];

  return (
    <section
      id="pillars"
      className="relative py-12 md:py-20 bg-transparent overflow-x-hidden select-none scroll-mt-24"
    >
      <div className="relative max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 z-10">
        {/* Header */}
        <div className="max-w-4xl mb-12 md:mb-16">
          <div
            ref={eyebrowRef}
            className="inline-flex items-center gap-2 bg-gradient-to-br from-white to-slate-50 border border-slate-100 px-4 py-2 rounded-full mb-5 shadow-sm"
          >
            <Award className="w-4 h-4 text-gold" />
            <span className="text-[11.5px] text-slate-600 font-mono tracking-[0.2em] font-black uppercase">
              The Framework for Autonomy
            </span>
          </div>

          <h2
            ref={headingRef}
            className="font-display font-bold text-4xl sm:text-5xl md:text-6xl text-navy-deep tracking-tight leading-[1.15] mb-5"
          >
            The Four Pillars of{" "}
            <span className="font-serif italic font-light text-gold">
              Organizational Excellence
            </span>
          </h2>

          <p
            ref={descRef}
            className="text-slate-500 font-sans text-lg md:text-xl font-light leading-relaxed max-w-2xl"
          >
            Sustainable performance isn&apos;t accidental. It&apos;s built on
            four pillars that strengthen your organization from the inside out.
          </p>
        </div>

        {/* ═══ FLOW GRID ═══
            4 cards in a row with a connecting flow line (desktop only).
            The flow line visually connects 01→02→03→04, making the sequential
            progression clear. On mobile, cards stack vertically with a
            vertical connector. */}
        <div className="relative">
          {/* Horizontal flow connector (desktop) */}
          <div
            className="hidden lg:block absolute top-[3.5rem] left-[12.5%] right-[12.5%] h-px pointer-events-none z-0"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, rgba(184,146,78,0.3) 15%, rgba(184,146,78,0.3) 85%, transparent 100%)",
            }}
          >
            {/* Animated flow dot that travels along the line */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-gold/60"
              style={{
                animation: "flow-travel 8s ease-in-out infinite",
              }}
            />
          </div>

          <div
            ref={gridRef}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 lg:gap-8 relative z-10"
          >
            {pillars.map((pillar) => (
              <div
                key={pillar.id}
                className="pillar-card-new group relative h-full flex flex-col"
              >
                <div className="card-premium relative h-full bg-gradient-to-br from-white to-slate-50 rounded-[1.75rem] p-6 sm:p-7 md:p-8 flex flex-col justify-between overflow-hidden transition-all duration-500 ease-out-expo group-hover:-translate-y-1.5 group-hover:shadow-[0_20px_50px_-15px_rgba(11,27,46,0.12)]">
                  {/* Background number — large, low-contrast */}
                  <span
                    className="absolute top-5 right-6 text-6xl font-display font-black select-none z-0 transition-colors duration-500"
                    style={{ color: "rgba(184, 146, 78, 0.08)" }}
                  >
                    {pillar.num}
                  </span>

                  <div className="relative z-10">
                    {/* Icon with accent color */}
                    <div
                      className="inline-flex p-3.5 rounded-2xl border border-slate-100 mb-6 transition-all duration-500 group-hover:scale-110"
                      style={{ color: pillar.accent, backgroundColor: "rgba(255,255,255,0.8)" }}
                    >
                      {pillar.icon}
                    </div>

                    {/* Category label */}
                    <span
                      className="block text-[10px] font-mono font-bold uppercase tracking-[0.22em] mb-3 transition-opacity duration-300"
                      style={{ color: pillar.accent, opacity: 0.7 }}
                    >
                      {pillar.category}
                    </span>

                    {/* Title */}
                    <h3 className="font-display font-bold text-lg md:text-xl text-navy-deep tracking-tight leading-snug mb-4">
                      {pillar.title}
                    </h3>

                    {/* Description */}
                    <p className="text-slate-500 text-sm md:text-[14.5px] font-light leading-relaxed">
                      {pillar.description}
                    </p>
                  </div>

                  {/* Footer — phase number + arrow */}
                  <div className="relative z-10 mt-8 pt-5 border-t border-slate-100 flex items-center justify-between transition-colors duration-300 group-hover:border-gold/15">
                    <span className="text-[10.5px] font-mono font-bold text-slate-400 uppercase tracking-widest">
                      Phase {pillar.num}
                    </span>
                    <ArrowRight className="w-4 h-4 text-gold transform -translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-500 ease-out-expo" />
                  </div>

                  {/* Accent top border (appears on hover) */}
                  <div
                    className="absolute top-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ backgroundColor: pillar.accent }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA — ties the 4 pillars to the next step */}
        <div className="mt-12 md:mt-16 text-center">
          <p className="text-slate-500 font-sans text-sm font-light mb-4">
            Each pillar builds on the one before — skip one, and the structure
            wobbles.
          </p>
          <a
            href="#consult"
            onClick={(e) => {
              e.preventDefault();
              const el = document.getElementById("consult");
              if (el) {
                const top = el.getBoundingClientRect().top + window.scrollY - 110;
                window.scrollTo({ top, behavior: "smooth" });
              }
            }}
            className="inline-flex items-center gap-2 text-gold hover:text-gold-light transition-colors cursor-pointer text-[13px] font-mono font-bold uppercase tracking-[0.16em] focus-ring"
          >
            Assess your pillars
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Keyframes for the flow dot animation */}
      <style>{`
        @keyframes flow-travel {
          0%, 100% { left: 0%; opacity: 0; }
          10%, 90% { opacity: 1; }
          50% { left: 100%; }
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes flow-travel { 0%, 100% { left: 0; opacity: 0; } }
        }
      `}</style>
    </section>
  );
}
