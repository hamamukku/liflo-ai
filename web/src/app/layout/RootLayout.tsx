import React from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../providers/AuthProvider';

/**
 * RootLayout
 * - ヘッダーを薄型化（py-2）して、下の「ログイン」バーと同じくらいの高さに調整
 * - 文字は読みやすさを確保しつつ高さを抑えるため text-xl / leading-6 を採用
 */
const RootLayout: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      {/* 薄いヘッダー（上部青帯） */}
      <header className="bg-blue-600 text-white py-2">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl font-semibold leading-6">
            <Link to="/">Liflo&nbsp;AI</Link>
          </h1>
          {user && (
            <div className="flex items-center gap-3">
              <span className="text-sm md:text-base leading-6">
                こんにちは、{user.nickname}さん
              </span>
              <button
                onClick={logout}
                className="bg-blue-800 hover:bg-blue-700 px-3 py-1.5 rounded-md text-white text-sm md:text-base"
              >
                ログアウト
              </button>
            </div>
          )}
        </div>
      </header>

      {/* 下の薄いバー（ログイン/ナビ） */}
      <nav className="bg-blue-50 border-b border-blue-200">
        <div className="container mx-auto flex flex-wrap space-x-4 py-2">
          {user ? (
            <>
              <NavLink
                to="/"
                className={({ isActive }) =>
                  `text-lg ${isActive ? 'font-bold text-blue-600' : 'text-blue-800'}`
                }
                end
              >
                ホーム
              </NavLink>
              <NavLink
                to="/goals"
                className={({ isActive }) =>
                  `text-lg ${isActive ? 'font-bold text-blue-600' : 'text-blue-800'}`
                }
              >
                目標
              </NavLink>
              <NavLink
                to="/record"
                className={({ isActive }) =>
                  `text-lg ${isActive ? 'font-bold text-blue-600' : 'text-blue-800'}`
                }
              >
                記録入力
              </NavLink>
              <NavLink
                to="/review"
                className={({ isActive }) =>
                  `text-lg ${isActive ? 'font-bold text-blue-600' : 'text-blue-800'}`
                }
              >
                振り返り
              </NavLink>
              <NavLink
                to="/flow-theory"
                className={({ isActive }) =>
                  `text-lg ${isActive ? 'font-bold text-blue-600' : 'text-blue-800'}`
                }
              >
                フロー理論
              </NavLink>
            </>
          ) : (
            <NavLink
  to="/login"
  className={({ isActive }) =>
    `text-lg ${isActive ? 'font-bold text-blue-600' : 'text-blue-800'}`
  }
  aria-label="ログインまたは新規会員登録"
  title="ログイン/新規会員登録"
>
  ログイン/新規会員登録
</NavLink>
          )}
        </div>
      </nav>

      <main className="flex-1 container mx-auto p-4">
        <Outlet />
      </main>

      <footer className="bg-gray-200 text-center py-4 text-sm">© 2025 Liflo</footer>
    </div>
  );
};

export default RootLayout;
