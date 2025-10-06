import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../app/providers/AuthProvider';
import { register as apiRegister } from '../app/api';

const USE_MOCK =
  !import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_USE_MOCK === '1';

const LoginPage: React.FC = () => {
  const nav = useNavigate();
  const { login } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [nickname, setNickname] = useState('');
  const [pin, setPin] = useState('');
  const [pin2, setPin2] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string>('');

  const resetMsg = () => setMsg('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMsg();
    const nn = nickname.trim();
    const pp = pin.trim();
    if (!nn || !pp) {
      setMsg('ニックネームと暗証番号を入力してください');
      return;
    }
    try {
      setLoading(true);
      await login(nn, pp);
      // 成功時はホームへ遷移（固定文は出さない）
      nav('/', { replace: true });
    } catch (_err) {
      // 失敗は「固定文」だけを表示（候補示唆なし）
      setMsg('ニックネームまたは暗証番号が正しくありません。');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMsg();
    const nn = nickname.trim();
    const pp = pin.trim();
    const pp2 = pin2.trim();
    if (!nn || !pp) {
      setMsg('ニックネームと暗証番号を入力してください');
      return;
    }
    if (pp !== pp2) {
      setMsg('暗証番号（確認）が一致しません');
      return;
    }
    try {
      setLoading(true);
      // 1) 新規登録（モック運用時は即成功／実API時は /auth/register へ）
      await apiRegister(nn, pp);
      // 2) 登録後に自動ログイン → ホームへ
      await login(nn, pp);
      nav('/', { replace: true });
    } catch (err: any) {
      setMsg(err?.message || '登録に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10">
      {/* タブ */}
      <div className="mb-6 flex rounded-lg border border-gray-200 overflow-hidden">
        <button
          type="button"
          onClick={() => { setMode('login'); resetMsg(); }}
          className={`flex-1 py-2 text-center ${mode === 'login' ? 'bg-blue-600 text-white' : 'bg-white text-blue-700'}`}
        >
          ログイン
        </button>
        <button
          type="button"
          onClick={() => { setMode('register'); resetMsg(); }}
          className={`flex-1 py-2 text-center ${mode === 'register' ? 'bg-blue-600 text-white' : 'bg-white text-blue-700'}`}
        >
          新規会員登録
        </button>
      </div>

      {/* 接続モードの小さな注記（UX向上・情報漏えいはしない） */}
      <p className="mb-3 text-xs text-gray-500">
        {USE_MOCK
          ? '現在はモック環境（バックエンド接続なし）で動作中です。'
          : '実APIに接続中です。'}
      </p>

      {/* メッセージ（失敗は赤、成功や通知は緑） */}
      {msg && (
        <p
          className={`mb-4 ${
            /失敗|一致しません|入力してください/.test(msg)
              ? 'text-red-600'
              : 'text-green-700'
          }`}
          aria-live="polite"
        >
          {msg}
        </p>
      )}

      {mode === 'login' ? (
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block mb-1">ニックネーム</label>
            <input
              className="w-full p-3 border rounded"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              autoComplete="username"
              disabled={loading}
            />
          </div>
          <div>
            <label className="block mb-1">暗証番号</label>
            <input
              type="password"
              className="w-full p-3 border rounded"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              autoComplete="current-password"
              disabled={loading}
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded disabled:opacity-70"
            disabled={loading}
          >
            {loading ? '送信中...' : 'ログイン'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block mb-1">ニックネーム</label>
            <input
              className="w-full p-3 border rounded"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              autoComplete="username"
              disabled={loading}
            />
          </div>
          <div>
            <label className="block mb-1">暗証番号</label>
            <input
              type="password"
              className="w-full p-3 border rounded"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              autoComplete="new-password"
              disabled={loading}
            />
          </div>
          <div>
            <label className="block mb-1">暗証番号（確認）</label>
            <input
              type="password"
              className="w-full p-3 border rounded"
              value={pin2}
              onChange={(e) => setPin2(e.target.value)}
              autoComplete="new-password"
              disabled={loading}
            />
          </div>
          <button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-500 text-white py-3 rounded disabled:opacity-70"
            disabled={loading}
          >
            {loading ? '登録中...' : '登録してログイン'}
          </button>
        </form>
      )}

      {/* PoC向け説明。内部仕様の具体は出さない */}
      <p className="mt-6 text-sm text-gray-600">
        ※ ログイン失敗時は固定文のみを表示します。本番ではメール認証やより強固な認証方式への拡張が可能です。
      </p>
    </div>
  );
};

export default LoginPage;
