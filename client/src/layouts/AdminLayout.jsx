import { NavLink, Outlet } from "react-router-dom";

export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-6">
        <aside className="md:col-span-1">
          <nav className="rounded-xl border border-white/10 p-2">
            <NavLink
              to="/admin/users"
              className={({isActive}) =>
                `block rounded-lg px-3 py-2 ${isActive ? "bg-sky-600 text-white" : "hover:bg-white/5"}`
              }>
              Users
            </NavLink>
          </nav>
        </aside>
        <main className="md:col-span-3 rounded-xl border border-white/10 p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
