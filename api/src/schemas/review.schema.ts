import { z } from 'zod';

const ymd = z.string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DDで入力してください');

export const reviewQuerySchema = z.object({
  from: ymd,
  to: ymd,
  goalId: z.string().trim().min(1).optional(),
}).strict().refine(v => v.from <= v.to, {
  path: ['to'],
  message: 'to は from 以降の日付にしてください',
});
