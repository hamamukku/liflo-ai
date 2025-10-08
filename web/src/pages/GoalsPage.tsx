import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listGoals, saveGoal, type Goal, type GoalStatus } from '../app/api';

const isActive = (s: GoalStatus | undefined) => s === 'active' || s === undefined;
const renderStatus = (s: GoalStatus | undefined) =>
  s === 1000 ? '達成' : s === 999 ? '中止' : '進行中';

const GoalsPage: React.FC = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // listGoals() が「配列」でも「{items: 配列}」でも正しく配列に正規化
  const normalizeGoals = (res: unknown): Goal[] => {
    if (Array.isArray(res)) return res as Goal[];
    if (res && typeof res === 'object' && Array.isArray((res as any).items)) {
      return (res as any).items as Goal[];
    }
    return [];
  };

  const fetchGoals = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await listGoals();
      setGoals(normalizeGoals(res));
    } catch (err: any) {
      setError(err?.message || '目標の取得に失敗しました');
      setGoals([]); // 防御
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchGoals(); }, []);

  const handleMarkStatus = async (goal: Goal, newStatus: 1000 | 999) => {
    const promptMsg = newStatus === 1000 ? '達成した理由を入力してください' : '中止した理由を入力してください';
    const reason = (window.prompt(promptMsg, '') || '').trim();
    if (!reason) return;

    try {
      await saveGoal({ id: goal.id, status: newStatus, reasonU: reason });
      await fetchGoals();
    } catch (err: any) {
      window.alert(err?.message || '更新に失敗しました');
    }
  };

  return (
    <div>
      {/* 戻るUI（既存クラスのまま） */}
      <div className="sticky top-2 z-10 mb-4">
        <Link
          to="/"
          aria-label="ホームに戻る"
          className="group inline-flex items-center gap-2 rounded-full border border-gray-300/80 bg-white/80 px-3 py-2 text-blue-700 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-blue-600 transition-transform group-hover:-translate-x-0.5">
            <path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="font-medium">ホームに戻る</span>
        </Link>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">目標一覧</h2>
        <Link to="/goal/new" className="bg-green-600 hover:bg-green-500 text-white text-lg px-4 py-2 rounded">目標を追加</Link>
      </div>

      {loading && <p className="text-lg">読み込み中...</p>}
      {error && <p className="text-red-600 text-lg">{error}</p>}

      <div className="space-y-4">
        {goals.map((g) => (
          <div key={g.id} className="p-4 border rounded-lg bg-white shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xl font-semibold mb-2">{g.content}</p>
                <p className="text-lg mb-1">状態: {renderStatus(g.status)}</p>
                {g.status !== 'active' && g.reasonU && (
                  <p className="text-sm text-gray-600">理由: {g.reasonU}</p>
                )}
              </div>
              <div className="space-y-2 text-right">
                <Link to={`/goal/${g.id}`} className="inline-block bg-blue-600 hover:bg-blue-500 text-white text-lg px-3 py-2 rounded">
                  編集
                </Link>
                {isActive(g.status) && (
                  <>
                    <button onClick={() => handleMarkStatus(g, 1000)} className="block w-full bg-green-600 hover:bg-green-500 text-white text-lg px-3 py-2 rounded">
                      達成
                    </button>
                    <button onClick={() => handleMarkStatus(g, 999)} className="block w-full bg-red-600 hover:bg-red-500 text-white text-lg px-3 py-2 rounded">
                      中止
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
        {goals.length === 0 && !loading && <p className="text-lg">まだ目標がありません。</p>}
      </div>
    </div>
  );
};

export default GoalsPage;
