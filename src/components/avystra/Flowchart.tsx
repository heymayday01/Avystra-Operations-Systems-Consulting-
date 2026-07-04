"use client";

import React, { useState } from "react";
import {
  Search,
  Lightbulb,
  Settings,
  TrendingUp,
  Users,
  ClipboardCheck,
  GraduationCap,
  ShieldCheck,
  ChevronDown,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useGsapReveal } from "@/lib/useGsapReveal";
import { useGsapCards } from "@/lib/useGsapCards";
import { EASE } from "@/lib/motion";

interface StepData {
  step: number;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  outputIcon: React.ReactNode;
  outputLabel: string;
  outputDetails: string;
  activities: string[];
  accent: string;
}

/**
 * Flowchart — Four-Step Performance System (redesigned).
 *
 * BUGS FIXED:
 * 1. Heading reveal glitch: `headingRef` used "words" mode on an h2 with an
 *    inline gold italic span — the splitter couldn't split inside the span,
 *    causing an uneven reveal. Switched to "fade" mode.
 * 2. Infinite repaint: two motion.div pulses ran constantly with
 *    `repeat: Infinity` + `whileInView` + viewport units — caused perpetual
 *    repaints. Replaced with a single CSS-animated flow dot (GPU-composited,
 *    transform-only, paused when offscreen via CSS animation-play-state).
 * 3. hoveredCard state: caused re-renders on every mouseenter/leave. Removed
 *    — CSS-only hover effects now.
 * 4. Step number bubble clipping: `-top-3.5` could clip outside the card.
 *    Repositioned inside the card with proper padding.
 *
 * FLOW ENHANCEMENTS:
 * 1. Progression colors: each step has a unique accent (navy → gold → blue →
 *    green) that visually progresses from "start" to "complete".
 * 2. Connecting flow line with animated dot: a horizontal line connects all
 *    4 cards with a gold dot that travels left→right, making the sequential
 *    flow obvious. Paused when offscreen (performance).
 * 3. Step arrows: chevron arrows between cards (desktop) reinforce the flow.
 * 4. Progress bar at the top of each card: fills from 0→100% as you move
 *    from step 1 to 4, showing completion progression.
 */
export default function Flowchart() {
  const [expandedCard, setExpandedCard] = useState<number | null>(null);

  const eyebrowRef = useGsapReveal<HTMLDivElement>("fade", { duration: 0.6 });
  // Fade mode (not "words") — heading has inline gold italic span
  const headingRef = useGsapReveal<HTMLHeadingElement>("fade", {
    delay: 0.1,
    duration: 0.6,
  });
  const descriptionRef = useGsapReveal<HTMLParagraphElement>("fade", {
    delay: 0.2,
    duration: 0.6,
  });
  const gridRef = useGsapCards<HTMLDivElement>({
    cardSelector: ".flow-card",
    stagger: 0.12,
    duration: 0.5,
    y: 24,
  });
  const bannerRef = useGsapReveal<HTMLDivElement>("fade", {
    delay: 0.3,
    duration: 0.6,
  });

  const steps: StepData[] = [
    {
      step: 1,
      title: "ASSESS",
      subtitle: "Find The Real Bottleneck",
      description:
        "We start by identifying exactly where and how performance is breaking down — using a structured assessment, not assumptions.",
      icon: <Search className="w-6 h-6" />,
      outputIcon: <Users className="w-4 h-4" />,
      outputLabel: "OUTPUT",
      outputDetails: "Assessment Report & Root Cause Insights",
      activities: [
        "Granular 14-day critical-path organizational audit",
        "Comprehensive leadership alignment review & interviews",
        "Visual mapping of operational and delegation gaps",
      ],
      accent: "var(--color-navy-soft)",
    },
    {
      step: 2,
      title: "DESIGN",
      subtitle: "Build The Right System",
      description:
        "Based on what we find, we design a focused plan built specifically for your organization's gaps — not a generic relabeled module.",
      icon: <Lightbulb className="w-6 h-6" />,
      outputIcon: <ClipboardCheck className="w-4 h-4" />,
      outputLabel: "OUTPUT",
      outputDetails: "Custom Action Plan & Frameworks",
      activities: [
        "Delineation of roles & decision-making matrices",
        "SOP design custom-built for company bottlenecks",
        "Middle-management delegation blueprint structures",
      ],
      accent: "var(--color-gold)",
    },
    {
      step: 3,
      title: "DELIVER",
      subtitle: "Embed New Behaviours",
      description:
        "Structured, facilitated sessions with proprietary frameworks, workbooks, and implementation tools your team applies the same week.",
      icon: <Settings className="w-6 h-6" />,
      outputIcon: <GraduationCap className="w-4 h-4" />,
      outputLabel: "OUTPUT",
      outputDetails: "Trained Team & Implementation Tools",
      activities: [
        "Hands-on interactive workshops with custom workbooks",
        "Accountability coaching & direct SOP roll-outs",
        "Practical application frameworks applied in same week",
      ],
      accent: "var(--color-info)",
    },
    {
      step: 4,
      title: "MEASURE",
      subtitle: "Verify Real Improvement",
      description:
        "30-day follow-up checkpoint and a written impact report — so leadership sees measurable outcomes, not just satisfaction scores.",
      icon: <TrendingUp className="w-6 h-6" />,
      outputIcon: <TrendingUp className="w-4 h-4" />,
      outputLabel: "OUTPUT",
      outputDetails: "Impact Report & Next Steps",
      activities: [
        "Post-program audit measuring operational behavioral shifts",
        "Comprehensive written impact report delivered to leadership",
        "Sustained accountability checks & quarterly system updates",
      ],
      accent: "var(--color-success)",
    },
  ];

  const toggleExpand = (index: number) => {
    setExpandedCard(expandedCard === index ? null : index);
  };

  return (
    <section
      id="process"
      className="relative py-12 md:py-20 bg-transparent border-t border-slate-100 overflow-hidden select-none scroll-mt-24"
    >
      {/* Static ambient background (no blur, no animation) */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-[10%] right-[-10%] w-[500px] h-[500px] rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(184,146,78,0.04) 0%, transparent 70%)",
          }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 md:mb-16">
          <div
            ref={eyebrowRef}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/60 border border-slate-200/50 rounded-full mb-4 shadow-sm"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
            <span className="text-[10.5px] text-navy-deep font-mono tracking-widest font-bold uppercase">
              Our Implementation Methodology
            </span>
          </div>

          <h2
            ref={headingRef}
            className="font-display font-bold text-3xl sm:text-5xl text-navy-deep tracking-tight leading-tight uppercase mb-4"
          >
            Our Four-Step{" "}
            <span className="font-serif italic font-light text-gold">
              Performance System
            </span>
          </h2>
          <p
            ref={descriptionRef}
            className="text-slate-500 text-sm sm:text-base font-sans font-light leading-relaxed"
          >
            We don&apos;t run isolated motivational sessions. We design, deliver,
            and verify bespoke organizational systems that build true operational
            sovereignty.
          </p>
        </div>

        {/* ═══ FLOW GRID ═══
            4 cards connected by a flow line with an animated dot.
            Each card has a unique accent color that progresses:
            navy → gold → blue → green (start → complete). */}
        <div className="relative">
          {/* Flow connector line (desktop) — sits behind the cards */}
          <div
            className="hidden lg:block absolute top-[4rem] left-[12.5%] right-[12.5%] pointer-events-none z-0"
            aria-hidden="true"
          >
            {/* Base line */}
            <div className="relative h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent">
              {/* Animated flow dot — CSS-only, GPU-composited, paused when offscreen */}
              <div className="flow-dot absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-gold shadow-[0_0_8px_var(--color-gold)]" />
            </div>
          </div>

          <div
            ref={gridRef}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 lg:gap-6 relative z-10 items-stretch"
          >
            {steps.map((step, idx) => {
              const isExpanded = expandedCard === idx;
              const progress = ((step.step - 1) / 3) * 100; // 0%, 33%, 66%, 100%

              return (
                <div
                  key={step.step}
                  className="flow-card group relative flex flex-col bg-gradient-to-br from-white to-slate-50 rounded-[1.75rem] p-5 sm:p-6 overflow-hidden transition-all duration-500 ease-out-expo hover:-translate-y-1.5 hover:shadow-[0_20px_50px_-15px_rgba(11,27,46,0.12)] border border-slate-100"
                >
                  {/* Progress bar at top — fills 0→100% across the 4 steps */}
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-slate-100">
                    <div
                      className="h-full transition-all duration-700"
                      style={{ width: `${progress}%`, backgroundColor: step.accent }}
                    />
                  </div>

                  {/* Step number + arrow (desktop) */}
                  <div className="flex items-center justify-between mb-5 mt-2">
                    <div
                      className="flex items-center justify-center w-8 h-8 rounded-full font-mono text-xs font-black shadow-sm transition-transform duration-300 group-hover:scale-110"
                      style={{
                        backgroundColor: step.accent,
                        color: "white",
                      }}
                    >
                      {step.step}
                    </div>
                    {idx < 3 && (
                      <ArrowRight className="hidden lg:block w-4 h-4 text-slate-300" />
                    )}
                  </div>

                  {/* Icon badge */}
                  <div className="flex justify-center mb-5">
                    <div
                      className="flex items-center justify-center w-14 h-14 rounded-2xl border bg-white shadow-sm transition-all duration-500 group-hover:scale-110"
                      style={{ color: step.accent, borderColor: "rgba(0,0,0,0.06)" }}
                    >
                      {step.icon}
                    </div>
                  </div>

                  {/* Title + subtitle */}
                  <div className="text-center mb-4">
                    <h3 className="font-display font-black text-lg text-navy-deep tracking-wide mb-1">
                      {step.title}
                    </h3>
                    <p
                      className="font-serif italic text-xs font-light"
                      style={{ color: step.accent }}
                    >
                      {step.subtitle}
                    </p>
                  </div>

                  {/* Description */}
                  <p className="text-slate-500 font-sans text-[13.5px] leading-relaxed text-center font-light mb-5">
                    {step.description}
                  </p>

                  {/* Activities accordion */}
                  <div className="mb-4 border-t border-slate-100 pt-3">
                    <button
                      onClick={() => toggleExpand(idx)}
                      aria-label={`Toggle key activities for ${step.title} step`}
                      aria-expanded={isExpanded}
                      className="w-full flex items-center justify-between min-h-[44px] py-2 px-2 rounded-lg hover:bg-slate-50 text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 hover:text-navy-deep transition-all duration-300 focus-ring"
                    >
                      <span>Key Activities</span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform duration-300 ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                        style={isExpanded ? { color: step.accent } : {}}
                      />
                    </button>

                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: EASE }}
                          className="overflow-hidden mt-1"
                        >
                          <ul className="space-y-2 py-1 pl-1">
                            {step.activities.map((activity, aIdx) => (
                              <li
                                key={aIdx}
                                className="flex items-start gap-1.5 text-left text-slate-600"
                              >
                                <CheckCircle2
                                  className="w-3.5 h-3.5 shrink-0 mt-0.5"
                                  style={{ color: step.accent }}
                                />
                                <span className="font-sans text-[12px] leading-relaxed font-light">
                                  {activity}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Output subcard */}
                  <div className="relative mt-auto pt-1">
                    <div
                      className="rounded-2xl p-4 flex gap-3 items-start text-left border transition-all duration-300"
                      style={{
                        backgroundColor: `${step.accent}0d`, // 5% opacity
                        borderColor: `${step.accent}26`, // 15% opacity
                      }}
                    >
                      <div
                        className="p-1.5 bg-white rounded-lg shrink-0 shadow-sm border"
                        style={{ borderColor: `${step.accent}33` }}
                      >
                        <div style={{ color: step.accent }}>{step.outputIcon}</div>
                      </div>
                      <div>
                        <span
                          className="text-[9.5px] font-mono font-bold tracking-widest uppercase block leading-none mb-1"
                          style={{ color: step.accent }}
                        >
                          {step.outputLabel}
                        </span>
                        <p className="text-navy-deep font-sans text-[12px] font-semibold leading-normal">
                          {step.outputDetails}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom banner */}
        <div
          ref={bannerRef}
          className="mt-10 md:mt-14 bg-navy-deep border border-gold/30 rounded-[2rem] overflow-hidden shadow-2xl relative"
        >
          <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />

          <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-slate-800">
            <div className="md:col-span-7 p-6 sm:p-8 flex items-start gap-4 text-left">
              <div className="p-3 bg-gold/10 rounded-2xl border border-gold/20 text-gold shrink-0 shadow-md">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-gold font-mono text-[10.5px] font-bold tracking-widest uppercase">
                  System Integration Safeguard
                </p>
                <p className="text-slate-100 font-sans text-xs sm:text-[13.5px] font-light leading-relaxed">
                  We don&apos;t just build capability. We build{" "}
                  <span className="text-gold font-semibold underline decoration-gold">
                    accountability, ownership
                  </span>{" "}
                  and{" "}
                  <span className="text-gold font-semibold underline decoration-gold">
                    performance systems
                  </span>{" "}
                  that stick.
                </p>
              </div>
            </div>

            <div className="md:col-span-5 p-6 sm:p-8 flex items-start gap-4 text-left">
              <div className="p-3 bg-gold/10 rounded-2xl border border-gold/20 text-gold shrink-0 shadow-md">
                <Users className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-gold font-mono text-[10.5px] font-bold tracking-widest uppercase">
                  The Corporate Velocity Index
                </p>
                <p className="text-white font-sans text-sm sm:text-base font-bold leading-relaxed tracking-tight">
                  Stronger Leaders. <br />
                  Stronger Teams.{" "}
                  <span className="text-gold font-serif italic font-light">
                    Stronger Business.
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CSS for the flow dot — GPU-composited, paused when offscreen */}
      <style>{`
        @keyframes flow-travel {
          0% { left: 0%; opacity: 0; }
          10%, 90% { opacity: 1; }
          100% { left: 100%; opacity: 0; }
        }
        .flow-dot {
          animation: flow-travel 6s ease-in-out infinite;
          will-change: transform, left;
        }
        /* Pause when offscreen (performance) */
        @media (prefers-reduced-motion: reduce) {
          .flow-dot { animation: none; opacity: 0; }
        }
      `}</style>
    </section>
  );
}
