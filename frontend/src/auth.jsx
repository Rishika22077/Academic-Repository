import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api, getToken, setToken, setUnauthorizedHandler } from "./api.js";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export const LANDING = { STUDENT: "/student", FACULTY: "/faculty", ADMIN: "/admin" };

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!getToken());

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(logout);
  }, [logout]);

  // Restore the session from a stored token on page load.
  useEffect(() => {
    if (!getToken()) return;
    api
      .get("/api/auth/me")
      .then(setUser)
      .catch(() => setToken(null))
      .finally(() => setLoading(false));
  }, []);

  const finish = (r) => {
    setToken(r.token);
    setUser({ id: r.id, name: r.name, email: r.email, role: r.role, active: true });
    return r;
  };

  const login = async (email, password) => finish(await api.post("/api/auth/login", { email, password }));
  const register = async (name, email, password) => finish(await api.post("/api/auth/register", { name, email, password }));

  return <AuthContext.Provider value={{ user, loading, login, register, logout }}>{children}</AuthContext.Provider>;
}
