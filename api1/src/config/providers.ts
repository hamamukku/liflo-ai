// api/src/config/providers.ts
// 目的: 既存コード互換 (repos / getRepos / ai / logSink を named export)
// - logSink は append(events) / flush() を提供し、auth.controller.ts の
//   `void logSink.append([ ... ])` を満たす。
// - 余計な依存を増やさず、存在する場合のみリポジトリ/AI実装を動的解決。
// - 見つからない場合でも安全なスタブにフォールバック。

type AnyRecord = Record<string, any>;
type LogEvent = AnyRecord;
type LogSink = { append: (events: LogEvent[] | LogEvent) => Promise<void>; flush: () => Promise<void> };

const ENV = process.env as AnyRecord;

/* -------------------- dynamic import helper -------------------- */
async function tryImport(candidates: string[]) {
  for (const p of candidates) {
    try {
      // eslint-disable-next-line no-await-in-loop
      return await import(p);
    } catch {}
  }
  return null;
}

/* -------------------- Repositories -------------------- */
type ReposShape = { goals: AnyRecord; records: AnyRecord; users: AnyRecord };
let reposMemo: ReposShape | null = null;

async function _resolveRepos(): Promise<ReposShape> {
  const kind = String(ENV.DB_PROVIDER || "").toLowerCase();

  // Firestore 優先（index 統合形 / 個別 repo の両方に対応）
  if (kind === "firestore") {
    const idx = await tryImport([
      "../repositories/firestore/index.js",
      "../repositories/firestore/index.ts",
      "../repositories/firestore/index",
    ]);
    if (idx?.goalsFirestore && idx?.recordsFirestore && idx?.usersFirestore) {
      return { goals: idx.goalsFirestore, records: idx.recordsFirestore, users: idx.usersFirestore };
    }
    const goals = await tryImport([
      "../repositories/firestore/goals.repo.js",
      "../repositories/firestore/goals.repo.ts",
      "../repositories/firestore/goals.repo",
    ]);
    const records = await tryImport([
      "../repositories/firestore/records.repo.js",
      "../repositories/firestore/records.repo.ts",
      "../repositories/firestore/records.repo",
    ]);
    const users = await tryImport([
      "../repositories/firestore/users.repo.js",
      "../repositories/firestore/users.repo.ts",
      "../repositories/firestore/users.repo",
    ]);
    if (goals || records || users) {
      return {
        goals: goals?.goalsFirestore ?? {},
        records: records?.recordsFirestore ?? {},
        users: users?.usersFirestore ?? {},
      };
    }
  }

  // Postgres など（存在すれば）
  if (kind === "postgres") {
    const mod = await tryImport([
      "../repositories/postgres/index.js",
      "../repositories/postgres/index.ts",
      "../repositories/postgres/index",
    ]);
    if (mod) {
      return {
        goals: mod.goalsPostgres ?? {},
        records: mod.recordsPostgres ?? {},
        users: mod.usersPostgres ?? {},
      };
    }
  }

  // Memory fallback（存在しない場合は空スタブ）
  const mem = await tryImport([
    "../repositories/memory/index.js",
    "../repositories/memory/index.ts",
    "../repositories/memory/index",
  ]);
  if (mem) return { goals: mem.goalsMem ?? {}, records: mem.recordsMem ?? {}, users: mem.usersMem ?? {} };

  console.warn("[providers] no repository modules found, using empty stubs");
  return { goals: {}, records: {}, users: {} };
}

export async function getRepos(): Promise<ReposShape> {
  if (reposMemo) return reposMemo;
  reposMemo = await _resolveRepos();
  return reposMemo;
}

/** 遅延解決プロキシ（既存呼び出し互換: repos.records.create(...) 等で使える） */
export const repos: any = new Proxy(
  {},
  {
    get(_t, repoKey: string | symbol) {
      return new Proxy(
        {},
        {
          get(_t2, methodKey: string | symbol) {
            return async (...args: any[]) => {
              const r = await getRepos();
              const repo = (r as any)[repoKey as any];
              const fn = repo?.[methodKey as any];
              if (typeof fn !== "function") {
                throw new Error(`[providers.repos] method not found: ${String(repoKey)}.${String(methodKey)}`);
              }
              return await fn.apply(repo, args);
            };
          },
        }
      );
    },
  }
);

/* ---------------------- AI Provider ---------------------- */
let aiMemo: any | null = null;
async function _resolveAI(): Promise<any> {
  const kind = String(ENV.AI_PROVIDER || "").toLowerCase();
  if (kind === "openai") {
    const mod = await tryImport([
      "../services/ai/openai.provider.js",
      "../services/ai/openai.provider.ts",
      "../services/ai/openai.provider",
    ]);
    if (mod?.OpenAIProvider) {
      return new mod.OpenAIProvider(ENV.OPENAI_API_KEY);
    }
  }
  // Mock fallback（プロジェクトに mock があればそれを使い、無ければ最小実装）
  const mock = await tryImport([
    "../services/ai/mock.provider.js",
    "../services/ai/mock.provider.ts",
    "../services/ai/mock.provider",
  ]);
  if (mock?.MockAIProvider) return new mock.MockAIProvider();
  return {
    async evaluate() { return null; },
    async evaluateRecordWithOpenAI() { return null; },
  };
}

/** 既存コードが期待する形（evaluateRecordWithOpenAI を提供） */
export const ai = {
  async evaluateRecordWithOpenAI(input: {
    goalId: string; date: string; challengeU: number; skillU: number; reasonU?: string;
  }) {
    if (!aiMemo) aiMemo = await _resolveAI();
    const prov = aiMemo;
    if (typeof prov?.evaluateRecordWithOpenAI === "function") {
      return prov.evaluateRecordWithOpenAI(input);
    }
    if (typeof prov?.evaluate === "function") {
      return prov.evaluate(input);
    }
    return null;
  },
};

/* ---------------------- logSink ---------------------- */
/**
 * 既存呼び出し互換:
 *   void logSink.append([{ ts, requestId, userId, endpoint, method, event, status, ... }])
 * flush() は No-Op。依存を増やさず console へ安全出力。
 * 必要なら後で Firestore/Sheets 版に差し替えてもインターフェイスは不変。
 */
export const logSink: LogSink = {
  async append(events: LogEvent[] | LogEvent) {
    const arr = Array.isArray(events) ? events : [events];
    for (const e of arr) {
      try {
        const ts = e?.ts ?? new Date().toISOString();
        const sev =
          e?.severity ||
          (e?.status === "error" ? "ERROR" : e?.status === "warn" ? "WARN" : "INFO");
        const line = JSON.stringify({ ...e, ts, severity: sev });
        if (sev === "ERROR") console.error("[logSink]", line);
        else if (sev === "WARN") console.warn("[logSink]", line);
        else console.log("[logSink]", line);
      } catch {
        // ここで落ちないように丸める
        console.log("[logSink]", "[malformed event]");
      }
    }
  },
  async flush() {
    /* no-op */
  },
};

/* まとめ（既存互換の集約オブジェクトも提供） */
export const providers = { getRepos, repos, ai, logSink };
