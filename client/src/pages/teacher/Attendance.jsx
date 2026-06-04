import { useEffect, useMemo, useState } from "react";
import { Listbox } from "@headlessui/react";
import { api } from "../../utils/api";

export default function Attendance() {
  const [sections, setSections] = useState([]);
  const [sectionId, setSectionId] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));

  const [roster, setRoster] = useState([]);           // [{student_id, full_name, roll_no?}]
  const [presence, setPresence] = useState({});       // { [studentId]: true|false }
  const [loading, setLoading] = useState(false);      // loading roster+attendance
  const [loadBtnBusy, setLoadBtnBusy] = useState(false);
  const [submitBusy, setSubmitBusy] = useState(false);
  const [msg, setMsg] = useState("");

  // Load teacher's sections for dropdown
  useEffect(() => {
    api.get("/teacher/sections").then(setSections).catch(console.error);
  }, []);

  // load roster + existing attendance
  async function load() {
    if (!sectionId || !date) return;
    setLoading(true);
    setLoadBtnBusy(true);
    setMsg("");
    try {
      const [r, a] = await Promise.all([
        api.get(`/teacher/sections/${sectionId}/roster`),
        api.get(`/teacher/attendance?sectionId=${sectionId}&date=${date}`),
      ]);
      setRoster(r);

      // presence from existing values or default false
      const map = {};
      r.forEach((s) => {
        const prev = a.find((x) => x.student_id === s.student_id);
        map[s.student_id] = !!prev?.present;
      });
      setPresence(map);
    } catch (e) {
      setMsg(e.message || "Failed to load");
    } finally {
      setLoading(false);
      setLoadBtnBusy(false);
    }
  }

  function toggleAll(val) {
    const m = {};
    roster.forEach((s) => (m[s.student_id] = val));
    setPresence(m);
  }

  async function submit() {
    if (!sectionId || roster.length === 0) return;
    setSubmitBusy(true);
    setMsg("");
    const entries = roster.map((s) => ({
      studentId: s.student_id,
      present: !!presence[s.student_id],
    }));
    try {
      await api.post("/teacher/attendance", { sectionId, date, entries });
      setMsg("✅ Attendance saved.");
    } catch (e) {
      setMsg(e.message || "Failed to save");
    } finally {
      setSubmitBusy(false);
    }
  }

  // ----- Listbox helpers -----
  const sectionOptions = useMemo(
    () =>
      sections.map((s) => ({
        value: String(s.id),
        label: `#${s.id} · ${s.course_code} ${s.course_title} · ${s.term}`,
      })),
    [sections]
  );
  const selectedSection = useMemo(
    () => sectionOptions.find((o) => o.value === String(sectionId)) || null,
    [sectionOptions, sectionId]
  );

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Attendance</h2>

      {/* Controls */}
      <div className="flex flex-col gap-3 sm:items-end sm:flex-row sm:flex-wrap">
        {/* Section picker (Listbox so it never overflows) */}
        <div className="sm:min-w-[320px] w-full">
          <label className="block text-sm font-medium mb-1">Section</label>
          <div className="relative">
            <Listbox value={selectedSection?.value || ""} onChange={(v) => setSectionId(v)}>
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

        {/* Date */}
        <div className="w-full sm:w-auto">
          <label className="block text-sm font-medium mb-1">Date</label>
          <input
            type="date"
            className="border rounded px-3 py-2 w-full sm:w-[220px]"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        {/* Load */}
        <div className="w-full sm:w-auto sm:self-end">
          <label className="block text-sm font-medium mb-1 opacity-0 select-none">Load</label>
          <button
            onClick={load}
            className="w-full sm:w-auto rounded bg-sky-600 text-white px-4 py-2 disabled:opacity-60"
            disabled={!sectionId || loadBtnBusy}
          >
            {loadBtnBusy ? "Loading…" : "Load"}
          </button>
        </div>

        {/* Bulk + Submit */}
        <div className="w-full sm:w-auto sm:ml-auto flex gap-2">
          <button
            onClick={() => toggleAll(true)}
            className="flex-1 sm:flex-none rounded border px-3 py-2"
            disabled={loading || roster.length === 0}
          >
            All present
          </button>
          <button
            onClick={() => toggleAll(false)}
            className="flex-1 sm:flex-none rounded border px-3 py-2"
            disabled={loading || roster.length === 0}
          >
            All absent
          </button>
          <button
            onClick={submit}
            className="flex-1 sm:flex-none rounded bg-emerald-600 text-white px-4 py-2 disabled:opacity-60"
            disabled={submitBusy || roster.length === 0}
          >
            {submitBusy ? "Saving…" : "Submit"}
          </button>
        </div>
      </div>

      {msg && <div className="text-sm text-neutral-700 dark:text-neutral-300">{msg}</div>}

      {/* Table */}
      <div className="overflow-x-auto rounded border">
        <table className="min-w-full text-sm">
          <thead className="bg-neutral-50 sticky top-0">
            <tr>
              <th className="px-3 py-2 text-left w-28">Roll</th>
              <th className="px-3 py-2 text-left">Name</th>
              <th className="px-3 py-2 text-center w-36">Present</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td className="px-3 py-4" colSpan={3}>
                  Loading…
                </td>
              </tr>
            )}

            {!loading && roster.length === 0 && (
              <tr>
                <td className="px-3 py-6 text-neutral-500" colSpan={3}>
                  Select section & date, then Load.
                </td>
              </tr>
            )}

            {!loading &&
              roster.map((s, idx) => (
                <tr key={s.student_id} className="border-t">
                  <td className="px-3 py-2">{s.roll_no ?? idx + 1}</td>
                  <td className="px-3 py-2">
                    {s.full_name}{" "}
                    <span className="text-xs text-neutral-500">#{s.student_id}</span>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <input
                      type="checkbox"
                      className="h-5 w-5 accent-sky-600"
                      checked={!!presence[s.student_id]}
                      onChange={(e) =>
                        setPresence((p) => ({ ...p, [s.student_id]: e.target.checked }))
                      }
                    />
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
