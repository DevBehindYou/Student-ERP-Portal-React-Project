import { useEffect, useState } from "react";
import { api } from "../utils/api";
import { useTheme } from "./ThemeProvider";

export default function ServerHealthGuard({ children }) {
  const [online, setOnline] = useState(false);
  const [checking, setChecking] = useState(true);
  const [countdown, setCountdown] = useState(60);
  const [failed, setFailed] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const checkHealth = async () => {
    try {
      // Fetch the health check endpoint
      const res = await api.get("/health");
      if (res && res.ok) {
        setOnline(true);
        setChecking(false);
        return true;
      }
    } catch (e) {
      console.warn("Backend server health check failed, waking up server...", e);
    }
    return false;
  };

  useEffect(() => {
    let active = true;

    async function initialCheck() {
      const isOnline = await checkHealth();
      if (!isOnline && active) {
        setChecking(false);
      }
    }

    initialCheck();

    return () => {
      active = false;
    };
  }, []);

  // Periodic health check in background while server is starting
  useEffect(() => {
    if (online || checking || failed) return;

    const interval = setInterval(async () => {
      const isOnline = await checkHealth();
      if (isOnline) {
        clearInterval(interval);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [online, checking, failed]);

  // Countdown timer
  useEffect(() => {
    if (online || checking || failed) return;

    if (countdown <= 0) {
      setFailed(true);
      return;
    }

    const timer = setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, online, checking, failed]);

  const handleRetry = async () => {
    setFailed(false);
    setCountdown(60);
    setChecking(true);
    const isOnline = await checkHealth();
    setChecking(false);
  };

  if (online) {
    return children;
  }

  // Circular progress math
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (countdown / 60) * circumference;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-neutral-50 via-white to-indigo-50 dark:from-[#0b1220] dark:via-[#0e1726] dark:to-[#090d16] text-neutral-900 dark:text-neutral-100 transition-colors duration-300">
      
      {/* Top right theme toggle for the wake up screen */}
      <div className="absolute top-5 right-5">
        <button
          onClick={toggleTheme}
          aria-label="Toggle Theme"
          className="p-3 rounded-full border border-neutral-200 dark:border-white/10 bg-white/40 dark:bg-white/5 backdrop-blur-md hover:bg-neutral-100/50 dark:hover:bg-white/10 transition shadow-sm"
        >
          {theme === "dark" ? (
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
            </svg>
          ) : (
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>
      </div>

      <div className="w-full max-w-md p-8 rounded-3xl border border-white/60 dark:border-white/10 bg-white/70 dark:bg-white/5 shadow-2xl backdrop-blur-2xl text-center space-y-6 transform hover:scale-[1.01] transition-transform duration-300">
        
        {/* Logo/Icon */}
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-500 text-white shadow-lg shadow-sky-500/20">
          <svg className="w-8 h-8 animate-pulse" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5v14" />
          </svg>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">College ERP Portal</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            {checking
              ? "Checking system status..."
              : failed
              ? "Server startup timed out"
              : "Starting The Server..."}
          </p>
        </div>

        {checking ? (
          <div className="py-8 flex justify-center">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-sky-500/30 border-t-sky-500" />
          </div>
        ) : failed ? (
          <div className="space-y-4 py-4">
            <div className="text-red-500 dark:text-rose-400 text-sm bg-red-500/10 dark:bg-rose-500/10 p-4 rounded-xl border border-red-500/20">
              The backend server is taking longer than expected to wake up. This happens sometimes with free hosting tiers.
            </div>
            <button
              onClick={handleRetry}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 px-6 py-3 font-semibold text-white shadow-lg shadow-sky-500/25 hover:from-sky-600 hover:to-indigo-600 transition duration-300"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89H18" />
              </svg>
              Retry Connection
            </button>
          </div>
        ) : (
          <div className="space-y-6 py-4 flex flex-col items-center">
            {/* Circular Countdown Loader */}
            <div className="relative h-28 w-28 flex items-center justify-center">
              <svg className="absolute -rotate-90 transform" width="112" height="112">
                {/* Background Ring */}
                <circle
                  cx="56"
                  cy="56"
                  r={radius}
                  className="stroke-neutral-200 dark:stroke-neutral-800"
                  strokeWidth="6"
                  fill="transparent"
                />
                {/* Colored Ring */}
                <circle
                  cx="56"
                  cy="56"
                  r={radius}
                  className="stroke-sky-500 transition-all duration-1000 ease-linear"
                  strokeWidth="6"
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                />
              </svg>
              <span className="text-3xl font-bold font-mono">{countdown}s</span>
            </div>

            <div className="max-w-xs mx-auto text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
              We are waking up the backend server on Render. Render spin-downs services after inactivity, taking up to 60 seconds to boot up. Please wait...
            </div>
          </div>
        )}

        <div className="text-xs text-neutral-400 dark:text-neutral-500 border-t border-neutral-100 dark:border-white/5 pt-4 flex items-center justify-center gap-2">
          <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
          <span>System Status: Sleeping (Spinning Up)</span>
        </div>
      </div>
    </div>
  );
}
