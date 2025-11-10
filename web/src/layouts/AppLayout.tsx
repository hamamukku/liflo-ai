import { useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Footer from "../components/Footer";
import { useAuth } from "../app/providers/AuthProvider";

const tabs = [
  { path: "/goals", label: "目標" },
  { path: "/record", label: "記録" },
  { path: "/review", label: "振り返り" },
  { path: "/flow", label: "フロー" },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  const isActive = (path: string) => pathname === path;

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logout();
      navigate("/login", { replace: true });
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-liflo-light text-gray-900 font-sans flex flex-col">
      <header className="border-b border-liflo-border bg-liflo-light/70">
        <div className="max-w-5xl mx-auto w-full px-4 py-6">
          <div className="flex items-center justify-center gap-4">
            <div className="w-16 h-16 rounded-full bg-liflo-accent text-white flex items-center justify-center text-3xl font-bold shadow-card">
              L
            </div>
            <div className="text-center">
              <p className="text-3xl font-semibold leading-tight tracking-wide">Liflo</p>
              <p className="text-sm text-gray-600 tracking-wide">ライフロ</p>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={handleLogout}
              className="text-sm text-gray-600 border border-liflo-border rounded-full px-4 py-2 hover:bg-white transition-colors disabled:opacity-60"
              disabled={loggingOut}
            >
              {loggingOut ? "ログアウト中..." : `${user?.nickname ?? "ゲスト"} さん / ログアウト`}
            </button>
          </div>

          <nav className="mt-6 flex flex-wrap gap-5 justify-center">
            {tabs.map((tab) => (
              <Link
                key={tab.path}
                to={tab.path}
                className={`rounded-full border px-10 py-4 text-xl font-bold shadow-sm transition-all duration-200 tracking-wide select-none ${
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

      <main className="flex-1 w-full">
        <div className="max-w-5xl mx-auto w-full px-4 py-10">
          <section className="bg-liflo-paper border border-liflo-border rounded-2xl shadow-card p-8">
            {children}
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
