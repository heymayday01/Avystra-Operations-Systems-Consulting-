"use client";

import React, { useRef } from "react";
import { useInView } from "motion/react";

interface TextRevealProps {
  text: string;
  as?: React.ElementType;
  className?: string;
  wordClassName?: string;
  delay?: number;
  duration?: number;
  blur?: boolean;
}

/**
 * Lightweight text reveal — uses CSS transitions instead of per-word
 * motion.span components. A single IntersectionObserver triggers a
 * CSS class that animates opacity + transform on the whole block.
 * Visually identical to the old motion-based version but with
 * zero JavaScript animation overhead per word.
 */
export default function TextReveal({
  text,
  as: Component = "p",
  className = "",
  wordClassName = "",
  delay = 0,
  duration = 0.8,
  blur = true,
}: TextRevealProps) {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-10% 0px" });

  const DynamicComponent = Component as any;

  return (
    <DynamicComponent
      ref={ref}
      className={`${className} m-0 p-0`}
      style={{
        opacity: isInView ? 1 : 0,
        transform: isInView ? "translateY(0)" : "translateY(20px)",
        filter: blur && !isInView ? "blur(10px)" : "none",
        transition: `opacity ${duration}s cubic-bezier(0.16,1,0.3,1) ${delay}s, transform ${duration}s cubic-bezier(0.16,1,0.3,1) ${delay}s, filter ${duration}s cubic-bezier(0.16,1,0.3,1) ${delay}s`,
      }}
    >
      <span className={`flex flex-wrap ${wordClassName ? "gap-x-[0.25em]" : ""}`}>
        {text}
      </span>
    </DynamicComponent>
  );
}
