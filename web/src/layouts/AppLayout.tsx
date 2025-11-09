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
      <header className="border-b border-liflo-border bg-liflo-light/70">
        <div className="max-w-5xl mx-auto w-full px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-liflo-accent text-white flex items-center justify-center text-xl font-bold shadow-card">
              L
            </div>
            <div>
              <p className="text-2xl font-semibold leading-tight">Liflo</p>
              <p className="text-sm text-gray-600 tracking-wide">ライフロ</p>
            </div>
          </div>
          <nav className="mt-6 flex flex-wrap gap-3">
            {tabs.map((tab) => (
              <Link
                key={tab.path}
                to={tab.path}
                className={`rounded-full border px-5 py-2 text-sm font-medium shadow-sm transition-colors ${
                  isActive(tab.path)
                    ? "bg-white border-liflo-accent text-liflo-accent"
                    : "bg-liflo-tab border-liflo-border text-gray-700 hover:bg-white"
                }`}
              >
                {tab.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="flex-1 w-full">
        <div className="max-w-5xl mx-auto w-full px-4 py-8">
          <section className="bg-liflo-paper border border-liflo-border rounded-2xl shadow-card p-6">
            {children}
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
