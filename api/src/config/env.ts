// api/src/config/env.ts
import { z } from "zod";

/**
 * Firebase Functions 環境では .env に PORT / FIREBASE_* は置けないため、
 * 旧名が来ても問題ないようにプレ正規化してからパースする。
 */
const raw = { ...process.env };

// 互換: 旧名→新名へ寄せる（.env には *書かない* こと）
if (!raw.APP_PORT && raw.PORT) raw.APP_PORT = raw.PORT;
if (!raw.FB_PROJECT_ID && raw.FIREBASE_PROJECT_ID) raw.FB_PROJECT_ID = raw.FIREBASE_PROJECT_ID;
if (!raw.FB_CLIENT_EMAIL && raw.FIREBASE_CLIENT_EMAIL) raw.FB_CLIENT_EMAIL = raw.FIREBASE_CLIENT_EMAIL;
if (!raw.FB_PRIVATE_KEY && raw.FIREBASE_PRIVATE_KEY) raw.FB_PRIVATE_KEY = raw.FIREBASE_PRIVATE_KEY;

/**
 * 環境変数スキーマ（予約語を避けたキー名）
 */
export const EnvSchema = z.object({
  // server
  APP_PORT: z.string().default("8787"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  CORS_ORIGIN: z.string().default("*"),
  LOG_LEVEL: z.string().default("info"),

  // providers
  DB_PROVIDER: z.enum(["memory", "firestore", "postgres", "sqlite"]).default("memory"),
  AI_PROVIDER: z.enum(["mock", "openai"]).default("mock"),

  // rate limit
  RATE_LIMIT_WINDOW_MS: z.string().default("60000"),
  RATE_LIMIT_MAX: z.string().default("100"),

  // firebase-admin（予約語 FIREBASE_* は使わない）
  FB_PROJECT_ID: z.string().default("liflo-ai"),
  FB_CLIENT_EMAIL: z.string().optional(),
  FB_PRIVATE_KEY: z.string().optional(),

  // --- ここに追加 ---
  // auth mode: dev | firebase | jwt（任意。存在しなくても動く）
  AUTH_MODE: z.enum(["dev", "firebase", "jwt"]).optional(),
  // JWT 用シークレット（jwt モードを使う場合）
  JWT_SECRET: z.string().optional(),
  // --- 追加ここまで ---

  // AI / Google Sheets
  OPENAI_API_KEY: z.string().optional(),
  SHEETS_SPREADSHEET_ID: z.string().optional(), // ← 従来名
  SHEETS_TAB_PREFIX: z.string().default("logs_"),
  GOOGLE_SERVICE_ACCOUNT_EMAIL: z.string().optional(),
  GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY: z.string().optional(),
  GOOGLE_CREDENTIALS_JSON_BASE64: z.string().optional(), // base64 JSON 併用可

  // SheetsSink
  SHEETS_BATCH_SIZE: z.string().default("20"),
  SHEETS_FLUSH_INTERVAL_MS: z.string().default("3000"),

  // logging
  LOG_SINK: z.enum(["console", "sheets", "none"]).default("console"),
});

export type Env = z.infer<typeof EnvSchema>;

// 検証済み env
const parsed = EnvSchema.parse(raw);

/**
 * 互換エイリアス（コード側はそのまま env.PORT / env.FIREBASE_* を参照しても動く）
 * ただし .env には書かないこと（Functions で拒否されるため）。
 */
export const env = {
  ...parsed,
  PORT: parsed.APP_PORT, // 旧来参照の互換
  FIREBASE_PROJECT_ID: parsed.FB_PROJECT_ID,
  FIREBASE_CLIENT_EMAIL: parsed.FB_CLIENT_EMAIL,
  FIREBASE_PRIVATE_KEY: parsed.FB_PRIVATE_KEY,

  // ★ 新規追加エイリアス（型チェック用）
  AUTH_MODE: parsed.AUTH_MODE,
  JWT_SECRET: parsed.JWT_SECRET,
} as Env & {
  PORT: string;
  FIREBASE_PROJECT_ID?: string;
  FIREBASE_CLIENT_EMAIL?: string;
  FIREBASE_PRIVATE_KEY?: string;
  AUTH_MODE?: "dev" | "firebase" | "jwt";
  JWT_SECRET?: string;
};

// ヘルパ
export const isProd = env.NODE_ENV === "production";
export const corsOrigins = env.CORS_ORIGIN.split(",").map((s: string) => s.trim());
