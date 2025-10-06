import type { ReviewSummary } from '../models/record.js';
import { env } from '../config/env.js';

// 小さく安全に：DB種別ごとに“読み取り”を分岐（正式にはRepoのlist実装へ移行する）
async function loadRows(userId: string, from: string, to: string, goalId?: string) {
  const provider = (process.env.DB_PROVIDER || env.DB_PROVIDER).toLowerCase();

  if (provider === 'postgres' || provider === 'sqlite') {
    try {
      const { prisma } = await import('../repositories/postgres/prisma.client.js');
      if (!prisma) return [];
      return await prisma.record.findMany({
        where: { userId, date: { gte: from, lte: to }, ...(goalId ? { goalId } : {}) },
        orderBy: { date: 'asc' },
      });
    } catch { return []; }
  }

  if (provider === 'firestore') {
    try {
      const { db } = await import('../repositories/firestore/client.js');
      if (!db) return [];
      let q: FirebaseFirestore.Query = db.collection('records')
        .where('userId', '==', userId)
        .where('date', '>=', from)
        .where('date', '<=', to);
      if (goalId) q = q.where('goalId', '==', goalId);
      const snap = await q.get();
      return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
    } catch { return []; }
  }

  // memory 他：取得手段が無ければ空
  return [];
}

export async function summary(
  userId: string,
  q: { from: string; to: string; goalId?: string }
): Promise<ReviewSummary> {
  const rows: any[] = await loadRows(userId, q.from, q.to, q.goalId);
  const n = rows.length;

  if (n === 0) {
    return {
      count: 0,
      avgUser: { challenge: 0, skill: 0 },
      avgAI: { challenge: 0, skill: 0 },
      states: { flow: 0, anxiety: 0, boredom: 0, apathy: 0 },
      notes: 'この期間の記録はありません。',
    };
  }

  // 平均
  const sum = rows.reduce((a, r) => {
    a.cU += Number(r.challengeU || 0);
    a.sU += Number(r.skillU || 0);
    a.cA += Number(r.aiChallenge || 0);
    a.sA += Number(r.aiSkill || 0);
    return a;
  }, { cU: 0, sU: 0, cA: 0, sA: 0 });

  const avgUser = { challenge: +(sum.cU / n).toFixed(2), skill: +(sum.sU / n).toFixed(2) };
  const avgAI   = { challenge: +(sum.cA / n).toFixed(2), skill: +(sum.sA / n).toFixed(2) };

  // 状態判定（簡易版）
  const st = { flow: 0, anxiety: 0, boredom: 0, apathy: 0 };
  for (const r of rows) {
    const c = Number(r.challengeU || 0), s = Number(r.skillU || 0);
    const d = c - s;
    if (Math.abs(d) <= 1 && c >= 3 && s >= 3) st.flow++;
    else if (d >= 2) st.anxiety++;
    else if (d <= -2) st.boredom++;
    else st.apathy++;
  }
  const pct = (x: number) => Math.round((x / n) * 100);
  const states = { flow: pct(st.flow), anxiety: pct(st.anxiety), boredom: pct(st.boredom), apathy: pct(st.apathy) };

  // 簡易ノート
  const biasC = avgUser.challenge - avgAI.challenge;
  const biasS = avgUser.skill - avgAI.skill;
  const mk = (v: number) => (v > 0 ? `+${v.toFixed(1)}` : v.toFixed(1));
  const notes =
    `挑戦度の差分(本人-AI)=${mk(biasC)}, 能力度の差分=${mk(biasS)}。` +
    (states.flow >= 40 ? 'フロー割合が高めです。' : states.anxiety >= 40 ? '不安側に偏っています。' : '');

  return { count: n, avgUser, avgAI, states, notes };
}
