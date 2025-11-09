// src/repositories/postgres/records.repo.ts
import { prisma } from './prisma.client.js';
import { mapRecord } from './mappers.js';
export const recordsPostgres = {
    async create(input) {
        const row = await prisma.record.create({
            data: {
                userId: input.userId,
                goalId: input.goalId,
                // DBフィールドが Date のため Date で保存（ドメインからの受取は文字列）
                date: new Date(input.date),
                challengeU: input.challengeU,
                skillU: input.skillU,
                // Prisma の create 型は non-null 要求 → ここでデフォルト値を補う
                reasonU: input.reasonU ?? '', // DB 側が string 非null のため
                aiChallenge: input.aiChallenge ?? 0,
                aiSkill: input.aiSkill ?? 0,
                aiComment: input.aiComment ?? '',
                regoalAI: input.regoalAI ?? '',
            },
        });
        return mapRecord(row); // 返却はドメイン型（date: string / ai*: number / string）
    },
};
