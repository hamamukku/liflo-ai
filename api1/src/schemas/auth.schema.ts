import { z } from 'zod';

const safeStr = z.string().trim().min(1, '必須です').max(128, '長すぎます');

export const authLoginSchema = z.object({
  nickname: safeStr,
  pin: safeStr,
}).strict();

export const authRegisterSchema = z.object({
  nickname: safeStr,
  pin: safeStr,
}).strict();
