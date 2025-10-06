import { env } from "./env.js";
import { MockAIProvider } from "../services/ai/mock.provider.js";
import { OpenAIProvider } from "../services/ai/openai.provider.js";

// ===== Repositories =====
import { goalsMem, recordsMem, usersMem } from "../repositories/memory/index.js";
import { goalsFirestore, recordsFirestore, usersFirestore } from "../repositories/firestore/index.js";
import { goalsPostgres, recordsPostgres, usersPostgres } from "../repositories/postgres/index.js";

// ===== Logging Sinks =====
import type { ILogSink } from "../logs/index.js";
import { ConsoleSink } from "../logs/console.sink.js";
import { SheetsSink } from "../logs/sheets.sink.js";
import { LogQueue } from "../logs/queue.js";

// ----------------------
// Repository Provider
// ----------------------
export const repos =
  env.DB_PROVIDER === "firestore"
    ? { goals: goalsFirestore, records: recordsFirestore, users: usersFirestore }
    : env.DB_PROVIDER === "postgres"
    ? { goals: goalsPostgres, records: recordsPostgres, users: usersPostgres }
    : { goals: goalsMem, records: recordsMem, users: usersMem };

// ----------------------
// AI Provider
// ----------------------
export const ai =
  env.AI_PROVIDER === "openai" && env.OPENAI_API_KEY
    ? new OpenAIProvider(env.OPENAI_API_KEY)
    : new MockAIProvider();

// ----------------------
// Log Sink Provider
// ----------------------
let baseSink: ILogSink;

switch (env.LOG_SINK) {
  case "sheets":
    baseSink = new SheetsSink(
      env.SHEETS_SPREADSHEET_ID!,
      env.SHEETS_TAB_PREFIX,
      env.GOOGLE_SERVICE_ACCOUNT_EMAIL!,
      env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY!
    );
    break;
  case "console":
    baseSink = new ConsoleSink();
    break;
  default:
    baseSink = { append: async () => {} };
    break;
}

// Log sink with queue (batch + retry)
export const logSink = new LogQueue({
  sink: baseSink,
  batchSize: env.SHEETS_BATCH_SIZE,
  flushIntervalMs: env.SHEETS_FLUSH_INTERVAL_MS,
});

// ----------------------
// Export Aggregates
// ----------------------
export const providers = {
  repos,
  ai,
  logSink,
};
