import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { getReview } from '../app/api';

interface ReviewResult {
  averageChallenge: number;
  averageSkill: number;
  counts: {
    flow: number;
    anxiety: number;
    boredom: number;
    apathy: number;
  };
}

/** ローカルタイムの YYYY-MM-DD を返す（UTCズレ回避） */
const toLocalYmd = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
};

/** 4象限分類（challenge/skill の閾値=4） */
const classify = (c: number, s: number): keyof ReviewResult['counts'] => {
  const hiC = Number(c) >= 4;
  const hiS = Number(s) >= 4;
  if (hiC && hiS) return 'flow';
  if (hiC && !hiS) return 'anxiety';
  if (!hiC && hiS) return 'boredom';
  return 'apathy';
};

/** サーバ/旧UIあらゆる形を安全に吸収して UI 用に正規化 */
function normalize(raw: any): ReviewResult {
  // --- 平均 ---
  let averageChallenge = 0;
  let averageSkill = 0;

  if (typeof raw?.averageChallenge === 'number' && typeof raw?.averageSkill === 'number') {
    // 旧UI（average*）互換
    averageChallenge = raw.averageChallenge;
    averageSkill = raw.averageSkill;
  } else if (typeof raw?.avgChallenge === 'number' && typeof raw?.avgSkill === 'number') {
    // サーバ現行（推奨）
    averageChallenge = raw.avgChallenge;
    averageSkill = raw.avgSkill;
  } else if (typeof raw?.avgUser === 'number' && typeof raw?.avgAI === 'number') {
    // サーバ互換キー（数値）
    averageChallenge = raw.avgUser;
    averageSkill = raw.avgAI;
  } else if (raw?.avgUser && typeof raw.avgUser?.challenge === 'number' && typeof raw.avgUser?.skill === 'number') {
    // 旧UI（オブジェクト形）
    averageChallenge = raw.avgUser.challenge;
    averageSkill = raw.avgUser.skill;
  }

  // --- counts ---
  let counts: ReviewResult['counts'] = { flow: 0, anxiety: 0, boredom: 0, apathy: 0 };

  if (raw?.counts && ['flow', 'anxiety', 'boredom', 'apathy'].every(k => typeof raw.counts[k] === 'number')) {
    // 旧UI: counts が直接ある
    counts = {
      flow: Number(raw.counts.flow || 0),
      anxiety: Number(raw.counts.anxiety || 0),
      boredom: Number(raw.counts.boredom || 0),
      apathy: Number(raw.counts.apathy || 0),
    };
  } else if (raw?.states) {
    // 現行サーバ: states.{..}.count or pct
    const fromStatesCount = (k: 'flow'|'anxiety'|'boredom'|'apathy') =>
      Number(raw?.states?.[k]?.count ?? 0);

    const hasCounts =
      ['flow','anxiety','boredom','apathy'].some(k => Number(raw?.states?.[k]?.count ?? 0) > 0);

    if (hasCounts) {
      counts = {
        flow: fromStatesCount('flow'),
        anxiety: fromStatesCount('anxiety'),
        boredom: fromStatesCount('boredom'),
        apathy: fromStatesCount('apathy'),
      };
    } else if (typeof raw?.count === 'number') {
      // pct × total から概算（端数は四捨五入）
      const pctOf = (k: 'flow'|'anxiety'|'boredom'|'apathy', topKey: string) =>
        Number(raw?.[topKey] ?? raw?.states?.[k]?.pct ?? 0);

      const total = Math.max(0, Number(raw.count));
      counts = {
        flow: Math.round(total * pctOf('flow', 'flowPct') / 100),
        anxiety: Math.round(total * pctOf('anxiety', 'anxietyPct') / 100),
        boredom: Math.round(total * pctOf('boredom', 'boredomPct') / 100),
        apathy: Math.round(total * pctOf('apathy', 'apathyPct') / 100),
      };
    }
  }

  // どれも無ければ items を再分類して counts を作る（最後の砦）
  if (!counts.flow && !counts.anxiety && !counts.boredom && !counts.apathy && Array.isArray(raw?.items)) {
    const bins: ReviewResult['counts'] = { flow: 0, anxiety: 0, boredom: 0, apathy: 0 };
    for (const it of raw.items) {
      const key = classify(Number(it?.challengeU ?? 0), Number(it?.skillU ?? 0));
      bins[key] += 1;
    }
    counts = bins;
  }

  return { averageChallenge, averageSkill, counts };
}

const ReviewPage: React.FC = () => {
  const today = toLocalYmd(new Date());
  const lastWeek = toLocalYmd(new Date(Date.now() - 6 * 24 * 60 * 60 * 1000));

  const [start, setStart] = useState(lastWeek);
  const [end, setEnd] = useState(today);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<ReviewResult | null>(null);

  const handleFetch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!start || !end) {
      setError('開始日と終了日を選択してください');
      return;
    }
    setError('');
    setResult(null);
    setLoading(true);
    try {
      const raw = await getReview({ from: start, to: end });
      setResult(normalize(raw));
    } catch (err: any) {
      setError(err?.message || 'データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const totalCount =
    result ? (result.counts.flow + result.counts.anxiety + result.counts.boredom + result.counts.apathy) : 0;

  const ratio = (count: number) => (totalCount === 0 ? 0 : Math.round((count / totalCount) * 100));

  return (
    <div className="max-w-xl mx-auto">
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
