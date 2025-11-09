import { repos, ai } from "../config/providers.js";
function ensureCS(n) {
    if (!Number.isInteger(n) || n < 1 || n > 7) {
        const e = new Error("validation");
        e.status = 400;
        throw e;
    }
}
export async function create(userId, dto) {
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
    });
    // ここで RecordEntity に正規化して返す（不足フィールドを補完）
    const normalized = {
        id: rec.id ?? `r-${Date.now()}`,
        userId: rec.userId ?? userId,
        goalId: rec.goalId ?? dto.goalId,
        date: rec.date ?? dto.date,
        challengeU: rec.challengeU ?? dto.challengeU,
        skillU: rec.skillU ?? dto.skillU,
        reasonU: rec.reasonU ?? dto.reasonU,
        aiChallenge: rec.aiChallenge ?? eva.aiChallenge ?? 0,
        aiSkill: rec.aiSkill ?? eva.aiSkill ?? 0,
        aiComment: rec.aiComment ?? eva.aiComment ?? "",
        regoalAI: rec.regoalAI ?? eva.regoalAI,
        createdAt: rec.createdAt ?? new Date().toISOString(),
    };
    return normalized;
}
