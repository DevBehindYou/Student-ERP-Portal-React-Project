// client/src/pages/student/Layout.jsx (example)
import { NavLink, Outlet } from "react-router-dom";

export default function StudentLayout() {
  return (
    <div className="grid md:grid-cols-[260px_1fr] gap-6">
      <aside className="rounded border p-3 space-y-2">
        <div className="text-sm font-semibold">Fees & Payments</div>
        <NavLink to="/student/notices" className="block rounded px-3 py-2 hover:bg-neutral-50">
          Notices
        </NavLink>
        <NavLink to="/student/assignments" className="block rounded px-3 py-2 hover:bg-neutral-50">
          Assignments
        </NavLink>
      </aside>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
