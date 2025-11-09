import { z } from "zod";
const nonEmpty = z.string().trim().min(1, "必須です").max(1000, "長すぎます");
const StatusActive = z.literal("active");
const StatusDone = z.literal(1000);
const StatusAbort = z.literal(999);
/** /goals/:id 用 */
export const goalIdParamSchema = z.object({
    id: z.string().trim().min(1, "idが不正です"),
}).strict();
/**
 * Create:
 *  - 必須: content
 *  - 任意: status（"active" のみ受容）
 *  - 未知キーは strip() で破棄 → {content, status: "active"} でも 400 にならない
 *  - ※ reasonU は定義に載せない（送られても strip で落ちる）
 */
export const goalCreateSchema = z.object({
    content: nonEmpty,
    status: StatusActive.optional(), // 送られてくるなら "active" のみ許可
}).strip();
/**
 * 通常更新（status 未指定 or "active"）
 *  - reasonU は許可しない（送られてきたら 400）
 *  - 未知キーは strip() で落とす
 */
const updateActive = z.object({
    content: nonEmpty.optional(),
    status: StatusActive.optional(),
    reasonU: z.never().optional(),
}).strip();
/**
 * 終了遷移（1000 / 999）
 *  - reasonU 必須
 *  - 未知キーは strip() で落とす
 */
const updateClosed = z.object({
    content: nonEmpty.optional(),
    status: z.union([StatusDone, StatusAbort]),
    reasonU: z.string().trim().min(1, "理由は必須です"),
}).strip();
/** Update は上記2パターンのユニオン */
export const goalUpdateSchema = z.union([updateActive, updateClosed]);
