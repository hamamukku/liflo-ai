import React, { useState } from 'react';
import { Link } from 'react-router-dom';
// 修正：getReview の呼び出しを {from,to} に変更（api.ts に合わせる）
import { getReview } from '../app/api';

interface ReviewResult {
  averageChallenge: number;
  averageSkill: number;
  counts: {
    anxiety: number;
    boredom: number;
    apathy: number;
    flow: number;
  };
}

const toYmd = (d: Date) => d.toISOString().slice(0, 10);

const ReviewPage: React.FC = () => {
  const today = toYmd(new Date());
  const lastWeek = toYmd(new Date(Date.now() - 6 * 24 * 60 * 60 * 1000));
  const [start, setStart] = useState(lastWeek);
  const [end, setEnd] = useState(today);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<ReviewResult | null>(null);

  // 受け取り形の揺れ（avgUser/avgAI or averageChallenge/averageSkill, counts 有無）を吸収
  function normalize(raw: any): ReviewResult {
    if (raw && typeof raw.averageChallenge === 'number' && typeof raw.averageSkill === 'number') {
      return {
        averageChallenge: raw.averageChallenge,
        averageSkill: raw.averageSkill,
        counts: raw.counts ?? { flow: 0, anxiety: 0, boredom: 0, apathy: 0 },
      };
    }
    const averageChallenge = raw?.avgUser?.challenge ?? 0;
    const averageSkill = raw?.avgUser?.skill ?? 0;
    const counts = raw?.counts ?? { flow: 0, anxiety: 0, boredom: 0, apathy: 0 };
    return { averageChallenge, averageSkill, counts };
  }

  const handleFetch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!start || !end) {
      setError('開始日と終了日を選択してください');
      return;
    }
    setError(''); setResult(null);
    try {
      setLoading(true);
      // 変更点：クエリ名を from/to で呼び出す（api.ts仕様）
      const raw = await getReview({ from: start, to: end });
      setResult(normalize(raw));
    } catch (err: any) {
      setError(err.message || 'データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const totalCount = result ? (result.counts.anxiety + result.counts.boredom + result.counts.apathy + result.counts.flow) : 0;
  const ratio = (count: number) => (totalCount === 0 ? 0 : Math.round((count / totalCount) * 100));

  return (
    <div className="max-w-xl mx-auto">
      {/* おしゃれ“戻る”ボタン（デザインは変更なし） */}
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

      <h2 className="text-2xl font-bold mb-4">振り返り</h2>

      <form onSubmit={handleFetch} className="space-y-4 mb-6">
        <div className="flex flex-col md:flex-row md:space-x-4 space-y-4 md:space-y-0">
          <div className="flex-1">
            <label htmlFor="start" className="block mb-1 text-lg">開始日</label>
            <input id="start" type="date" className="w-full p-3 border rounded text-lg" value={start} max={end} onChange={(e) => setStart(e.target.value)} />
          </div>
          <div className="flex-1">
            <label htmlFor="end" className="block mb-1 text-lg">終了日</label>
            <input id="end" type="date" className="w-full p-3 border rounded text-lg" value={end} min={start} max={today} onChange={(e) => setEnd(e.target.value)} />
          </div>
        </div>
        {error && <p className="text-red-600 text-lg">{error}</p>}
        <button type="submit" className="w-full bg-orange-600 hover:bg-orange-500 text-white text-lg py-3 rounded" disabled={loading}>
          {loading ? '取得中...' : '表示'}
        </button>
      </form>

      {result && (
        <div className="p-4 border rounded bg-gray-50 space-y-2">
          <p className="text-lg">平均挑戦度: {result.averageChallenge.toFixed(2)}</p>
          <p className="text-lg">平均能力度: {result.averageSkill.toFixed(2)}</p>
          <h3 className="text-xl font-bold mt-2">状態の割合</h3>
          <ul className="space-y-1 text-lg">
            <li>フロー: {ratio(result.counts.flow)}%</li>
            <li>不安: {ratio(result.counts.anxiety)}%</li>
            <li>退屈: {ratio(result.counts.boredom)}%</li>
            <li>無関心: {ratio(result.counts.apathy)}%</li>
          </ul>
        </div>
      )}

      {!result && !loading && (
        <p className="text-lg text-gray-600">期間を選択して「表示」を押すと、記録の要約が表示されます。</p>
      )}
    </div>
  );
};

export default ReviewPage;
