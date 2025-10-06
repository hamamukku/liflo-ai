import { z } from 'zod';

const nonEmpty = z.string().trim().min(1, '必須です').max(1000, '長すぎます');

const StatusActive = z.literal('active');
const StatusDone   = z.literal(1000);
const StatusAbort  = z.literal(999);

export const goalIdParamSchema = z.object({
  id: z.string().trim().min(1, 'idが不正です'),
}).strict();

export const goalCreateSchema = z.object({
  content: nonEmpty,
}).strict();

// 通常更新（status未指定 or 'active'）→ reasonUは不可
const updateActive = z.object({
  content: nonEmpty.optional(),
  status: StatusActive.optional(),
  reasonU: z.never().optional(),
}).strict();

// 終了遷移（1000/999）→ reasonU必須
const updateClosed = z.object({
  content: nonEmpty.optional(),
  status: z.union([StatusDone, StatusAbort]),
  reasonU: z.string().trim().min(1, '理由は必須です'),
}).strict();

export const goalUpdateSchema = z.union([updateActive, updateClosed]);
