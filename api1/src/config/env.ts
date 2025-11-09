// api/src/config/env.ts
import * as functions from "firebase-functions";

/** process.env と functions.config() の両方から設定を読み取る */
function pick(paths: string[], fallback?: string) {
  // 1) process.env 優先
  for (const p of paths) {
    const v = process.env[p];
    if (v !== undefined && v !== "") return String(v);
  }
  // 2) functions.config()
  try {
    const cfg: any = functions.config?.() ?? {};
    for (const p of paths) {
      const parts = p.split(".");
      let cur: any = cfg;
      for (const part of parts) cur = cur?.[part];
      if (cur !== undefined && cur !== "") return String(cur);
    }
  } catch { /* noop */ }
  return fallback;
}

const toBool = (v?: string, d = false) => (v == null ? d : /^(1|true|yes|on)$/i.test(String(v)));

export const nodeEnv = pick(["NODE_ENV", "app.env"], "production");
export const isProd = nodeEnv === "production";
export const appPort = Number(pick(["APP_PORT", "app.port"], "8787"));
export const logLevel = pick(["LOG_LEVEL", "app.log_level"], "info");

/** CORS origins (CSV) */
const corsCsv = pick(["CORS_ORIGIN", "CORS_ORIGINS", "app.cors_origin"], "") || "";
export const corsOrigins = corsCsv.split(",").map(s => s.trim()).filter(Boolean);

/** 実行モード / プロバイダ */
export const authMode = (pick(["AUTH_MODE", "auth.mode"], "dev") || "dev") as "dev"|"firebase";
export const dbProvider = (pick(["DB_PROVIDER", "db.provider"], "memory") || "memory").toLowerCase();
export const dbUrl = pick(["DATABASE_URL", "db.url"]);
export const aiProvider = (pick(["AI_PROVIDER", "ai.provider"], "mock") || "mock").toLowerCase();

/** セキュリティ/暗号 */
export const jwtSecret = pick(["JWT_SECRET", "jwt.secret"], "change_me_to_a_strong_secret_key");
export const argon2Memory = Number(pick(["ARGON2_MEMORY", "argon2.memory"], "19456"));
export const argon2Iterations = Number(pick(["ARGON2_ITERATIONS", "argon2.iterations"], "2"));
export const argon2Parallelism = Number(pick(["ARGON2_PARALLELISM", "argon2.parallelism"], "1"));

/** Firebase / OpenAI / Sheets (任意) */
export const fbProjectId = pick(["FB_PROJECT_ID", "fb.project_id"]);
export const fbClientEmail = pick(["FB_CLIENT_EMAIL", "fb.client_email"]);
export const fbPrivateKey = pick(["FB_PRIVATE_KEY", "fb.private_key"]);
export const openaiApiKey = pick(["OPENAI_API_KEY", "openai.api_key"]);
export const sheetsAppendEnabled = toBool(pick(["SHEETS_APPEND_ENABLED", "sheets.append_enabled"], "0"));
export const googleSheetId = pick(["GOOGLE_SHEET_ID", "sheets.id"]);
export const googleCredentialsJsonBase64 = pick(["GOOGLE_CREDENTIALS_JSON_BASE64", "sheets.credentials_json_base64"]);

/** 後方互換：`import { env }` でも動く集約オブジェクトを提供 */
export const env: any = {
  NODE_ENV: nodeEnv, isProd, APP_PORT: appPort, LOG_LEVEL: logLevel,
  CORS_ORIGIN: corsOrigins.join(","), corsOrigins,
  AUTH_MODE: authMode, DB_PROVIDER: dbProvider, DATABASE_URL: dbUrl,
  AI_PROVIDER: aiProvider, OPENAI_API_KEY: openaiApiKey,
  FB_PROJECT_ID: fbProjectId, FB_CLIENT_EMAIL: fbClientEmail, FB_PRIVATE_KEY: fbPrivateKey,
  JWT_SECRET: jwtSecret, ARGON2_MEMORY: argon2Memory, ARGON2_ITERATIONS: argon2Iterations, ARGON2_PARALLELISM: argon2Parallelism,
  SHEETS_APPEND_ENABLED: sheetsAppendEnabled ? "1" : "0",
  GOOGLE_SHEET_ID: googleSheetId, GOOGLE_CREDENTIALS_JSON_BASE64: googleCredentialsJsonBase64,
  app: { env: nodeEnv, port: appPort, log_level: logLevel, cors_origin: corsOrigins.join(",") },
  auth: { mode: authMode },
  db: { provider: dbProvider, url: dbUrl },
  ai: { provider: aiProvider },
  openai: { api_key: openaiApiKey },
  fb: { project_id: fbProjectId, client_email: fbClientEmail, private_key: fbPrivateKey },
  jwt: { secret: jwtSecret },
  argon2: { memory: argon2Memory, iterations: argon2Iterations, parallelism: argon2Parallelism },
  sheets: { append_enabled: sheetsAppendEnabled ? "1" : "0", id: googleSheetId, credentials_json_base64: googleCredentialsJsonBase64 },
};

export default env;
