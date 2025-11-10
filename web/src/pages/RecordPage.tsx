import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../layouts/AppLayout";
import { recordsApi } from "../lib/api";

type Sender = "ai" | "user";

type Message = {
  sender: Sender;
  text: string;
  suggestSave?: boolean;
};

const initialMessages: Message[] = [
  {
    sender: "ai",
    text: "こんにちは。今日の出来事を振り返るお手伝いをします。",
  },
  {
    sender: "ai",
    text: "思い出に残ったことや感じたことを教えてください。入力が終わったら送信ボタンを押してくださいね。",
  },
];

export default function RecordPage() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();

  const handleSave = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isSaving) return;
    setIsSaving(true);
    try {
      await recordsApi.create({ text: trimmed });
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: "記録を保存しました。振り返りページに移動しますね。",
        },
      ]);
      setTimeout(() => {
        navigate("/review");
      }, 600);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: err instanceof Error ? err.message : "保存に失敗しました。もう一度お試しください。",
        },
      ]);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSkip = () => {
    setMessages((prev) => [
      ...prev,
      {
        sender: "ai",
        text: "わかりました。また記録したくなったら声をかけてくださいね。",
      },
    ]);
  };

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
          text: "素敵な記録です。保存して振り返りに追加しておきますか？",
          suggestSave: true,
        },
      ]);
    }, 350);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    handleSend();
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <header>
          <p className="text-xl font-semibold text-liflo-accent">🌱 今日の記録</p>
          <p className="text-gray-700 mt-1">気持ちや出来事を気軽に残しましょう。短い言葉でもOKです。</p>
          <p className="text-sm text-[#D9534F] mt-1">※ 個人情報やフルネームは避け、ニックネームで入力してください。</p>
        </header>

        <section className="bg-liflo-paper border border-liflo-border rounded-2xl p-4 shadow-card h-[55vh] overflow-y-auto space-y-3">
          {messages.map((message, index) => {
            const isUser = message.sender === "user";
            const latestUser = (() => {
              for (let i = index - 1; i >= 0; i -= 1) {
                if (messages[i].sender === "user") {
                  return messages[i];
                }
              }
              return undefined;
            })();

            return (
              <div
                key={`${message.sender}-${index}-${message.text}`}
                className={`flex ${isUser ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-line ${
                    isUser
                      ? "bg-liflo-accent text-white shadow-card"
                      : "bg-white border border-liflo-border text-gray-800"
                  }`}
                >
                  {message.text}
                  {message.suggestSave && latestUser && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleSave(latestUser.text)}
                        disabled={isSaving}
                        className="text-sm font-medium bg-liflo-accent text-white rounded-full px-4 py-1.5 hover:bg-liflo-accent700 transition-colors disabled:opacity-60"
                      >
                        {isSaving ? "保存中..." : "💾 保存する"}
                      </button>
                      <button
                        type="button"
                        onClick={handleSkip}
                        className="text-sm font-medium border border-liflo-border text-gray-700 rounded-full px-4 py-1.5 hover:bg-liflo-tab transition-colors"
                      >
                        スキップ
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </section>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex items-center gap-3 border border-liflo-border bg-white rounded-full px-5 py-2 shadow-sm">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="今日の出来事を入力..."
              className="flex-1 bg-transparent outline-none text-gray-800 placeholder:text-gray-400"
            />
            <button
              type="submit"
              className="bg-liflo-accent hover:bg-liflo-accent700 text-white rounded-full px-6 py-2 text-sm font-semibold transition-colors"
            >
              送信
            </button>
          </div>
          <p className="text-xs text-gray-500 text-right">Enterキーでも送信できます。</p>
        </form>
      </div>
    </AppLayout>
  );
}
