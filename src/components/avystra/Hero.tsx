"use client";

import React, { useRef, useEffect, useCallback, useState, useSyncExternalStore } from "react";
import { UserPlus, TrendingUp, Building2, Banknote, ClipboardList } from "lucide-react";
import { UnderlineSquiggle } from "./DoodleWidgets";
import { smoothScrollTo } from "@/lib/scroll";
import { useGsapReveal } from "@/lib/useGsapReveal";
import { usePageReady } from "@/lib/pageReady";
import ArrowRevealButton from "./ArrowRevealButton";

// Subscribe to prefers-reduced-motion without setState-in-effect
const reducedMotionSubscribe = (callback: () => void) => {
  const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  mediaQuery.addEventListener("change", callback);
  return () => mediaQuery.removeEventListener("change", callback);
};
const reducedMotionGetSnapshot = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const reducedMotionGetServerSnapshot = () => false;

export default function Hero() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const pageReady = usePageReady();

  // GSAP ScrollTrigger reveals for hero entrance (eyebrow / chips / card /
  // CTAs / trust / marquee). The H1 heading stays on CSS animations
  // (hero-line-1/2/3) per design — GSAP is not applied to it.
  //
  // SYNCED TIMELINE (all delays measured from pageReady — the moment the
  // loading screen finishes its exit fade and the page wrapper begins
  // fading in over 0.25s). The hero cascade emerges WITH the page.
  //
  // SMOOTHNESS: y:10 (reduced from 16) for a gentler slide that doesn't
  // fight with the page wrapper's opacity fade. Larger slides look jumpy
  // when the whole page is also fading in — 10px is the sweet spot.
  // Durations are 0.5s (slightly longer) with power3.out for a smoother
  // settle. The cascade is compressed to 0.75s total (was 0.95s) so the
  // whole hero reveals as one cohesive motion.
  // H1 line 1 (CSS):  0.05s delay, 0.4s dur  → finishes at 0.45s
  // H1 line 2 (CSS):  0.18s delay, 0.4s dur  → finishes at 0.58s
  // H1 line 3 (CSS):  0.32s delay, 0.4s dur  → finishes at 0.72s
  // Eyebrow (GSAP):   0s    delay, 0.5s dur  → finishes at 0.50s
  // Chips (GSAP):     0.3s  delay, 0.5s dur  → finishes at 0.80s
  // Card (GSAP):      0.45s delay, 0.5s dur  → finishes at 0.95s
  // CTAs (GSAP):      0.6s  delay, 0.5s dur  → finishes at 1.10s
  // Trust (GSAP):     0.7s  delay, 0.5s dur  → finishes at 1.20s
  // Marquee (GSAP):   0.8s  delay, 0.5s dur, y:0 (pure fade — no slide gap)
  // Squiggle (FM):    0.4s  delay, 0.8s dur  → draws under line 3 as it settles
  const eyebrowRef = useGsapReveal<HTMLDivElement>("fade", { delay: 0, duration: 0.5, y: 10 });
  const chipsRef = useGsapReveal<HTMLDivElement>("fade", { delay: 0.3, duration: 0.5, y: 10 });
  const cardRef = useGsapReveal<HTMLDivElement>("fade", { delay: 0.45, duration: 0.5, y: 10 });
  const ctaRef = useGsapReveal<HTMLDivElement>("fade", { delay: 0.6, duration: 0.5, y: 10 });
  const trustRef = useGsapReveal<HTMLDivElement>("fade", { delay: 0.7, duration: 0.5, y: 10 });
  // Marquee: pure fade (y:0) — a slide-up would leave a visible cream gap
  // below the navy band as it animates into place.
  const marqueeRef = useGsapReveal<HTMLDivElement>("fade", { delay: 0.8, duration: 0.5, y: 0 });

  const reducedMotion = useSyncExternalStore(
    reducedMotionSubscribe,
    reducedMotionGetSnapshot,
    reducedMotionGetServerSnapshot
  );
  const [isVisible, setIsVisible] = useState(true);

  // IntersectionObserver for marquee visibility — replaces the per-scroll
  // getBoundingClientRect() call which forced a sync layout read on every
  // frame. IO is zero-cost when the section is offscreen.
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // CTA micro-interactions are handled purely in CSS (.hero-btn-primary
  // / .hero-btn-secondary) — translateY + gold glow on hover.

  const handleScrollToForm = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      const message = "Hi AVYSTRA, I visited your website and would like to know more. Can we connect?";
      window.open(`https://wa.me/918596059607?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
    },
    []
  );

  const handleScrollToBento = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      smoothScrollTo("bottlenecks");
    },
    []
  );

  return (
    <section
      id="hero-section"
      ref={sectionRef}
      className="relative w-full pt-20 sm:pt-28 lg:pt-32 pb-4 sm:pb-6 overflow-x-hidden bg-transparent"
    >
      <div className="relative max-w-5xl lg:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10 w-full select-none">
        <div className="flex flex-col items-center text-center w-full">

          {/* Eyebrow badge — compact on mobile, normal on desktop.
              Mobile: smaller text, tighter padding, shorter label. */}
          <div ref={eyebrowRef} className="mb-8 sm:mb-12">
            <span className="hero-badge-premium eyebrow-premium inline-flex items-center gap-1.5 sm:gap-2.5 rounded-full px-3 py-1 sm:px-5 sm:py-2">
              <span className="relative flex h-1.5 w-1.5">
                {!reducedMotion && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold opacity-75" />
                )}
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-gold" />
              </span>
              {/* Mobile: shorter label to fit compact pill */}
              <span className="sm:hidden text-[9px] text-gold font-mono tracking-[0.14em] font-medium uppercase whitespace-nowrap">
                Leadership Consulting
              </span>
              {/* Desktop: full label */}
              <span className="hidden sm:inline text-[11.5px] text-gold font-mono tracking-[0.18em] font-medium uppercase whitespace-nowrap">
                Leadership &amp; Performance Consulting
              </span>
            </span>
          </div>

          {/* Main heading — smaller on mobile, full size on desktop.
              Mobile: clamp(2rem, 8vw, 2.75rem) keeps it readable without
              pushing CTA below the fold. Desktop: clamp(2.25rem, 7vw, 5rem). */}
          <h1
            className="font-display font-bold text-[clamp(2rem,8vw,2.75rem)] sm:text-[clamp(2.25rem,7vw,5rem)] tracking-[-0.04em] text-navy-deep select-none heading-balance mb-10 sm:mb-14"
            style={{ lineHeight: 1.15 }}
          >
            <span className="block hero-line-1">
              You Built A Team.
            </span>
            <span className="block text-center hero-line-2 mt-1">
              So Why Does Everything Still
            </span>
            <span className="block text-center hero-line-3 mt-1">
              <span className="relative inline-block font-serif italic font-semibold whitespace-nowrap text-gold">
                Depend On You?
                {/* Squiggle mounts only after pageReady so its delay is
                    measured from the hero reveal start (not from initial
                    mount, which would fire behind the loading screen). */}
                {pageReady && (
                  <UnderlineSquiggle className="text-gold/50" delay={0.4} duration={0.8} />
                )}
              </span>
            </span>
          </h1>

          {/* Feature chips — horizontal scroll on mobile (no wrapping),
              wrap on desktop. Mobile: smaller chips, tighter padding. */}
          <div ref={chipsRef} className="flex flex-row sm:flex-wrap items-center gap-2 sm:gap-3 mb-10 sm:mb-14 max-w-3xl mx-auto overflow-x-auto scrollbar-none pb-2 sm:pb-0 sm:justify-center">
            {[
              { label: "Hired experienced people", Icon: UserPlus },
              { label: "Promoted managers", Icon: TrendingUp },
              { label: "Created departments", Icon: Building2 },
              { label: "Increased salaries", Icon: Banknote },
              { label: "Held meetings & set targets", Icon: ClipboardList },
            ].map(({ label, Icon }, idx) => (
              <div
                key={idx}
                className="flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-full border border-navy-deep/[0.08] bg-white/90 hover:border-gold/40 hover:bg-white transition-[border-color,background-color] duration-500 ease-out-expo shrink-0"
                style={{ boxShadow: "0 1px 2px rgba(11,27,46,0.04), inset 0 1px 0 rgba(255,255,255,0.9)" }}
              >
                <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-gold shrink-0" />
                <span className="text-navy-deep/80 font-sans text-[10px] sm:text-[12px] font-medium whitespace-nowrap">
                  You {label}
                </span>
              </div>
            ))}
          </div>

          {/* Bridging content block — smaller padding on mobile. */}
          <div
            ref={cardRef}
            className="hero-card-premium mb-10 sm:mb-14 max-w-2xl mx-auto rounded-2xl px-4 py-5 sm:px-12 sm:py-10 text-center"
          >
            <p className="text-navy-deep font-sans text-base sm:text-xl font-medium leading-relaxed mb-4" style={{ lineHeight: 1.5 }}>
              So why does it still feel like the company slows down whenever you step away?
            </p>
            <div className="hero-divider w-12 h-px mx-auto mb-4" />
            <p className="text-navy-deep/85 font-sans text-[14px] sm:text-base font-medium leading-relaxed mb-2" style={{ lineHeight: 1.65 }}>
              Most organizations don&apos;t struggle because people don&apos;t know what to do.
            </p>
            <p className="text-navy-deep/85 font-sans text-[14px] sm:text-base font-medium leading-relaxed mb-5" style={{ lineHeight: 1.65 }}>
              They struggle because knowing and doing are two very different things.
            </p>
            <p className="text-navy-deep font-sans text-[12px] sm:text-sm font-medium tracking-[0.1em] sm:tracking-[0.12em] uppercase">
              That&apos;s the gap{" "}
              <span className="text-gold font-bold">AVYSTRA</span>{" "}
              helps organizations close.
            </p>
          </div>

          {/* CTAs — ArrowRevealButton (premium expanding badge on hover).
              Auto-width (hug content), properly proportioned badge. */}
          <div
            ref={ctaRef}
            className="flex flex-col items-center w-full sm:max-w-none sm:flex-row sm:justify-center gap-3 sm:gap-4 mb-14 sm:mb-16 mx-auto"
          >
            <ArrowRevealButton
              label="Talk To Us"
              onClick={handleScrollToForm}
              ariaLabel="Talk to us on WhatsApp"
              colors={{ fill: "#0B1B2E", textColor: "#FFFFFF" }}
              font={{ fontFamily: "var(--font-mono)", fontSize: "11px", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase" }}
              padding="11px 28px 11px 11px"
              rounded={100}
              gap={8}
              icon={{
                type: "icon",
                icon: "arrow",
                background: "#B8924E",
                color: "#0B1B2E",
                size: 22,
                padding: 8,
                rounded: 100,
                restAngle: 0,
                hoverAngle: 45,
                side: "left",
              }}
              style={{ width: "100%", maxWidth: "220px" }}
            />

            <ArrowRevealButton
              label="See The Problem"
              onClick={handleScrollToBento}
              ariaLabel="See the problem — scroll to founder diagnostic"
              colors={{ fill: "#FFFFFF", textColor: "#0B1B2E" }}
              font={{ fontFamily: "var(--font-mono)", fontSize: "11px", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase" }}
              padding="11px 28px 11px 11px"
              rounded={100}
              gap={8}
              icon={{
                type: "icon",
                icon: "chevron",
                background: "#0B1B2E",
                color: "#B8924E",
                size: 22,
                padding: 8,
                rounded: 100,
                restAngle: 90,
                hoverAngle: 180,
                side: "left",
              }}
              border={{
                borderColor: "rgba(11, 27, 46, 0.12)",
                borderStyle: "solid",
                borderWidth: 1,
                borderTopWidth: 1,
                borderLeftWidth: 1,
                borderRightWidth: 1,
                borderBottomWidth: 1,
              }}
              style={{ width: "100%", maxWidth: "260px" }}
            />
          </div>

          {/* Trust indicators — 2x2 grid on mobile, row on desktop. */}
          <div
            ref={trustRef}
            className="grid grid-cols-2 sm:flex sm:flex-wrap justify-center gap-x-6 sm:gap-x-10 md:gap-x-14 gap-y-3 pt-6 sm:pt-8 border-t border-slate-200/50 w-full max-w-2xl"
          >
            {[
              "Leadership Development",
              "Manager Effectiveness",
              "Team Accountability",
              "Execution Systems",
            ].map((label, i) => (
              <div key={i} className="flex items-center gap-2.5 group cursor-default">
                <span className="w-1 h-1 rounded-full bg-gold/40 group-hover:bg-gold transition-colors duration-500" />
                <span className="font-mono text-[10px] sm:text-[11px] font-bold text-navy-deep/60 uppercase tracking-[0.16em] group-hover:text-navy-deep transition-colors duration-500">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Marquee Ticker */}
      <div ref={marqueeRef} className="mt-12 w-full border-y border-white/10 bg-navy-deep py-4 flex items-center relative z-10 overflow-hidden">
        <div
          aria-hidden="true"
          className="animate-marquee-slow flex whitespace-nowrap gap-x-24 select-none"
          style={{
            animationPlayState:
              isVisible && !reducedMotion ? "running" : "paused",
          }}
        >
          {[1, 2, 3, 4].map((loopIdx) => (
            <React.Fragment key={loopIdx}>
              <span className="font-display font-black text-[11px] tracking-[0.4em] text-white uppercase flex items-center gap-4">
                THINK <span className="text-gold">CLEARLY</span>
              </span>
              <span className="text-slate-500 font-light mx-4">•</span>
              <span className="font-serif italic font-light text-[11px] tracking-[0.2em] text-gold uppercase flex items-center gap-4">
                ACT DECISIVELY
              </span>
              <span className="text-slate-500 font-light mx-4">•</span>
              <span className="font-display font-black text-[11px] tracking-[0.4em] text-white uppercase flex items-center gap-4">
                ELIMINATE <span className="text-gold">FRICTION</span>
              </span>
              <span className="text-slate-500 font-light mx-4">•</span>
              <span className="font-serif italic font-light text-[11px] tracking-[0.2em] text-gold/60 uppercase flex items-center gap-4">
                STREAMLINED SUCCESS
              </span>
              <span className="text-slate-500 font-light mx-4">•</span>
            </React.Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}
