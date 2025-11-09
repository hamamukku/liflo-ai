// api/src/config/providers.ts
import { env } from "./env.js";
import { MockAIProvider } from "../services/ai/mock.provider.js";
import { OpenAIProvider } from "../services/ai/openai.provider.js";
// ===== Repositories =====
import { goalsMem, recordsMem, usersMem } from "../repositories/memory/index.js";
import { goalsFirestore as _goalsFs, recordsFirestore as _recordsFs, usersFirestore as _usersFs, } from "../repositories/firestore/index.js";
import { goalsPostgres as _goalsPg, recordsPostgres as _recordsPg, usersPostgres as _usersPg, } from "../repositories/postgres/index.js";
import { ConsoleSink } from "../logs/console.sink.js";
import { SheetsSink } from "../logs/sheets.sink.js";
import { LogQueue } from "../logs/queue.js";
// ----------------------
// Repository Provider
// ----------------------
// Firestore / Postgres が未実装でも動くように安全にフォールバック
const goalsFs = _goalsFs ?? goalsMem;
const recordsFs = _recordsFs ?? recordsMem;
const usersFs = _usersFs ?? usersMem;
const goalsPg = _goalsPg ?? goalsMem;
const recordsPg = _recordsPg ?? recordsMem;
const usersPg = _usersPg ?? usersMem;
export const repos = env.DB_PROVIDER === "firestore"
    ? { goals: goalsFs, records: recordsFs, users: usersFs }
    : env.DB_PROVIDER === "postgres"
        ? { goals: goalsPg, records: recordsPg, users: usersPg }
        : { goals: goalsMem, records: recordsMem, users: usersMem };
// ----------------------
// AI Provider
// ----------------------
export const ai = env.AI_PROVIDER === "openai" && env.OPENAI_API_KEY
    ? new OpenAIProvider(env.OPENAI_API_KEY)
    : new MockAIProvider();
// ----------------------
// Log Sink Provider
// ----------------------
class NoopSink {
    async append() {
        /* noop */
    }
}
let baseSink;
const hasSheetsCreds = !!env.SHEETS_SPREADSHEET_ID &&
    !!env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
    !!env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
switch (env.LOG_SINK) {
    case "sheets":
        baseSink = hasSheetsCreds
            ? new SheetsSink(env.SHEETS_SPREADSHEET_ID, env.SHEETS_TAB_PREFIX, env.GOOGLE_SERVICE_ACCOUNT_EMAIL, env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY)
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
// ✅ env は string 型なので数値に変換して渡す
const batchSize = Number(env.SHEETS_BATCH_SIZE ?? "20");
const flushIntervalMs = Number(env.SHEETS_FLUSH_INTERVAL_MS ?? "3000");
// Log sink with queue (batch + retry)
export const logSink = new LogQueue({
    sink: baseSink,
    batchSize,
    flushIntervalMs,
});
// ----------------------
// Export Aggregates
// ----------------------
export const providers = {
    repos,
    ai,
    logSink,
};
