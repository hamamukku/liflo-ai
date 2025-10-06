import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

// ===== 型付き環境変数スキーマ =====
const EnvSchema = z.object({
  PORT: z.string().default("8787"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  LOG_LEVEL: z.string().default("info"),

  // Provider switches
  DB_PROVIDER: z.enum(["memory", "firestore", "postgres", "sqlite"]).default("memory"),
  AI_PROVIDER: z.enum(["mock", "openai"]).default("mock"),
  LOG_SINK: z.enum(["none", "console", "sheets"]).default("console"),

  // Database
  DATABASE_URL: z.string().optional(),

  // Firebase / Firestore
  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().optional(),
  FIREBASE_PRIVATE_KEY: z
    .string()
    .optional()
    .transform((val) => (val ? val.replace(/\\n/g, "\n") : undefined)),

  // Auth / Crypto
  JWT_SECRET: z.string().optional(),
  ARGON2_MEMORY: z.coerce.number().default(19456),
  ARGON2_ITERATIONS: z.coerce.number().default(2),
  ARGON2_PARALLELISM: z.coerce.number().default(1),

  // AI
  OPENAI_API_KEY: z.string().optional(),

  // Google Sheets Logging
  SHEETS_SPREADSHEET_ID: z.string().optional(),
  SHEETS_TAB_PREFIX: z.string().default("logs_"),
  GOOGLE_SERVICE_ACCOUNT_EMAIL: z.string().optional(),
  GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY: z
    .string()
    .optional()
    .transform((v) => (v ? v.replace(/\\n/g, "\n") : undefined)),

  SHEETS_BATCH_SIZE: z.coerce.number().default(20),
  SHEETS_FLUSH_INTERVAL_MS: z.coerce.number().default(3000),
});

export const env = EnvSchema.parse(process.env);

export type Env = z.infer<typeof EnvSchema>;

export const isDev = env.NODE_ENV === "development";
