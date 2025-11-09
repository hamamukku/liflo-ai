// api/src/providers/openai.provider.ts

// logger（無ければ console フォールバック）
let info: (...a: any[]) => void = console.info.bind(console);
let warn: (...a: any[]) => void = console.warn.bind(console);
let error: (...a: any[]) => void = console.error.bind(console);
try {
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  import("firebase-functions/logger").then((m) => {
    info  = (m.info  ?? console.info ).bind(console);
    warn  = (m.warn  ?? console.warn ).bind(console);
    error = (m.error ?? console.error).bind(console);
  });
} catch {}

export type EvalInput = {
  goalId: string;
  date: string;         // YYYY-MM-DD
  challengeU: number;   // 1..7
  skillU: number;       // 1..7
  reasonU?: string;
};

export type EvalResult = {
  aiChallenge?: number;
  aiSkill?: number;
  aiComment?: string;
  regoalAI?: string;
};

function resolveOpenAIKey(override?: string): string | undefined {
  if (override) return override;
  return (
    process.env.OPENAI_API_KEY ??
    process.env.OPENAI_APIKEY ??
    (() => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const f = require("firebase-functions");
        const cfg = f?.config?.() ?? {};
        return cfg?.openai?.api_key ?? undefined;
      } catch { return undefined; }
    })()
  );
}

const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const BASE_URL = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
const TIMEOUT_MS = Number(process.env.OPENAI_TIMEOUT_MS ?? 10000);

function clamp17(n?: unknown): number | undefined {
  if (typeof n !== "number" || !Number.isFinite(n)) return undefined;
  return Math.max(1, Math.min(7, Math.round(n)));
}
function fallback(_input: EvalInput): EvalResult {
  return { aiComment: "openai-fallback: 一時的に簡易評価を返しました。" };
}

export async function evaluateRecordWithOpenAI(input: EvalInput): Promise<EvalResult> {
  const key = resolveOpenAIKey();
  if (!key) {
    warn("openai: no api key (using fallback)");
    return fallback(input);
  }

  info("openai: starting call", { goalId: input.goalId, date: input.date, model: MODEL });

  const controller = new AbortController();
  const to = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const system = [
      "あなたはセルフコーチング用の短文評価アシスタントです。",
      "ユーザー主観(1..7)を尊重しつつ補助的にAI評価(1..7)と短いコメントを返す。",
      "出力は JSON オブジェクトのみ。キー: aiChallenge, aiSkill, aiComment, regoalAI。",
      "aiChallenge/aiSkill は1..7の整数、aiCommentは80字以内、日本語。"
    ].join("");

    const user = [
      `目標ID: ${input.goalId}`,
      `日付: ${input.date}`,
      `主観: challengeU=${input.challengeU}, skillU=${input.skillU}`,
      input.reasonU ? `理由: ${input.reasonU}` : "",
    ].filter(Boolean).join("\n");

    const resp = await fetch(`${BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user }
        ],
        temperature: 0.2,
        max_tokens: 220,
        response_format: { type: "json_object" },
      }),
      signal: controller.signal,
    });

    clearTimeout(to);

    if (!resp.ok) {
      const t = await resp.text();
      warn("openai-error", { status: resp.status, bodyPreview: t.slice(0, 300) });
      return fallback(input);
    }

    const json = await resp.json() as any;
    info("openai: response ok", { choices: String(json?.choices?.length ?? 0) });

    const content: string =
      json?.choices?.[0]?.message?.content ??
      json?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments ??
      "{}";

    let parsed: any = {};
    try {
      parsed = JSON.parse(content);
    } catch {
      const mC = content.match(/aiChallenge"?\D+(\d)/i)?.[1];
      const mS = content.match(/aiSkill"?\D+(\d)/i)?.[1];
      parsed = {
        aiChallenge: mC ? Number(mC) : undefined,
        aiSkill: mS ? Number(mS) : undefined,
        aiComment: content.slice(0, 120)
      };
    }

    const out: EvalResult = {
      aiChallenge: clamp17(parsed.aiChallenge),
      aiSkill: clamp17(parsed.aiSkill),
      aiComment: (parsed.aiComment ?? "").toString().slice(0, 120) || undefined,
      regoalAI: (parsed.regoalAI ?? "").toString().slice(0, 120) || undefined,
    };

    info("openai:ok", { hasComment: !!out.aiComment });
    return out;
  } catch (e: any) {
    warn("openai-call-failed", { message: e?.message });
    return fallback(input);
  }
}

/** class 互換（必要なら） */
export class OpenAIProvider {
  private key?: string;
  constructor(apiKey?: string) { this.key = apiKey; }
  async evaluateRecordWithOpenAI(input: EvalInput): Promise<EvalResult> {
    const kOrig = process.env.OPENAI_API_KEY;
    try {
      if (this.key) process.env.OPENAI_API_KEY = this.key;
      return await evaluateRecordWithOpenAI(input);
    } finally {
      if (this.key) process.env.OPENAI_API_KEY = kOrig;
    }
  }
}

export default { evaluateRecordWithOpenAI };
