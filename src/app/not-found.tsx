"use client";

import Link from "next/link";
import { ArrowLeft, Compass } from "lucide-react";

/**
 * Custom 404 page — branded, maintains the design system.
 * Matches the navy/gold premium aesthetic.
 */
export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-cream-bg px-4 text-center">
      {/* Ambient glow */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[400px] h-[400px] rounded-full opacity-30 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(184,146,78,0.15) 0%, transparent 65%)",
        }}
      />

      <div className="relative z-10 max-w-md mx-auto">
        {/* Large 404 */}
        <div className="mb-6">
          <span className="font-display font-black text-[clamp(5rem,20vw,9rem)] text-navy-deep/10 leading-none tracking-tighter">
            404
          </span>
        </div>

        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-white/60 border border-slate-200/50 flex items-center justify-center shadow-sm">
            <Compass className="w-7 h-7 text-gold" />
          </div>
        </div>

        {/* Heading */}
        <h1 className="font-display font-bold text-2xl sm:text-3xl text-navy-deep tracking-tight mb-3">
          This page took a wrong turn
        </h1>

        {/* Description */}
        <p className="text-slate-500 font-sans text-sm sm:text-base font-light leading-relaxed mb-8 max-w-sm mx-auto">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
          Let&apos;s get you back on track.
        </p>

        {/* CTA */}
        <Link
          href="/"
          className="btn-premium group inline-flex items-center gap-2.5 bg-navy-deep hover:bg-gold text-white font-display text-sm font-bold tracking-wider uppercase px-8 py-4 rounded-full shadow-lg focus-ring cursor-pointer transition-colors duration-300"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-300" />
          Back to Home
        </Link>
      </div>
    </div>
  );
}
