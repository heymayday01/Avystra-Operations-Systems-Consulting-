"use client";

import React, { useState, useRef, useEffect } from "react";
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
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useGsapReveal } from "@/lib/useGsapReveal";
import { useGsapCards } from "@/lib/useGsapCards";
import { EASE } from "@/lib/motion";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { usePageReady } from "@/lib/pageReady";

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
  accentRgb: string;
}

/**
 * Flowchart — Four-Step Performance System.
 *
 * ADVANCED FLOW VISUALIZATION (scroll-linked, one-directional):
 * An SVG connector sits behind the 4 cards with:
 * 1. A background track line (gray).
 * 2. A progress line that DRAWS itself from left→right using
 *    stroke-dashoffset — tied to scroll position via GSAP ScrollTrigger
 *    (scrub). As you scroll down, the line draws from step 1 → step 4.
 *    Scrolling up reverses it naturally, but the motion is always
 *    forward-progressing (never bounces back and forth).
 * 3. A glowing gold dot that travels along the line in ONE direction
 *    (left→right), scroll-linked. Its position = the line's draw progress.
 * 4. Four node circles (one per card) that light up sequentially — each
 *    fills with its accent color + scales when the dot reaches it.
 *
 * This is the premium "scroll-linked timeline" pattern seen in award-
 * winning sites. The animation is driven by scroll, not a loop — so it
 * feels intentional and connected to the user's progress through the page.
 */
export default function Flowchart() {
  const [expandedCard, setExpandedCard] = useState<number | null>(null);
  const pageReady = usePageReady();

  const eyebrowRef = useGsapReveal<HTMLDivElement>("fade", { duration: 0.6 });
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

  // Refs for the SVG flow connector
  const flowSvgRef = useRef<SVGSVGElement>(null);
  const flowSectionRef = useRef<HTMLDivElement>(null);

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
      accentRgb: "22, 38, 61",
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
      accentRgb: "184, 146, 78",
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
      accentRgb: "84, 122, 149",
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
      accentRgb: "16, 185, 129",
    },
  ];

  const toggleExpand = (index: number) => {
    setExpandedCard(expandedCard === index ? null : index);
  };

  // ── Scroll-linked flow animation ──────────────────────────────────────────
  // GSAP ScrollTrigger with scrub ties the flow line draw + dot travel + node
  // activation to the user's scroll position. This is ONE-DIRECTIONAL:
  // scrolling down progresses 1→4, scrolling up reverses 4→1. The motion
  // never bounces or loops — it's a linear scrub tied to scroll.
  useEffect(() => {
    if (!pageReady) return;

    const svg = flowSvgRef.current;
    const section = flowSectionRef.current;
    if (!svg || !section) return;

    // Respect reduced motion — skip the animation, show everything lit
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const progressLine = svg.querySelector(".flow-progress-line");
      const dot = svg.querySelector(".flow-dot-circle");
      const nodes = svg.querySelectorAll(".flow-node");
      if (progressLine) (progressLine as SVGPathElement).style.strokeDashoffset = "0";
      if (dot) (dot as SVGCircleElement).setAttribute("cx", "740");
      nodes.forEach((n) => n.classList.add("flow-node-active"));
      return;
    }

    const ctx = gsap.context(() => {
      const progressLine = svg.querySelector(".flow-progress-line") as SVGPathElement;
      const dot = svg.querySelector(".flow-dot-circle") as SVGCircleElement;
      const nodes = svg.querySelectorAll(".flow-node");

      if (!progressLine || !dot) return;

      // Get the total length of the line for the dash effect
      const lineLength = progressLine.getTotalLength();
      // Set up the dash — line starts fully hidden
      progressLine.style.strokeDasharray = `${lineLength}`;
      progressLine.style.strokeDashoffset = `${lineLength}`;

      // Dot start/end X positions (match the line's x1/x2)
      const dotStartX = 60;
      const dotEndX = 740;

      // Build the scroll-linked timeline
      // The timeline is tied to scroll via ScrollTrigger scrub — as the user
      // scrolls through the section, the timeline progresses linearly.
      // This is strictly one-directional: scroll down = forward, scroll up = reverse.
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top 70%",
          end: "bottom 60%",
          scrub: 1, // smooth scrub (1s lag) — feels premium, not jerky
        },
      });

      // 1. Draw the progress line (stroke-dashoffset → 0)
      tl.fromTo(
        progressLine,
        { strokeDashoffset: lineLength },
        { strokeDashoffset: 0, duration: 1, ease: "none" },
        0
      );

      // 2. Move the dot from left → right (one direction)
      tl.fromTo(
        dot,
        { attr: { cx: dotStartX }, opacity: 0 },
        { attr: { cx: dotEndX }, opacity: 1, duration: 1, ease: "none" },
        0
      );

      // 3. Light up each node sequentially at 25%, 50%, 75%, 100%
      // Each node activates when the dot reaches it — className toggles the
      // fill color + scale via CSS transitions.
      nodes.forEach((node, idx) => {
        const activateAt = (idx + 1) / 4; // 0.25, 0.5, 0.75, 1.0
        tl.to(
          node,
          {
            onStart: () => node.classList.add("flow-node-active"),
            onReverseStart: () => node.classList.remove("flow-node-active"),
            duration: 0.001,
          },
          activateAt
        );
      });
    }, flowSectionRef);

    return () => ctx.revert();
  }, [pageReady]);

  return (
    <section
      id="process"
      className="relative py-12 md:py-20 bg-transparent border-t border-slate-100 overflow-hidden select-none scroll-mt-24"
    >
      {/* Static ambient background */}
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

        {/* ═══ FLOW GRID ═══ */}
        <div ref={flowSectionRef} className="relative">
          {/* ═══ SVG FLOW CONNECTOR (desktop only) ═══
              An SVG line with 4 nodes sits behind the cards. As the user
              scrolls, GSAP ScrollTrigger (scrub) drives:
              1. The progress line drawing from left→right (stroke-dashoffset)
              2. The gold dot traveling left→right (cx animation)
              3. Each node lighting up sequentially when the dot reaches it
              All scroll-linked — strictly one-directional, no loop. */}
          <svg
            ref={flowSvgRef}
            className="hidden lg:block absolute top-[4rem] left-0 right-0 w-full pointer-events-none z-0"
            height="40"
            viewBox="0 0 800 40"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            {/* Background track line */}
            <line
              x1="60"
              y1="20"
              x2="740"
              y2="20"
              stroke="rgba(203, 213, 225, 0.4)"
              strokeWidth="2"
              strokeLinecap="round"
            />
            {/* Progress line (draws itself via stroke-dashoffset) */}
            <line
              className="flow-progress-line"
              x1="60"
              y1="20"
              x2="740"
              y2="20"
              stroke="var(--color-gold)"
              strokeWidth="2.5"
              strokeLinecap="round"
              style={{ filter: "drop-shadow(0 0 4px rgba(184,146,78,0.4))" }}
            />
            {/* 4 nodes — one per card position (200px intervals) */}
            {steps.map((step, idx) => {
              const x = 60 + idx * ((740 - 60) / 3);
              return (
                <circle
                  key={step.step}
                  className={`flow-node flow-node-${step.step}`}
                  cx={x}
                  cy={20}
                  r="6"
                  fill="white"
                  stroke="rgba(203, 213, 225, 0.6)"
                  strokeWidth="2"
                  style={{
                    transition:
                      "fill 0.4s ease, stroke 0.4s ease, r 0.4s ease",
                  }}
                />
              );
            })}
            {/* Traveling dot (glows gold, moves left→right) */}
            <circle
              className="flow-dot-circle"
              cx="60"
              cy="20"
              r="5"
              fill="var(--color-gold)"
              style={{
                filter: "drop-shadow(0 0 6px rgba(184,146,78,0.8))",
                opacity: 0,
              }}
            />
          </svg>

          {/* Node activation styles */}
          <style>{`
            .flow-node-active {
              fill: var(--color-gold) !important;
              stroke: var(--color-gold) !important;
              r: 8 !important;
            }
            .flow-node-1.flow-node-active { fill: var(--color-navy-soft) !important; stroke: var(--color-navy-soft) !important; }
            .flow-node-2.flow-node-active { fill: var(--color-gold) !important; stroke: var(--color-gold) !important; }
            .flow-node-3.flow-node-active { fill: var(--color-info) !important; stroke: var(--color-info) !important; }
            .flow-node-4.flow-node-active { fill: var(--color-success) !important; stroke: var(--color-success) !important; }
          `}</style>

          <div
            ref={gridRef}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 lg:gap-6 relative z-10 items-stretch"
          >
            {steps.map((step, idx) => {
              const isExpanded = expandedCard === idx;
              const progress = ((step.step - 1) / 3) * 100;

              return (
                <div
                  key={step.step}
                  className="flow-card group relative flex flex-col bg-gradient-to-br from-white to-slate-50 rounded-[1.75rem] p-5 sm:p-6 overflow-hidden transition-all duration-500 ease-out-expo hover:-translate-y-1.5 hover:shadow-[0_20px_50px_-15px_rgba(11,27,46,0.12)] border border-slate-100"
                >
                  {/* Progress bar at top */}
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-slate-100">
                    <div
                      className="h-full transition-all duration-700"
                      style={{ width: `${progress}%`, backgroundColor: step.accent }}
                    />
                  </div>

                  {/* Step number */}
                  <div className="flex items-center justify-between mb-5 mt-2">
                    <div
                      className="flex items-center justify-center w-8 h-8 rounded-full font-mono text-xs font-black shadow-sm transition-transform duration-300 group-hover:scale-110"
                      style={{ backgroundColor: step.accent, color: "white" }}
                    >
                      {step.step}
                    </div>
                  </div>

                  {/* Icon */}
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
                        backgroundColor: `rgba(${step.accentRgb}, 0.05)`,
                        borderColor: `rgba(${step.accentRgb}, 0.15)`,
                      }}
                    >
                      <div
                        className="p-1.5 bg-white rounded-lg shrink-0 shadow-sm border"
                        style={{ borderColor: `rgba(${step.accentRgb}, 0.2)` }}
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
    </section>
  );
}
