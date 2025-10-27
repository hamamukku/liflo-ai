// api/src/services/records.service.ts
import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";

if (!getApps().length) initializeApp();
const db = getFirestore();

type Incoming = {
  goalId?: string; goal_id?: string;
  date?: string; dt?: string;
  challengeU?: number | string; challenge_u?: number | string;
  skillU?: number | string;     skill_u?: number | string;
  reasonU?: string;             reason_u?: string;
};

export type RecordDoc = {
  userId: string;
  goalId: string;
  date: string;       // YYYY-MM-DD
  dateMs: number;     // クエリ用
  challengeU: number; // 1..7
  skillU: number;     // 1..7
  reasonU?: string | null;
  aiChallenge?: number | null;
  aiSkill?: number | null;
  aiComment?: string | null;
  regoalAI?: string | null;
  createdAt: FirebaseFirestore.FieldValue | FirebaseFirestore.Timestamp;
};

function toIsoDateOnly(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
    .toISOString().slice(0, 10);
}
function parseDateFlexible(s?: string | null): Date | null {
  if (!s) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return new Date(`${s}T00:00:00Z`);
  if (/^\d+$/.test(s)) return new Date(Number(s));
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}
function mustIntInRange(v: any, min: number, max: number, name: string): number {
  const n = typeof v === "string" ? Number(v) : v;
  if (!Number.isInteger(n) || n < min || n > max) {
    const err: any = new Error(`${name} must be an integer in [${min},${max}]`);
    err.status = 400; err.type = "validation";
    throw err;
  }
  return n;
}
function pickRecordInput(uid: string, raw: Incoming): RecordDoc {
  const goalId = (raw.goalId ?? raw.goal_id ?? "").toString().trim();
  if (!goalId) { const e: any = new Error("goalId is required"); e.status = 400; e.type = "validation"; throw e; }

  const dateIn = (raw.date ?? raw.dt) ?? undefined;
  const d = parseDateFlexible(typeof dateIn === "string" ? dateIn : undefined) ?? new Date();
  const date = toIsoDateOnly(d);
  const dateMs = new Date(`${date}T00:00:00Z`).getTime();

  const challengeU = mustIntInRange(raw.challengeU ?? raw.challenge_u, 1, 7, "challengeU");
  const skillU     = mustIntInRange(raw.skillU     ?? raw.skill_u,     1, 7, "skillU");
  const reasonU    = (raw.reasonU ?? raw.reason_u ?? "").toString().trim() || null;

  return {
    userId: uid, goalId, date, dateMs,
    challengeU, skillU, reasonU,
    aiChallenge: null, aiSkill: null, aiComment: null, regoalAI: null,
    createdAt: FieldValue.serverTimestamp(),
  };
}

/** 作成：Firestore 保存 → AI 評価（後追い merge） */
export async function createRecord(userId: string, raw: Incoming) {
  const base = pickRecordInput(userId, raw);
  const ref = await db.collection("records").add(base);

  try {
    // providers を遅延 import（循環＆初期化遅延を避ける）
    const prov = await import("../config/providers.js");
    const ai = prov?.ai;

    const meta = { providerName: ai?.constructor?.name ?? "lazy-wrapper", hasEvaluate: !!(ai && typeof ai.evaluateRecordWithOpenAI === "function") };
    // eslint-disable-next-line no-console
    console.info("records.create: calling ai provider", meta);

    const aiRes = meta.hasEvaluate
      ? await ai.evaluateRecordWithOpenAI({
          goalId: base.goalId,
          date: base.date,
          challengeU: base.challengeU,
          skillU: base.skillU,
          reasonU: base.reasonU ?? undefined,
        })
      : null;

    // eslint-disable-next-line no-console
    console.info("records.create: aiRes summary", {
      aiChallenge: aiRes?.aiChallenge ?? null,
      aiSkill: aiRes?.aiSkill ?? null,
      hasComment: !!aiRes?.aiComment,
    });

    if (aiRes) {
      const patch: Partial<RecordDoc> = {
        aiChallenge: aiRes.aiChallenge ?? null,
        aiSkill: aiRes.aiSkill ?? null,
        aiComment: aiRes.aiComment ?? null,
        regoalAI: aiRes.regoalAI ?? null,
        createdAt: Timestamp.now(),
      };
      await ref.set(patch, { merge: true });
      return { id: ref.id, ...base, ...patch };
    }
    return { id: ref.id, ...base, createdAt: Timestamp.now(), aiComment: "openai-fallback: 一時的に簡易評価を返しました。" };
  } catch (e: any) {
    // eslint-disable-next-line no-console
    console.error("records.create: ai call failed", { message: e?.message });
    return { id: ref.id, ...base, createdAt: Timestamp.now(), aiComment: "openai-fallback: 一時的に簡易評価を返しました。" };
  }
}

/** 読み出し（/records?from&to[&goalId]） */
export async function listRecords(
  userId: string, q: { from?: string; to?: string; goalId?: string }
) {
  const fromD = parseDateFlexible(q.from ?? undefined);
  const toD   = parseDateFlexible(q.to   ?? undefined);
  if (!fromD || !toD) {
    const err: any = new Error("from/to must be valid dates (YYYY-MM-DD or timestamp)");
    err.status = 400; err.type = "validation"; throw err;
  }
  const from = toIsoDateOnly(fromD);
  const to   = toIsoDateOnly(toD);

  let query: FirebaseFirestore.Query = db
    .collection("records")
    .where("userId", "==", userId)
    .where("date", ">=", from)
    .where("date", "<=", to);

  if (q.goalId) query = query.where("goalId", "==", q.goalId);

  const snap = await query.orderBy("date", "desc").get();
  const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return { count: items.length, items };
}
