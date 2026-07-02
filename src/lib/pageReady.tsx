"use client";

import { createContext, useContext, type ReactNode } from "react";

/**
 * PageReadyContext — signals when the page is ready for reveal animations.
 *
 * PROBLEM: The loading screen hides content for 800ms, but IntersectionObservers
 * and CSS animations fire on mount (behind the loading screen). By the time the
 * loading screen fades, above-the-fold reveals have already played out.
 *
 * SOLUTION: This context provides a `pageReady` boolean that flips to true
 * AFTER the loading screen fades. Reveal hooks (useReveal, useWordReveal) wait
 * for `pageReady` before starting to observe elements. Hero CSS animations are
 * gated behind a `.page-ready` class on <html> so their delays start from
 * pageReady, not from mount.
 *
 * Usage in page.tsx:
 *   const [pageReady, setPageReady] = useState(false);
 *   <PageReadyProvider value={pageReady}>...</PageReadyProvider>
 *
 * Usage in hooks:
 *   const pageReady = usePageReady();
 *   useEffect(() => { if (!pageReady) return; }, [pageReady]);
 */

const PageReadyContext = createContext<boolean>(false);

export function PageReadyProvider({
  value,
  children,
}: {
  value: boolean;
  children: ReactNode;
}) {
  return (
    <PageReadyContext.Provider value={value}>
      {children}
    </PageReadyContext.Provider>
  );
}

export function usePageReady(): boolean {
  return useContext(PageReadyContext);
}

export default PageReadyContext;
