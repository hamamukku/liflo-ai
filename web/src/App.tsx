import type { ReactElement } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import GoalsPage from "./pages/GoalsPage";
import RecordPage from "./pages/RecordPage";
import ReviewPage from "./pages/ReviewPage";
import FlowTheoryPage from "./pages/FlowTheoryPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import { ProtectedRoute } from "./app/features/auth/guards/ProtectedRoute";

function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 text-gray-800">
      <div className="bg-white shadow-md rounded-lg p-8">
        <h1 className="text-3xl font-bold mb-4">404 - ページが見つかりません</h1>
        <p className="mb-4">指定されたURLにアクセスする権限がないか存在しない可能性があります。</p>
        <a href="/" className="text-blue-600 hover:underline">
          トップに戻る
        </a>
      </div>
    </div>
  );
}

export default function App(): ReactElement {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/goals" replace />} />
      <Route
        path="/goals"
        element={
          <ProtectedRoute>
            <GoalsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/record"
        element={
          <ProtectedRoute>
            <RecordPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/review"
        element={
          <ProtectedRoute>
            <ReviewPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/flow"
        element={
          <ProtectedRoute>
            <FlowTheoryPage />
          </ProtectedRoute>
        }
      />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
