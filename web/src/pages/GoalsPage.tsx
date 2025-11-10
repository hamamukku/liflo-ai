import { FormEvent, useEffect, useState } from "react";
import AppLayout from "../layouts/AppLayout";
import { Goal, GoalStatus, goalsApi } from "../lib/api";

const statusLabel: Record<GoalStatus, string> = {
  active: "進行中",
  done: "達成済み",
  cancelled: "中止",
};

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await goalsApi.list();
        if (active) {
          setGoals(data);
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "目標の取得に失敗しました。");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const created = await goalsApi.create({ title: trimmed });
      setGoals((prev) => [created, ...prev]);
      setTitle("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "目標の作成に失敗しました。");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusUpdate = async (id: string, status: GoalStatus) => {
    if (pendingId) return;
    setPendingId(id);
    setError(null);
    try {
      const updated = await goalsApi.updateStatus(id, status);
      setGoals((prev) => prev.map((goal) => (goal.id === id ? updated : goal)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "ステータスの更新に失敗しました。");
    } finally {
      setPendingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (pendingId) return;
    setPendingId(id);
    setError(null);
    try {
      await goalsApi.remove(id);
      setGoals((prev) => prev.filter((goal) => goal.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "目標の削除に失敗しました。");
    } finally {
      setPendingId(null);
    }
  };

  const hasGoals = goals.length > 0;

  const formatDate = (value: string) => {
    try {
      return new Date(value).toLocaleDateString();
    } catch {
      return value;
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <header>
          <h2 className="text-2xl font-semibold text-liflo-accent">🎯 目標リーチ</h2>
          <p className="text-gray-700 mt-2">
            取り組みたいことを記録し、進捗に応じてステータスを切り替えましょう。小さなチャレンジも歓迎です。
          </p>
        </header>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="例）週に3回ランニングをする"
            className="flex-1 border border-liflo-border rounded-full bg-white px-5 py-3 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-liflo-accent"
          />
          <button
            type="submit"
            disabled={submitting}
            className="bg-liflo-accent hover:bg-liflo-accent700 disabled:opacity-70 disabled:cursor-not-allowed text-white rounded-full px-6 py-3 font-semibold shadow-card transition-colors"
          >
            {submitting ? "追加中..." : "追加"}
          </button>
        </form>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">{error}</p>
        )}

        <section className="space-y-4">
          {loading && <p className="text-gray-600">読み込み中です...</p>}

          {!loading && !hasGoals && (
            <p className="text-gray-600 bg-white border border-liflo-border rounded-xl p-4 text-center">
              まだ目標が登録されていません。最初の目標を入力してスタートしましょう。
            </p>
          )}

          {hasGoals && (
            <ul className="space-y-4">
              {goals.map((goal) => (
                <li
                  key={goal.id}
                  className="bg-white border border-liflo-border rounded-xl p-4 shadow-sm"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-gray-800 font-medium">{goal.title}</p>
                      <p className="text-sm text-gray-500">登録日：{formatDate(goal.createdAt)}</p>
                    </div>
                    <span
                      className={`text-xs font-semibold rounded-full px-3 py-1 ${
                        goal.status === "done"
                          ? "bg-liflo-accent text-white"
                          : goal.status === "cancelled"
                          ? "bg-gray-200 text-gray-600"
                          : "bg-liflo-tab text-gray-700"
                      }`}
                    >
                      {statusLabel[goal.status]}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => handleStatusUpdate(goal.id, "done")}
                      disabled={pendingId === goal.id}
                      className="border border-liflo-border rounded-full px-4 py-2 text-sm font-medium hover:bg-liflo-tab transition-colors disabled:opacity-60"
                    >
                      達成
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStatusUpdate(goal.id, "cancelled")}
                      disabled={pendingId === goal.id}
                      className="border border-liflo-border rounded-full px-4 py-2 text-sm font-medium hover:bg-liflo-tab transition-colors disabled:opacity-60"
                    >
                      中止
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStatusUpdate(goal.id, "active")}
                      disabled={pendingId === goal.id}
                      className="border border-liflo-border rounded-full px-4 py-2 text-sm font-medium hover:bg-liflo-tab transition-colors disabled:opacity-60"
                    >
                      進行中に戻す
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(goal.id)}
                      disabled={pendingId === goal.id}
                      className="border border-red-200 text-red-600 rounded-full px-4 py-2 text-sm font-medium hover:bg-red-50 transition-colors disabled:opacity-60"
                    >
                      削除
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </AppLayout>
  );
}
