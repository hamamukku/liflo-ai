import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listGoals, createRecord } from '../app/api';

interface Goal {
  id: string;
  content: string;
  status: any;
}

const RecordNewPage: React.FC = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [selectedGoal, setSelectedGoal] = useState('');
  const [challenge, setChallenge] = useState<number | null>(null);
  const [skill, setSkill] = useState<number | null>(null);
  const [reason, setReason] = useState('');
  const [messages, setMessages] = useState<{ sender: 'user' | 'ai'; content: string }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchGoals = async () => {
      try {
        const { items } = await listGoals();
        setGoals(items.filter((g: any) => g.status === 0 || g.status === 'active' || g.status === undefined));
      } catch (err: any) {
        setMessages((prev) => [...prev, { sender: 'ai', content: err.message || '目標の取得に失敗しました' }]);
      }
    };
    fetchGoals();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoal) {
      setMessages((prev) => [...prev, { sender: 'ai', content: '目標を選択してください' }]);
      return;
    }
    if (challenge == null || skill == null) {
      setMessages((prev) => [...prev, { sender: 'ai', content: '挑戦度と能力度を選択してください' }]);
      return;
    }
    const goal = goals.find((g) => g.id === selectedGoal);
    const userSummary = [
      `目標: ${goal?.content || ''}`,
      `挑戦度: ${challenge}`,
      `能力度: ${skill}`,
      reason ? `理由: ${reason}` : '',
    ].filter(Boolean).join('\n');
    setMessages((prev) => [...prev, { sender: 'user', content: userSummary }]);

    try {
      setLoading(true);
      const today = new Date().toISOString().slice(0, 10);
      const data = await createRecord({
        goalId: selectedGoal,
        date: today,
        challengeU: challenge as 1 | 2 | 3 | 4 | 5 | 6 | 7,
        skillU: skill as 1 | 2 | 3 | 4 | 5 | 6 | 7,
        reasonU: reason.trim() || undefined,
      } as any);
      const aiMessages: string[] = [];
      if (data.aiChallenge !== undefined) aiMessages.push(`AI評価 挑戦度: ${data.aiChallenge}`);
      if (data.aiSkill !== undefined) aiMessages.push(`AI評価 能力度: ${data.aiSkill}`);
      if (data.aiComment) aiMessages.push(`AIコメント: ${data.aiComment}`);
      if (data.regoalAI) aiMessages.push(`提案: ${data.regoalAI}`);
      setMessages((prev) => [...prev, { sender: 'ai', content: aiMessages.join('\n') || '記録を保存しました' }]);
      setChallenge(null);
      setSkill(null);
      setReason('');
    } catch (err: any) {
      setMessages((prev) => [...prev, { sender: 'ai', content: err.message || '保存に失敗しました' }]);
    } finally {
      setLoading(false);
    }
  };

  const scaleOptions = [1, 2, 3, 4, 5, 6, 7];

  return (
    <div className="flex h-full">
      <aside className="w-48 bg-gray-100 border-r border-gray-200 p-4 flex-shrink-0">
        <nav className="flex flex-col space-y-3">
          <Link to="/goals" className="block px-3 py-2 rounded-md text-lg text-gray-800 hover:bg-blue-50">目標</Link>
          <Link to="/record" className="block px-3 py-2 rounded-md text-lg bg-blue-600 text-white">記録</Link>
          <Link to="/review" className="block px-3 py-2 rounded-md text-lg text-gray-800 hover:bg-blue-50">振り返り</Link>
          <Link to="/flow-theory" className="block px-3 py-2 rounded-md text-lg text-gray-800 hover:bg-blue-50">フロー理論</Link>
        </nav>
      </aside>
      <div className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <p className="text-gray-500">ここに会話が表示されます。フォームに入力して送信してみましょう。</p>
          )}
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`whitespace-pre-wrap max-w-xs rounded-lg px-4 py-2 text-base ${msg.sender === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}>
                {msg.content}
              </div>
            </div>
          ))}
        </div>
        <form onSubmit={handleSubmit} className="border-t border-gray-200 p-4 space-y-4">
          {goals.length === 0 ? (
            <p className="text-lg">進行中の目標がありません。先に目標を作成してください。</p>
          ) : (
            <>
              <div>
                <label htmlFor="goal" className="block mb-1 text-lg">目標を選択</label>
                <select id="goal" className="w-full p-2 border rounded text-lg" value={selectedGoal} onChange={(e) => setSelectedGoal(e.target.value)}>
                  <option value="">-- 選択してください --</option>
                  {goals.map((goal) => (
                    <option key={goal.id} value={goal.id}>{goal.content}</option>
                  ))}
                </select>
              </div>
              <div>
                <p className="mb-2 text-lg font-semibold">挑戦度（1〜7）</p>
                <div className="grid grid-cols-7 gap-2">
                  {scaleOptions.map((n) => (
                    <label key={n} className="flex flex-col items-center">
                      <input type="radio" name="challenge" value={n} checked={challenge === n} onChange={() => setChallenge(n)} className="sr-only" />
                      <span className={`cursor-pointer w-10 h-10 flex items-center justify-center border rounded-full text-lg ${challenge === n ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}>{n}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 text-lg font-semibold">能力度（1〜7）</p>
                <div className="grid grid-cols-7 gap-2">
                  {scaleOptions.map((n) => (
                    <label key={n} className="flex flex-col items-center">
                      <input type="radio" name="skill" value={n} checked={skill === n} onChange={() => setSkill(n)} className="sr-only" />
                      <span className={`cursor-pointer w-10 h-10 flex items-center justify-center border rounded-full text-lg ${skill === n ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-800'}`}>{n}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label htmlFor="reason" className="block mb-1 text-lg">理由（任意）</label>
                <textarea id="reason" className="w-full p-2 border rounded text-lg" value={reason} onChange={(e) => setReason(e.target.value)} rows={2}></textarea>
              </div>
              <div>
                <button type="submit" className="w-full bg-purple-600 hover:bg-purple-500 text-white text-lg py-2 rounded" disabled={loading}>{loading ? '送信中...' : '送信'}</button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
};
export default RecordNewPage;
