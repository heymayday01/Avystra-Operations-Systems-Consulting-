"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

/**
 * Error boundary — catches any uncaught error in the React tree and shows
 * a branded fallback instead of a blank white screen. The user can reload
 * the page without losing context.
 *
 * This wraps the entire app (placed at src/app/error.tsx) and catches errors
 * from any component, API route handler, or server component.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to console for debugging (production should send to Sentry/etc)
    console.error("[error-boundary]", error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-cream-bg px-4 text-center">
      {/* Ambient glow */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[400px] h-[400px] rounded-full opacity-20 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(239,68,68,0.10) 0%, transparent 65%)",
        }}
      />

      <div className="relative z-10 max-w-md mx-auto">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-white/60 border border-rose-200/50 flex items-center justify-center shadow-sm">
            <AlertTriangle className="w-7 h-7 text-rose-500" />
          </div>
        </div>

        {/* Heading */}
        <h1 className="font-display font-bold text-2xl sm:text-3xl text-navy-deep tracking-tight mb-3">
          Something went wrong
        </h1>

        {/* Description */}
        <p className="text-slate-500 font-sans text-sm sm:text-base font-light leading-relaxed mb-8 max-w-sm mx-auto">
          An unexpected error occurred. You can try again — if the problem
          persists, please refresh the page.
        </p>

        {/* Error digest (for debugging) */}
        {error.digest && (
          <p className="text-[10px] font-mono text-slate-400 mb-6">
            Error ID: {error.digest}
          </p>
        )}

        {/* Retry button */}
        <button
          onClick={reset}
          className="btn-premium group inline-flex items-center gap-2.5 bg-navy-deep hover:bg-gold text-white font-display text-sm font-bold tracking-wider uppercase px-8 py-4 rounded-full shadow-lg focus-ring cursor-pointer transition-colors duration-300"
        >
          <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
          Try Again
        </button>
      </div>
    </div>
  );
}
