// src/repositories/postgres/mappers.ts
import type { Goal, GoalStatus, RecordEntity, User } from '../index.js';

const toIsoDateTime = (d: Date | string): string =>
  typeof d === 'string' ? d : new Date(d).toISOString();

/** YYYY-MM-DD で返す（RecordEntity 用） */
const toYmd = (d: Date | string): string => {
  if (typeof d === 'string') {
    if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
    const dt = new Date(d);
    if (!isNaN(+dt)) return dt.toISOString().slice(0, 10);
    return d;
  }
  return new Date(d).toISOString().slice(0, 10);
};

export const mapGoal = (g: any): Goal => ({
  id: g.id,
  userId: g.userId,
  content: g.content,
  status: g.status as unknown as GoalStatus,   // Prisma(number) → ドメイン(GoalStatus)
  reasonU: g.reasonU ?? null,
  createdAt: toIsoDateTime(g.createdAt),       // ドメインは string 想定
  updatedAt: toIsoDateTime(g.updatedAt),       // ドメインは string 想定
});

// ⚠ User ドメインに updatedAt が無いエラーが出ていたので “updatedAt は出さない”
// もし User に createdAt も無い定義なら、下の createdAt 行も削ってください。
export const mapUser = (u: any): User => ({
  id: u.id,
  nickname: u.nickname,
  pinHash: u.pinHash,
  createdAt: toIsoDateTime(u.createdAt),       // User に createdAt:string がある前提
});

export const mapRecord = (r: any): RecordEntity => ({
  id: r.id,
  userId: r.userId,
  goalId: r.goalId,
  date: toYmd(r.date),               // ← ドメインは string(YYYY-MM-DD)
  challengeU: r.challengeU,
  skillU: r.skillU,
  reasonU: r.reasonU ?? '',          // string | null → string
  aiChallenge: r.aiChallenge ?? 0,   // number | null → number
  aiSkill:     r.aiSkill ?? 0,       // number | null → number
  aiComment:   r.aiComment ?? '',    // string | null → string
  regoalAI:    r.regoalAI ?? '',     // string | null → string
});
