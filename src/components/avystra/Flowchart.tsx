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
  accentRgb: string;
}

/**
 * Flowchart — Four-Step Performance System.
 *
 * BOLD FLOW DESIGN:
 * A prominent horizontal flow path sits ABOVE the cards with:
 * 1. Large numbered nodes (1-4) — each is a big circle with the step number,
 *    colored with its accent. These are the visual anchors.
 * 2. Thick connector segments between nodes — a gradient line that goes from
 *    the previous node's color to the next node's color, showing progression.
 * 3. A continuous glowing pulse that travels from node 1 → 2 → 3 → 4, then
 *    loops. The pulse is a bright gold comet with a trail, moving along the
 *    connector path. It lights up each node as it passes.
 * 4. Arrowheads between nodes — clear directional indicators (1→2→3→4).
 *
 * The flow is UNMISTAKABLE — you see 4 big numbered circles connected by
 * arrows with a glowing pulse traveling through them. No ambiguity.
 */
export default function Flowchart() {
  const [expandedCard, setExpandedCard] = useState<number | null>(null);
  const [isInView, setIsInView] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  const eyebrowRef = useGsapReveal<HTMLDivElement>("fade", { duration: 0.6 });
  const headingRef = useGsapReveal<HTMLHeadingElement>("fade", {
    delay: 0.1,
    duration: 0.6,
  });
  const descriptionRef = useGsapReveal<HTMLParagraphElement>("fade", {
    delay: 0.2,
    duration: 0.6,
  });
  const flowPathRef = useGsapReveal<HTMLDivElement>("fade", {
    delay: 0.15,
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

  // Pause the pulse when the section is offscreen (performance)
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsInView(entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const steps: StepData[] = [
    {
      step: 1,
      title: "ASSESS",
      subtitle: "Find The Real Bottleneck",
      description:
        "We identify exactly where performance is breaking down — using a structured assessment, not assumptions.",
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
        "We design a focused plan built specifically for your organization's gaps — not a generic relabeled module.",
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
        "Structured sessions with proprietary frameworks, workbooks, and implementation tools your team applies the same week.",
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
        "30-day follow-up checkpoint and a written impact report — so leadership sees measurable outcomes, not satisfaction scores.",
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

  return (
    <section
      id="process"
      className="relative py-12 md:py-20 bg-transparent border-t border-slate-100 overflow-hidden select-none scroll-mt-24"
      ref={sectionRef}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-10 md:mb-14">
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

        {/* ═══ BOLD FLOW PATH (desktop) ═══
            4 large numbered nodes connected by gradient arrows with a
            continuous gold pulse traveling through them. This sits ABOVE
            the cards as a clear visual flow indicator. */}
        <div
          ref={flowPathRef}
          className="hidden lg:flex items-center justify-center gap-0 mb-8 px-[12%]"
          aria-hidden="true"
        >
          {steps.map((step, idx) => (
            <React.Fragment key={`flow-${step.step}`}>
              {/* Numbered node — large, colored, with glow */}
              <div className="relative flex flex-col items-center flex-shrink-0">
                <div
                  className="flow-node-large flex items-center justify-center w-12 h-12 rounded-full font-display font-black text-white text-lg shadow-lg relative z-10"
                  style={{
                    backgroundColor: step.accent,
                    boxShadow: `0 0 0 4px white, 0 4px 14px rgba(${step.accentRgb}, 0.3)`,
                    animation: `flow-node-glow 4s ease-in-out ${idx * 1}s infinite`,
                    animationPlayState: isInView ? "running" : "paused",
                  }}
                >
                  {step.step}
                </div>
                <span
                  className="text-[9px] font-mono font-bold uppercase tracking-[0.16em] mt-2"
                  style={{ color: step.accent }}
                >
                  {step.title}
                </span>
              </div>

              {/* Connector arrow between nodes (not after the last one) */}
              {idx < 3 && (
                <div className="flex-1 relative h-12 flex items-center mx-1">
                  {/* Gradient line — goes from current accent to next accent */}
                  <div
                    className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[3px] rounded-full"
                    style={{
                      background: `linear-gradient(90deg, ${step.accent}, ${steps[idx + 1].accent})`,
                      opacity: 0.3,
                    }}
                  />
                  {/* Continuous pulse traveling along the connector */}
                  <div
                    className={`flow-comet absolute top-1/2 -translate-y-1/2 w-8 h-8 rounded-full ${isInView ? "flow-comet-running" : ""}`}
                    style={{
                      background:
                        "radial-gradient(circle, rgba(184,146,78,0.8) 0%, rgba(184,146,78,0.3) 40%, transparent 70%)",
                      filter: "blur(3px)",
                      animationDelay: `${idx * 1}s`,
                    }}
                  />
                  {/* Arrowhead */}
                  <ArrowRight
                    className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4"
                    style={{ color: steps[idx + 1].accent }}
                  />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Cards grid */}
        <div
          ref={gridRef}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 lg:gap-6 relative z-10 items-stretch"
        >
          {steps.map((step, idx) => {
            const isExpanded = expandedCard === idx;

            return (
              <div
                key={step.step}
                className="flow-card group relative flex flex-col bg-gradient-to-br from-white to-slate-50 rounded-[1.75rem] p-5 sm:p-6 overflow-hidden transition-all duration-500 ease-out-expo hover:-translate-y-1.5 hover:shadow-[0_20px_50px_-15px_rgba(11,27,46,0.12)] border border-slate-100"
              >
                {/* Step number badge */}
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

      {/* ═══ FLOW ANIMATIONS ═══
          flow-node-glow: each node pulses its glow in sequence (1→2→3→4)
          flow-comet-running: a gold comet travels along each connector segment */}
      <style>{`
        @keyframes flow-node-glow {
          0%, 70%, 100% {
            box-shadow: 0 0 0 4px white, 0 4px 14px rgba(0,0,0,0.1);
            transform: scale(1);
          }
          15%, 35% {
            transform: scale(1.15);
          }
        }
        @keyframes flow-comet-travel {
          0%   { left: 0%; opacity: 0; }
          15%  { opacity: 1; }
          85%  { opacity: 1; }
          100% { left: 100%; opacity: 0; }
        }
        .flow-comet-running {
          animation: flow-comet-travel 1s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .flow-node-large { animation: none !important; }
          .flow-comet-running { animation: none !important; opacity: 0; }
        }
      `}</style>
    </section>
  );
}
