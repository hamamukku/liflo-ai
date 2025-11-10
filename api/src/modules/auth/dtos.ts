import { z } from "zod";

const credentialSchema = z.object({
  nickname: z
    .string({
      required_error: "ニックネームは必須です。",
    })
    .trim()
    .min(1, "ニックネームを入力してください。")
    .max(20, "ニックネームは20文字以内で入力してください。"),
  pin: z
    .string({
      required_error: "PINは必須です。",
    })
    .regex(/^[0-9]{4}$/, "4桁の数字を入力してください。"),
});

export const loginSchema = credentialSchema;
export type LoginInput = z.infer<typeof loginSchema>;

export const signupSchema = credentialSchema;
export type SignupInput = z.infer<typeof signupSchema>;
