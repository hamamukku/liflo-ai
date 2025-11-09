import { FormEvent, useEffect, useState } from "react";
import AppLayout from "../layouts/AppLayout";

type GoalStatus = "active" | "done" | "cancelled";

type Goal = {
  id: string;
  title: string;
  status: GoalStatus;
  createdAt: string;
};

const STORAGE_KEY = "liflo_goals";

const statusLabel: Record<GoalStatus, string> = {
  active: "進行中",
  done: "達成済み",
  cancelled: "中止",
};

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [title, setTitle] = useState("");

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setGoals(parsed);
      }
    } catch (error) {
      console.error("Failed to load goals:", error);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
  }, [goals]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    const newGoal: Goal = {
      id: Date.now().toString(),
      title: trimmed,
      status: "active",
      createdAt: new Date().toLocaleDateString(),
    };
    setGoals((prev) => [newGoal, ...prev]);
    setTitle("");
  };

  const updateStatus = (id: string, status: GoalStatus) => {
    setGoals((prev) => prev.map((goal) => (goal.id === id ? { ...goal, status } : goal)));
  };

  const hasGoals = goals.length > 0;

  return (
    <AppLayout>
      <div className="space-y-6">
        <header>
          <h2 className="text-2xl font-semibold text-liflo-accent">🎯 目標ボード</h2>
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
            className="bg-liflo-accent hover:bg-liflo-accent700 text-white rounded-full px-6 py-3 font-semibold shadow-card transition-colors"
          >
            追加
          </button>
        </form>

        <section className="space-y-4">
          {!hasGoals && (
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
                      <p className="text-sm text-gray-500">登録日：{goal.createdAt}</p>
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
                      onClick={() => updateStatus(goal.id, "done")}
                      className="border border-liflo-border rounded-full px-4 py-2 text-sm font-medium hover:bg-liflo-tab transition-colors"
                    >
                      達成
                    </button>
                    <button
                      type="button"
                      onClick={() => updateStatus(goal.id, "cancelled")}
                      className="border border-liflo-border rounded-full px-4 py-2 text-sm font-medium hover:bg-liflo-tab transition-colors"
                    >
                      中止
                    </button>
                    <button
                      type="button"
                      onClick={() => updateStatus(goal.id, "active")}
                      className="border border-liflo-border rounded-full px-4 py-2 text-sm font-medium hover:bg-liflo-tab transition-colors"
                    >
                      進行中に戻す
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
