import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/context";

export default function Login() {
  const nav = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [role, setRole] = useState(null);

  function handleRole(r) {
    setRole(r);
    if (r === "Admin")   { setEmail("admin@erp.test");   setPassword("admin123"); }
    if (r === "Teacher") { setEmail("teacher@erp.test"); setPassword("teacher123"); }
    if (r === "Student") { setEmail("student@erp.test"); setPassword("student123"); }
  }

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    try {
      const me = await login({ email, password });
      const to =
        me.role === "ADMIN"   ? "/admin"   :
        me.role === "TEACHER" ? "/teacher" : "/student";
      nav(to, { replace: true });
    } catch {
      setMsg("Invalid email or password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-dvh overflow-hidden bg-gradient-to-br from-sky-50 via-white to-indigo-50 dark:from-[#0b1220] dark:via-[#0b1220] dark:to-[#0b1220] pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      <Decor />

      <main className="relative z-10 grid min-h-dvh place-items-center px-4 sm:px-6">
        {/* container scales with breakpoints */}
        <section className="w-full max-w-sm sm:max-w-md md:max-w-lg">
          {/* Brand */}
          <div className="mb-6 flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-500 text-white shadow-lg shadow-sky-500/20">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M5 12h14M12 5v14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-neutral-900 dark:text-white">College ERP</h1>
              <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">Sign in to continue</p>
            </div>
          </div>

          {/* Card */}
          <div className="rounded-2xl border border-white/60 bg-white/70 p-5 sm:p-6 shadow-xl backdrop-blur-xl transition dark:border-white/10 dark:bg-white/5">
            <form onSubmit={onSubmit} className="space-y-5">
              {/* Email */}
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="peer w-full rounded-xl border border-neutral-200 bg-white/70 px-4 pb-2 pt-6 text-[15px] text-neutral-900 outline-none transition placeholder-transparent focus:border-sky-400 focus:bg-white dark:border-white/10 dark:bg-white/10 dark:text-white dark:focus:bg-white/15"
                  placeholder="Email"
                  autoComplete="username"
                  inputMode="email"
                />
                <label
                  htmlFor="email"
                  className="pointer-events-none absolute left-3 top-2 text-xs font-medium text-neutral-500 transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:left-4 peer-placeholder-shown:text-sm peer-focus:top-2 peer-focus:left-3 peer-focus:text-xs dark:text-neutral-400"
                >
                  Email
                </label>
              </div>

              {/* Password */}
              <div className="relative">
                <input
                  id="password"
                  type={show ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="peer w-full rounded-xl border border-neutral-200 bg-white/70 px-4 pb-2 pt-6 text-[15px] text-neutral-900 outline-none transition placeholder-transparent focus:border-sky-400 focus:bg-white dark:border-white/10 dark:bg-white/10 dark:text-white dark:focus:bg-white/15"
                  placeholder="Password"
                  autoComplete="current-password"
                />
                <label
                  htmlFor="password"
                  className="pointer-events-none absolute left-3 top-2 text-xs font-medium text-neutral-500 transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:left-4 peer-placeholder-shown:text-sm peer-focus:top-2 peer-focus:left-3 peer-focus:text-xs dark:text-neutral-400"
                >
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs text-neutral-600 hover:bg-neutral-100/70 dark:text-neutral-400 dark:hover:bg-white/10"
                  aria-label={show ? "Hide password" : "Show password"}
                >
                  {show ? "Hide" : "Show"}
                </button>
              </div>

              {/* Remember + Forgot */}
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <label className="inline-flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
                  <input type="checkbox" className="h-4 w-4 accent-sky-600" /> Remember me
                </label>
                <a href="#" className="text-sm text-sky-600 hover:opacity-80 dark:text-sky-400">Forgot?</a>
              </div>

              {/* Submit */}
              <button
                disabled={loading}
                className="group relative inline-flex w-full items-center justify-center overflow-hidden rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 px-4 py-3 text-[15px] font-medium text-white shadow-lg shadow-sky-500/20 transition hover:from-sky-600 hover:to-indigo-600 disabled:opacity-70"
              >
                <span className={`transition ${loading ? "opacity-0" : "opacity-100"}`}>Sign in</span>
                {loading && <Spinner />}
              </button>

              {/* Inline message */}
              <p className="min-h-[1.25rem] text-center text-sm text-red-600 dark:text-rose-300" aria-live="polite">
                {msg}
              </p>
            </form>

            {/* Demo creds helper */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
              {["Admin", "Teacher", "Student"].map((r) => {
                const pressed = role === r;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => handleRole(r)}
                    aria-pressed={pressed}
                    className={`rounded-lg border px-3 py-2 font-medium transition-all
                      ${pressed
                        ? "text-white bg-gradient-to-r from-sky-500/70 to-indigo-500/70 shadow-md shadow-sky-500/20 border-transparent"
                        : "border-neutral-200 text-neutral-600 hover:bg-neutral-100 dark:border-white/10 dark:text-neutral-300 dark:hover:bg-white/10"}`}
                  >
                    {r}
                  </button>
                );
              })}
            </div>
          </div>

          {/* footer */}
          <p className="mt-6 text-center text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
            By continuing, you agree to our{" "}
            <a className="underline underline-offset-2 hover:opacity-80" href="#">Terms</a>.
          </p>
        </section>
      </main>
    </div>
  );
}

/* subtle progress spinner */
function Spinner() {
  return (
    <span className="absolute inset-0 grid place-items-center">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
    </span>
  );
}

/* background decoration (scaled & hidden on very small screens) */
function Decor() {
  return (
    <>
      <div className="pointer-events-none absolute -left-24 -top-24 h-52 w-52 rounded-full bg-sky-400/20 blur-3xl sm:h-72 sm:w-72 sm:block hidden" />
      <div className="pointer-events-none absolute -right-16 top-1/3 h-60 w-60 rounded-full bg-indigo-400/20 blur-3xl sm:h-80 sm:w-80" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-white/70 to-transparent dark:from-black/40 sm:h-24" />
    </>
  );
}
