import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../../providers/AuthProvider";

/**
 * 認証ガード
 * - モックモード（バックエンド無し）では常に通す
 * - 実API接続時のみ token を要求（未ログインは /login にリダイレクト）
 */
const USE_MOCK = !import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_USE_MOCK === "1";

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token } = useAuth();
  const location = useLocation();

  if (USE_MOCK) {
    // バックエンド無し運用 → 常に許可
    return <>{children}</>;
  }

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <>{children}</>;
};
