"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { motion } from "motion/react";
import { useGsapReveal } from "@/lib/useGsapReveal";
import { useGsapCards } from "@/lib/useGsapCards";
import {
  Compass,
  Briefcase,
  Users,
  Target,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";

// ═══ Shared Founder Images — crossfade between frustrated (bottleneck)
// and confident (AVYSTRA system) states. Defined at module scope so the
// same JSX is reused by both the desktop center node and the mobile
// center node without re-creating the component each render. ═══
function FounderImages({ isResolved }: { isResolved: boolean }) {
  return (
    <div className="relative w-full h-full rounded-full overflow-hidden flex items-center justify-center bg-navy-deep">
      {/* Frustrated state */}
      <img
        src="/founder-frustrated.webp"
        alt="Founder — frustrated, bottlenecked"
        referrerPolicy="no-referrer"
        loading="lazy" decoding="async"
        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-out-expo"
        style={{
          opacity: isResolved ? 0 : 1,
          objectPosition: "center 25%",
        }}
      />
      {/* Red tint overlay for frustrated state */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-700 rounded-full"
        style={{
          opacity: isResolved ? 0 : 1,
          background: "radial-gradient(circle, transparent 40%, rgba(239,68,68,0.22) 100%)",
        }}
      />
      {/* Confident state */}
      <img
        src="/founder-confident.webp"
        alt="Founder — confident, system in place"
        referrerPolicy="no-referrer"
        loading="lazy" decoding="async"
        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-out-expo"
        style={{
          opacity: isResolved ? 1 : 0,
          objectPosition: "center center",
        }}
      />
      {/* Green tint overlay for confident state */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-700 rounded-full"
        style={{
          opacity: isResolved ? 1 : 0,
          background: "radial-gradient(circle, transparent 40%, rgba(16,185,129,0.18) 100%)",
        }}
      />
    </div>
  );
}

// ═══ Floating particles — tiny drifting gold dots (desktop only).
// Memoized so the random positions are stable across re-renders. ═══
function FloatingParticles() {
  const particles = useMemo(() => {
    if (typeof window === "undefined") return [];
    if (window.matchMedia("(max-width: 768px)").matches) return [];
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return [];
    return Array.from({ length: 8 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${60 + Math.random() * 40}%`,
      dx: `${(Math.random() - 0.5) * 60}px`,
      dy: `${-80 - Math.random() * 80}px`,
      delay: `${Math.random() * 8}s`,
      duration: `${8 + Math.random() * 6}s`,
    }));
  }, []);

  if (particles.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      {particles.map((p) => (
        <span
          key={p.id}
          className="ff-particle"
          style={{
            left: p.left,
            top: p.top,
            // CSS custom props consumed by the ff-particle-drift keyframes
            ["--dx" as string]: p.dx,
            ["--dy" as string]: p.dy,
            animation: `ff-particle-drift ${p.duration} ease-in-out ${p.delay} infinite`,
          }}
        />
      ))}
    </div>
  );
}

// ═══ HUD corner brackets — tactical targeting-reticle on each outcome card.
// Color shifts with the toggle state (red when bottlenecked, green when resolved). ═══
function HudBrackets({ color }: { color: string }) {
  return (
    <>
      <span className="ff-card-bracket ff-card-bracket-tl" style={{ ["--bracket-color" as string]: color }} />
      <span className="ff-card-bracket ff-card-bracket-tr" style={{ ["--bracket-color" as string]: color }} />
      <span className="ff-card-bracket ff-card-bracket-bl" style={{ ["--bracket-color" as string]: color }} />
      <span className="ff-card-bracket ff-card-bracket-br" style={{ ["--bracket-color" as string]: color }} />
    </>
  );
}

export default function FounderFrictionSimulator() {
  const [isResolved, setIsResolved] = useState<boolean>(false);
  const sectionRef = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);

  // ── GSAP ScrollTrigger reveals ──
  const subtextRef = useGsapReveal<HTMLParagraphElement>("fade", { duration: 0.6 });
  const toggleRef = useGsapReveal<HTMLDivElement>("fade", { delay: 0.15, duration: 0.6 });
  const desktopCardsRef = useGsapCards<HTMLDivElement>({ cardSelector: ".card-premium-dark" });
  const desktopCenterNodeRef = useGsapReveal<HTMLDivElement>("fade", { delay: 0.2, duration: 0.8 });
  const mobileCenterNodeRef = useGsapReveal<HTMLDivElement>("fade", { duration: 0.6 });
  const mobileCardsRef = useGsapCards<HTMLDivElement>();
  const ctaRef = useGsapReveal<HTMLDivElement>("fade", { delay: 0.3, duration: 0.6 });

  // Pause SVG animateMotion + CSS animations when section is off-screen
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.05 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handleBookCall = () => {
    const message = "Hi AVYSTRA, I visited your website and would like to understand how you can help my organization. Can we connect?";
    const whatsappUrl = `https://wa.me/918596059607?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };

  const outcomes = [
    {
      id: "leadership",
      number: "01",
      name: "LEADERSHIP",
      icon: Compass,
      issues: ["Direction unclear to teams", "Every decision escalates upward"],
      solution: "Clear direction. Teams know what to do and why.",
      desktopStyle: { left: "0%", top: "0%" },
    },
    {
      id: "managers",
      number: "02",
      name: "MANAGERS",
      icon: Briefcase,
      issues: ["Feedback doesn't lead to change", "Difficult conversations avoided"],
      solution: "Decisions made at the right level. No more bottlenecks.",
      desktopStyle: { right: "0%", top: "0%" },
    },
    {
      id: "teams",
      number: "03",
      name: "TEAMS",
      icon: Users,
      issues: ["No real ownership of outcomes", "Commitments missed repeatedly"],
      solution: "Ownership without supervision. Commitments followed through.",
      desktopStyle: { left: "0%", bottom: "0%" },
    },
    {
      id: "execution",
      number: "04",
      name: "EXECUTION",
      icon: Target,
      issues: ["Plans lose momentum by mid-year", "No measurement or follow-through"],
      solution: "Plans that actually get implemented. Results that are measured.",
      desktopStyle: { right: "0%", bottom: "0%" },
    },
  ];

  // Active accent color: red when bottlenecked, green when AVYSTRA system
  const accent = isResolved ? "var(--color-success)" : "var(--color-danger)";
  const accentSoft = isResolved ? "rgba(16,185,129,0.35)" : "rgba(239,68,68,0.35)";
  const accentFaint = isResolved ? "rgba(16,185,129,0.5)" : "rgba(239,68,68,0.5)";
  const pulseColor = isResolved ? "var(--color-success)" : "var(--color-danger)";
  // Aura color for the radial spotlight behind the founder — shifts with toggle
  const auraColor = isResolved ? "rgba(16,185,129,0.28)" : "rgba(239,68,68,0.28)";
  // Bracket color for the HUD corner brackets — shifts with toggle
  const bracketColor = isResolved ? "rgba(16,185,129,0.65)" : "rgba(239,68,68,0.65)";

  return (
    <section
      ref={sectionRef}
      id="bottlenecks"
      className="relative w-full overflow-hidden select-none scroll-mt-20 bg-navy-deep"
    >
      {/* ═══ IMMERSIVE "COMMAND CENTER" BACKGROUND ═══
          Layered background localized to this section:
            1. Perspective grid floor (gold blueprint lines, fades at top)
            2. Fine secondary grid (desktop only — texture depth)
            3. Radial aura spotlight behind founder (shifts red↔green w/ toggle)
            4. CRT scanline overlay (high-tech diagnostic feel)
            5. Floating gold particles (desktop only — ambient life)
          All pointer-events:none, paused on reduced-motion. */}

      {/* Layer 1: perspective grid floor */}
      <div className="ff-grid-floor" aria-hidden="true" />
      {/* Layer 2: fine secondary grid (desktop only) */}
      <div className="ff-grid-fine" aria-hidden="true" />
      {/* Layer 3: radial aura spotlight — color bound to toggle state */}
      <div
        className="ff-aura"
        aria-hidden="true"
        style={{ ["--aura-color" as string]: auraColor }}
      />
      {/* Layer 4: scanline overlay */}
      <div className="ff-scanlines" aria-hidden="true" />
      {/* Layer 5: floating particles (desktop only, memoized) */}
      <FloatingParticles />

      <div className="relative max-w-[1200px] mx-auto px-5 sm:px-6 lg:px-8 z-10 py-16 sm:py-20 lg:py-24">
        {/* Visually-hidden section heading for screen-reader navigation */}
        <h2 className="sr-only">Founder Dependency Diagnostic</h2>

        {/* ─── HEADER BLOCK ─── */}
        <div className="flex flex-col items-center text-center mb-14 sm:mb-16">
          <p
            ref={subtextRef}
            className="text-white/65 font-sans text-[15px] sm:text-base max-w-[520px] leading-relaxed"
            style={{ letterSpacing: "0.02em" }}
          >
            Toggle between states to see exactly what AVYSTRA engineers.
          </p>
        </div>

        {/* ─── PREMIUM TOGGLE — red/green active pill ─── */}
        <div
          ref={toggleRef}
          className="relative mx-auto mb-14 sm:mb-16 flex items-center h-12 w-full max-w-[380px] rounded-full p-1"
          style={{
            background: "rgba(255,255,255,0.06)",
            backdropFilter: "blur(20px) saturate(1.6)",
            WebkitBackdropFilter: "blur(20px) saturate(1.6)",
            border: "1px solid rgba(255,255,255,0.12)",
            boxShadow: "0 1px 2px rgba(0,0,0,0.20), 0 8px 24px -8px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,255,255,0.08)",
          }}
        >
          <motion.div
            className="absolute top-1 bottom-1 left-1 rounded-full"
            animate={{ x: isResolved ? "calc(100% + 0px)" : "0px" }}
            transition={{ type: "spring", stiffness: 280, damping: 32 }}
            style={{
              width: "calc(50% - 4px)",
              background: `linear-gradient(135deg, ${accent} 0%, ${isResolved ? "var(--color-success)" : "var(--color-danger)"} 100%)`,
              boxShadow: `0 4px 20px ${accentSoft}, 0 0 0 1px ${accentFaint}`,
            }}
          />
          <button
            onClick={() => setIsResolved(false)}
            aria-label="Show bottlenecked state"
            className={`toggle-pill-btn relative z-10 w-1/2 text-center text-[12px] font-mono tracking-[0.14em] font-bold h-full transition-colors duration-500 ease-out-expo focus-ring ${
              !isResolved ? "text-white" : "text-white/60 hover:text-white/75"
            }`}
          >
            BOTTLENECKED STATE
          </button>
          <button
            onClick={() => setIsResolved(true)}
            aria-label="Show AVYSTRA system state"
            className={`toggle-pill-btn relative z-10 w-1/2 text-center text-[12px] font-mono tracking-[0.14em] font-bold h-full transition-colors duration-500 ease-out-expo focus-ring ${
              isResolved ? "text-white" : "text-white/60 hover:text-white/75"
            }`}
          >
            AVYSTRA SYSTEM
          </button>
        </div>

        {/* ═══ DIAGRAM — DESKTOP & TABLET (≥768px) ═══ */}
        <div
          ref={desktopCardsRef}
          className="relative w-full max-w-[1000px] h-[480px] md:h-[520px] lg:h-[560px] mx-auto hidden md:block"
        >
          {/* SVG Connector Lines — color matches active state */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none z-0"
            viewBox="0 0 800 560"
            preserveAspectRatio="xMidYMid meet"
          >
            <path id="path-tl" d="M 400 280 L 160 80" fill="none" stroke={accentSoft} strokeWidth="1" />
            <path id="path-tr" d="M 400 280 L 640 80" fill="none" stroke={accentSoft} strokeWidth="1" />
            <path id="path-bl" d="M 400 280 L 160 480" fill="none" stroke={accentSoft} strokeWidth="1" />
            <path id="path-br" d="M 400 280 L 640 480" fill="none" stroke={accentSoft} strokeWidth="1" />

            {inView && (
              <>
                <circle r="3.5" fill={pulseColor}>
                  <animateMotion dur="3s" repeatCount="indefinite" begin="0s">
                    <mpath href="#path-tl" />
                  </animateMotion>
                </circle>
                <circle r="3.5" fill={pulseColor}>
                  <animateMotion dur="3s" repeatCount="indefinite" begin="0.75s">
                    <mpath href="#path-tr" />
                  </animateMotion>
                </circle>
                <circle r="3.5" fill={pulseColor}>
                  <animateMotion dur="3s" repeatCount="indefinite" begin="1.5s">
                    <mpath href="#path-bl" />
                  </animateMotion>
                </circle>
                <circle r="3.5" fill={pulseColor}>
                  <animateMotion dur="3s" repeatCount="indefinite" begin="2.25s">
                    <mpath href="#path-br" />
                  </animateMotion>
                </circle>
              </>
            )}
          </svg>

          {/* Outcome cards — dark glass panels at corners + HUD brackets */}
          {outcomes.map((outcome) => {
            const Icon = outcome.icon;
            return (
              <div
                key={outcome.id}
                className="card-premium-dark absolute w-[200px] md:w-[220px] lg:w-[240px] rounded-2xl p-5 sm:p-6 z-10 overflow-hidden"
                style={{
                  ...outcome.desktopStyle,
                  borderLeft: `2px solid ${accent}`,
                }}
              >
                {/* HUD corner brackets — tactical targeting-reticle feel */}
                <HudBrackets color={bracketColor} />

                {/* Header: number + icon + label */}
                <div className="flex items-center gap-2.5 mb-3">
                  <span
                    className="text-[10.5px] font-mono font-bold tracking-[0.15em] transition-colors duration-500"
                    style={{ color: accent }}
                  >
                    {outcome.number}
                  </span>
                  <Icon
                    className="w-[18px] h-[18px] shrink-0 transition-colors duration-500"
                    strokeWidth={1.5}
                    style={{ color: accent }}
                  />
                  <span
                    className="text-[12.5px] font-mono font-bold tracking-[0.15em] uppercase transition-colors duration-500"
                    style={{ color: accent }}
                  >
                    {outcome.name}
                  </span>
                </div>

                <div
                  className="h-px mb-3 transition-colors duration-500"
                  style={{ background: `linear-gradient(to right, ${accentSoft}, transparent)` }}
                />

                {/* Content — switches based on toggle state */}
                <div className="relative min-h-[110px]">
                  <div
                    className="absolute inset-0 transition-opacity duration-500 ease-out-expo space-y-2"
                    style={{ opacity: isResolved ? 0 : 1, pointerEvents: isResolved ? "none" : "auto" }}
                  >
                    {outcome.issues.map((issue, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-left">
                        <span
                          className="text-[11.5px] font-bold shrink-0 mt-1 transition-colors duration-500"
                          style={{ color: "color-mix(in srgb, var(--color-danger) 60%, transparent)" }}
                        >
                          ◆
                        </span>
                        <span className="text-white/80 font-sans text-[14px] leading-relaxed font-normal">
                          {issue}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div
                    className="absolute inset-0 transition-opacity duration-500 ease-out-expo"
                    style={{ opacity: isResolved ? 1 : 0, pointerEvents: isResolved ? "auto" : "none" }}
                  >
                    <div className="flex items-start gap-2 text-left">
                      <ShieldCheck
                        className="w-3.5 h-3.5 shrink-0 mt-0.5 transition-colors duration-500"
                        strokeWidth={2}
                        style={{ color: "var(--color-success)" }}
                      />
                      <span className="text-white/90 font-sans text-[14px] leading-relaxed font-medium">
                        {outcome.solution}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* ─── CENTER NODE — founder portrait crossfade, accent ring, label ─── */}
          <div ref={desktopCenterNodeRef} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center">
            <div
              className="relative w-[150px] h-[150px] rounded-full overflow-hidden flex flex-col items-center justify-center text-center transition-all duration-700 ease-out-expo"
              style={{
                border: `1px solid ${accentFaint}`,
                boxShadow: `0 0 0 6px ${accentSoft}19, 0 0 48px ${accentSoft}, inset 0 0 20px rgba(0,0,0,0.4)`,
              }}
            >
              <FounderImages isResolved={isResolved} />
              <span
                className="absolute inset-0 rounded-full pointer-events-none"
                style={{
                  border: `1px solid ${accentFaint}`,
                  animation: "centerPulse 2s ease-out infinite",
                }}
              />
            </div>

            <div className="mt-5 text-center">
              <div
                className="text-[13px] font-mono font-bold tracking-[0.18em] uppercase transition-colors duration-500"
                style={{ color: accent }}
              >
                {isResolved ? "AVYSTRA SYSTEM" : "FOUNDER"}
              </div>
              <div className="text-[12px] font-sans text-white/55 mt-1 transition-colors duration-500">
                {isResolved ? "The system that holds" : "Single point of failure"}
              </div>
            </div>
          </div>
        </div>

        {/* ═══ MOBILE STACKED VIEW (<768px) ═══ */}
        <div className="md:hidden flex flex-col items-center">
          <div ref={mobileCenterNodeRef} className="flex flex-col items-center relative">
            {/* Mobile aura — placed inside the founder wrapper so it tracks
                the founder exactly, regardless of text wrapping above. */}
            <div
              className="ff-aura-mobile"
              aria-hidden="true"
              style={{ ["--aura-color" as string]: auraColor }}
            />
            <div
              className="relative w-[130px] h-[130px] rounded-full overflow-hidden transition-all duration-700 ease-out-expo z-10"
              style={{
                border: `1px solid ${accentFaint}`,
                boxShadow: `0 0 0 6px ${accentSoft}19, 0 0 44px ${accentSoft}, inset 0 0 20px rgba(0,0,0,0.4)`,
              }}
            >
              <FounderImages isResolved={isResolved} />
              <span
                className="absolute inset-0 rounded-full pointer-events-none"
                style={{
                  border: `1px solid ${accentFaint}`,
                  animation: "centerPulse 2s ease-out infinite",
                }}
              />
            </div>

            <div className="mt-5 mb-10 text-center">
              <div
                className="text-[12px] font-mono font-bold tracking-[0.18em] uppercase transition-colors duration-500"
                style={{ color: accent }}
              >
                {isResolved ? "AVYSTRA SYSTEM" : "FOUNDER"}
              </div>
              <div className="text-[12px] font-sans text-white/55 mt-1 transition-colors duration-500">
                {isResolved ? "The system that holds" : "Single point of failure"}
              </div>
            </div>
          </div>

          {/* Stacked outcome cards */}
          <div ref={mobileCardsRef} className="w-full grid grid-cols-1 gap-3">
            {outcomes.map((outcome) => {
              const Icon = outcome.icon;
              return (
                <div
                  key={outcome.id}
                  className="card-premium-dark relative rounded-2xl p-5 sm:p-6 overflow-hidden"
                  style={{ borderLeft: `2px solid ${accent}` }}
                >
                  {/* HUD corner brackets — mobile too */}
                  <HudBrackets color={bracketColor} />

                  <div className="flex items-center gap-2.5 mb-3">
                    <span
                      className="text-[10.5px] font-mono font-bold tracking-[0.15em] transition-colors duration-500"
                      style={{ color: accent }}
                    >
                      {outcome.number}
                    </span>
                    <Icon
                      className="w-[18px] h-[18px] shrink-0 transition-colors duration-500"
                      strokeWidth={1.5}
                      style={{ color: accent }}
                    />
                    <span
                      className="text-[12.5px] font-mono font-bold tracking-[0.15em] uppercase transition-colors duration-500"
                      style={{ color: accent }}
                    >
                      {outcome.name}
                    </span>
                  </div>

                  <div
                    className="h-px mb-3 transition-colors duration-500"
                    style={{ background: `linear-gradient(to right, ${accentSoft}, transparent)` }}
                  />

                  <div className="relative min-h-[80px]">
                    <div
                      className="transition-opacity duration-500 ease-out-expo space-y-2"
                      style={{ display: isResolved ? "none" : "block" }}
                    >
                      {outcome.issues.map((issue, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-left">
                          <span
                            className="text-[11.5px] font-bold shrink-0 mt-1"
                            style={{ color: "color-mix(in srgb, var(--color-danger) 60%, transparent)" }}
                          >
                            ◆
                          </span>
                          <span className="text-white/80 font-sans text-[14px] leading-relaxed font-normal">
                            {issue}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div
                      className="transition-opacity duration-500 ease-out-expo"
                      style={{ display: isResolved ? "block" : "none" }}
                    >
                      <div className="flex items-start gap-2 text-left">
                        <ShieldCheck
                          className="w-3.5 h-3.5 shrink-0 mt-0.5"
                          strokeWidth={2}
                          style={{ color: "var(--color-success)" }}
                        />
                        <span className="text-white/90 font-sans text-[14px] leading-relaxed font-medium">
                          {outcome.solution}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ─── BOTTOM CTA STRIP ─── */}
        <div
          ref={ctaRef}
          className="mt-14 sm:mt-16 w-full max-w-[1000px] mx-auto rounded-2xl p-6 sm:p-7 flex flex-col sm:flex-row items-center justify-between gap-5 text-center sm:text-left"
          style={{
            background: "rgba(255,255,255,0.06)",
            backdropFilter: "blur(20px) saturate(1.6)",
            WebkitBackdropFilter: "blur(20px) saturate(1.6)",
            border: "1px solid rgba(184,146,78,0.25)",
            boxShadow: "0 1px 2px rgba(0,0,0,0.20), 0 8px 24px -8px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,255,255,0.08)",
          }}
        >
          <p className="font-serif italic text-white text-lg sm:text-xl" style={{ lineHeight: 1.4 }}>
            Recognise your business in the left state?
          </p>
          <button
            onClick={handleBookCall}
            aria-label="Book an assessment call"
            className="btn-premium group inline-flex items-center gap-2 bg-gold text-navy-deep font-sans font-bold text-xs uppercase tracking-[0.12em] px-7 py-3.5 rounded-full hover:bg-gold-light transition-colors duration-500 ease-out-expo cursor-pointer w-full sm:w-auto shrink-0 focus-ring"
          >
            Book an assessment call
            <ArrowRight
              className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-500 ease-out-expo"
              strokeWidth={2.5}
            />
          </button>
        </div>
      </div>
    </section>
  );
}
