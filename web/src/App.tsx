import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// 各ページをインポート
import HomePage from "./pages/HomePage";
import RecordPage from "./pages/RecordPage";
import ReviewPage from "./pages/ReviewPage";
import FlowTheoryPage from "./pages/FlowTheoryPage";
import LoginPage from "./pages/LoginPage";

// 404ページ（存在しないパス）
function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 text-gray-800">
      <div className="bg-white shadow-md rounded-lg p-8">
        <h1 className="text-3xl font-bold mb-4">404 - ページが見つかりません</h1>
        <p className="mb-4">存在しないURLにアクセスした可能性があります。</p>
        <a href="/" className="text-blue-600 hover:underline">
          ホームに戻る
        </a>
      </div>
    </div>
  );
}

// メインルーティング定義
export default function App(): JSX.Element {
  return (
    <Routes>
      {/* メインページ */}
      <Route path="/" element={<HomePage />} />
      <Route path="/record" element={<RecordPage />} />
      <Route path="/review" element={<ReviewPage />} />
      <Route path="/flow" element={<FlowTheoryPage />} />
      <Route path="/login" element={<LoginPage />} />

      {/* リダイレクト（旧パスや誤入力用） */}
      <Route path="/home" element={<Navigate to="/" replace />} />

      {/* それ以外は全部 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
