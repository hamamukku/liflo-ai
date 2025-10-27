// api/src/services/review.service.ts
import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

if (!getApps().length) initializeApp();
const db = getFirestore();

/** 柔軟に Date へ変換 */
function parseDateFlexible(s?: string | string[] | null): Date | null {
  if (!s) return null;
  const v = Array.isArray(s) ? s[0] : s;
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return new Date(v + "T00:00:00Z");
  if (/^\d+$/.test(v)) return new Date(Number(v));
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}
/** YYYY-MM-DD（UTC） */
function toIsoDateOnly(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
    .toISOString()
    .slice(0, 10);
}
/** 1..7 スケール分類（閾値=4） */
function classifyState(challengeU: number, skillU: number) {
  const hiC = challengeU >= 4;
  const hiS = skillU >= 4;
  if (hiC && hiS) return "flow";
  if (hiC && !hiS) return "anxiety";
  if (!hiC && hiS) return "boredom";
  return "apathy";
}

export type ReviewQuery = { from?: string; to?: string; goalId?: string };

function isIndexError(e: unknown): boolean {
  const msg = (e as any)?.message ?? "";
  const code = (e as any)?.code;
  return msg.includes("FAILED_PRECONDITION") || msg.includes("The query requires an index") || code === 9;
}

/** 既存呼び出し互換の集計API */
export async function getReview(userId: string, q: ReviewQuery) {
  // 1) from/to 正規化
  const fromD = parseDateFlexible(q.from ?? null);
  const toD = parseDateFlexible(q.to ?? null);
  if (!fromD || !toD) {
    const err: any = new Error("from/to must be valid dates (YYYY-MM-DD or timestamp)");
    err.status = 400; err.type = "validation";
    throw err;
  }
  let from = toIsoDateOnly(fromD);
  let to = toIsoDateOnly(toD);
  if (from > to) [from, to] = [to, from];

  // 2) 正道クエリ: userId + date(string) 範囲（複合index）
  let items: any[] = [];
  try {
    let query: FirebaseFirestore.Query = db
      .collection("records")
      .where("userId", "==", userId)
      .where("date", ">=", from)
      .where("date", "<=", to)
      .orderBy("date", "asc");
    if (q.goalId) query = query.where("goalId", "==", q.goalId);
    const snap = await query.get();
    items = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
  } catch (e) {
    if (!isIndexError(e)) throw e;
    // 3) index無しフォールバック: date(string) 範囲→メモリで userId/goalId 絞り込み
    const snap = await db
      .collection("records")
      .where("date", ">=", from)
      .where("date", "<=", to)
      .orderBy("date", "asc")
      .get();
    items = snap.docs
      .map((d) => ({ id: d.id, ...(d.data() as any) }))
      .filter((it) => it.userId === userId && (q.goalId ? it.goalId === q.goalId : true));
  }

  // 4) ヒット0件なら型揺れ救済: dateMs(number) 範囲
  if (items.length === 0) {
    const fromMs = new Date(from + "T00:00:00Z").getTime();
    const toMs   = new Date(to   + "T23:59:59Z").getTime();
    const snap2 = await db
      .collection("records")
      .where("dateMs", ">=", fromMs)
      .where("dateMs", "<=", toMs)
      .orderBy("dateMs", "asc")
      .get();
    items = snap2.docs
      .map((d) => ({ id: d.id, ...(d.data() as any) }))
      .filter((it) => it.userId === userId && (q.goalId ? it.goalId === q.goalId : true));
  }

  const count = items.length;
  if (count === 0) {
    return {
      from, to, goalId: q.goalId ?? null, count: 0,
      avgChallenge: 0, avgSkill: 0,
      // 互換キー（UIの鍵ズレ対策）
      avgUser: 0, avgAI: 0,
      states: {
        flow: { count: 0, pct: 0 },
        anxiety: { count: 0, pct: 0 },
        boredom: { count: 0, pct: 0 },
        apathy: { count: 0, pct: 0 },
      },
      flowPct: 0, anxietyPct: 0, boredomPct: 0, apathyPct: 0,
      items: [],
    };
  }

  // 5) 集計
  let sumC = 0, sumS = 0;
  const bins = { flow: 0, anxiety: 0, boredom: 0, apathy: 0 };
  for (const it of items) {
    const c = Number(it.challengeU ?? 0);
    const s = Number(it.skillU ?? 0);
    if (Number.isFinite(c)) sumC += c;
    if (Number.isFinite(s)) sumS += s;
    const st = classifyState(c, s) as keyof typeof bins;
    bins[st] += 1;
  }
  const avgChallenge = +(sumC / count).toFixed(2);
  const avgSkill     = +(sumS / count).toFixed(2);
  const pct = (n: number) => +((n * 100) / count).toFixed(1);
  const states = {
    flow:    { count: bins.flow,    pct: pct(bins.flow) },
    anxiety: { count: bins.anxiety, pct: pct(bins.anxiety) },
    boredom: { count: bins.boredom, pct: pct(bins.boredom) },
    apathy:  { count: bins.apathy,  pct: pct(bins.apathy) },
  };

  // 6) 互換キー同梱（既存UI互換: avgUser/avgAI）
  return {
    from, to, goalId: q.goalId ?? null, count,
    avgChallenge, avgSkill, states,
    flowPct: states.flow.pct, anxietyPct: states.anxiety.pct, boredomPct: states.boredom.pct, apathyPct: states.apathy.pct,
    avgUser: avgChallenge,
    avgAI:   avgSkill,
    items,
  };
}
