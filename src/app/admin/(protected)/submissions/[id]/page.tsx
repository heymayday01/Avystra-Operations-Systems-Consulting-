import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { db } from "@/lib/db";
import { questions, dimensionLabels, getResultBand, type DimensionCode } from "@/lib/ogi-data";
import StatusEditor from "@/components/admin/StatusEditor";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

const STATUS_LABEL: Record<string, string> = {
  new: "New",
  reviewed: "Reviewed",
  contacted: "Contacted",
  archived: "Archived",
};

export default async function SubmissionDetailPage({ params }: PageProps) {
  const { id } = await params;
  const submission = await db.ogiSubmission.findUnique({ where: { id } });
  if (!submission) notFound();

  let rawAnswers: Record<string, number | string> = {};
  try {
    rawAnswers = JSON.parse(submission.answersJson);
  } catch {
    rawAnswers = {};
  }

  const band = getResultBand(submission.score);
  const pillars: DimensionCode[] = ["L", "M", "T", "E"];
  const pillarBreakdown = pillars.map((code) => {
    const qs = questions.filter((q) => q.dimensionCode === code);
    const sum = qs.reduce((acc, q) => {
      const raw = rawAnswers[String(q.id)];
      const v = typeof raw === "string" ? Number(raw) : raw;
      return acc + (typeof v === "number" && Number.isFinite(v) ? v : 2);
    }, 0);
    const pct = Math.round((sum / (qs.length * 4)) * 100);
    return { code, label: dimensionLabels[code], color: qs[0]?.color ?? "#0B1B2E", pct };
  });

  return (
    <div className="space-y-6">
      <Link
        href="/admin/submissions"
        className="focus-ring inline-flex items-center gap-1.5 rounded-full font-display text-[11px] font-bold uppercase tracking-[0.1em] text-slate-muted hover:text-navy-deep"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Submissions
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-navy-deep">{submission.name}</h1>
          <p className="mt-1 font-sans text-sm text-slate-muted">{submission.role}</p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className="rounded-full px-3 py-1.5 font-sans text-sm font-medium text-white"
            style={{ backgroundColor: band.colour }}
          >
            {submission.band}
          </span>
          <span className="font-mono text-3xl font-bold text-navy-deep">{submission.score}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Identity */}
          <div className="card-premium rounded-2xl bg-white p-5">
            <p className="mb-3 font-display text-[11px] font-bold uppercase tracking-[0.1em] text-slate-muted">
              Contact
            </p>
            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <dt className="font-sans text-xs text-slate-muted">Contact</dt>
                <dd className="font-sans text-sm text-navy-deep">{submission.contact}</dd>
              </div>
              <div>
                <dt className="font-sans text-xs text-slate-muted">Email</dt>
                <dd className="font-sans text-sm text-navy-deep">{submission.email ?? "—"}</dd>
              </div>
              <div>
                <dt className="font-sans text-xs text-slate-muted">Submitted</dt>
                <dd className="font-sans text-sm text-navy-deep">
                  {submission.createdAt.toLocaleString()}
                </dd>
              </div>
              <div>
                <dt className="font-sans text-xs text-slate-muted">Current Status</dt>
                <dd className="font-sans text-sm text-navy-deep">
                  {STATUS_LABEL[submission.status] ?? submission.status}
                </dd>
              </div>
            </dl>
          </div>

          {/* Pillar breakdown */}
          <div className="card-premium rounded-2xl bg-white p-5">
            <p className="mb-4 font-display text-[11px] font-bold uppercase tracking-[0.1em] text-slate-muted">
              Pillar Breakdown
            </p>
            <div className="space-y-4">
              {pillarBreakdown.map((p) => (
                <div key={p.code}>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="font-sans text-sm text-navy-deep">{p.label}</span>
                    <span className="font-mono text-sm font-bold text-navy-deep">{p.pct}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-cream-bg">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${p.pct}%`, backgroundColor: p.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Answers */}
          <div className="card-premium rounded-2xl bg-white p-5">
            <p className="mb-3 font-display text-[11px] font-bold uppercase tracking-[0.1em] text-slate-muted">
              All Answers
            </p>
            <ul className="divide-y divide-navy-deep/[0.06]">
              {questions.map((q) => {
                const raw = rawAnswers[String(q.id)];
                const value = typeof raw === "string" ? Number(raw) : raw;
                return (
                  <li key={q.id} className="py-3">
                    <p className="font-sans text-sm text-navy-deep">{q.text}</p>
                    <p className="mt-1 font-sans text-xs text-slate-muted">
                      {q.dimensionName} ·{" "}
                      <span className="font-medium text-navy-deep">
                        {typeof value === "number" && Number.isFinite(value) ? value : "—"}
                      </span>
                      /4
                    </p>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* Admin editor */}
        <div>
          <StatusEditor
            submissionId={submission.id}
            initialStatus={submission.status}
            initialNotes={submission.adminNotes ?? ""}
          />
        </div>
      </div>
    </div>
  );
}
