// api/src/config/env.ts
import { z } from "zod";
/**
 * 環境変数スキーマ定義
 */
export const EnvSchema = z.object({
    PORT: z.string().default("8787"),
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    CORS_ORIGIN: z.string().default("*"),
    LOG_LEVEL: z.string().default("info"),
    DB_PROVIDER: z
        .enum(["memory", "firestore", "postgres", "sqlite"])
        .default("memory"),
    AI_PROVIDER: z.enum(["mock", "openai"]).default("mock"),
    // ✅ レートリミット設定
    RATE_LIMIT_WINDOW_MS: z.string().default("60000"),
    RATE_LIMIT_MAX: z.string().default("100"),
    // ✅ Firebase 関連
    FIREBASE_PROJECT_ID: z.string().default("liflo-ai"),
    FIREBASE_CLIENT_EMAIL: z.string().optional(),
    FIREBASE_PRIVATE_KEY: z.string().optional(),
    // ✅ OpenAI & Google Sheets 関連
    OPENAI_API_KEY: z.string().optional(),
    SHEETS_SPREADSHEET_ID: z.string().optional(),
    SHEETS_TAB_PREFIX: z.string().default("logs_"),
    GOOGLE_SERVICE_ACCOUNT_EMAIL: z.string().optional(),
    GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY: z.string().optional(),
    // ✅ SheetsSink設定
    SHEETS_BATCH_SIZE: z.string().default("20"),
    SHEETS_FLUSH_INTERVAL_MS: z.string().default("3000"),
    // ✅ ログ出力
    LOG_SINK: z.enum(["console", "sheets", "none"]).default("console"),
});
/**
 * 検証済み環境変数を取得
 */
export const env = EnvSchema.parse(process.env);
// ✅ 環境補助フラグとCORS設定
export const isProd = env.NODE_ENV === "production";
export const corsOrigins = env.CORS_ORIGIN.split(",").map((s) => s.trim());
