// delivery_web/src/pages/HomePage.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../app/providers/AuthProvider';

const HomePage: React.FC = () => {
  const auth = useAuth();

  const nickname =
    auth?.user?.nickname ||
    (() => {
      try {
        const keys = ['liflo_user', 'user', 'auth_user'];
        for (const k of keys) {
          const raw = localStorage.getItem(k);
          if (!raw) continue;
          const o = JSON.parse(raw);
          if (o && o.nickname) return o.nickname;
        }
      } catch {
        // ignore
      }
      return 'ゲスト';
    })();

  const avatarChar = nickname ? nickname.trim().slice(0, 1) : 'ゲ';

  return (
    <main className="min-h-[calc(100vh-112px)] flex items-start justify-center px-4 py-6">
      {/* 白い大枠（カード） - 幅を元に戻し、内部は横並びヘッダー */}
      <section
        className="w-full max-w-4xl bg-white rounded-xl shadow-lg"
        style={{ padding: '36px 44px', marginTop: 6 }}
      >
        {/* ヘッダー：アバターとタイトルを横並びに */}
        <header className="flex items-center justify-center gap-6 mb-6">
          <div
            aria-hidden
            style={{
              width: 66,
              height: 66,
              borderRadius: 999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 22,
              fontWeight: 700,
              color: '#fff',
              background: 'linear-gradient(135deg,#667eea,#764ba2)',
              boxShadow: '0 6px 18px rgba(16,24,40,0.08)',
            }}
          >
            {avatarChar}
          </div>

          <div style={{ textAlign: 'left' }}>
            <h1 style={{ fontSize: 28, margin: 0, fontWeight: 800, color: '#0f172a' }}>
              ようこそ、{nickname}さん
            </h1>
            <p style={{ marginTop: 6, color: '#6b7280' }}>次に行う操作を選んでください。</p>
          </div>
        </header>

        {/* ボタン群（縦並び） */}
        <div className="mx-auto" style={{ maxWidth: 820 }}>
          <div className="mb-6">
            <Link
              to="/goals"
              className="block text-center rounded-md text-white"
              style={{
                padding: '14px 18px',
                background: 'linear-gradient(180deg,#1f9d55,#147a37)',
                textDecoration: 'none',
                boxShadow: '0 12px 24px rgba(20,125,60,0.08)',
                borderRadius: 8,
                fontWeight: 700,
              }}
            >
              目標の管理
            </Link>
            <p style={{ marginTop: 10, color: '#6b7280', fontSize: 14 }}>
              現在の目標を一覧・編集します。新しい目標を立てたり、達成・中止を記録できます。
            </p>
          </div>

          <div className="mb-6">
            <Link
              to="/record"
              className="block text-center rounded-md text-white"
              style={{
                padding: '14px 18px',
                background: 'linear-gradient(180deg,#8b5cf6,#7c3aed)',
                textDecoration: 'none',
                boxShadow: '0 12px 24px rgba(124,58,237,0.08)',
                borderRadius: 8,
                fontWeight: 700,
              }}
            >
              記録を入力
            </Link>
            <p style={{ marginTop: 10, color: '#6b7280', fontSize: 14 }}>
              今日の取り組みを1〜7で評価して保存します。AIが簡単なアドバイスを返します。
            </p>
          </div>

          <div className="mb-6">
            <Link
              to="/review"
              className="block text-center rounded-md text-white"
              style={{
                padding: '14px 18px',
                background: 'linear-gradient(180deg,#fb7c19,#f97316)',
                textDecoration: 'none',
                boxShadow: '0 12px 24px rgba(251,124,25,0.08)',
                borderRadius: 8,
                fontWeight: 700,
              }}
            >
              振り返り
            </Link>
            <p style={{ marginTop: 10, color: '#6b7280', fontSize: 14 }}>
              指定した期間の平均や傾向（フロー・不安・退屈・無関心）を集計します。
            </p>
          </div>

          <div>
            <Link
              to="/flow-theory"
              className="block text-center rounded-md text-white"
              style={{
                padding: '14px 18px',
                background: 'linear-gradient(180deg,#1f776f,#0f6b63)',
                textDecoration: 'none',
                boxShadow: '0 12px 24px rgba(20,107,99,0.08)',
                borderRadius: 8,
                fontWeight: 700,
              }}
            >
              フロー理論とは？
            </Link>
            <p style={{ marginTop: 10, color: '#6b7280', fontSize: 14 }}>
              挑戦と能力のバランスで起きる「フロー」について学べます。実践ヒント付き。
            </p>
          </div>
        </div>

        <div style={{ marginTop: 20, textAlign: 'center', color: '#9aa4b2', fontSize: 13 }}>
          ヒント: 「記録を入力」で挑戦度・能力度を1〜7で選ぶと、AIが改善案を返します。
        </div>
      </section>
    </main>
  );
};

export default HomePage;
