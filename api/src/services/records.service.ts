import type { CS, RecordEntity } from '../models/record.js';
import { repos } from '../config/providers.js';
import { ai } from './ai/index.js';

function ensureCS(n: number): asserts n is CS {
  if (!Number.isInteger(n) || n < 1 || n > 7) {
    const e: any = new Error('validation');
    e.status = 400;
    throw e;
  }
}

export async function create(
  userId: string,
  dto: { goalId: string; date: string; challengeU: CS; skillU: CS; reasonU?: string }
): Promise<RecordEntity> {
  ensureCS(dto.challengeU);
  ensureCS(dto.skillU);

  // AI評価を生成して“一体保存”
  const eva = await ai.evaluate({ challengeU: dto.challengeU, skillU: dto.skillU, reasonU: dto.reasonU });
  const rec = await repos.records.create({
    userId,
    goalId: dto.goalId,
    date: dto.date,
    challengeU: dto.challengeU,
    skillU: dto.skillU,
    reasonU: dto.reasonU,
    aiChallenge: eva.aiChallenge,
    aiSkill: eva.aiSkill,
    aiComment: eva.aiComment,
    regoalAI: eva.regoalAI,
    createdAt: new Date().toISOString(),
  });
  return rec;
}
