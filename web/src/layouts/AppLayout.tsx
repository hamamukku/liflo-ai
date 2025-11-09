import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import Footer from "../components/Footer";

const tabs = [
  { path: "/goals", label: "目標" },
  { path: "/record", label: "記録" },
  { path: "/review", label: "振り返り" },
  { path: "/flow", label: "フロー" },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const isActive = (path: string) => pathname === path;

  return (
    <div className="min-h-screen bg-liflo-light text-gray-900 font-sans flex flex-col">
      {/* ===== ヘッダー ===== */}
      <header className="border-b border-liflo-border bg-liflo-light/70">
        <div className="max-w-5xl mx-auto w-full px-4 py-6">
          {/* --- ロゴとタイトルを中央寄せ・横並び --- */}
          <div className="flex items-center justify-center gap-4">
            {/* Lロゴ */}
            <div className="w-16 h-16 rounded-full bg-liflo-accent text-white flex items-center justify-center text-3xl font-bold shadow-card">
              L
            </div>

            {/* タイトルテキスト */}
            <div className="text-center">
              <p className="text-3xl font-semibold leading-tight tracking-wide">Liflo</p>
              <p className="text-sm text-gray-600 tracking-wide">ライフロ</p>
            </div>
          </div>

          {/* --- ナビゲーションタブ --- */}
          <nav className="mt-8 flex flex-wrap gap-5 justify-center">
            {tabs.map((tab) => (
              <Link
                key={tab.path}
                to={tab.path}
                className={`rounded-full border px-10 py-4 text-xl font-bold shadow-sm transition-all duration-200 tracking-wide select-none
                  ${
                    isActive(tab.path)
                      ? "bg-white border-liflo-accent text-liflo-accent scale-105 shadow-card"
                      : "bg-liflo-tab border-liflo-border text-gray-700 hover:bg-white hover:scale-105 hover:text-liflo-accent"
                  }`}
              >
                {tab.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      {/* ===== メインコンテンツ ===== */}
      <main className="flex-1 w-full">
        <div className="max-w-5xl mx-auto w-full px-4 py-10">
          <section className="bg-liflo-paper border border-liflo-border rounded-2xl shadow-card p-8">
            {children}
          </section>
        </div>
      </main>

      {/* ===== フッター ===== */}
      <Footer />
    </div>
  );
}
