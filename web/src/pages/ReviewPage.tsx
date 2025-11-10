import { useEffect, useMemo, useState } from "react";
import AppLayout from "../layouts/AppLayout";
import { RecordEntry, ReviewStats, reviewApi } from "../lib/api";

export default function ReviewPage() {
  const [records, setRecords] = useState<RecordEntry[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [feed, statData] = await Promise.all([reviewApi.list(), reviewApi.stats()]);
        if (!active) return;
        setRecords(Array.isArray(feed?.items) ? feed.items : []);
        setStats(statData ?? null);
      } catch (err) {
        if (!active) return;
        const message = err instanceof Error ? err.message : "Failed to load review data";
        setError(message);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, []);

  const sortedRecords = useMemo(() => {
    if (!Array.isArray(records)) return [];
    return [...records].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [records]);

  const formatDateTime = (value: string) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
  };

  const statCards = [
    {
      label: "記録の合計",
      value: stats?.totalEntries ?? 0,
      helper: stats?.lastRecordedAt ? `最終更新: ${formatDateTime(stats.lastRecordedAt)}` : undefined,
    },
    { label: "直近7日", value: stats?.last7Days ?? 0 },
    { label: "直近30日", value: stats?.last30Days ?? 0 },
    { label: "連続記録日数", value: stats?.currentStreakDays ?? 0 },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <header>
          <h2 className="text-2xl font-semibold text-liflo-accent">振り返り</h2>
          <p className="text-gray-700 mt-2">保存した記録を確認し、次の行動を考えましょう。</p>
        </header>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">{error}</p>
        )}

        <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {statCards.map((stat) => (
            <StatCard key={stat.label} label={stat.label} value={stat.value} helper={stat.helper} />
          ))}
        </section>

        {loading && <p className="text-gray-600">読み込み中です…</p>}

        {!loading && sortedRecords.length === 0 && (
          <p className="text-gray-600 bg-white border border-liflo-border rounded-xl p-4 text-center">
            まだ記録がありません。「記録」ページから最初のメモを追加してください。
          </p>
        )}

        {!loading && sortedRecords.length > 0 && (
          <div className="space-y-4">
            {sortedRecords.map((record) => (
              <article
                key={record.id}
                className="bg-white border border-liflo-border rounded-xl p-4 shadow-sm"
              >
                <p className="text-gray-800 whitespace-pre-line leading-relaxed">{record.text}</p>
                <p className="text-sm text-gray-500 mt-3">Logged at: {formatDateTime(record.createdAt)}</p>
              </article>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function StatCard({ label, value, helper }: { label: string; value: number; helper?: string }) {
  return (
    <div className="bg-white border border-liflo-border rounded-2xl p-4 shadow-sm text-center">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-3xl font-semibold text-liflo-accent mt-1">{value}</p>
      {helper && <p className="text-xs text-gray-400 mt-1">{helper}</p>}
    </div>
  );
}
