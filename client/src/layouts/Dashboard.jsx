import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/context";

const MENUS = {
  admin: [
    { to: "/admin/users", label: "Users" },
    { to: "/admin/fees", label: "Fees" },
    { to: "/admin/results", label: "Results" },
    { to: "/admin/timetables", label: "Time-tables" },
    { to: "/admin/notices", label: "Notices" },
  ],
  teacher: [
    { to: "/teacher/attendance", label: "Attendance" },
    { to: "/teacher/assignments", label: "Assignments" },
    { to: "/teacher/notices", label: "Notices" },
  ],
  student: [
    { to: "/student/fees", label: "Fees & Payments" },
    { to: "/student/notices", label: "Notices" },
    { to: "/student/assignments", label: "Assignments" },
  ],
};

function areaFromPath(pathname) {
  if (pathname.startsWith("/admin")) return "admin";
  if (pathname.startsWith("/teacher")) return "teacher";
  if (pathname.startsWith("/student")) return "student";
  return "student"; // sensible default
}

export default function Dashboard() {
  const { me, logout } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();

  const area = areaFromPath(loc.pathname);
  const menu = MENUS[area] ?? MENUS.student;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-3 border-b">
        <div className="text-lg font-semibold">College ERP</div>
        <div className="flex items-center gap-3 text-sm">
          <span>
            {me?.full_name || me?.email} · {me?.role || area.toUpperCase()}
          </span>
          <button
            className="rounded border px-3 py-1"
            onClick={async () => {
              await logout();
              nav("/login", { replace: true });
            }}
          >
            Logout
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="grid gap-6 p-6 md:grid-cols-[280px_1fr]">
        <aside className="rounded border p-3 space-y-2">
          {menu.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `block rounded px-3 py-2 text-sm ${
                  isActive ? "bg-sky-600 text-white" : "hover:bg-neutral-50"
                }`
              }
              end={false}
            >
              {item.label}
            </NavLink>
          ))}
        </aside>

        <main className="rounded border p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
