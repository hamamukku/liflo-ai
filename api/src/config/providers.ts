// api/src/config/providers.ts
import { env } from "./env.js";
import { MockAIProvider } from "../services/ai/mock.provider.js";
import { OpenAIProvider } from "../services/ai/openai.provider.js";

// 常時使うメモリ実装のみ静的 import（安全フォールバック）
import { goalsMem, recordsMem, usersMem } from "../repositories/memory/index.js";

// ===== Logging Sinks =====
import type { ILogSink } from "../logs/index.js";
import { ConsoleSink } from "../logs/console.sink.js";
import { SheetsSink } from "../logs/sheets.sink.js";
import { LogQueue } from "../logs/queue.js";

/** ---------------------------------------------------------
 *  Repositories Resolver（DBごとに “必要になった時だけ” 読み込む）
 *  --------------------------------------------------------- */
async function resolveRepos() {
  try {
    if (env.DB_PROVIDER === "firestore") {
      const fs = await import("../repositories/firestore/index.js");
      return {
        goals: fs.goalsFirestore,
        records: fs.recordsFirestore,
        users: fs.usersFirestore,
      };
    }
    if (env.DB_PROVIDER === "postgres") {
      const pg = await import("../repositories/postgres/index.js");
      return {
        goals: pg.goalsPostgres,
        records: pg.recordsPostgres,
        users: pg.usersPostgres,
      };
    }
  } catch (e) {
    console.warn("[providers] repo resolve failed, fallback to memory:", e);
  }
  // フォールバック：メモリ
  return { goals: goalsMem, records: recordsMem, users: usersMem };
}

// Node.js 22 + ESM なので TLA が使える
export const repos = await resolveRepos();

/** ---------------------------------------------------------
 *  AI Provider
 *  --------------------------------------------------------- */
export const ai =
  env.AI_PROVIDER === "openai" && env.OPENAI_API_KEY
    ? new OpenAIProvider(env.OPENAI_API_KEY)
    : new MockAIProvider();

/** ---------------------------------------------------------
 *  Sheets 資格情報の両対応（email/privateKey or base64 JSON）
 *  --------------------------------------------------------- */
type GoogleSA = { client_email?: string; private_key?: string };

function resolveSheetsCreds() {
  // シートIDはどちらの名前でも拾う
  const spreadsheetId =
    (env as any).SHEETS_SPREADSHEET_ID ||
    process.env.GOOGLE_SHEET_ID ||
    (env as any).GOOGLE_SHEET_ID;

  let email =
    (env as any).GOOGLE_SERVICE_ACCOUNT_EMAIL ||
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;

  let privateKey =
    (env as any).GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY ||
    process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;

  // base64 JSON から復元（優先度は既存の email/key より下）
  const b64 =
    process.env.GOOGLE_CREDENTIALS_JSON_BASE64 ||
    (env as any).GOOGLE_CREDENTIALS_JSON_BASE64;
  if ((!email || !privateKey) && b64) {
    try {
      const decoded = Buffer.from(b64, "base64").toString("utf8");
      const j = JSON.parse(decoded) as GoogleSA;
      email = email || j.client_email || "";
      privateKey = privateKey || j.private_key || "";
    } catch (e) {
      console.warn("[providers] failed to decode GOOGLE_CREDENTIALS_JSON_BASE64:", e);
    }
  }

  return { spreadsheetId, email, privateKey };
}

/** ---------------------------------------------------------
 *  Log Sink Provider（Console / Sheets / Noop）
 *  --------------------------------------------------------- */
class NoopSink implements ILogSink {
  async append(): Promise<void> {
    /* noop */
  }
}

const { spreadsheetId, email: saEmail, privateKey: saPrivateKey } = resolveSheetsCreds();
const hasSheetsCreds = !!spreadsheetId && !!saEmail && !!saPrivateKey;

const selectedSink = (env as any).LOG_SINK || (hasSheetsCreds ? "sheets" : "console");

let baseSink: ILogSink;
switch (selectedSink) {
  case "sheets":
    baseSink = hasSheetsCreds
      ? new SheetsSink(
          spreadsheetId!,
          (env as any).SHEETS_TAB_PREFIX,
          saEmail!,
          saPrivateKey!
        )
      : new ConsoleSink();
    break;
  case "console":
    baseSink = new ConsoleSink();
    break;
  case "none":
  default:
    baseSink = new NoopSink();
    break;
}

// env は string 想定なので数値に変換
const batchSize = Number((env as any).SHEETS_BATCH_SIZE ?? "20");
const flushIntervalMs = Number((env as any).SHEETS_FLUSH_INTERVAL_MS ?? "3000");

// バッチ＆リトライ付きログキュー
export const logSink: ILogSink = new LogQueue({
  sink: baseSink,
  batchSize,
  flushIntervalMs,
});

/** ---------------------------------------------------------
 *  Export Aggregates
 *  --------------------------------------------------------- */
export const providers = {
  repos,
  ai,
  logSink,
};
