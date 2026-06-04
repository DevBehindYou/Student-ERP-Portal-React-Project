// client/src/pages/student/Fees.jsx
import { useEffect, useMemo, useState } from "react";
import { api } from "../../utils/api";
import { useConfirm } from "../../components/ConfirmProvider";

export default function StudentFees() {
  const { confirm, alert } = useConfirm();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState(null);
  const [msg, setMsg] = useState("");

  const currency = useMemo(
    () => new Intl.NumberFormat(undefined, { style: "currency", currency: "INR", maximumFractionDigits: 0 }),
    []
  );

  function fmtDate(d) {
    if (!d) return "-";
    try {
      return new Date(d).toLocaleDateString();
    } catch { return String(d).slice(0, 10); }
  }

  async function load() {
    setLoading(true);
    setMsg("");
    try {
      const data = await api.get("/student/fees");
      setRows(data);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  async function pay(id, amount) {
    setMsg("");
    const ok = await confirm({
      title: "Pay fees?",
      message: `You are about to pay ${currency.format(Number(amount || 0))}. Continue?`,
      okText: "Pay",
      cancelText: "Cancel",
    });
    if (!ok) return;

    setPayingId(id);
    try {
      // In a real integration you'd open a gateway and get a txnRef
      const txnRef = "TEST-" + Date.now();
      await api.post(`/student/fees/${id}/pay`, { method: "ONLINE", txnRef });
      await load();
      setMsg(`✅ Payment successful for ${currency.format(Number(amount || 0))}.`);
      await alert({ title: "Payment successful", message: "Your fee status is now PAID." });
    } catch (e) {
      setMsg("❌ " + (e?.response?.data?.error || e?.message || "Payment failed."));
    } finally {
      setPayingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Your fees</h2>
      {msg && <div className="rounded border px-3 py-2 text-sm bg-white dark:bg-white/5">{msg}</div>}

      {/* Mobile cards (show on small screens) */}
      <div className="grid gap-3 sm:hidden">
        {loading && (
          <div className="text-sm text-neutral-500">Loading…</div>
        )}

        {!loading && rows.length === 0 && (
          <div className="text-sm text-neutral-500">No records.</div>
        )}

        {rows.map((r) => (
          <div key={r.id} className="rounded border p-3">
            <div className="flex items-center justify-between">
              <div className="font-medium">{r.term}</div>
              <span className={`text-xs rounded px-2 py-0.5 border ${
                r.status === "PAID" ? "border-emerald-300 text-emerald-700" : "border-amber-300 text-amber-700"
              }`}>
                {r.status}
              </span>
            </div>
            <div className="mt-1 text-sm">
              <div>Amount: <b>{currency.format(Number(r.amount || 0))}</b></div>
              <div>Due: {fmtDate(r.due_date)}</div>
            </div>
            <div className="mt-3">
              {r.status === "DUE" ? (
                <button
                  onClick={() => pay(r.id, r.amount)}
                  disabled={payingId === r.id}
                  className="w-full rounded bg-emerald-600 text-white px-3 py-2 disabled:opacity-60"
                >
                  {payingId === r.id ? "Processing…" : "Pay"}
                </button>
              ) : (
                <div className="text-neutral-400 text-sm">Paid</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Table for sm+ screens */}
      <div className="hidden sm:block overflow-x-auto rounded border">
        <table className="min-w-full text-sm">
          <thead className="bg-neutral-50 sticky top-0">
            <tr>
              <th className="px-3 py-2 text-left">Term</th>
              <th className="px-3 py-2 text-right">Amount</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-left">Due date</th>
              <th className="px-3 py-2 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td className="px-3 py-4" colSpan={5}>Loading…</td></tr>
            )}

            {!loading && rows.length === 0 && (
              <tr>
                <td className="px-3 py-6 text-neutral-500" colSpan={5}>
                  No records.
                </td>
              </tr>
            )}

            {!loading && rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="px-3 py-2">{r.term}</td>
                <td className="px-3 py-2 text-right">
                  {currency.format(Number(r.amount || 0))}
                </td>
                <td className="px-3 py-2">
                  <span className={`text-xs rounded px-2 py-0.5 border ${
                    r.status === "PAID" ? "border-emerald-300 text-emerald-700" : "border-amber-300 text-amber-700"
                  }`}>
                    {r.status}
                  </span>
                </td>
                <td className="px-3 py-2">{fmtDate(r.due_date)}</td>
                <td className="px-3 py-2 text-right">
                  {r.status === "DUE" ? (
                    <button
                      onClick={() => pay(r.id, r.amount)}
                      disabled={payingId === r.id}
                      className="rounded bg-emerald-600 text-white px-3 py-1.5 disabled:opacity-60"
                    >
                      {payingId === r.id ? "Processing…" : "Pay"}
                    </button>
                  ) : (
                    <span className="text-neutral-400">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
