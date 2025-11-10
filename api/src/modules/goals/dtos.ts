import { z } from "zod";
import { GoalStatus } from "./model";

export const createGoalSchema = z.object({
  title: z
    .string({
      required_error: "タイトルは必須です。",
    })
    .trim()
    .min(1, "タイトルを入力してください。")
    .max(120, "タイトルは120文字以内で入力してください。"),
});

export type CreateGoalInput = z.infer<typeof createGoalSchema>;

export const updateGoalStatusSchema = z.object({
  status: z.enum(
    ["active", "done", "cancelled"],
    {
      required_error: "ステータスは必須です。",
      invalid_type_error: "ステータスの値が不正です。",
    },
  ),
});

export type UpdateGoalStatusInput = {
  status: GoalStatus;
};
