import { useEffect, useMemo, useState } from "react";
import AppLayout from "../layouts/AppLayout";

type RecordItem = {
  id: string;
  text: string;
  createdAt: string;
};

const STORAGE_KEY = "liflo_records";

export default function ReviewPage() {
  const [records, setRecords] = useState<RecordItem[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setRecords(parsed);
      }
    } catch (error) {
      console.error("Failed to load records:", error);
    }
  }, []);

  const sortedRecords = useMemo(
    () => [...records].sort((a, b) => Number(b.id) - Number(a.id)),
    [records],
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        <header>
          <h2 className="text-2xl font-semibold text-liflo-accent">📊 振り返り</h2>
          <p className="text-gray-700 mt-2">
            ここには保存した記録が並びます。振り返りたい項目をカードから見返して、次のアクションに活かしましょう。
          </p>
        </header>

        {sortedRecords.length === 0 ? (
          <p className="text-gray-600 bg-white border border-liflo-border rounded-xl p-4 text-center">
            まだ保存された記録がありません。記録ページから最初のメモを残してみましょう。
          </p>
        ) : (
          <div className="space-y-4">
            {sortedRecords.map((record) => (
              <article
                key={record.id}
                className="bg-white border border-liflo-border rounded-xl p-4 shadow-sm"
              >
                <p className="text-gray-800 whitespace-pre-line leading-relaxed">{record.text}</p>
                <p className="text-sm text-gray-500 mt-3">記録日時：{record.createdAt}</p>
              </article>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
