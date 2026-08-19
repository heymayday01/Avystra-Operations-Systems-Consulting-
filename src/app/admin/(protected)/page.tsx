import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  new: "New",
  reviewed: "Reviewed",
  contacted: "Contacted",
  archived: "Archived",
};

export default async function AdminDashboardPage() {
  const [total, byBand, byStatus, recent] = await Promise.all([
    db.ogiSubmission.count(),
    db.ogiSubmission.groupBy({ by: ["band"], _count: { _all: true } }),
    db.ogiSubmission.groupBy({ by: ["status"], _count: { _all: true } }),
    db.ogiSubmission.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { id: true, name: true, role: true, score: true, band: true, status: true, createdAt: true },
    }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-navy-deep">Dashboard</h1>
        <p className="mt-1 font-sans text-sm text-slate-muted">
          Overview of OGI diagnostic submissions.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card-premium rounded-2xl bg-white p-5">
          <p className="font-display text-[11px] font-bold uppercase tracking-[0.1em] text-slate-muted">
            Total Submissions
          </p>
          <p className="mt-2 font-mono text-3xl font-bold text-navy-deep">{total}</p>
        </div>

        {byStatus.map((s) => (
          <div key={s.status} className="card-premium rounded-2xl bg-white p-5">
            <p className="font-display text-[11px] font-bold uppercase tracking-[0.1em] text-slate-muted">
              {STATUS_LABEL[s.status] ?? s.status}
            </p>
            <p className="mt-2 font-mono text-3xl font-bold text-navy-deep">{s._count._all}</p>
          </div>
        ))}
      </div>

      {byBand.length > 0 && (
        <div className="card-premium rounded-2xl bg-white p-5">
          <p className="font-display text-[11px] font-bold uppercase tracking-[0.1em] text-slate-muted">
            By Band
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {byBand.map((b) => (
              <span
                key={b.band}
                className="rounded-full border border-navy-deep/10 bg-cream-bg px-3 py-1.5 font-sans text-sm text-navy-deep"
              >
                {b.band} <span className="font-mono font-bold">{b._count._all}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="card-premium rounded-2xl bg-white p-5">
        <div className="mb-3 flex items-center justify-between">
          <p className="font-display text-[11px] font-bold uppercase tracking-[0.1em] text-slate-muted">
            Recent Submissions
          </p>
          <Link
            href="/admin/submissions"
            className="focus-ring flex items-center gap-1 rounded-full font-display text-[11px] font-bold uppercase tracking-[0.1em] text-gold-deep hover:text-gold"
          >
            View all
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>

        {recent.length === 0 ? (
          <p className="py-6 text-center font-sans text-sm text-slate-muted">No submissions found.</p>
        ) : (
          <ul className="divide-y divide-navy-deep/[0.06]">
            {recent.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/admin/submissions/${s.id}`}
                  className="focus-ring flex items-center justify-between gap-3 rounded-xl px-2 py-3 hover:bg-cream-bg"
                >
                  <div className="min-w-0">
                    <p className="truncate font-sans text-sm font-medium text-navy-deep">{s.name}</p>
                    <p className="truncate font-sans text-xs text-slate-muted">{s.role}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="font-mono text-sm font-bold text-navy-deep">{s.score}</span>
                    <span className="hidden rounded-full bg-cream-bg px-2.5 py-1 font-sans text-xs text-navy-deep sm:inline">
                      {s.band}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
