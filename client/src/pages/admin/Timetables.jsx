// client/src/pages/admin/Timetables.jsx
import { Fragment, useEffect, useMemo, useState } from "react";
import { Listbox, Transition } from "@headlessui/react";
import { api } from "../../utils/api";
import { useConfirm } from "../../components/ConfirmProvider";

/* ---------- Reusable Listbox Select ---------- */
function SelectBox({ options, value, onChange, placeholder = "Select…", className = "" }) {
  const selected = useMemo(
    () => options.find((o) => String(o.value) === String(value)) || null,
    [options, value]
  );
  return (
    <div className={`relative ${className}`}>
      <Listbox value={value} onChange={onChange}>
        <Listbox.Button className="w-full border rounded px-3 py-2 text-left bg-white dark:bg-white/5">
          {selected ? selected.label : <span className="text-neutral-500">{placeholder}</span>}
        </Listbox.Button>

        <Transition
          as={Fragment}
          enter="transition ease-out duration-100"
          enterFrom="opacity-0 scale-95"
          enterTo="opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="opacity-100 scale-100"
          leaveTo="opacity-0 scale-95"
        >
          <Listbox.Options className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-white text-sm shadow-lg ring-1 ring-black/5 focus:outline-none">
            {options.length === 0 && (
              <div className="px-3 py-2 text-neutral-500">No options</div>
            )}
            {options.map((opt) => (
              <Listbox.Option
                key={opt.value}
                value={opt.value}
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
  );
}

/* ---------- Small sub-component: Enroll panel ---------- */
function EnrollPanel({ sectionId }) {
  const { confirm } = useConfirm();
  const [students, setStudents] = useState([]);
  const [roster, setRoster] = useState([]);
  const [studentId, setStudentId] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const studentOptions = useMemo(
    () =>
      students.map((s) => ({
        value: String(s.id),
        label: `${s.full_name} · ${s.email}`,
      })),
    [students]
  );

  async function load() {
    if (!sectionId) return;
    const [all, rs] = await Promise.all([
      api.get("/admin/students"),
      api.get(`/admin/sections/${sectionId}/roster`),
    ]);
    setStudents(all);
    setRoster(rs);
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionId]);

  async function enroll(e) {
    e.preventDefault();
    if (!studentId) return;
    setBusy(true);
    setMsg("");
    try {
      await api.post(`/admin/sections/${sectionId}/enroll`, {
        studentId,
      });
      setStudentId("");
      await load();
      setMsg("Student enrolled.");
    } finally {
      setBusy(false);
    }
  }

  async function unenroll(sid) {
    const ok = await confirm({
      title: "Remove student?",
      message: "This will unenroll the student from this section.",
      okText: "Remove",
      cancelText: "Cancel",
      variant: "danger",
    });
    if (!ok) return;
    setBusy(true);
    try {
      await api.del(`/admin/sections/${sectionId}/enroll/${sid}`);
      await load();
    } finally {
      setBusy(false);
    }
  }

  if (!sectionId) return null;

  return (
    <div className="mt-6 rounded border p-3 space-y-3 bg-white dark:bg-white/5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h3 className="font-medium flex flex-wrap items-center gap-1">
          <span>Enroll students for section</span>
          <span className="font-mono text-sm max-w-[120px] truncate inline-block align-middle" title={sectionId}>
            #{sectionId}
          </span>
        </h3>
        {msg && <div className="text-sm text-neutral-600">{msg}</div>}
      </div>

      <form onSubmit={enroll} className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2">
        <SelectBox
          options={studentOptions}
          value={studentId}
          onChange={(v) => setStudentId(String(v))}
          placeholder="Select student…"
          className="min-w-[220px]"
        />
        <button
          className="rounded bg-sky-600 text-white px-4 py-2 disabled:opacity-60"
          disabled={!studentId || busy}
        >
          {busy ? "Working…" : "Enroll"}
        </button>
      </form>

      <div className="overflow-x-auto rounded border">
        <table className="min-w-full text-sm">
          <thead className="bg-neutral-50">
            <tr>
              <th className="px-3 py-2 text-left">Student</th>
              <th className="px-3 py-2 text-left">Email</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {roster.map((r) => (
              <tr key={r.student_id} className="border-t">
                <td className="px-3 py-2 whitespace-nowrap">
                  <span className="font-mono text-xs max-w-[90px] truncate inline-block align-middle" title={r.student_id}>
                    #{r.student_id}
                  </span>
                  <span className="align-middle"> · {r.full_name}</span>
                </td>
                <td className="px-3 py-2 break-all">{r.email}</td>
                <td className="px-3 py-2 text-right">
                  <button
                    onClick={() => unenroll(r.student_id)}
                    className="rounded border px-2 py-1 text-xs hover:bg-red-50 hover:text-red-600 disabled:opacity-60"
                    disabled={busy}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
            {roster.length === 0 && (
              <tr>
                <td className="px-3 py-6 text-neutral-500" colSpan={3}>
                  No students enrolled yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------- Main page ---------- */
export default function Timetables() {
  const { confirm } = useConfirm();
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [sections, setSections] = useState([]);

  const [form, setForm] = useState({ courseId: "", teacherId: "", term: "2025-Fall" });
  const [busy, setBusy] = useState(false);

  // which section's roster to manage
  const [activeSectionId, setActiveSectionId] = useState(null);

  // Manage Courses state
  const [newCourse, setNewCourse] = useState({ code: "", title: "" });
  const [editing, setEditing] = useState(null); // {id, code, title}
  const [courseBusy, setCourseBusy] = useState(false);

  const courseOptions = useMemo(
    () =>
      courses.map((c) => ({
        value: String(c.id),
        label: `${c.code} · ${c.title}`,
      })),
    [courses]
  );
  const teacherOptions = useMemo(
    () =>
      teachers.map((t) => ({
        value: String(t.id),
        label: t.full_name,
      })),
    [teachers]
  );

  async function load() {
    const [c, t, s] = await Promise.all([
      api.get("/admin/courses"),
      api.get("/admin/teachers"),
      api.get("/admin/sections"),
    ]);
    setCourses(c);
    setTeachers(t);
    setSections(s);
    if (activeSectionId && !s.find((x) => x.id === activeSectionId)) {
      setActiveSectionId(null);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function create(e) {
    e.preventDefault();
    if (!form.courseId || !form.teacherId) return;
    setBusy(true);
    try {
      await api.post("/admin/sections", {
        ...form,
        courseId:  form.courseId,
        teacherId: form.teacherId,
      });
      setForm({ ...form, courseId: "", teacherId: "" });
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function removeSection(id) {
    const ok = await confirm({
      title: "Delete section?",
      message: "This will remove the section and its related data. Continue?",
      okText: "Delete",
      cancelText: "Cancel",
      variant: "danger",
    });
    if (!ok) return;
    await api.del(`/admin/sections/${id}`);
    await load();
  }

  async function createCourse(e) {
    e.preventDefault();
    if (!newCourse.code || !newCourse.title) return;
    setCourseBusy(true);
    try {
      await api.post("/admin/courses", {
        code: newCourse.code.trim().toUpperCase(),
        title: newCourse.title.trim(),
      });
      setNewCourse({ code: "", title: "" });
      await load();
    } finally {
      setCourseBusy(false);
    }
  }

  async function updateCourse(e) {
    e.preventDefault();
    if (!editing?.code || !editing?.title) return;
    setCourseBusy(true);
    try {
      await api.put(`/admin/courses/${editing.id}`, {
        code: editing.code.trim().toUpperCase(),
        title: editing.title.trim(),
      });
      setEditing(null);
      await load();
    } finally {
      setCourseBusy(false);
    }
  }

  async function deleteCourse(id) {
    const ok = await confirm({
      title: "Delete course?",
      message:
        "Sections referencing this course will block delete unless you remove them first.",
      okText: "Delete",
      cancelText: "Cancel",
      variant: "danger",
    });
    if (!ok) return;
    setCourseBusy(true);
    try {
      await api.del(`/admin/courses/${id}`);
    } finally {
      await load();
      setCourseBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Create section */}
        <form onSubmit={create} className="space-y-3 rounded border p-4 bg-white dark:bg-white/5 min-w-0">
          <h2 className="text-lg font-semibold">Create section</h2>

          <SelectBox
            options={courseOptions}
            value={form.courseId}
            onChange={(v) => setForm({ ...form, courseId: String(v) })}
            placeholder="Select course…"
            className="w-full"
          />

          <SelectBox
            options={teacherOptions}
            value={form.teacherId}
            onChange={(v) => setForm({ ...form, teacherId: String(v) })}
            placeholder="Select teacher…"
            className="w-full"
          />

          <input
            className="border rounded px-3 py-2 w-full"
            value={form.term}
            onChange={(e) => setForm({ ...form, term: e.target.value })}
            placeholder="Term (e.g., 2025-Fall)"
          />

          <button
            className="rounded bg-sky-600 text-white px-4 py-2 disabled:opacity-60"
            disabled={busy || !form.courseId || !form.teacherId}
          >
            {busy ? "Working…" : "Add section"}
          </button>
        </form>

        {/* Sections list */}
        <div className="rounded border p-3 bg-white dark:bg-white/5 min-w-0">
          <h2 className="text-lg font-semibold mb-3">Sections</h2>
          <div className="overflow-x-auto rounded border">
            <table className="min-w-full text-sm">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="px-3 py-2 text-left">ID</th>
                  <th className="px-3 py-2 text-left">Course</th>
                  <th className="px-3 py-2 text-left">Teacher</th>
                  <th className="px-3 py-2 text-left">Term</th>
                  <th className="px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sections.map((s) => (
                  <tr key={s.id} className="border-t">
                    <td className="px-3 py-2">
                      <div className="font-mono text-xs max-w-[100px] truncate" title={s.id}>
                        {s.id}
                      </div>
                    </td>
                    <td className="px-3 py-2">{s.course_code} · {s.course_title}</td>
                    <td className="px-3 py-2">{s.teacher_name}</td>
                    <td className="px-3 py-2">{s.term}</td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex flex-col items-center justify-end gap-2">
                        <button
                          onClick={() => setActiveSectionId(s.id)}
                          className={`rounded border px-3 py-1 text-xs hover:bg-neutral-50 ${
                            activeSectionId === s.id ? "bg-neutral-100" : ""
                          }`}
                          title="Manage roster"
                        >
                          Manage
                        </button>

                        <button
                          onClick={() => removeSection(s.id)}
                          className="rounded border px-3 py-1 text-xs hover:bg-red-50 hover:text-red-600"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {sections.length === 0 && (
                  <tr>
                    <td className="px-3 py-6 text-neutral-500 text-center" colSpan={5}>
                      No sections yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Enrollment manager for selected section */}
          <EnrollPanel sectionId={activeSectionId} />
        </div>
      </div>

      {/* Manage Courses */}
      <div className="rounded border p-4 bg-white dark:bg-white/5">
        <h2 className="text-lg font-semibold mb-3">Manage courses</h2>

        {/* Add new */}
        <form onSubmit={createCourse} className="flex flex-col sm:flex-row gap-2 mb-3">
          <input
            className="border rounded px-3 py-2 sm:w-40"
            placeholder="Code (e.g., CS303)"
            value={newCourse.code}
            onChange={(e) => setNewCourse((c) => ({ ...c, code: e.target.value }))}
          />
          <input
            className="border rounded px-3 py-2 grow"
            placeholder="Title"
            value={newCourse.title}
            onChange={(e) => setNewCourse((c) => ({ ...c, title: e.target.value }))}
          />
          <button
            className="rounded bg-sky-600 text-white px-4 py-2 disabled:opacity-60 sm:w-auto"
            disabled={courseBusy}
          >
            {courseBusy ? "Working…" : "Add course"}
          </button>
        </form>

        {/* Existing list with inline edit */}
        <div className="overflow-x-auto rounded border">
          <table className="min-w-full text-sm">
            <thead className="bg-neutral-50">
              <tr>
                <th className="px-3 py-2 text-left w-36">Code</th>
                <th className="px-3 py-2 text-left">Title</th>
                <th className="px-3 py-2 text-right w-40">Actions</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((c) => (
                <tr key={c.id} className="border-t">
                  <td className="px-3 py-2">
                    {editing?.id === c.id ? (
                      <input
                        className="border rounded px-2 py-1 w-32"
                        value={editing.code}
                        onChange={(e) =>
                          setEditing((x) => ({ ...x, code: e.target.value }))
                        }
                      />
                    ) : (
                      c.code
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {editing?.id === c.id ? (
                      <input
                        className="border rounded px-2 py-1 w-full"
                        value={editing.title}
                        onChange={(e) =>
                          setEditing((x) => ({ ...x, title: e.target.value }))
                        }
                      />
                    ) : (
                      c.title
                    )}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {editing?.id === c.id ? (
                      <>
                        <button
                          className="rounded border px-2 py-1 text-xs mr-2"
                          onClick={() => setEditing(null)}
                        >
                          Cancel
                        </button>
                        <button
                          className="rounded bg-emerald-600 text-white px-3 py-1 text-xs disabled:opacity-60"
                          disabled={courseBusy}
                          onClick={updateCourse}
                        >
                          Save
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          className="rounded border px-2 py-1 text-xs mr-2"
                          onClick={() =>
                            setEditing({ id: c.id, code: c.code, title: c.title })
                          }
                        >
                          Edit
                        </button>
                        <button
                          className="rounded border px-2 py-1 text-xs hover:bg-red-50 hover:text-red-600 disabled:opacity-60"
                          onClick={() => deleteCourse(c.id)}
                          disabled={courseBusy}
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {courses.length === 0 && (
                <tr>
                  <td className="px-3 py-6 text-neutral-500" colSpan={3}>
                    No courses yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
