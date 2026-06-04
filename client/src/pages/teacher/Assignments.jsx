// client/src/pages/teacher/Assignments.jsx
import { useEffect, useMemo, useState } from "react";
import { Listbox } from "@headlessui/react";
import { api } from "../../utils/api";
import { useConfirm } from "../../components/ConfirmProvider";

export default function Assignments() {
  const { confirm, alert } = useConfirm();

  // create form
  const [sections, setSections] = useState([]);
  const [form, setForm] = useState({ sectionId: "", title: "", description: "", dueDate: "" });
  const [creating, setCreating] = useState(false);

  // recent list + selection
  const [recent, setRecent] = useState([]);
  const [loadingList, setLoadingList] = useState(false);

  const [active, setActive] = useState(null);   // selected assignment doc
  const [rows, setRows] = useState([]);         // roster with submitted flag
  const [loadingSummary, setLoadingSummary] = useState(false);

  const [msg, setMsg] = useState("");
  const [busyId, setBusyId] = useState(null);   // track which item is deleting

  useEffect(() => {
    (async () => {
      setLoadingList(true);
      try {
        const secs = await api.get("/teacher/sections");
        setSections(secs);
        const list = await api.get("/teacher/assignments");
        setRecent(list);
      } finally {
        setLoadingList(false);
      }
    })();
  }, []);

  async function create(e) {
    e.preventDefault();
    setMsg("");
    const payload = { ...form };
    if (!payload.sectionId || !payload.title || !payload.dueDate) {
      setMsg("Please fill Section, Title and Due date.");
      return;
    }
    try {
      setCreating(true);
      const a = await api.post("/teacher/assignments", payload);
      setForm({ sectionId: "", title: "", description: "", dueDate: "" });
      const list = await api.get("/teacher/assignments");
      setRecent(list);
      setMsg("✅ Assignment created.");
      await openSummary(a._id);
    } catch (err) {
      setMsg(err?.response?.data?.error || err?.message || "Failed to create assignment.");
    } finally {
      setCreating(false);
    }
  }

  async function openSummary(id) {
    setMsg("");
    setLoadingSummary(true);
    try {
      const data = await api.get(`/teacher/assignments/${id}/summary`);
      setActive(data.assignment);
      setRows(data.rows);
    } finally {
      setLoadingSummary(false);
    }
  }

  async function toggle(studentId, nextVal) {
    if (!active?._id) return;
    await api.post(`/teacher/assignments/${active._id}/mark`, {
      studentId,
      submitted: nextVal,
    });
    setRows((prev) =>
      prev.map((r) => (r.student_id === studentId ? { ...r, submitted: nextVal } : r))
    );
  }

  // delete an assignment from the recent list (ConfirmProvider)
  async function deleteAssignment(id) {
    const ok = await confirm({
      title: "Delete assignment?",
      message: "This will remove the assignment and all submissions.",
      okText: "Delete",
      cancelText: "Cancel",
      variant: "danger",
    });
    if (!ok) return;

    try {
      setBusyId(id);
      await api.del(`/teacher/assignments/${id}`);
      setRecent((prev) => prev.filter((a) => a._id !== id));
      if (active?._id === id) {
        setActive(null);
        setRows([]);
      }
      await alert({ title: "Deleted", message: "The assignment was removed." });
    } catch (err) {
      setMsg(err?.response?.data?.error || err?.message || "Failed to delete assignment.");
    } finally {
      setBusyId(null);
    }
  }

  // ---- Listbox helpers for Section picker ----
  const sectionOptions = useMemo(
    () =>
      sections.map((s) => ({
        value: String(s.id),
        label: `#${s.id} · ${s.course_code} ${s.course_title} · ${s.term}`,
      })),
    [sections]
  );
  const selectedSection = useMemo(
    () => sectionOptions.find((o) => o.value === String(form.sectionId)) || null,
    [sectionOptions, form.sectionId]
  );

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Create assignment */}
      <form onSubmit={create} className="space-y-3">
        <h2 className="text-lg font-semibold">New assignment</h2>

        {/* Section (Listbox so it never overflows) */}
        <div>
          <label className="block text-sm font-medium mb-1">Section</label>
          <div className="relative">
            <Listbox
              value={selectedSection?.value || ""}
              onChange={(v) => setForm((f) => ({ ...f, sectionId: v }))}
            >
              <Listbox.Button className="w-full border rounded px-3 py-2 text-left bg-white dark:bg-white/5">
                {selectedSection ? (
                  selectedSection.label
                ) : (
                  <span className="text-neutral-500">Select section…</span>
                )}
              </Listbox.Button>
              <Listbox.Options className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white shadow-lg ring-1 ring-black/5 focus:outline-none text-sm">
                {sectionOptions.length === 0 && (
                  <div className="px-3 py-2 text-neutral-500">No sections</div>
                )}
                {sectionOptions.map((opt) => (
                  <Listbox.Option
                    key={opt.value}
                    value={opt.value}
                    className={({ active }) =>
                      `cursor-pointer select-none px-3 py-2 ${
                        active ? "bg-sky-50 text-sky-700" : "text-neutral-900"
                      }`
                    }
                  >
                    {opt.label}
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            </Listbox>
          </div>
        </div>

        <input
          className="border rounded px-3 py-2 w-full"
          placeholder="Title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />

        <textarea
          rows={6}
          className="border rounded px-3 py-2 w-full"
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="date"
            className="border rounded px-3 py-2 sm:w-[220px]"
            value={form.dueDate}
            onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
          />
          <button
            className="rounded bg-sky-600 text-white px-4 py-2 disabled:opacity-60"
            disabled={creating}
          >
            {creating ? "Creating…" : "Create"}
          </button>
        </div>

        {msg && <div className="text-sm text-neutral-700 dark:text-neutral-300">{msg}</div>}
      </form>

      {/* Right side: Recent + Summary */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Recent assignments</h2>

        <div className="grid gap-2">
          {loadingList && <div className="text-sm text-neutral-500">Loading…</div>}
          {!loadingList &&
            recent.map((a) => (
              <div
                key={a._id}
                className={`flex items-center justify-between rounded border px-3 py-2 hover:bg-neutral-50 ${
                  active?._id === a._id ? "border-sky-400 bg-sky-50/30" : ""
                }`}
              >
                <button
                  className="text-left flex-1"
                  onClick={() => openSummary(a._id)}
                  title="Open summary"
                >
                  <div className="font-medium">{a.title}</div>
                  <div className="text-xs text-neutral-600">
                    Section #{a.sectionId} · Due {new Date(a.dueDate).toISOString().slice(0, 10)}
                  </div>
                </button>

                <button
                  onClick={() => deleteAssignment(a._id)}
                  disabled={busyId === a._id}
                  className="ml-3 rounded border px-2 py-1 text-xs hover:bg-red-50 hover:text-red-600 disabled:opacity-60"
                  title="Delete assignment"
                >
                  {busyId === a._id ? "Deleting…" : "Delete"}
                </button>
              </div>
            ))}
          {!loadingList && recent.length === 0 && (
            <div className="text-sm text-neutral-500">No assignments yet.</div>
          )}
        </div>

        {/* Selected summary */}
        {active && (
          <div className="mt-3 rounded border">
            <div className="px-3 py-2 border-b">
              <div className="font-medium">{active.title}</div>
              <div className="text-xs text-neutral-600">
                Section #{active.sectionId} · Due {new Date(active.dueDate).toISOString().slice(0, 10)}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-neutral-50 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left">Student</th>
                    <th className="px-3 py-2 text-left">Email</th>
                    <th className="px-3 py-2 text-center w-32">Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingSummary && (
                    <tr>
                      <td className="px-3 py-4" colSpan={3}>
                        Loading…
                      </td>
                    </tr>
                  )}
                  {!loadingSummary &&
                    rows.map((r) => (
                      <tr key={r.student_id} className="border-t">
                        <td className="px-3 py-2">#{r.student_id} · {r.full_name}</td>
                        <td className="px-3 py-2 break-all">{r.email}</td>
                        <td className="px-3 py-2 text-center">
                          <input
                            type="checkbox"
                            className="h-5 w-5 accent-emerald-600"
                            checked={!!r.submitted}
                            onChange={(e) => toggle(r.student_id, e.target.checked)}
                          />
                        </td>
                      </tr>
                    ))}
                  {!loadingSummary && rows.length === 0 && (
                    <tr>
                      <td className="px-3 py-6 text-neutral-500" colSpan={3}>
                        Load an assignment to see the roster.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
