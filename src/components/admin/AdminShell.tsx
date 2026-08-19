"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, ListChecks, LogOut, Menu, X } from "lucide-react";
import AvystraLogo from "@/components/avystra/AvystraLogo";

interface AdminShellProps {
  adminEmail: string;
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Submissions", href: "/admin/submissions", icon: ListChecks },
];

export default function AdminShell({ adminEmail, children }: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } finally {
      router.push("/admin/login");
      router.refresh();
    }
  }

  const navLinks = (onNavigate?: () => void) => (
    <nav aria-label="Admin navigation" className="flex flex-col gap-1">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={`focus-ring flex items-center gap-3 rounded-xl px-4 py-2.5 font-display text-[12px] font-bold uppercase tracking-[0.1em] transition-colors duration-200 ${
              active
                ? "bg-white/10 text-gold"
                : "text-white/70 hover:bg-white/[0.06] hover:text-white"
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {item.name}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-cream-bg">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col bg-navy-deep px-4 py-6 lg:flex">
        <Link href="/admin" className="focus-ring mb-8 flex items-center rounded-xl px-2">
          <AvystraLogo theme="dark" size="sm" />
        </Link>
        {navLinks()}
        <div className="mt-auto space-y-3 border-t border-white/10 pt-4">
          <p className="truncate px-2 font-sans text-[11px] text-white/50" title={adminEmail}>
            {adminEmail}
          </p>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="focus-ring btn-premium flex w-full items-center gap-3 rounded-xl px-4 py-2.5 font-display text-[12px] font-bold uppercase tracking-[0.1em] text-white/70 transition-colors duration-200 hover:bg-white/[0.06] hover:text-white disabled:opacity-50"
          >
            <LogOut className="h-4 w-4" />
            {loggingOut ? "Logging out…" : "Logout"}
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-navy-deep/10 bg-navy-deep px-4 py-3 lg:hidden">
        <Link href="/admin" className="focus-ring flex items-center rounded-xl">
          <AvystraLogo theme="dark" size="sm" />
        </Link>
        <button
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle admin menu"
          aria-expanded={mobileOpen}
          className="focus-ring flex h-10 w-10 items-center justify-center rounded-full text-white"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>
      {mobileOpen && (
        <div className="border-b border-navy-deep/10 bg-navy-deep px-4 pb-4 lg:hidden">
          {navLinks(() => setMobileOpen(false))}
          <div className="mt-3 space-y-2 border-t border-white/10 pt-3">
            <p className="truncate px-2 font-sans text-[11px] text-white/50">{adminEmail}</p>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="focus-ring flex w-full items-center gap-3 rounded-xl px-4 py-2.5 font-display text-[12px] font-bold uppercase tracking-[0.1em] text-white/70 disabled:opacity-50"
            >
              <LogOut className="h-4 w-4" />
              {loggingOut ? "Logging out…" : "Logout"}
            </button>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="lg:pl-64">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">{children}</div>
      </main>
    </div>
  );
}
