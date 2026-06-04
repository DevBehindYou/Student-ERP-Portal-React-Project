// client/src/pages/admin/Results.jsx
import { Fragment, useEffect, useMemo, useState } from "react";
import { Listbox, Transition } from "@headlessui/react";
import { api } from "../../utils/api";
import { useConfirm } from "../../components/ConfirmProvider";

export default function Results() {
  const { confirm } = useConfirm();

  const [sections, setSections] = useState([]);        // dropdown options (raw)
  const [sectionId, setSectionId] = useState("");      // selected section id (string)
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  // data for the selected section
  const [roster, setRoster] = useState([]);            // [{student_id, full_name}]
  const [exams, setExams] = useState([]);              // [{id, name, max_marks, exam_date}]
  const [scores, setScores] = useState({});            // { [studentId]: { [examId]: value } }

  // create-exam form
  const [examForm, setExamForm] = useState({
    name: "",
    max_marks: 100,
    exam_date: "", // yyyy-mm-dd
  });

  // build Listbox options for sections
  const sectionOptions = useMemo(
    () =>
      sections.map((s) => ({
        id: String(s.id),
        label: `#${s.id} · ${s.course_code} ${s.course_title} · ${s.teacher_name} · ${s.term}`,
        raw: s,
      })),
    [sections]
  );

  const selectedOption = useMemo(
    () => sectionOptions.find((o) => o.id === String(sectionId)) || null,
    [sectionOptions, sectionId]
  );

  // derived
  const selectedSection = selectedOption?.raw ?? null;

  // load sections once (for dropdown)
  useEffect(() => {
    (async () => {
      try {
        const list = await api.get("/admin/sections");
        setSections(list);
      } catch (e) {
        console.error(e);
        setError(e?.response?.data?.error || e.message || "Failed to load sections");
      }
    })();
  }, []);

  // helper: load roster + exams for selected section
  async function loadData() {
    if (!sectionId) return;
    setLoading(true);
    setError("");
    setMsg("");
    try {
      const [r, e] = await Promise.all([
        api.get(`/admin/sections/${sectionId}/roster`),
        api.get(`/admin/sections/${sectionId}/exams`),
      ]);
      setRoster(r);
      setExams(e);
      // initialize scores grid (blank)
      const init = {};
      r.forEach((s) => (init[s.student_id] = {}));
      setScores(init);
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.error || err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  // create an exam for the selected section
  async function createExam(e) {
    e.preventDefault();
    setError("");
    setMsg("");
    if (!sectionId) return setError("Select a section first.");
    const name = (examForm.name || "").trim();
    if (!name) return setError("Exam name is required.");
    const payload = {
      name,
      max_marks: Number(examForm.max_marks || 100),
      exam_date: examForm.exam_date, // yyyy-mm-dd
    };
    try {
      await api.post(`/admin/sections/${sectionId}/exams`, payload);
      setExamForm({ name: "", max_marks: 100, exam_date: "" });
      await loadData(); // refresh exams + grid headers
      setMsg("✅ Exam created.");
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.error || err.message || "Failed to create exam");
    }
  }

  // delete an exam (results will cascade if FK is set)
  async function deleteExam(examId) {
    const ok = await confirm({
      title: "Delete exam?",
      message: "This will remove the exam and any scores linked to it for this section.",
      okText: "Delete",
      cancelText: "Cancel",
      variant: "danger",
    });
    if (!ok) return;

    setMsg("");
    setError("");
    try {
      await api.del(`/admin/exams/${examId}`);
      await loadData();
      setMsg("🗑️ Exam deleted.");
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.error || err.message || "Failed to delete exam");
    }
  }

  // save all entered scores (upsert)
  async function saveAll() {
    if (!sectionId) return;
    setMsg("");
    setError("");
    const entries = roster.map((s) => ({
      studentId: s.student_id,
      scores: scores[s.student_id] || {},
    }));
    try {
      await api.post(`/admin/sections/${sectionId}/results`, { entries });
      setMsg("✅ Results saved.");
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.error || err.message || "Failed to save results");
    }
  }

  return (
    <div className="space-y-5">
      <h2 className="text-lg font-semibold">Upload results</h2>

      {/* Section selector (Listbox) */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-[300px]">
          <Listbox value={sectionId} onChange={(val) => setSectionId(String(val))}>
            <Listbox.Button className="w-full border rounded px-3 py-2 bg-white text-left">
              {selectedOption ? (
                <span>{selectedOption.label}</span>
              ) : (
                <span className="text-neutral-500">Select section…</span>
              )}
            </Listbox.Button>

            <Transition as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Listbox.Options
                className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-white text-sm shadow-lg ring-1 ring-black/5 focus:outline-none"
              >
                {sectionOptions.length === 0 && (
                  <div className="px-3 py-2 text-neutral-500">No sections</div>
                )}
                {sectionOptions.map((opt) => (
                  <Listbox.Option
                    key={opt.id}
                    value={opt.id}
                    className={({ active, selected }) =>
                      `cursor-pointer select-none px-3 py-2 ${
                        active ? "bg-sky-50 text-sky-700" : "text-neutral-900"
                      } ${selected ? "bg-sky-50" : ""}`
                    }
                  >
                    {opt.label}
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            </Transition>
          </Listbox>
        </div>

        <button
          onClick={loadData}
          className="rounded bg-sky-600 text-white px-4 py-2 disabled:opacity-60"
          disabled={!sectionId || loading}
        >
          {loading ? "Loading…" : "Load"}
        </button>

        {selectedSection && (
          <span className="text-sm text-neutral-600">
            Course: <b>{selectedSection.course_code}</b> · {selectedSection.course_title}
          </span>
        )}
      </div>

      {/* Manage exams */}
      {sectionId && (
        <form onSubmit={createExam} className="rounded border p-3 space-y-3 bg-white dark:bg-white/5">
          <div className="font-medium">Create exam for section #{sectionId}</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <input
              className="border rounded px-3 py-2"
              placeholder="Exam name (e.g., Midterm)"
              value={examForm.name}
              onChange={(e) => setExamForm({ ...examForm, name: e.target.value })}
            />
            <input
              type="number"
              min={1}
              className="border rounded px-3 py-2"
              placeholder="Max marks"
              value={examForm.max_marks}
              onChange={(e) => setExamForm({ ...examForm, max_marks: e.target.value })}
            />
            <input
              type="date"
              className="border rounded px-3 py-2"
              value={examForm.exam_date}
              onChange={(e) => setExamForm({ ...examForm, exam_date: e.target.value })}
            />
          </div>
          <div className="flex items-center gap-2">
            <button className="rounded bg-emerald-600 text-white px-4 py-2">
              Add exam
            </button>
            {exams.length > 0 && (
              <span className="text-sm text-neutral-500">
                {exams.length} exam{exams.length > 1 ? "s" : ""} defined
              </span>
            )}
          </div>

          {exams.length > 0 && (
            <ul className="mt-2 space-y-1 text-sm">
              {exams.map((ex) => (
                <li
                  key={ex.id}
                  className="flex items-center justify-between border rounded px-2 py-1"
                >
                  <span>
                    {ex.name} · /{ex.max_marks}
                    {ex.exam_date ? ` · ${String(ex.exam_date).slice(0, 10)}` : ""}
                  </span>
                  <button
                    type="button"
                    onClick={() => deleteExam(ex.id)}
                    className="text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </form>
      )}

      {/* Feedback banners */}
      {error && (
        <div className="rounded border border-red-300 bg-red-50 text-red-800 px-3 py-2 text-sm">
          {error}
        </div>
      )}
      {msg && (
        <div className="rounded border border-emerald-300 bg-emerald-50 text-emerald-800 px-3 py-2 text-sm flex justify-between items-center">
          <span>{msg}</span>
          <button className="text-xs underline" onClick={() => setMsg("")} type="button">
            Dismiss
          </button>
        </div>
      )}

      {/* Score grid */}
      {!loading && roster.length > 0 && exams.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-neutral-50">
              <tr>
                <th className="px-3 py-2 text-left w-64">Student</th>
                {exams.map((ex) => (
                  <th key={ex.id} className="px-3 py-2 text-center">
                    <div className="font-medium">{ex.name}</div>
                    <div className="text-xs text-neutral-500">/ {ex.max_marks}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {roster.map((s) => (
                <tr key={s.student_id} className="border-t">
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="font-medium">{s.full_name}</div>
                    <div className="text-xs text-neutral-500">ID: {s.student_id}</div>
                  </td>
                  {exams.map((ex) => (
                    <td key={ex.id} className="px-3 py-2 text-center">
                      <input
                        type="number"
                        min="0"
                        max={ex.max_marks}
                        className="w-24 border rounded px-2 py-1 text-center"
                        value={scores[s.student_id]?.[ex.id] ?? ""}
                        onChange={(e) => {
                          const v = e.target.value;
                          setScores((prev) => ({
                            ...prev,
                            [s.student_id]: {
                              ...(prev[s.student_id] || {}),
                              [ex.id]: v,
                            },
                          }));
                        }}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-4 flex gap-2">
            <button onClick={saveAll} className="rounded bg-sky-600 text-white px-4 py-2">
              Save
            </button>
          </div>
        </div>
      )}

      {/* Empty states */}
      {!loading && sectionId && roster.length === 0 && (
        <p className="text-sm text-neutral-500">No students enrolled in this section.</p>
      )}
      {!loading && sectionId && exams.length === 0 && (
        <p className="text-sm text-neutral-500">
          No exams defined for this section. Create one above.
        </p>
      )}
    </div>
  );
}
