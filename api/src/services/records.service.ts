// api/src/services/records.service.ts
import type { CS, RecordEntity } from "../models/record.js";
import { repos, ai } from "../config/providers.js";

function ensureCS(n: number): asserts n is CS {
  if (!Number.isInteger(n) || n < 1 || n > 7) {
    const e: any = new Error("validation");
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

  // AI評価を生成
  const eva = await ai.evaluate({
    challengeU: dto.challengeU,
    skillU: dto.skillU,
    reasonU: dto.reasonU,
  });

  // Repo層へ保存（実装差により戻り値の型がブレる可能性があるので後で正規化）
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
  } as any);

  // ここで RecordEntity に正規化して返す（不足フィールドを補完）
  const normalized: RecordEntity = {
    id: (rec as any).id ?? `r-${Date.now()}`,
    userId: (rec as any).userId ?? userId,
    goalId: (rec as any).goalId ?? dto.goalId,
    date: (rec as any).date ?? dto.date,
    challengeU: (rec as any).challengeU ?? dto.challengeU,
    skillU: (rec as any).skillU ?? dto.skillU,
    reasonU: (rec as any).reasonU ?? dto.reasonU,
    aiChallenge: (rec as any).aiChallenge ?? eva.aiChallenge ?? 0,
    aiSkill: (rec as any).aiSkill ?? eva.aiSkill ?? 0,
    aiComment: (rec as any).aiComment ?? eva.aiComment ?? "",
    regoalAI: (rec as any).regoalAI ?? eva.regoalAI,
    createdAt: (rec as any).createdAt ?? new Date().toISOString(),
  };

  return normalized;
}
