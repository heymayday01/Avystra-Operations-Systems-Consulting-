"use client";

import { motion } from "motion/react";
import { useEffect, useState } from "react";

/**
 * Professional loading screen — clean, minimal, enterprise-grade.
 * Single logo image with smooth blur-in entrance, shimmer sweep on
 * progress, fluid blur-out exit. No duplicate wordmark.
 */
export default function LoadingScreen() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        const remaining = 100 - prev;
        return prev + Math.max(1, remaining * 0.15);
      });
    }, 70);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, filter: "blur(12px)", scale: 1.03 }}
      transition={{
        opacity: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
        filter: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
        scale: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
      }}
      className="fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-navy-deep"
    >
      {/* Single logo image — smooth blur-in */}
      <motion.div
        initial={{ opacity: 0, filter: "blur(16px)", scale: 0.95 }}
        animate={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
        className="mb-8"
      >
        <img
          src="/avystra-logo-new-white.webp"
          alt="AVYSTRA Consulting Pvt. Ltd."
          style={{ height: "90px", width: "auto" }}
        />
      </motion.div>

      {/* Progress bar — thin line with shimmer sweep */}
      <motion.div
        initial={{ opacity: 0, width: 0 }}
        animate={{ opacity: 1, width: "10rem" }}
        transition={{ delay: 0.3, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="h-px bg-white/10 rounded-full overflow-hidden"
      >
        <div
          className="h-full rounded-full relative overflow-hidden"
          style={{
            width: `${progress}%`,
            background: "linear-gradient(90deg, #B8924E, #D4B26A)",
            transition: "width 0.3s cubic-bezier(0.16,1,0.3,1)",
          }}
        >
          {/* Shimmer sweep — continuous */}
          <motion.div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%)",
            }}
            animate={{ x: ["-100%", "200%"] }}
            transition={{
              duration: 1.4,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        </div>
      </motion.div>

      {/* Percentage — smooth fade-in */}
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="mt-3 font-mono text-[10.5px] tracking-[0.3em] text-slate-500 uppercase tabular-nums"
      >
        {Math.round(progress)}%
      </motion.span>
    </motion.div>
  );
}
