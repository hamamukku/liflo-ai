import React from 'react';
import { Link } from 'react-router-dom';

const FlowTheoryPage: React.FC = () => {
  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* おしゃれ“戻る”ボタン */}
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

      <h2 className="text-3xl font-bold">フロー理論とは？</h2>
      <p className="text-lg">
        フロー理論は、私たちが何かに没頭し、時間を忘れて取り組んでいるときの心の状態を説明する理論です。挑戦度（難しさ）と能力度（自分の力）のバランスで、次の４つの状態に分類されます。
      </p>
      <table className="w-full table-auto border-collapse text-lg">
        <thead>
          <tr className="bg-gray-200">
            <th className="border px-3 py-2">状態</th>
            <th className="border px-3 py-2">特徴</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border px-3 py-2 font-semibold">フロー</td>
            <td className="border px-3 py-2">挑戦度も能力度も高く、作業に没頭している状態。</td>
          </tr>
          <tr className="bg-gray-50">
            <td className="border px-3 py-2 font-semibold">不安</td>
            <td className="border px-3 py-2">挑戦度が高く能力が追いつかないため、緊張や不安を感じる状態。</td>
          </tr>
          <tr>
            <td className="border px-3 py-2 font-semibold">退屈</td>
            <td className="border px-3 py-2">能力度が高いのに挑戦度が低く、つまらなさを感じる状態。</td>
          </tr>
          <tr className="bg-gray-50">
            <td className="border px-3 py-2 font-semibold">無関心</td>
            <td className="border px-3 py-2">挑戦度も能力度も低く、やる気が起きない状態。</td>
          </tr>
        </tbody>
      </table>
      <p className="text-lg">
        Liflo AI は、あなたの自己評価と AI 独自の評価を組み合わせて、より良いチャレンジ設定を提案します。記録を続けることで、自分に合ったフロー状態を増やしていきましょう。
      </p>
    </div>
  );
};

export default FlowTheoryPage;
