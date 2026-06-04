import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/context";
import { useTheme } from "../components/ThemeProvider";
import { useState, useEffect } from "react";

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
  return "student";
}

export default function Dashboard() {
  const { user: me, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const nav = useNavigate();
  const loc = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const area = areaFromPath(loc.pathname);
  const menu = MENUS[area] ?? MENUS.student;

  // Auto-close mobile sidebar when path changes
  useEffect(() => {
    setMobileOpen(false);
  }, [loc.pathname]);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-[#080d16] text-neutral-900 dark:text-neutral-100 transition-colors duration-300">
      {/* Sticky Header */}
      <header className="sticky top-0 z-40 flex items-center justify-between px-4 sm:px-6 py-4 border-b border-neutral-200 dark:border-white/10 bg-white/80 dark:bg-[#0b1220]/80 backdrop-blur-md shadow-sm">
        <div className="flex items-center gap-3">
          {/* Mobile Hamburger menu */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-white/10 transition"
            aria-label="Toggle Menu"
          >
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-sky-500 to-indigo-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
              E
            </div>
            <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-neutral-900 to-neutral-700 dark:from-white dark:to-neutral-300 bg-clip-text text-transparent">
              College ERP
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <div className="hidden sm:flex flex-col text-right text-xs">
            <span className="font-semibold text-neutral-800 dark:text-neutral-200">
              {me?.full_name || me?.email}
            </span>
            <span className="text-neutral-400 dark:text-neutral-500 font-mono text-[10px]">
              {me?.role || area.toUpperCase()}
            </span>
          </div>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle Theme"
            className="p-2 rounded-xl border border-neutral-200 dark:border-white/10 hover:bg-neutral-100 dark:hover:bg-white/5 transition duration-200 shadow-sm"
          >
            {theme === "dark" ? (
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
              </svg>
            ) : (
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>

          {/* Logout button */}
          <button
            className="flex items-center gap-1.5 rounded-xl border border-neutral-200 dark:border-white/10 px-3 py-1.5 text-xs font-semibold hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400 transition"
            onClick={async () => {
              await logout();
              nav("/login", { replace: true });
            }}
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* Main Grid Container */}
      <div className="max-w-7xl mx-auto p-4 sm:p-6 grid grid-cols-1 md:grid-cols-[240px_1fr] gap-6">
        
        {/* Desktop Sidebar (Sidebar menu hidden on mobile) */}
        <aside className="hidden md:block h-fit rounded-2xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#0b1220] p-4 space-y-1.5 shadow-sm sticky top-24">
          <div className="px-3 py-1 mb-2 text-xs font-semibold text-neutral-400 uppercase tracking-wider">
            Navigation
          </div>
          {menu.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `block rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? "bg-gradient-to-r from-sky-50 to-indigo-500 text-white shadow-md shadow-sky-500/15"
                    : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-white/5"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </aside>

        {/* Mobile Side Drawer Overlay */}
        {mobileOpen && (
          <div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm md:hidden"
            onClick={() => setMobileOpen(false)}
          >
            <div
              className="w-64 max-w-[80vw] h-full bg-white dark:bg-[#0b1220] p-6 space-y-4 shadow-2xl border-r border-neutral-200 dark:border-white/10 flex flex-col justify-between"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-4 border-b border-neutral-100 dark:border-white/5">
                  <span className="text-md font-bold">Navigation</span>
                  <button
                    onClick={() => setMobileOpen(false)}
                    className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-white/5"
                  >
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <nav className="space-y-1">
                  {menu.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={({ isActive }) =>
                        `block rounded-xl px-4 py-3 text-sm font-medium transition ${
                          isActive
                            ? "bg-gradient-to-r from-sky-500 to-indigo-500 text-white shadow-md"
                            : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-white/5"
                        }`
                      }
                    >
                      {item.label}
                    </NavLink>
                  ))}
                </nav>
              </div>

              {/* User info at bottom of mobile menu */}
              <div className="border-t border-neutral-100 dark:border-white/5 pt-4">
                <div className="flex flex-col text-sm">
                  <span className="font-semibold text-neutral-800 dark:text-neutral-200 truncate">
                    {me?.full_name || me?.email}
                  </span>
                  <span className="text-neutral-400 dark:text-neutral-500 font-mono text-xs">
                    {me?.role || area.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="rounded-2xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#0b1220] p-4 sm:p-6 shadow-sm overflow-hidden min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
