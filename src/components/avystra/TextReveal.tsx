"use client";

import React, { useRef } from "react";
import { useReveal } from "@/lib/useReveal";

interface TextRevealProps {
  text: string;
  as?: React.ElementType;
  className?: string;
  /** Enable word-by-word stagger reveal (default: true for headings, false for paragraphs).
   *  When true, text is split into word spans that stagger in with 80ms delay. */
  words?: boolean;
  /** Base delay before the first word/element starts (seconds). */
  delay?: number;
}

/**
 * Unified text reveal component — used across the entire site.
 *
 * Uses the site-wide `.reveal` / `.reveal-words` CSS system (driven by
 * `useReveal` + IntersectionObserver). No Framer Motion dependency.
 *
 * MODES:
 * - words={true} (default for headings): splits text into word spans,
 *   each staggers in with 80ms delay. Premium editorial feel.
 * - words={false}: whole-block fade-up reveal (cheaper, for paragraphs).
 *
 * SAFETY: Progressive enhancement — hidden state only applies when
 * <html> has `.js` class. 4s CSS safety fallback guarantees visibility.
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
                "--word-index": i + delay * 12.5, // delay in seconds → word-index offset
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
