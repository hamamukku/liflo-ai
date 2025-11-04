import React from "react";
import { Link, useLocation } from "react-router-dom";

/**
 * AppLayout
 * 全ページ共通のヘッダー／サイドメニュー／フッター構成。
 * ルーティングは React Router Link に統一（href="#" は排除済み）。
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  // 現在のパスを取得してメニューのアクティブ状態を切り替える
  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen flex flex-col bg-gray-100 text-gray-900">
      {/* ヘッダー */}
      <header className="bg-blue-600 text-white">
        <div className="max-w-6xl mx-auto px-4 py-2 flex justify-between items-center">
          <h1 className="text-xl font-semibold">Liflo AI</h1>
          <nav className="space-x-4 text-sm">
            <Link to="/" className="hover:underline">ホーム</Link>
            <Link to="/record" className="hover:underline">記録</Link>
          </nav>
        </div>
      </header>

      {/* メインコンテンツ（サイドメニュー＋ページ本体） */}
      <div className="flex flex-1 max-w-6xl mx-auto w-full py-6 px-4 gap-4">
        {/* サイドメニュー */}
        <aside className="w-56 bg-white shadow-md rounded-xl p-4">
          <nav className="flex flex-col space-y-3 text-lg">
            <Link
              to="/"
              className={`flex items-center gap-2 ${
                isActive("/") ? "text-blue-600 font-semibold" : "text-gray-800 hover:text-blue-600"
              }`}
            >
              🏠 ホーム
            </Link>
            <Link
              to="/record"
              className={`flex items-center gap-2 ${
                isActive("/record") ? "text-blue-600 font-semibold" : "text-gray-800 hover:text-blue-600"
              }`}
            >
              📝 記録
            </Link>
            <Link
              to="/review"
              className={`flex items-center gap-2 ${
                isActive("/review") ? "text-blue-600 font-semibold" : "text-gray-800 hover:text-blue-600"
              }`}
            >
              📊 振り返り
            </Link>
            <Link
              to="/flow"
              className={`flex items-center gap-2 ${
                isActive("/flow") ? "text-blue-600 font-semibold" : "text-gray-800 hover:text-blue-600"
              }`}
            >
              💡 フロー理論
            </Link>
          </nav>
        </aside>

        {/* ページコンテンツ */}
        <main className="flex-1">{children}</main>
      </div>

      {/* フッター */}
      <footer className="text-center text-sm text-gray-500 py-4">
        © 2025 Liflo
      </footer>
    </div>
  );
}
