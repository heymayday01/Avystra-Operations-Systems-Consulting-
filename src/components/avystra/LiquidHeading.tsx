"use client";

import React from "react";

interface LiquidHeadingProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
}

/**
 * Clean heading wrapper — renders children without any SVG filter effects.
 *
 * The previous version used an feDisplacementMap ripple effect on hover
 * which caused the question mark glyph to be clipped on iOS Safari
 * (the SVG filter region couldn't accommodate the tall '?' descender
 * when iOS forced bold rendering). Removed for cross-device reliability.
 */
export default function LiquidHeading({
  children,
  className = "",
  id,
}: LiquidHeadingProps) {
  return (
    <div
      className={`relative inline-block select-none ${className}`}
      id={id}
    >
      {children}
    </div>
  );
}
