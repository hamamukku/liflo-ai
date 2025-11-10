import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../lib/api";

export default function SignupPage() {
  const navigate = useNavigate();
  const [nickname, setNickname] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!nickname.trim() || pin.length !== 4) {
      setError("ニックネームと4桁のPINを入力してください。");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await authApi.signup({ nickname: nickname.trim(), pin });
      navigate("/login", {
        replace: true,
        state: { signupMessage: "登録が完了しました。ログインしてください。" },
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "登録に失敗しました。時間を置いて再度お試しください。"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handlePinChange = (value: string) => {
    setPin(value.replace(/\D/g, "").slice(0, 4));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-liflo-light px-4">
      <div className="w-full max-w-md bg-white border border-liflo-border rounded-3xl shadow-card p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 mx-auto rounded-full bg-liflo-accent text-white flex items-center justify-center text-3xl font-bold shadow-card">
            L
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">はじめての方</h1>
          <p className="text-gray-600 text-sm">
            ニックネームと4桁の数字だけで、すぐにアカウントを作れます。
          </p>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-center">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="nickname" className="block text-gray-800 font-medium mb-2 text-lg">
              ニックネーム
            </label>
            <input
              id="nickname"
              name="nickname"
              autoFocus
              value={nickname}
              onChange={(event) => setNickname(event.target.value)}
              placeholder="例）たろう"
              maxLength={20}
              className="w-full border border-liflo-border rounded-2xl px-5 py-4 text-xl focus:outline-none focus:ring-2 focus:ring-liflo-accent"
            />
          </div>

          <div>
            <label htmlFor="pin" className="block text-gray-800 font-medium mb-2 text-lg">
              4桁の数字
            </label>
            <input
              id="pin"
              name="pin"
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              value={pin}
              onChange={(event) => handlePinChange(event.target.value)}
              placeholder="1234"
              maxLength={4}
              className="w-full border border-liflo-border rounded-2xl px-5 py-4 text-2xl tracking-[0.5em] text-center focus:outline-none focus:ring-2 focus:ring-liflo-accent"
            />
            <p className="text-xs text-gray-500 mt-1">数字のみ。忘れない番号を設定してください。</p>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-liflo-accent hover:bg-liflo-accent700 disabled:opacity-70 disabled:cursor-not-allowed text-white rounded-2xl py-4 text-xl font-semibold shadow-card transition-colors"
          >
            {submitting ? "登録中..." : "アカウントを作成"}
          </button>
        </form>

        <div className="text-center">
          <Link to="/login" className="text-liflo-accent underline font-medium text-lg">
            すでに登録済みの方はこちら
          </Link>
        </div>
      </div>
    </div>
  );
}
