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
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [recordData, statData] = await Promise.all([reviewApi.list(), reviewApi.stats()]);
        if (active) {
          setRecords(recordData);
          setStats(statData);
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "記録の取得に失敗しました。");
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

  const sortedRecords = useMemo(
    () => [...records].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [records],
  );

  const formatDateTime = (value: string) => {
    try {
      return new Date(value).toLocaleString();
    } catch {
      return value;
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <header>
          <h2 className="text-2xl font-semibold text-liflo-accent">📊 振り返り</h2>
          <p className="text-gray-700 mt-2">
            保存した記録が並びます。振り返りたい内容をカードから見返して、次のアクションに活かしましょう。
          </p>
        </header>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">{error}</p>
        )}

        {stats && (
          <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard label="総記録" value={stats.total} />
            <StatCard label="直近7日" value={stats.last7Days} />
            <StatCard label="直近30日" value={stats.last30Days} />
            <StatCard label="連続日数" value={stats.streak} />
          </section>
        )}

        {loading && <p className="text-gray-600">読み込み中です...</p>}

        {!loading && sortedRecords.length === 0 && (
          <p className="text-gray-600 bg-white border border-liflo-border rounded-xl p-4 text-center">
            まだ保存された記録がありません。記録ページから最初のメモを残してみましょう。
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
                <p className="text-sm text-gray-500 mt-3">記録日時：{formatDateTime(record.createdAt)}</p>
              </article>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white border border-liflo-border rounded-2xl p-4 shadow-sm text-center">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-3xl font-semibold text-liflo-accent mt-1">{value}</p>
    </div>
  );
}
