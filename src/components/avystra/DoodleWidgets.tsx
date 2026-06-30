"use client";

import { motion } from "motion/react";

interface DoodleProps {
  className?: string;
  color?: string;
  duration?: number;
  delay?: number;
}

/** Squiggly underline that draws itself on scroll-into-view */
export function UnderlineSquiggle({
  className = "",
  color = "#C5A059",
  duration = 1.4,
  delay = 0.3,
}: DoodleProps) {
  return (
    <svg
      viewBox="0 0 200 15"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`absolute left-0 bottom-[-6px] w-[110%] h-[12px] overflow-visible pointer-events-none ${className}`}
      aria-hidden="true"
    >
      <motion.path
        d="M2 13C35 9 125 2 198 2C160 5.5 110 8 35 12"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        whileInView={{ pathLength: 1, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration, delay, ease: "easeInOut" }}
      />
    </svg>
  );
}

/** Dynamic organic sparkle star — pops in with spring physics */
export function DoodleSparkle({
  className = "",
  color = "#C5A059",
  duration = 1.2,
  delay = 0,
}: DoodleProps) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`absolute w-8 h-8 pointer-events-none ${className}`}
      aria-hidden="true"
    >
      <motion.path
        d="M 20 2 Q 20 18, 38 20 Q 20 22, 20 38 Q 20 22, 2 20 Q 20 18, 20 2"
        fill={color}
        initial={{ scale: 0, opacity: 0, rotate: -25 }}
        whileInView={{ scale: 1, opacity: 0.9, rotate: 0 }}
        viewport={{ once: true }}
        transition={{
          type: "spring",
          stiffness: 80,
          damping: 10,
          duration,
          delay,
        }}
        whileHover={{
          scale: 1.2,
          rotate: 45,
          transition: { duration: 0.3 },
        }}
      />
    </svg>
  );
}
