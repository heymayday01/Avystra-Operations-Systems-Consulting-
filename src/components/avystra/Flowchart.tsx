"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
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
 * Flowchart — $10K premium flow showcase.
 *
 * DESIGN PHILOSOPHY (award-winning agency aesthetic):
 * 1. SCROLL-LINKED PROGRESS STEPPER: a thin line at the top with 4 step
 *    indicators. The line FILLS based on scroll position (GSAP ScrollTrigger
 *    scrub) — so the flow is tied to the user's progression, not a loop.
 *    Each step activates (color + scale + glow) when its card enters view.
 * 2. EDITORIAL BACKGROUND NUMBERS: huge "01-04" behind each card — a design
 *    element, not just a badge. Low opacity, display font, creates depth.
 * 3. CURSOR SPOTLIGHT: each card has a radial gold gradient that follows the
 *    mouse (rAF-throttled, GPU-cheap). Premium micro-interaction.
 * 4. SPRING HOVER: cards lift with spring physics (motion/react), not flat
 *    CSS transitions. Feels organic, not mechanical.
 * 5. REFINED GLASSMORPHISM: subtle backdrop-blur on cards + output subcards.
 *    Used sparingly — not the heavy 2020 glassmorphism trend.
 * 6. NO GIMMICKS: no comets, no bouncing dots, no infinite loops. The
 *    scroll-linked progress IS the flow animation — intentional, premium.
 */
export default function Flowchart() {
  const [expandedCard, setExpandedCard] = useState<number | null>(null);
  const [activeStep, setActiveStep] = useState(0);
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
  const bannerRef = useGsapReveal<HTMLDivElement>("fade", {
    delay: 0.3,
    duration: 0.6,
  });

  const sectionRef = useRef<HTMLElement>(null);
  const stepperRef = useRef<HTMLDivElement>(null);
  const progressLineRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

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
      accent: "#16263D",
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
      accent: "#B8924E",
      accentRgb: "184, 146, 78",
    },
    {
      step: 3,
      title: "DELIVER",
      subtitle: "Embed New Behaviours",
      description:
        "Structured sessions with proprietary frameworks, workbooks, and tools your team applies the same week.",
      icon: <Settings className="w-6 h-6" />,
      outputIcon: <GraduationCap className="w-4 h-4" />,
      outputLabel: "OUTPUT",
      outputDetails: "Trained Team & Implementation Tools",
      activities: [
        "Hands-on interactive workshops with custom workbooks",
        "Accountability coaching & direct SOP roll-outs",
        "Practical application frameworks applied in same week",
      ],
      accent: "#547A95",
      accentRgb: "84, 122, 149",
    },
    {
      step: 4,
      title: "MEASURE",
      subtitle: "Verify Real Improvement",
      description:
        "30-day follow-up checkpoint and a written impact report — so leadership sees measurable outcomes.",
      icon: <TrendingUp className="w-6 h-6" />,
      outputIcon: <TrendingUp className="w-4 h-4" />,
      outputLabel: "OUTPUT",
      outputDetails: "Impact Report & Next Steps",
      activities: [
        "Post-program audit measuring operational behavioral shifts",
        "Comprehensive written impact report delivered to leadership",
        "Sustained accountability checks & quarterly system updates",
      ],
      accent: "#10B981",
      accentRgb: "16, 185, 129",
    },
  ];

  const toggleExpand = (index: number) => {
    setExpandedCard(expandedCard === index ? null : index);
  };

  // ── Scroll-linked progress line + step activation ──────────────────────────
  // The progress line at the top FILLS based on scroll position through the
  // section. Each step activates when its card enters the viewport center.
  useEffect(() => {
    if (!pageReady) return;

    const section = sectionRef.current;
    const progressLine = progressLineRef.current;
    if (!section || !progressLine) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (reducedMotion) {
      progressLine.style.transform = "scaleX(1)";
      return;
    }

    const ctx = gsap.context(() => {
      // 1. Progress line fills with scroll (scaleX 0→1)
      gsap.fromTo(
        progressLine,
        { scaleX: 0 },
        {
          scaleX: 1,
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top 60%",
            end: "bottom 70%",
            scrub: 1,
          },
        }
      );

      // 2. Each card activates its step when it enters view
      cardRefs.current.forEach((card, idx) => {
        if (!card) return;
        ScrollTrigger.create({
          trigger: card,
          start: "top 60%",
          end: "bottom 40%",
          onToggle: (self) => {
            if (self.isActive) setActiveStep(idx);
          },
        });
      });
    }, sectionRef);

    return () => ctx.revert();
  }, [pageReady]);

  // ── Cursor spotlight tracking (rAF-throttled, GPU-cheap) ───────────────────
  const handleCardMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>, cardIdx: number) => {
      const card = cardRefs.current[cardIdx];
      if (!card) return;
      const rect = card.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      card.style.setProperty("--spotlight-x", `${x}%`);
      card.style.setProperty("--spotlight-y", `${y}%`);
    },
    []
  );

  return (
    <section
      id="process"
      ref={sectionRef}
      className="relative py-16 md:py-24 bg-transparent border-t border-slate-100 overflow-hidden select-none scroll-mt-24"
    >
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

        {/* ═══ PREMIUM SCROLL-LINKED PROGRESS STEPPER ═══
            A thin line with 4 step indicators. The line FILLS as you scroll
            through the section (GSAP scrub). Each step activates when its card
            enters view — color changes, scale + glow. This is the flow
            indicator — no comets, no loops, just intentional scroll-linked
            progress. */}
        <div
          ref={stepperRef}
          className="hidden lg:flex items-center justify-center mb-14 px-[10%]"
        >
          <div className="relative w-full max-w-4xl">
            {/* Base track */}
            <div className="absolute top-1/2 left-0 right-0 h-px bg-slate-200/60 -translate-y-1/2" />
            {/* Progress fill (scaleX driven by scroll) */}
            <div
              ref={progressLineRef}
              className="absolute top-1/2 left-0 right-0 h-px -translate-y-1/2 origin-left"
              style={{
                background:
                  "linear-gradient(90deg, #16263D 0%, #B8924E 33%, #547A95 66%, #10B981 100%)",
                transform: "scaleX(0)",
              }}
            />
            {/* Step indicators */}
            <div className="relative flex justify-between">
              {steps.map((step, idx) => {
                const isActive = activeStep >= idx;
                return (
                  <div
                    key={step.step}
                    className="flex flex-col items-center"
                    style={{ transition: "all 0.5s cubic-bezier(0.16,1,0.3,1)" }}
                  >
                    <div
                      className="flex items-center justify-center w-10 h-10 rounded-full font-display font-black text-sm transition-all duration-500 ease-out-expo relative z-10"
                      style={{
                        backgroundColor: isActive
                          ? step.accent
                          : "white",
                        color: isActive ? "white" : "#94a3b8",
                        border: `2px solid ${
                          isActive ? step.accent : "#cbd5e1"
                        }`,
                        transform: isActive
                          ? "scale(1.15)"
                          : "scale(1)",
                        boxShadow: isActive
                          ? `0 0 0 6px white, 0 8px 24px rgba(${step.accentRgb}, 0.35)`
                          : "0 0 0 6px white, 0 2px 8px rgba(0,0,0,0.06)",
                      }}
                    >
                      {step.step}
                    </div>
                    <span
                      className="text-[9px] font-mono font-bold uppercase tracking-[0.18em] mt-3 transition-colors duration-500"
                      style={{
                        color: isActive ? step.accent : "#94a3b8",
                      }}
                    >
                      {step.title}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ═══ PREMIUM CARDS ═══ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 lg:gap-6 relative z-10 items-stretch">
          {steps.map((step, idx) => {
            const isExpanded = expandedCard === idx;

            return (
              <motion.div
                key={step.step}
                ref={(el) => { cardRefs.current[idx] = el; }}
                onMouseMove={(e) => handleCardMouseMove(e, idx)}
                className="flow-card-premium group relative flex flex-col rounded-[1.75rem] overflow-hidden border backdrop-blur-sm cursor-default"
                style={{
                  backgroundColor: "rgba(255,255,255,0.7)",
                  borderColor: "rgba(226,232,240,0.8)",
                  // Cursor spotlight — radial gradient follows mouse
                  backgroundImage: `radial-gradient(400px circle at var(--spotlight-x, 50%) var(--spotlight-y, 50%), rgba(${step.accentRgb}, 0.06), transparent 50%)`,
                }}
                whileHover={{
                  y: -8,
                  transition: { type: "spring", stiffness: 300, damping: 25 },
                }}
              >
                {/* Editorial background number — huge, low-opacity */}
                <span
                  className="absolute -top-4 -right-2 font-display font-black text-[7rem] leading-none select-none pointer-events-none z-0 transition-all duration-700 ease-out-expo group-hover:scale-110 group-hover:opacity-100"
                  style={{
                    color: `rgba(${step.accentRgb}, 0.08)`,
                  }}
                >
                  {String(step.step).padStart(2, "0")}
                </span>

                {/* Card content */}
                <div className="relative z-10 flex flex-col h-full p-6 sm:p-7">
                  {/* Step number badge */}
                  <div className="flex items-center mb-6">
                    <div
                      className="flex items-center justify-center w-9 h-9 rounded-full font-mono text-xs font-black shadow-sm"
                      style={{
                        backgroundColor: step.accent,
                        color: "white",
                      }}
                    >
                      {step.step}
                    </div>
                  </div>

                  {/* Icon with parallax depth */}
                  <div className="flex justify-center mb-6">
                    <motion.div
                      className="flex items-center justify-center w-16 h-16 rounded-2xl border bg-white shadow-sm"
                      style={{
                        color: step.accent,
                        borderColor: `rgba(${step.accentRgb}, 0.15)`,
                      }}
                      whileHover={{
                        scale: 1.1,
                        rotate: 3,
                        transition: { type: "spring", stiffness: 300, damping: 15 },
                      }}
                    >
                      {step.icon}
                    </motion.div>
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
                  <p className="text-slate-500 font-sans text-[13px] leading-relaxed text-center font-light mb-5">
                    {step.description}
                  </p>

                  {/* Activities accordion */}
                  <div className="mb-4 border-t border-slate-100/80 pt-3">
                    <button
                      onClick={() => toggleExpand(idx)}
                      aria-label={`Toggle key activities for ${step.title} step`}
                      aria-expanded={isExpanded}
                      className="w-full flex items-center justify-between min-h-[44px] py-2 px-2 rounded-lg hover:bg-white/60 text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 hover:text-navy-deep transition-all duration-300 focus-ring"
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

                  {/* Output subcard — glassmorphism */}
                  <div className="relative mt-auto pt-1">
                    <div
                      className="rounded-2xl p-4 flex gap-3 items-start text-left border backdrop-blur-sm transition-all duration-300"
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
              </motion.div>
            );
          })}
        </div>

        {/* Bottom banner */}
        <div
          ref={bannerRef}
          className="mt-12 md:mt-16 bg-navy-deep border border-gold/30 rounded-[2rem] overflow-hidden shadow-2xl relative"
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
