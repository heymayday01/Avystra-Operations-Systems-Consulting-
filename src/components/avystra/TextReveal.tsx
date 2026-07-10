"use client";

import React, { useRef } from "react";
import { useReveal } from "@/lib/useReveal";

interface TextRevealProps {
  text: string;
  as?: React.ElementType;
  className?: string;
  /** Enable word-by-word stagger reveal (default: false for paragraphs).
   *  When true, text is split into word spans that stagger in with 60ms delay. */
  words?: boolean;
  /** Base delay before the first word starts, in number of stagger intervals.
   *  E.g., delay={4} with default 60ms stagger = 240ms before first word. */
  delay?: number;
}

/**
 * Unified text reveal component — used across the entire site.
 *
 * Uses the site-wide `.reveal` / `.reveal-words` CSS system (driven by
 * `useReveal` + shared IntersectionObserver pool). No Framer Motion dependency.
 *
 * MODES:
 * - words={true}: splits text into word spans, each staggers in with 60ms delay.
 *   Premium editorial feel for headings.
 * - words={false} (default): whole-block fade-up reveal (cheaper, for paragraphs).
 *
 * STAGGER MATH:
 * The `delay` prop is in "stagger intervals" (not seconds). Each interval is
 * 60ms (var(--stagger)). So delay={4} = 240ms before the first word.
 * This maps cleanly to the CSS calc(): transition-delay = word-index * stagger.
 * The first word's --word-index = delay, so it starts at delay * 60ms.
 *
 * SAFETY: Progressive enhancement — hidden state only applies when
 * <html> has `.js` class. 10s CSS safety fallback guarantees visibility.
 */
export default function TextReveal({
  text,
  as: Component = "p",
  className = "",
  words = false,
  delay = 0,
}: TextRevealProps) {
  const ref = useReveal<HTMLElement>();
  const DynamicComponent = Component as any;

  if (words) {
    // Word-by-word stagger reveal using the .reveal-words CSS system.
    // Each word gets --word-index for the CSS calc() stagger delay.
    // delay prop offsets the starting word-index (in stagger intervals).
    const wordList = text.split(" ");
    return (
      <DynamicComponent
        ref={ref}
        className={`reveal reveal-words ${className} m-0 p-0`}
      >
        {wordList.map((word, i) => (
          <span
            key={i}
            className="word"
            style={
              {
                "--word-index": i + delay,
              } as React.CSSProperties
            }
          >
            {word}{" "}
          </span>
        ))}
      </DynamicComponent>
    );
  }

  // Default: whole-block reveal (uses .reveal CSS system)
  return (
    <DynamicComponent
      ref={ref}
      className={`reveal ${className} m-0 p-0`}
    >
      <span className="inline">{text}</span>
    </DynamicComponent>
  );
}
