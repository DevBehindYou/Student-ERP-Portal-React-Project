// client/src/pages/student/Assignments.jsx
import { useEffect, useMemo, useState } from "react";
import { api } from "../../utils/api";

export default function StudentAssignments() {
  const [items, setItems] = useState([]);
  const [savingId, setSavingId] = useState(null);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setMsg("");
    setLoading(true);
    try {
      const list = await api.get("/student/assignments");
      setItems(Array.isArray(list) ? list : []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function submitLink(id, url) {
    setSavingId(id);
    setMsg("");
    try {
      await api.post(`/student/assignments/${id}/submit`, { url });
      await load();
      setMsg("✅ Submitted!");
    } catch (e) {
      setMsg(e?.response?.data?.error || e?.message || "Failed to submit.");
    } finally {
      setSavingId(null);
    }
  }

  const sorted = useMemo(() => {
    // show pending/soonest first
    const byDue = [...items].sort((a,b) => new Date(a.dueDate) - new Date(b.dueDate));
    return byDue;
  }, [items]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h2 className="text-lg font-semibold">Assignments</h2>
        {msg && <div className="text-sm text-neutral-700 dark:text-neutral-300">{msg}</div>}
      </div>

      {loading && (
        <div className="rounded border p-3 text-sm text-neutral-500">Loading…</div>
      )}

      {!loading && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {sorted.map((a) => (
            <AssignmentCard
              key={a._id}
              data={a}
              saving={savingId === a._id}
              onSubmit={submitLink}
            />
          ))}
          {sorted.length === 0 && (
            <div className="col-span-full text-neutral-500 text-sm">
              No assignments yet.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AssignmentCard({ data, saving, onSubmit }) {
  const [url, setUrl] = useState("");

  useEffect(() => {
    setUrl(data.url || "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data._id]);

  const dueISO = safeISO(data.dueDate);
  const dueLabel = fmtDate(dueISO);
  const status = useStatus(dueISO, !!data.submitted);

  const canSubmit = isLikelyUrl(url);

  return (
    <article className="rounded border p-3 bg-white dark:bg-white/5">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-medium leading-snug break-words">{data.title}</h3>
          <div className="text-xs text-neutral-600">
            Section #{data.sectionId} · Due {dueLabel}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <StatusBadge submitted={data.submitted} />
          <DueBadge status={status} />
        </div>
      </header>

      {data.description && (
        <p className="text-sm mt-2 whitespace-pre-wrap break-words">{data.description}</p>
      )}

      {data.submitted ? (
        <div className="mt-3 text-sm">
          <div>
            <span className="font-medium">Submitted:</span>{" "}
            {data.submittedAt ? fmtDate(safeISO(data.submittedAt), true) : "--"}
          </div>
          {data.url && (
            <div className="truncate">
              <span className="font-medium">URL:</span>{" "}
              <a className="text-sky-600 underline break-all" href={data.url} target="_blank" rel="noreferrer">
                {data.url}
              </a>
            </div>
          )}
          <div className="mt-2 text-xs text-neutral-500">
            You can update your link and press Submit again.
          </div>
        </div>
      ) : null}

      {/* Submit / Update form */}
      <form
        className="mt-3 flex flex-col sm:flex-row sm:items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!canSubmit) return;
          onSubmit(data._id, url.trim());
        }}
      >
        <input
          className="border rounded px-3 py-2 w-full"
          placeholder="Paste Drive/GitHub/URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
          inputMode="url"
        />
        <button
          disabled={saving || !canSubmit}
          className="rounded bg-sky-600 text-white px-4 py-2 disabled:opacity-60 w-full sm:w-auto"
          title={!canSubmit ? "Enter a valid URL" : "Submit assignment link"}
        >
          {saving ? "Submitting…" : data.submitted ? "Update link" : "Submit"}
        </button>
      </form>
    </article>
  );
}

/* ---------- helpers & badges ---------- */

function StatusBadge({ submitted }) {
  return submitted ? (
    <span className="rounded-full bg-emerald-100 text-emerald-700 text-xs px-2 py-1">Submitted</span>
  ) : (
    <span className="rounded-full bg-amber-100 text-amber-700 text-xs px-2 py-1">Pending</span>
  );
}

function DueBadge({ status }) {
  if (status === "overdue") {
    return <span className="rounded-full bg-rose-100 text-rose-700 text-xs px-2 py-1">Overdue</span>;
  }
  if (status === "soon") {
    return <span className="rounded-full bg-amber-100 text-amber-700 text-xs px-2 py-1">Due soon</span>;
  }
  return null;
}

function useStatus(dueISO, submitted) {
  if (!dueISO || submitted) return null;
  const now = Date.now();
  const due = new Date(dueISO).getTime();
  if (isNaN(due)) return null;
  if (due < now) return "overdue";
  const ONE_DAY = 24 * 60 * 60 * 1000;
  if (due - now <= 2 * ONE_DAY) return "soon";
  return null;
}

function fmtDate(iso, includeTime = false) {
  if (!iso) return "-";
  const d = new Date(iso);
  try {
    return includeTime
      ? d.toLocaleString()
      : d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
  } catch {
    return iso;
  }
}

function safeISO(v) {
  try { return new Date(v).toISOString(); } catch { return null; }
}

// Light URL check; keeps UX friendly while catching obvious typos.
function isLikelyUrl(s) {
  if (!s) return false;
  const v = s.trim();
  // allow http(s) and common share links (drive/github)
  if (/^https?:\/\/\S+/i.test(v)) return true;
  if (/drive\.google\.com\/\S+/i.test(v)) return true;
  if (/github\.com\/\S+/i.test(v)) return true;
  return false;
}
