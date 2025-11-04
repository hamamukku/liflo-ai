import React, { useEffect, useState } from "react";
import AppLayout from "../layouts/AppLayout";

type RecordItem = {
  id: string;
  text: string;
  createdAt: string;
};

export default function ReviewPage() {
  const [records, setRecords] = useState<RecordItem[]>([]);

  // ✅ ページ表示時に localStorage から取得
  useEffect(() => {
    try {
      const raw = localStorage.getItem("liflo_records");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setRecords(parsed);
        } else {
          console.warn("記録データが不正です", parsed);
        }
      }
    } catch (e) {
      console.error("localStorage 読み込み失敗:", e);
    }
  }, []);

  return (
    <AppLayout>
      <div className="bg-white p-6 rounded-xl shadow w-full">
        <h2 className="text-xl font-bold mb-4">📊 振り返り</h2>

        {records.length === 0 ? (
          <p className="text-gray-600">まだ保存された記録がありません。</p>
        ) : (
          <ul className="space-y-2">
            {records.map((r) => (
              <li key={r.id} className="border p-4 rounded-md">
                <p className="text-gray-800">{r.text}</p>
                <p className="text-sm text-gray-500 mt-1">保存日時：{r.createdAt}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppLayout>
  );
}
