// client/src/pages/teacher/Notices.jsx
import { useEffect, useMemo, useState } from "react";
import { api } from "../../utils/api";

export default function TeacherNotices() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [audFilter, setAudFilter] = useState("*"); // * | ALL | STUDENT | TEACHER

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        // Teacher sees ALL + TEACHER + STUDENT
        const data = await api.get("/teacher/notices");
        setList(data || []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    if (audFilter === "*") return list;
    return list.filter((n) => (audFilter === "ALL" ? true : n.audience === audFilter));
  }, [list, audFilter]);

  function fmtDate(d) {
    if (!d) return "";
    try { return new Date(d).toLocaleString(); }
    catch { return String(d); }
  }

  function badgeClass(aud) {
    if (aud === "TEACHER") return "border-violet-300 text-violet-800";
    if (aud === "STUDENT") return "border-emerald-300 text-emerald-800";
    return "border-neutral-300 text-neutral-700"; // ALL
  }

  return (
    <div className="space-y-4">
      {/* Header + filter (mirrors student page) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h2 className="text-lg font-semibold">Notices</h2>

        <div className="flex items-center gap-2">
          <label className="text-sm text-neutral-600">Filter:</label>
          <select
            className="border rounded px-3 py-1.5 text-sm"
            value={audFilter}
            onChange={(e) => setAudFilter(e.target.value)}
          >
            <option value="*">All</option>
            <option value="ALL">Audience: ALL</option>
            <option value="TEACHER">Audience: TEACHER</option>
            <option value="STUDENT">Audience: STUDENT</option>
          </select>
        </div>
      </div>

      {/* Content (identical card layout to student page) */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {loading && (
          <div className="col-span-full text-sm text-neutral-500">Loading…</div>
        )}

        {!loading && filtered.map((n) => (
          <article key={n._id} className="rounded border p-3 bg-white dark:bg-white/5">
            <header className="flex items-start justify-between gap-3">
              <h3 className="font-medium leading-snug break-words">
                {n.title}
              </h3>
              <span
                className={`shrink-0 text-xs rounded px-2 py-0.5 border ${badgeClass(n.audience)}`}
                title={`Audience: ${n.audience}`}
              >
                {n.audience}
              </span>
            </header>

            <p className="text-sm mt-2 whitespace-pre-wrap break-words">
              {n.body}
            </p>

            <footer className="text-xs text-neutral-500 mt-2">
              {fmtDate(n.createdAt)}
            </footer>
          </article>
        ))}

        {!loading && filtered.length === 0 && (
          <div className="col-span-full text-sm text-neutral-500">
            No notices{audFilter !== "*" ? " for this filter" : ""}.
          </div>
        )}
      </div>
    </div>
  );
}
