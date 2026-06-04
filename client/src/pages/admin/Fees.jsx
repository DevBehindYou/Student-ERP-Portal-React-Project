import { useEffect, useMemo, useState } from "react";
import { Listbox } from "@headlessui/react";
import { api } from "../../utils/api";
import { useConfirm } from "../../components/ConfirmProvider";

export default function Fees() {
  const { confirm } = useConfirm();

  const [status, setStatus] = useState("DUE");
  const [rows, setRows] = useState([]);

  // dropdown data
  const [sections, setSections] = useState([]);
  const [students, setStudents] = useState([]);

  // form state
  const [mode, setMode] = useState("SECTION"); // "SECTION" | "STUDENT"
  const [form, setForm] = useState({
    sectionId: "",
    studentId: "",
    term: "2025-Fall",
    amount: "",
    due_date: "",
  });

  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function loadFees() {
    const data = await api.get(`/admin/fees?status=${status}`);
    setRows(data);
  }
  useEffect(() => { loadFees(); }, [status]);

  // load dropdowns once
  useEffect(() => {
    (async () => {
      const [secs, studs] = await Promise.all([
        api.get("/admin/sections"),
        api.get("/admin/students"),
      ]);
      setSections(secs);
      setStudents(studs);
    })();
  }, []);

  async function declareFees(e) {
    e.preventDefault();
    setMsg("");

    const ok = await confirm({
      title: "Declare fees?",
      message:
        mode === "SECTION"
          ? "This will create fee records for all students in the selected section."
          : "This will create a fee record for the selected student.",
      okText: "Declare",
      cancelText: "Cancel",
    });
    if (!ok) return;

    try {
      setBusy(true);
      if (mode === "SECTION") {
        await api.post("/admin/fees/bulk", {
          sectionId: form.sectionId,
          term: form.term,
          amount: Number(form.amount),
          due_date: form.due_date || null,
        });
      } else {
        await api.post("/admin/fees", {
          studentId: form.studentId,
          term: form.term,
          amount: Number(form.amount),
          due_date: form.due_date || null,
        });
      }
      setMsg("✅ Fees declared successfully.");
      setForm({ ...form, amount: "", due_date: "" });
      await loadFees();
    } catch (err) {
      setMsg("❌ " + (err?.response?.data?.error || err?.message || "Failed to declare fees"));
    } finally {
      setBusy(false);
    }
  }

  async function markPaid(id) {
    const ok = await confirm({
      title: "Mark as paid?",
      message: "This will mark the fee as PAID. Continue?",
      okText: "Mark Paid",
      cancelText: "Cancel",
    });
    if (!ok) return;

    setBusy(true);
    try {
      await api.post(`/admin/fees/${id}/mark-paid`);
      await loadFees();
    } catch (e) {
      setMsg("❌ " + (e?.response?.data?.error || e?.message || "Failed to mark as paid"));
    } finally {
      setBusy(false);
    }
  }

  // ------- helpers to render labels in the Listbox -------
  const sectionOptions = useMemo(
    () =>
      sections.map((s) => ({
        value: String(s.id),
        label: `#${s.id} · ${s.course_code} ${s.course_title} · ${s.teacher_name} · ${s.term}`,
      })),
    [sections]
  );

  const studentOptions = useMemo(
    () =>
      students.map((s) => ({
        value: String(s.id),
        label: `#${s.id} · ${s.full_name} · ${s.email}`,
      })),
    [students]
  );

  return (
    <div className="space-y-5">
      {/* Status header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-lg font-semibold">Fees</h2>
        {/* Keeping this as native <select> since it's short & safe */}
        <select
          className="border rounded px-3 py-2 w-full sm:w-auto"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option>DUE</option>
          <option>PAID</option>
        </select>
      </div>

      {/* Declare fees */}
      <form onSubmit={declareFees} className="rounded border p-4 space-y-4 bg-white dark:bg-white/5">
        <div className="flex flex-wrap gap-2 items-center">
          <label className="text-sm font-medium">Mode:</label>
          <div className="inline-flex rounded border overflow-hidden text-sm">
            <button
              type="button"
              onClick={() => setMode("SECTION")}
              className={`px-3 py-1.5 ${mode === "SECTION" ? "bg-sky-600 text-white" : "bg-white"}`}
            >
              By Section
            </button>
            <button
              type="button"
              onClick={() => setMode("STUDENT")}
              className={`px-3 py-1.5 ${mode === "STUDENT" ? "bg-sky-600 text-white" : "bg-white"}`}
            >
              Single Student
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Listbox for SECTION / STUDENT */}
          {mode === "SECTION" ? (
            <SelectBox
              options={sectionOptions}
              value={form.sectionId}
              placeholder="Select section…"
              onChange={(v) => setForm({ ...form, sectionId: v })}
            />
          ) : (
            <SelectBox
              options={studentOptions}
              value={form.studentId}
              placeholder="Select student…"
              onChange={(v) => setForm({ ...form, studentId: v })}
            />
          )}

          <input
            className="border rounded px-3 py-2"
            placeholder="Term (e.g., 2025-Fall)"
            value={form.term}
            onChange={(e) => setForm({ ...form, term: e.target.value })}
            required
          />
          <input
            type="number"
            className="border rounded px-3 py-2"
            placeholder="Amount"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            min="1"
            required
          />
          <input
            type="date"
            className="border rounded px-3 py-2"
            value={form.due_date}
            onChange={(e) => setForm({ ...form, due_date: e.target.value })}
          />
        </div>

        <div className="mt-2 flex flex-col sm:flex-row gap-2">
          <button
            className="w-full sm:w-auto rounded bg-emerald-600 text-white px-4 py-2 disabled:opacity-60"
            disabled={busy}
          >
            {busy ? "Working..." : "Declare fees"}
          </button>
        </div>

        {msg && <div className="text-sm text-center text-neutral-700 dark:text-neutral-300">{msg}</div>}
      </form>

      {/* List */}
      <div className="overflow-x-auto border rounded">
        <table className="min-w-full text-sm">
          <thead className="bg-neutral-50 sticky top-0">
            <tr>
              <th className="px-3 py-2 text-left">Student</th>
              <th className="px-3 py-2">Term</th>
              <th className="px-3 py-2 text-right">Amount</th>
              <th className="px-3 py-2">Due</th>
              <th className="px-3 py-2 text-right"></th>
            </tr>
          </thead>
        <tbody>
            {rows.map((f) => (
              <tr key={f._id || f.id} className="border-t">
                <td className="px-3 py-2">
                  {f.studentId?.fullName || f.studentId?.full_name || String(f.studentId)}
                </td>
                <td className="px-3 py-2">{f.term}</td>
                <td className="px-3 py-2 text-right">₹ {Number(f.amount).toFixed(2)}</td>
                <td className="px-3 py-2">{f.dueDate ? String(f.dueDate).slice(0, 10) : (f.due_date?.slice(0, 10) || "-")}</td>
                <td className="px-3 py-2 text-right">
                  {status === "DUE" && (
                    <button
                      className="w-full sm:w-auto rounded bg-sky-600 text-white px-3 py-1 text-sm disabled:opacity-60"
                      onClick={() => markPaid(f._id || f.id)}
                      disabled={busy}
                    >
                      Mark Paid
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td className="px-3 py-6 text-center text-neutral-500" colSpan={5}>
                  No records.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Reusable Headless UI Listbox with Tailwind styles */
function SelectBox({ options, value, onChange, placeholder = "Select..." }) {
  const selected = options.find((o) => o.value === value) || null;

  return (
    <div className="relative">
      <Listbox value={selected?.value || ""} onChange={onChange}>
        <Listbox.Button className="w-full border rounded px-3 py-2 text-left bg-white dark:bg-white/5">
          {selected ? selected.label : <span className="text-neutral-500">{placeholder}</span>}
        </Listbox.Button>

        {/* The dropdown menu */}
        <Listbox.Options
          className="
            absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white shadow-lg
            ring-1 ring-black/5 focus:outline-none text-sm
          "
        >
          {options.length === 0 && (
            <div className="px-3 py-2 text-neutral-500">No options</div>
          )}
          {options.map((opt) => (
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
  );
}
