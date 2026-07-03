"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";

export interface LoadingScreenProps {
  /**
   * Fires AFTER the exit fade-out completes. The parent should use this to
   * unmount the LoadingScreen AND flip `pageReady` simultaneously — this
   * creates a clean handoff where the page wrapper fades in while the hero
   * cascade begins, with no navy tint over the hero.
   */
  onComplete?: () => void;
}

/**
 * Professional loading screen — self-contained GSAP lifecycle.
 *
 * PIPELINE (single GSAP timeline, no competing timers):
 *   1. Entrance  — logo / bar / pct stagger in (0.45s, overlapping).
 *   2. Progress  — bar fills 0 → 100% via a proxy tween that writes directly
 *                  to the DOM (refs). No per-frame React re-renders.
 *   3. Hold      — brief 80ms pause at 100% so the user registers completion.
 *   4. Exit      — root fades out (0.28s, power2.inOut).
 *   5. onComplete — fires after exit, parent unmounts + starts hero cascade.
 *
 * GLITCHES THIS FIXES (vs. the old implementation):
 * - Old: progress bar used an exponential counter cut off at 400ms, freezing
 *   at ~55%. New: deterministic GSAP tween reaches exactly 100% before exit.
 * - Old: no exit animation — hard cut when isLoading flipped. New: 0.28s fade.
 * - Old: percentage showed a non-100% number on vanish. New: shows "100%".
 * - Old: LoadingScreen had its own GSAP entrance fighting the parent's
 *   separate 400ms/550ms timers. New: single source of truth — this timeline
 *   owns the entire loading phase, parent reacts via onComplete.
 *
 * REDUCED MOTION: the timeline is skipped entirely; onComplete fires on the
 * next frame so the page appears instantly with no motion.
 */
export default function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const barTrackRef = useRef<HTMLDivElement>(null);
  const barFillRef = useRef<HTMLDivElement>(null);
  const pctRef = useRef<HTMLSpanElement>(null);

  // Keep the latest callback in a ref so the GSAP timeline (created once on
  // mount) always calls the freshest closure without rebuilding.
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      // No motion — reveal the page on the next frame.
      const id = requestAnimationFrame(() => onCompleteRef.current?.());
      return () => cancelAnimationFrame(id);
    }

    // Proxy object tweened by GSAP; its `v` is mirrored to the bar width +
    // percentage text via direct DOM writes (no React state per frame).
    const proxy = { v: 0 };

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: "power2.out" },
        onComplete: () => onCompleteRef.current?.(),
      });

      // 1. Entrance — inner content staggers in. The root itself is visible
      //    immediately (bg-navy-deep) so there is no white flash before paint;
      //    the body background is also navy-deep, matching seamlessly.
      tl.fromTo(
        logoRef.current,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.45, ease: "power3.out" }
      )
        .fromTo(
          barTrackRef.current,
          { opacity: 0 },
          { opacity: 1, duration: 0.35 },
          "-=0.2"
        )
        .fromTo(
          pctRef.current,
          { opacity: 0 },
          { opacity: 1, duration: 0.35 },
          "<"
        )
        // 2. Progress fill — deterministic 0 → 100 over 0.55s.
        .to(
          proxy,
          {
            v: 100,
            duration: 0.55,
            ease: "power1.out",
            onUpdate: () => {
              const v = proxy.v;
              if (barFillRef.current)
                barFillRef.current.style.width = `${v}%`;
              if (pctRef.current)
                pctRef.current.textContent = `${Math.round(v)}%`;
            },
          },
          "-=0.15"
        )
        // 3. Hold at 100% — let completion register.
        .to({}, { duration: 0.08 })
        // 4. Exit fade.
        .to(rootRef.current, {
          opacity: 0,
          duration: 0.28,
          ease: "power2.inOut",
        });
    }, rootRef);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-navy-deep"
      role="status"
      aria-label="Loading Avystra"
    >
      <div ref={logoRef} className="mb-8 opacity-0">
        <img
          src="/avystra-logo-new-white.webp"
          alt=""
          style={{ height: "90px", width: "auto" }}
        />
      </div>
      <div
        ref={barTrackRef}
        className="h-px bg-white/10 rounded-full overflow-hidden opacity-0"
        style={{ width: "10rem" }}
      >
        <div
          ref={barFillRef}
          className="h-full rounded-full"
          style={{
            width: "0%",
            background:
              "linear-gradient(90deg, var(--color-gold), var(--color-gold-light))",
          }}
        />
      </div>
      <span
        ref={pctRef}
        className="mt-3 font-mono text-[10.5px] tracking-[0.3em] text-slate-500 uppercase tabular-nums opacity-0"
      >
        0%
      </span>
    </div>
  );
}
