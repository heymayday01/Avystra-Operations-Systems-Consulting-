"use client";

import { useGlobalTextReveal } from "@/hooks/useGlobalTextReveal";

/**
 * GlobalAnimations — invisible client component that runs the GSAP
 * useGlobalTextReveal hook once at the App level.
 *
 * Rendered inside <PageReadyProvider> in page.tsx so the hook can
 * access the pageReady context (animations start AFTER loading screen).
 */
export default function GlobalAnimations() {
  useGlobalTextReveal();
  return null;
}
