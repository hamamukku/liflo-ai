import { useEffect, useState } from "react";
import AppLayout from "../layouts/AppLayout";
import { flowApi } from "../lib/api";

export default function FlowTheoryPage() {
  const [tips, setTips] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setError(null);
      try {
        const data = await flowApi.tips();
        if (active) {
          setTips(data.tips);
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "ヒントの取得に失敗しました。");
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

  return (
    <AppLayout>
      <div className="space-y-5 text-gray-800 leading-7">
        <h2 className="text-2xl font-semibold text-liflo-accent">💡 フロー理論とは？</h2>
        <p>
          フローとは、心理学者チクセントミハイが提唱した「没入状態」のことです。集中力とワクワクを両立できるゾーンに入り、時間を忘れるほど作業へ没頭している状態を指します。
        </p>

        <div className="bg-white border border-liflo-border rounded-2xl p-4 shadow-sm space-y-3">
          <p className="font-medium text-gray-900">フロー状態を生み出すためのヒント</p>
          {loading && <p className="text-gray-600">ヒントを読み込み中です...</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}
          {!loading && !error && (
            <ul className="list-disc pl-6 space-y-2">
              {tips.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
          )}
        </div>

        <p>
          Liflo は、日々の記録と振り返りを通じて自分に合ったフローのパターンを見つけるお手伝いをします。目標を細かく区切り、達成感を積み重ねましょう。
        </p>
      </div>
    </AppLayout>
  );
}
