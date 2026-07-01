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
  /** Blur effect on reveal. Default: false (blur causes GPU layer thrashing
   *  and iOS text clipping — disabled by default for performance). */
  blur?: boolean;
  /** Stagger words individually. Default: false (animates the whole block
   *  as one unit — much better performance than per-word animation). */
  stagger?: boolean;
}

/**
 * Unified text reveal component — used across the entire site.
 *
 * PERFORMANCE DESIGN:
 * - Uses CSS transitions (not Framer Motion per-word animation) for zero
 *   JS animation overhead. A single IntersectionObserver triggers the reveal.
 * - Blur is DISABLED by default. `filter: blur()` creates a GPU compositing
 *   layer per element, which causes: (1) scroll jank when 10+ elements
 *   each have their own blur layer, (2) iOS text clipping (the GPU layer
 *   clips glyph descenders like the '?' tail), (3) longer paint times.
 *   Enable blur only for hero-level headings where the effect is worth the cost.
 * - Stagger is DISABLED by default. Per-word stagger creates N motion.span
 *   elements each with their own animation, which is expensive. The whole-
 *   block reveal is visually similar but 10x cheaper.
 */
export default function TextReveal({
  text,
  as: Component = "p",
  className = "",
  wordClassName = "",
  delay = 0,
  duration = 0.8,
  blur = false,
  stagger = false,
}: TextRevealProps) {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-10% 0px" });

  const DynamicComponent = Component as any;

  // Base CSS transition — opacity + transform only (GPU-cheap, no filter)
  const transition = `opacity ${duration}s cubic-bezier(0.16,1,0.3,1) ${delay}s, transform ${duration}s cubic-bezier(0.16,1,0.3,1) ${delay}s${blur ? `, filter ${duration}s cubic-bezier(0.16,1,0.3,1) ${delay}s` : ""}`;

  const baseStyle: React.CSSProperties = {
    opacity: isInView ? 1 : 0,
    transform: isInView ? "translateY(0)" : "translateY(20px)",
    transition,
  };

  if (blur) {
    baseStyle.filter = isInView ? "none" : "blur(8px)";
  }

  if (stagger) {
    // Per-word stagger using CSS animation-delay (still CSS, not JS)
    const words = text.split(" ");
    return (
      <DynamicComponent
        ref={ref}
        className={`${className} m-0 p-0`}
        style={baseStyle}
      >
        <span className="flex flex-wrap gap-x-[0.25em]">
          {words.map((word, i) => (
            <span
              key={i}
              className={wordClassName}
              style={{
                opacity: isInView ? 1 : 0,
                transform: isInView ? "translateY(0)" : "translateY(15px)",
                transition: `opacity ${duration}s cubic-bezier(0.16,1,0.3,1) ${delay + i * 0.04}s, transform ${duration}s cubic-bezier(0.16,1,0.3,1) ${delay + i * 0.04}s`,
                display: "inline-block",
              }}
            >
              {word}
            </span>
          ))}
        </span>
      </DynamicComponent>
    );
  }

  // Default: whole-block reveal (cheapest, no per-word overhead)
  return (
    <DynamicComponent
      ref={ref}
      className={`${className} m-0 p-0`}
      style={baseStyle}
    >
      <span className={wordClassName ? `inline ${wordClassName}` : "inline"}>
        {text}
      </span>
    </DynamicComponent>
  );
}
