import { z } from "zod";

export const createRecordSchema = z.object({
  text: z
    .string({
      required_error: "記録内容は必須です。",
    })
    .trim()
    .min(1, "1文字以上で入力してください。")
    .max(2000, "2000文字以内で入力してください。"),
});

export type CreateRecordInput = z.infer<typeof createRecordSchema>;
