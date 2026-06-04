// client/src/pages/admin/Notices.jsx
import { useEffect, useMemo, useState } from "react";
import { Listbox } from "@headlessui/react";
import { api } from "../../utils/api";
import { useConfirm } from "../../components/ConfirmProvider";

const AUDIENCE_OPTS = [
  { value: "ALL", label: "All users" },
  { value: "STUDENT", label: "Students" },
  { value: "TEACHER", label: "Teachers" },
];

export default function Notices() {
  const { confirm, alert } = useConfirm();

  const [form, setForm] = useState({ title: "", body: "", audience: "ALL" });
  const [list, setList] = useState([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const canPublish = form.title.trim() && form.body.trim();

  const load = async () => {
    setErr("");
    try {
      const data = await api.get("/admin/notices");
      setList(data);
    } catch (e) {
      setErr(e?.response?.data?.error || e.message || "Failed to load notices");
    }
  };

  useEffect(() => { load(); }, []);

  const selectedAudience = useMemo(
    () => AUDIENCE_OPTS.find(o => o.value === form.audience) ?? AUDIENCE_OPTS[0],
    [form.audience]
  );

  async function onPublish(e) {
    e.preventDefault();
    setMsg(""); setErr("");
    if (!canPublish) return;

    setSaving(true);
    try {
      await api.post("/admin/notices", {
        title: form.title.trim(),
        body: form.body.trim(),
        audience: form.audience,
      });
      setForm({ title: "", body: "", audience: "ALL" });
      setMsg("✅ Notice published.");
      await load();
    } catch (e) {
      setErr(e?.response?.data?.error || e.message || "Failed to publish notice");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id) {
    const ok = await confirm({
      title: "Delete notice?",
      message: "This action cannot be undone.",
      okText: "Delete",
      cancelText: "Keep",
      variant: "danger",
    });
    if (!ok) return;
    await api.del(`/admin/notices/${id}`);
    await load();
    await alert({ title: "Deleted", message: "The notice was removed." });
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Create notice */}
      <form onSubmit={onPublish} className="space-y-3 rounded border p-4 bg-white dark:bg-white/5">
        <h2 className="text-lg font-semibold">Create notice</h2>

        <input
          required
          className="border rounded px-3 py-2 w-full"
          placeholder="Title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />

        <textarea
          required
          className="border rounded px-3 py-2 w-full"
          rows={6}
          placeholder="Body"
          value={form.body}
          onChange={(e) => setForm({ ...form, body: e.target.value })}
        />

        {/* Audience (Headless UI Listbox so it never overflows) */}
        <AudienceSelect
          value={selectedAudience}
          onChange={(opt) => setForm({ ...form, audience: opt.value })}
        />

        <div className="flex gap-2">
          <button
            disabled={!canPublish || saving}
            className={`rounded px-4 py-2 text-white disabled:opacity-60 ${
              !canPublish || saving ? "bg-sky-300" : "bg-sky-600 hover:bg-sky-700"
            }`}
          >
            {saving ? "Publishing…" : "Publish"}
          </button>
          {msg && <span className="text-sm text-emerald-700">{msg}</span>}
        </div>
        {err && (
          <div className="text-sm text-red-600">{err}</div>
        )}
      </form>

      {/* Recent notices */}
      <div>
        <h2 className="text-lg font-semibold mb-2">Recent notices</h2>

        <div className="grid gap-3">
          {list.map((n) => (
            <div key={n._id} className="rounded border p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <b className="block truncate">{n.title}</b>
                  <p className="text-xs text-neutral-500">
                    {n.createdAt ? new Date(n.createdAt).toLocaleString() : ""}
                  </p>
                  <p className="text-sm mt-1 break-words">{n.body}</p>
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className="text-xs border rounded px-2 py-0.5">{n.audience}</span>
                  <button
                    onClick={() => onDelete(n._id)}
                    className="rounded-lg border px-2 py-1 text-xs hover:bg-red-50 hover:border-red-400 hover:text-red-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}

          {list.length === 0 && (
            <div className="text-sm text-neutral-500">No notices yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Audience dropdown using Headless UI Listbox (mobile-safe, no overflow) */
function AudienceSelect({ value, onChange }) {
  return (
    <div className="relative">
      <label className="block text-sm font-medium mb-1">Audience</label>
      <Listbox value={value} onChange={onChange}>
        <Listbox.Button className="w-full border rounded px-3 py-2 text-left bg-white dark:bg-white/5">
          {value?.label || "Select audience…"}
        </Listbox.Button>

        <Listbox.Options
          className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white shadow-lg ring-1 ring-black/5 focus:outline-none text-sm"
        >
          {AUDIENCE_OPTS.map((opt) => (
            <Listbox.Option
              key={opt.value}
              value={opt}
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
