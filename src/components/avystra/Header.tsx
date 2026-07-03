"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { ArrowUpRight } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { usePageReady } from "@/lib/pageReady";
import AvystraLogo from "./AvystraLogo";
import { smoothScrollTo, scrollToTop } from "@/lib/scroll";

interface NavItem {
  name: string;
  href: string;
  number: string;
}

// iOS spring easing — used for all navbar transitions
const IOS_EASE = [0.32, 0.72, 0, 1] as const;

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("bottlenecks");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const shouldReduceMotion = useReducedMotion();
  const activeSectionRef = useRef("bottlenecks");
  const pageReady = usePageReady();

  // Refs
  const headerRef = useRef<HTMLElement>(null);
  const logoRef = useRef<HTMLAnchorElement>(null);
  const navRef = useRef<HTMLElement>(null);

  // ── GSAP navbar entrance ──
  useEffect(() => {
    if (!pageReady || shouldReduceMotion) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(headerRef.current,
        { y: -24, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7, ease: "power3.out", delay: 0.1, clearProps: "all" }
      );
      gsap.fromTo(logoRef.current,
        { y: -8, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.45, ease: "power3.out", delay: 0.25, clearProps: "all" }
      );
      if (navRef.current) {
        const links = navRef.current.querySelectorAll("a");
        gsap.fromTo(links,
          { y: -8, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.35, ease: "power3.out", stagger: 0.06, delay: 0.4, clearProps: "all" }
        );
      }
    }, headerRef);
    return () => ctx.revert();
  }, [pageReady, shouldReduceMotion]);

  // ── Scroll state + active section tracking ──
  useEffect(() => {
    const handleScrollState = () => {
      const isScrolled = window.scrollY > 15;
      setScrolled((prev) => (prev !== isScrolled ? isScrolled : prev));
    };
    handleScrollState();
    window.addEventListener("scroll", handleScrollState, { passive: true });

    const sections = ["bottlenecks", "process", "programs", "team", "consult"];
    const triggers: ScrollTrigger[] = [];
    sections.forEach((id) => {
      const el = document.getElementById(id);
      if (el) {
        const trigger = ScrollTrigger.create({
          trigger: el, start: "top 45%", end: "bottom 45%",
          onToggle: (self) => {
            if (self.isActive && activeSectionRef.current !== id) {
              activeSectionRef.current = id;
              setActiveSection(id);
            }
          },
        });
        triggers.push(trigger);
      }
    });
    ScrollTrigger.refresh();

    return () => {
      window.removeEventListener("scroll", handleScrollState);
      triggers.forEach((t) => t.kill());
    };
  }, []);

  // ── Mobile menu expand/collapse ──
  // Uses CSS grid-template-rows: 0fr → 1fr trick (GPU-composited, zero layout
  // reflow per frame — same technique iOS uses for sheet expand/collapse).
  // The grid transition is handled by CSS class toggle, not GSAP.
  // GSAP handles only the opacity fade + content slide-in for polish.

  const navItems: NavItem[] = useMemo(
    () => [
      { name: "The Problem", href: "#bottlenecks", number: "01" },
      { name: "What We Do", href: "#process", number: "02" },
      { name: "Programs", href: "#programs", number: "03" },
      { name: "About", href: "#about", number: "04" },
      { name: "Contact", href: "#contact-wa", number: "05" },
    ],
    []
  );

  const handleScrollTo = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
      e.preventDefault();
      e.stopPropagation();
      setIsOpen(false);

      if (targetId === "contact-wa") {
        const message = "Hi AVYSTRA, I visited your website and would like to know more. Can we connect?";
        window.open(`https://wa.me/918596059607?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
        return;
      }
      setActiveSection(targetId);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => smoothScrollTo(targetId));
      });
    },
    []
  );

  return (
    <div
      className={`fixed left-0 right-0 z-[60] flex justify-center px-4 sm:px-6 lg:px-8 transition-[top] duration-300 ease-out-expo ${
        scrolled || isOpen ? "top-3 md:top-4" : "top-10 sm:top-12"
      }`}
      style={{ pointerEvents: "none" }}
    >
      <header
        ref={headerRef}
        className={`w-full max-w-6xl pointer-events-auto transition-[background-color,border-color,box-shadow,padding] duration-300 ease-out-expo rounded-[22px] ${
          scrolled || isOpen
            ? "py-2 px-3 sm:px-4 lg:py-2 lg:px-4 border border-white/60 bg-white/70 shadow-[0_8px_32px_-8px_rgba(var(--navy-rgb),0.18)] backdrop-blur-xl backdrop-saturate-150"
            : "py-2.5 px-3 sm:px-5 lg:px-6 bg-white/50 backdrop-blur-lg border border-white/25 shadow-sm"
        }`}
      >
        <div className="flex items-center gap-4 lg:gap-6">
          {/* Logo */}
          <div className="flex items-center min-w-0 flex-1 pl-1 sm:pl-0">
            <a
              ref={logoRef}
              href="#"
              onClick={(e) => { e.preventDefault(); setIsOpen(false); scrollToTop(1.0); }}
              className="flex items-center gap-2 group cursor-pointer focus-ring rounded-xl shrink-0"
              aria-label="AVYSTRA home"
            >
              <AvystraLogo size="sm" showSubtitle={true} className="scale-105 sm:scale-100" />
            </a>
          </div>

          {/* Desktop Nav */}
          <nav
            ref={navRef}
            aria-label="Main navigation"
            className="hidden lg:flex items-center gap-0.5 relative bg-white/40 px-1 py-1 rounded-full border border-white/30"
            onMouseLeave={() => setHoveredIndex(null)}
          >
            {navItems.map((item, i) => {
              const isActive = activeSection === item.href.substring(1);
              return (
                <a
                  key={item.name}
                  href={item.href}
                  aria-current={isActive ? "true" : undefined}
                  onMouseEnter={() => setHoveredIndex(i)}
                  onClick={(e) => {
                    setActiveSection(item.href.substring(1));
                    handleScrollTo(e, item.href.substring(1));
                  }}
                  className={`nav-premium group relative px-4 xl:px-5 py-2 font-display text-[11px] xl:text-[11.5px] uppercase tracking-[0.14em] font-bold rounded-full z-10 whitespace-nowrap focus-ring ${
                    isActive ? "text-navy-deep" : "text-navy-deep/55"
                  }`}
                >
                  <span className="relative z-10">{item.name}</span>
                  {isActive && !shouldReduceMotion && (
                    <motion.span
                      layoutId="nav-active-pill"
                      className="absolute inset-0 bg-navy-deep/[0.06] rounded-full -z-10"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  {hoveredIndex === i && !isActive && !shouldReduceMotion && (
                    <motion.span
                      layoutId="nav-hover-pill"
                      className="absolute inset-0 bg-navy-deep/[0.04] rounded-full -z-10"
                      transition={{ type: "spring", stiffness: 450, damping: 28 }}
                    />
                  )}
                </a>
              );
            })}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden lg:flex items-center justify-end shrink-0 flex-1">
            <a
              href="#consult"
              onClick={(e) => handleScrollTo(e, "consult")}
              className="relative inline-flex items-center gap-2 bg-navy-deep text-white font-display text-[10.5px] uppercase tracking-[0.18em] font-bold px-4 sm:px-5 xl:px-6 py-2.5 rounded-full hover:bg-navy-soft transition-colors duration-300 group overflow-hidden shine-on-hover whitespace-nowrap focus-ring"
            >
              <span className="relative z-10 whitespace-nowrap">Check Your OGI Score</span>
              <ArrowUpRight className="w-3 h-3 text-gold group-hover:rotate-45 transition-transform duration-300 relative z-10" />
            </a>
          </div>

          {/* Mobile Hamburger */}
          <div className="lg:hidden flex items-center shrink-0">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="relative w-11 h-11 flex items-center justify-center text-navy-deep focus-ring rounded-full bg-white/70 border border-white/40 transition-colors duration-300 hover:bg-white/80 active:bg-white/90"
              style={{ touchAction: "manipulation", WebkitTapHighlightColor: "transparent" }}
              aria-label="Toggle Menu"
              aria-expanded={isOpen}
            >
              <div className="relative w-5 h-3.5 flex flex-col justify-between items-center">
                <motion.span
                  animate={isOpen ? { rotate: 45, y: 6.25 } : { rotate: 0, y: 0 }}
                  className="w-full h-[1.5px] bg-navy-deep origin-center rounded-full"
                  transition={{ duration: 0.3, ease: IOS_EASE }}
                />
                <motion.span
                  animate={isOpen ? { opacity: 0 } : { opacity: 1 }}
                  className="w-full h-[1.5px] bg-navy-deep rounded-full"
                  transition={{ duration: 0.2, ease: "easeOut" }}
                />
                <motion.span
                  animate={isOpen ? { rotate: -45, y: -6.25 } : { rotate: 0, y: 0 }}
                  className="w-full h-[1.5px] bg-navy-deep origin-center rounded-full"
                  transition={{ duration: 0.3, ease: IOS_EASE }}
                />
              </div>
            </button>
          </div>
        </div>

        {/* Mobile Menu — CSS grid expand/collapse (iOS-smooth, zero layout reflow) */}
        <div
          className="lg:hidden grid transition-[grid-template-rows] duration-[350ms] ease-[cubic-bezier(0.32,0.72,0,1)]"
          style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
        >
          <div className="overflow-hidden">
            <div className="mt-2 pt-2 pb-1.5 space-y-1 bg-navy-deep/[0.03] backdrop-blur-md rounded-[18px] border border-navy-deep/[0.06] p-2"
              style={{
                opacity: isOpen ? 1 : 0,
                transform: isOpen ? "translateY(0)" : "translateY(-8px)",
                transition: "opacity 0.3s ease, transform 0.3s cubic-bezier(0.32,0.72,0,1)",
              }}
            >
              {navItems.map((item) => (
                <a
                  href={item.href}
                  onClick={(e) => handleScrollTo(e, item.href.substring(1))}
                  key={item.name}
                  className="flex items-center gap-3 px-4 py-3 min-h-[48px] rounded-xl bg-transparent hover:bg-navy-deep/[0.06] active:bg-navy-deep/[0.1] border border-transparent hover:border-navy-deep/[0.04] transition-[background-color,border-color] duration-300 font-sans group cursor-pointer focus-ring"
                  style={{ touchAction: "manipulation", WebkitTapHighlightColor: "transparent" }}
                >
                  <span className="font-mono text-[10.5px] font-bold text-gold tracking-widest opacity-90 shrink-0">
                    {item.number}
                  </span>
                  <span className="font-display font-semibold text-[13px] uppercase tracking-wider text-navy-deep group-hover:translate-x-1 transition-transform flex-1">
                    {item.name}
                  </span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-navy-deep transition-colors shrink-0" />
                </a>
              ))}
              <a
                href="#consult"
                onClick={(e) => handleScrollTo(e, "consult")}
                className="w-full mt-2 py-3.5 min-h-[48px] bg-navy-deep text-white font-bold font-display text-[11.5px] uppercase tracking-[0.16em] flex items-center justify-center gap-2 rounded-xl shadow-lg active:scale-[0.98] transition-transform whitespace-nowrap cursor-pointer focus-ring"
                style={{ touchAction: "manipulation", WebkitTapHighlightColor: "transparent" }}
              >
                Check Your OGI Score
                <ArrowUpRight className="w-3.5 h-3.5 text-gold" />
              </a>
            </div>
          </div>
        </div>
      </header>
    </div>
  );
}
