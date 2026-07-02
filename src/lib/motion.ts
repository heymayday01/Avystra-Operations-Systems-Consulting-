/**
 * Shared motion constants — single source of truth for the entire site.
 *
 * Previously, the same easing array `[0.16, 1, 0.3, 1]` was duplicated as:
 * - `const EASE` in CumulativePenalty.tsx
 * - `const EASE` in OGIDiagnostic.tsx
 * - 9 inline `ease: [0.16, 1, 0.3, 1]` arrays across Header, Flowchart, LoadingScreen, etc.
 *
 * Now every component imports from here. These match the CSS design tokens
 * in globals.css (--ease-out, --ease-standard, --ease-sine, --dur-*).
 */

// ── Easings (match CSS --ease-* tokens) ──
/** Expo-out — primary entrance/transition easing. cubic-bezier(0.16, 1, 0.3, 1) */
export const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number];

/** Material standard — toggles/accordions. cubic-bezier(0.4, 0, 0.2, 1) */
export const EASE_STANDARD = [0.4, 0, 0.2, 1] as [number, number, number, number];

/** Sine in-out — hover micro-interactions. cubic-bezier(0.45, 0, 0.55, 1) */
export const EASE_SINE = [0.45, 0, 0.55, 1] as [number, number, number, number];

// ── Durations (match CSS --dur-* tokens, in seconds for Framer Motion) ──
/** 150ms — hover, state change */
export const DUR_MICRO = 0.15;
/** 280ms — reveal, toggle */
export const DUR_STANDARD = 0.28;
/** 600ms — scroll-triggered entrance */
export const DUR_ENTRANCE = 0.6;

// ── Spring presets (for Framer Motion state-driven animations) ──
/** Soft spring — toggle pills, gentle transitions. Less bouncy. */
export const SPRING_SOFT = { type: "spring" as const, stiffness: 280, damping: 32 };
/** Snappy spring — nav pills, active states. More responsive. */
export const SPRING_SNAPPY = { type: "spring" as const, stiffness: 380, damping: 30 };

// ── Stagger ──
/** 80ms per-child stagger (matches --stagger token) */
export const STAGGER = 0.08;
