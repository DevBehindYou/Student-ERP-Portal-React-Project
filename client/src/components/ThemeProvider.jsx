import { createContext, useContext, useEffect, useState } from "react";

const ThemeCtx = createContext(null);
export const useTheme = () => useContext(ThemeCtx);

export default function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("erp_theme");
    if (saved) return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("erp_theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  return (
    <ThemeCtx.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeCtx.Provider>
  );
}
