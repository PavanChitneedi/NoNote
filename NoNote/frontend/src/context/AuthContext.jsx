import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getMe, login as apiLogin, logout as apiLogout, setTokens, clearTokens, hasRefreshToken } from "../api/client.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  // Re-hydrate from stored refresh token on mount
  useEffect(() => {
    if (!hasRefreshToken()) { setLoading(false); return; }
    getMe()
      .then((data) => setUser(data.user))
      .catch(() => clearTokens())
      .finally(() => setLoading(false));
  }, []);

  // Listen for forced logout (401 after refresh fail)
  useEffect(() => {
    const handler = () => { setUser(null); };
    window.addEventListener("nm:logout", handler);
    return () => window.removeEventListener("nm:logout", handler);
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await apiLogin(email, password);
    setTokens(data.access_token, data.refresh_token);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    await apiLogout().catch(() => {});
    setUser(null);
  }, []);

  const updateUserLocal = useCallback((updates) => {
    setUser((u) => u ? { ...u, ...updates } : u);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUserLocal }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
