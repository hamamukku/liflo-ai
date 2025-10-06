import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getStoredUser, login as apiLogin, clearSession } from "../api";

type User = { userId: string; nickname?: string } | null;
type AuthCtx = {
  user: User;
  token: string | null;
  login: (nickname: string, pin: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthCtx | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 初期化は localStorage ベース（既存仕様に合わせる）
  const [user, setUser] = useState<User>(() => getStoredUser());
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("token"));

  // 他タブでのログイン/ログアウトと同期（任意だが堅牢化）
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "token" || e.key === "user") {
        setToken(localStorage.getItem("token"));
        setUser(getStoredUser());
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const login = async (nickname: string, pin: string) => {
    const res = await apiLogin(nickname, pin);
    const t = (res as any)?.token ?? (res as any)?.customToken;
    const uid = (res as any)?.userId ?? (res as any)?.uid;
    if (!t || !uid) throw new Error("ログインに失敗しました");
    // api.ts 側でも保存しているが、ここでも冪等に反映しておく
    localStorage.setItem("token", t);
    localStorage.setItem("user", JSON.stringify({ userId: uid, nickname }));
    setToken(t);
    setUser({ userId: uid, nickname });
  };

  const logout = () => {
    clearSession();
    setToken(null);
    setUser(null);
  };

  const value = useMemo(() => ({ user, token, login, logout }), [user, token]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
