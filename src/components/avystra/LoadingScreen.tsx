"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";

/**
 * Professional loading screen — GSAP-powered, no Framer Motion.
 * Pure opacity transitions. Logo + progress bar + percentage.
 */
export default function LoadingScreen() {
  const [progress, setProgress] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const pctRef = useRef<HTMLSpanElement>(null);

  // Progress counter
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) { clearInterval(interval); return 100; }
        return prev + Math.max(1, (100 - prev) * 0.15);
      });
    }, 70);
    return () => clearInterval(interval);
  }, []);

  // GSAP entrance
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(rootRef.current, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: "power2.out" });
      gsap.fromTo(logoRef.current, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.5, ease: "power3.out", delay: 0.1 });
      gsap.fromTo(barRef.current, { opacity: 0 }, { opacity: 1, duration: 0.4, ease: "power2.out", delay: 0.3 });
      gsap.fromTo(pctRef.current, { opacity: 0 }, { opacity: 1, duration: 0.4, ease: "power2.out", delay: 0.4 });
    }, rootRef);
    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-navy-deep"
    >
      <div ref={logoRef} className="mb-8">
        <img
          src="/avystra-logo-new-white.webp"
          alt="AVYSTRA Consulting Pvt. Ltd."
          style={{ height: "90px", width: "auto" }}
        />
      </div>
      <div
        ref={barRef}
        className="h-px bg-white/10 rounded-full overflow-hidden"
        style={{ width: "10rem" }}
      >
        <div
          className="h-full rounded-full"
          style={{
            width: `${progress}%`,
            background: "linear-gradient(90deg, var(--color-gold), var(--color-gold-light))",
            transition: "width 0.3s cubic-bezier(0.16,1,0.3,1)",
          }}
        />
      </div>
      <span
        ref={pctRef}
        className="mt-3 font-mono text-[10.5px] tracking-[0.3em] text-slate-500 uppercase tabular-nums"
      >
        {Math.round(progress)}%
      </span>
    </div>
  );
}
