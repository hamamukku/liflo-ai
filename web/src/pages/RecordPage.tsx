import React, { useState, useEffect } from "react";
import AppLayout from "../layouts/AppLayout";

type Sender = "ai" | "user";
type Message = { sender: Sender; text: string; suggestSave?: boolean };
type RecordItem = { id: string; text: string; createdAt: string };

export default function RecordPage() {
  const [messages, setMessages] = useState<Message[]>([
    { sender: "ai", text: "こんにちは！今日の記録を始めましょう。" },
  ]);
  const [input, setInput] = useState("");
  const [records, setRecords] = useState<RecordItem[]>([]);

  // ✅ localStorageから保存データ復元（初回のみ）
  useEffect(() => {
    const raw = localStorage.getItem("liflo_records");
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setRecords(parsed);
      } catch (e) {
        console.error("localStorage parse error:", e);
      }
    }
  }, []);

  // ✅ 保存処理（localStorageに即時反映）
  const handleSave = (text: string) => {
    const newRecord: RecordItem = {
      id: Date.now().toString(),
      text,
      createdAt: new Date().toLocaleString(),
    };
    const updated = [...records, newRecord];
    setRecords(updated);
    localStorage.setItem("liflo_records", JSON.stringify(updated)); // ← ここが即保存の鍵

    setMessages((prev) => [
      ...prev,
      {
        sender: "ai",
        text: "✅ 記録を保存しました！「振り返り」で確認できます。",
      },
    ]);
  };

  // チャット送信
  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    setMessages((prev) => [...prev, { sender: "user", text }]);
    setInput("");

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: "なるほど、これは今日の記録として保存しますか？",
          suggestSave: true,
        },
      ]);
    }, 400);
  };

  // スキップ
  const handleSkip = () => {
    setMessages((prev) => [
      ...prev,
      { sender: "ai", text: "了解です。次の話題に進みましょう。" },
    ]);
  };

  return (
    <AppLayout>
      <main className="flex flex-col bg-white rounded-xl shadow h-[75vh] w-full">
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((m, i) => {
            const latestUser = [...messages].slice(0, i).reverse().find((msg) => msg.sender === "user");
            return (
              <div key={i} className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`px-4 py-2 rounded-2xl max-w-md whitespace-pre-wrap ${
                    m.sender === "user"
                      ? "bg-green-500 text-white"
                      : "bg-gray-200 text-gray-800"
                  }`}
                >
                  {m.text}
                  {m.suggestSave && latestUser && (
                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={() => handleSave(latestUser.text)}
                        className="text-sm bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded"
                      >
                        ✔ 保存する
                      </button>
                      <button
                        onClick={handleSkip}
                        className="text-sm text-gray-600 hover:text-gray-800 px-3 py-1 rounded"
                      >
                        ❌ スキップ
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-4 border-t flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="メッセージを入力..."
            className="flex-1 border rounded-full px-4 py-2"
          />
          <button
            onClick={handleSend}
            className="bg-green-600 hover:bg-green-500 text-white rounded-full px-6 py-2"
          >
            送信
          </button>
        </div>
      </main>
    </AppLayout>
  );
}
