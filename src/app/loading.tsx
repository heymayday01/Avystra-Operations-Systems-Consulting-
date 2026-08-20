/**
 * Route-level loading state — shown while the page chunk is loading.
 * Matches the loading screen aesthetic (navy bg, gold spinner).
 */
export default function Loading() {
  return (
    <div className="fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-navy-deep">
      <div className="relative">
        <div className="w-10 h-10 rounded-full border-2 border-white/10 border-t-gold animate-spin" />
      </div>
      <span className="mt-4 font-mono text-[10.5px] tracking-[0.3em] text-slate-500 uppercase">
        Loading
      </span>
    </div>
  );
}
