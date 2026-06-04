import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../utils/api";

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = sessionStorage.getItem("erp_user");
    return saved ? JSON.parse(saved) : null;
  });

  async function login(creds) {
    const me = await api.post("/auth/login", creds);
    setUser(me);
    sessionStorage.setItem("erp_user", JSON.stringify(me));
    return me;
  }

  async function logout() {
    await api.post("/auth/logout", {});
    setUser(null);
    sessionStorage.removeItem("erp_user");
  }

  return <Ctx.Provider value={{ user, login, logout }}>{children}</Ctx.Provider>;
}
