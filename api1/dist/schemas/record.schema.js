import { z } from 'zod';
// YYYY-MM-DD 妥当性
const ymd = z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DDで入力してください')
    .refine(s => {
    const [y, m, d] = s.split('-').map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d));
    return dt.getUTCFullYear() === y && dt.getUTCMonth() === (m - 1) && dt.getUTCDate() === d;
}, '存在しない日付です');
// CS=1..7 の整数（文字でも来たら数値化）
const CS = z.coerce.number().int().min(1, '1〜7で入力').max(7, '1〜7で入力');
export const recordCreateSchema = z.object({
    goalId: z.string().trim().min(1, 'goalIdが不正です'),
    date: ymd,
    challengeU: CS,
    skillU: CS,
    reasonU: z.string().trim().min(1).optional(),
}).strict();
