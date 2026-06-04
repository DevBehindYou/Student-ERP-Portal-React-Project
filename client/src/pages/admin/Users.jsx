import { useEffect, useState } from "react";
import { api } from "../../utils/api";
import { useConfirm } from "../../components/ConfirmProvider";

export default function Users() {
  const { confirm } = useConfirm();

  const [users, setUsers] = useState([]);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    role: "STUDENT",
    password: "",
  });

  async function load() {
    setMsg("");
    try {
      const list = await api.get("/admin/users");
      setUsers(list);
    } catch (e) {
      setMsg(e?.response?.data?.error || e.message || "Failed to load users");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function addUser(e) {
    e.preventDefault();
    setMsg("");
    setBusy(true);
    try {
      await api.post("/admin/users", form);
      setForm({ full_name: "", email: "", role: "STUDENT", password: "" });
      await load();
      setMsg("✅ User added.");
    } catch (e) {
      setMsg("❌ " + (e?.response?.data?.error || e.message || "Failed to add user"));
    } finally {
      setBusy(false);
    }
  }

  async function deleteUser(id) {
    const ok = await confirm({
      title: "Delete user?",
      message:
        "This will permanently remove the user account. This action cannot be undone.",
      okText: "Delete",
      cancelText: "Cancel",
      variant: "danger",
    });
    if (!ok) return;

    setMsg("");
    setBusy(true);
    try {
      await api.del(`/admin/users/${id}`);
      await load();
      setMsg("🗑️ User deleted.");
    } catch (e) {
      setMsg("❌ " + (e?.response?.data?.error || e.message || "Failed to delete user"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <h2 className="text-lg font-semibold">Users</h2>

      {/* Create user */}
      <form onSubmit={addUser} className="rounded border p-4 space-y-3 bg-white dark:bg-white/5">
        <div className="font-medium">Add user</div>

        {/* Responsive form grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <input
            className="w-full border rounded px-3 py-2"
            placeholder="Full name"
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            required
          />

          <input
            type="email"
            className="w-full border rounded px-3 py-2"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />

          <select
            className="w-full border rounded px-3 py-2"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
          >
            <option value="ADMIN">ADMIN</option>
            <option value="TEACHER">TEACHER</option>
            <option value="STUDENT">STUDENT</option>
          </select>

          <input
            type="password"
            className="w-full border rounded px-3 py-2"
            placeholder="Password (min 6)"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
            minLength={6}
          />
        </div>

        <button
          className="rounded bg-emerald-600 text-white px-4 py-2 disabled:opacity-60"
          disabled={busy}
        >
          {busy ? "Working…" : "Create"}
        </button>

        {msg && <div className="text-sm text-neutral-700 dark:text-neutral-300">{msg}</div>}
      </form>

      {/* Users table */}
      <div className="overflow-x-auto rounded border">
        <table className="min-w-full text-sm">
          <thead className="bg-neutral-50">
            <tr>
              <th className="px-3 py-2 text-left">ID</th>
              <th className="px-3 py-2 text-left">Name</th>
              <th className="px-3 py-2 text-left">Email</th>
              <th className="px-3 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t">
                <td className="px-3 py-2">{u.id}</td>
                <td className="px-3 py-2">{u.full_name}</td>
                <td className="px-3 py-2 break-all">{u.email}</td>
                <td className="px-3 py-2">
                  <button
                    className="rounded border px-3 py-1 text-red-600 hover:bg-red-50 disabled:opacity-60"
                    onClick={() => deleteUser(u.id)}
                    disabled={busy}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}

            {users.length === 0 && (
              <tr>
                <td className="px-3 py-6 text-center text-neutral-500" colSpan={4}>
                  No users.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* extra message line (optional, kept for parity with your original) */}
      {msg && <div className="text-xs text-neutral-500">{msg}</div>}
    </div>
  );
}
