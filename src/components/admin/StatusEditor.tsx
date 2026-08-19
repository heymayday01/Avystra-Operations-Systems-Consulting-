"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { SUBMISSION_STATUSES } from "@/lib/admin-submissions";

interface StatusEditorProps {
  submissionId: string;
  initialStatus: string;
  initialNotes: string;
}

const STATUS_LABEL: Record<string, string> = {
  new: "New",
  reviewed: "Reviewed",
  contacted: "Contacted",
  archived: "Archived",
};

export default function StatusEditor({ submissionId, initialStatus, initialNotes }: StatusEditorProps) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [notes, setNotes] = useState(initialNotes);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const dirty = status !== initialStatus || notes !== initialNotes;

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch(`/api/admin/submissions/${submissionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, adminNotes: notes }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        setError("Failed to save changes.");
        return;
      }
      setSaved(true);
      router.refresh();
    } catch {
      setError("Failed to save changes.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card-premium rounded-2xl bg-white p-5">
      <p className="font-display text-[11px] font-bold uppercase tracking-[0.1em] text-slate-muted">
        Admin Status
      </p>

      <div className="mt-3">
        <label htmlFor="status-select" className="sr-only">
          Status
        </label>
        <select
          id="status-select"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setSaved(false);
          }}
          disabled={saving}
          className="focus-ring w-full rounded-xl border border-navy-deep/15 bg-white px-3 py-2.5 font-sans text-sm text-navy-deep disabled:opacity-60"
        >
          {SUBMISSION_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-3">
        <label
          htmlFor="admin-notes"
          className="mb-1.5 block font-display text-[11px] font-bold uppercase tracking-[0.1em] text-navy-deep/70"
        >
          Notes
        </label>
        <textarea
          id="admin-notes"
          value={notes}
          onChange={(e) => {
            setNotes(e.target.value);
            setSaved(false);
          }}
          disabled={saving}
          maxLength={2000}
          rows={4}
          placeholder="Internal notes about this submission…"
          className="focus-ring w-full resize-y rounded-xl border border-navy-deep/15 bg-white px-3 py-2.5 font-sans text-sm text-navy-deep placeholder:text-navy-deep/30 disabled:opacity-60"
        />
      </div>

      {error && (
        <p role="alert" className="mt-3 rounded-lg bg-danger/10 px-3 py-2 font-sans text-sm text-danger">
          {error}
        </p>
      )}
      {saved && !dirty && (
        <p className="mt-3 font-sans text-sm text-success">Saved.</p>
      )}

      <button
        onClick={handleSave}
        disabled={saving || !dirty}
        className="hero-btn-primary focus-ring mt-4 flex w-full items-center justify-center gap-2 rounded-full py-2.5 font-display text-[11px] font-bold uppercase tracking-[0.16em] text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {saving && <Loader2 className="h-4 w-4 animate-spin" />}
        {saving ? "Saving…" : "Save Changes"}
      </button>
    </div>
  );
}
