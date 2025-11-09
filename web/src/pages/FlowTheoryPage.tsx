import AppLayout from "../layouts/AppLayout";

export default function FlowTheoryPage() {
  return (
    <AppLayout>
      <div className="space-y-5 text-gray-800 leading-7">
        <h2 className="text-2xl font-semibold text-liflo-accent">💡 フロー理論とは？</h2>
        <p>
          フローとは、心理学者ミハイ・チクセントミハイが提唱した「没入状態」のことです。集中力とワクワクを両立できるゾーンに入り、時間を忘れるほど作業へ没頭している状態を指します。
        </p>
        <div className="bg-white border border-liflo-border rounded-2xl p-4 shadow-sm space-y-3">
          <p className="font-medium text-gray-900">フロー状態を生み出す3つのヒント</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>目標と現在地を明確にし、達成イメージを描く</li>
            <li>課題の難易度と自分のスキルのバランスを調整する</li>
            <li>集中を妨げる要素を減らし、没入できる環境を整える</li>
          </ul>
        </div>
        <p>
          Liflo は、日々の記録や振り返りを通じて自分に合ったフローのパターンを見つけるお手伝いをします。目標を細かく区切り、達成感を積み重ねましょう。
        </p>
      </div>
    </AppLayout>
  );
}
