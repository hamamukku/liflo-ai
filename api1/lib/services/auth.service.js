// api/src/services/auth.service.ts
import { randomUUID } from "node:crypto";
/**
 * ログイン：nickname/pin を受け取り、カスタムトークンと userId を返す
 */
export async function login(nickname, pin) {
    // ※ここではPoC用の最小実装。
    // 本来はDBで nickname/pin の照合を行い、Firebase Custom Token等を発行する。
    const base = Buffer.from(`${nickname}:${pin}`).toString("base64url");
    const userId = `u_${Buffer.from(nickname).toString("hex").slice(0, 8)}`;
    const customToken = `ct_${base}_${randomUUID()}`;
    return { customToken, userId };
}
/**
 * 登録：nickname/pin を受け取り、userId を払い出す
 */
export async function register(nickname, pin) {
    // ※PoC用：実DB保存は省略。ユニークなIDを返す。
    const userId = `u_${Buffer.from(nickname).toString("hex").slice(0, 8)}_${Date.now()}`;
    return { userId };
}
