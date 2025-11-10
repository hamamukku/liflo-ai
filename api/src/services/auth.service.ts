import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { hash } from "argon2";

const prisma = new PrismaClient();

/**
 * 新規アカウント作成
 * - ニックネームと4桁PINで登録
 * - ニックネーム重複時はエラー
 */
export async function signup(req: Request, res: Response) {
  const { nickname, pin } = req.body as { nickname?: string; pin?: string };

  if (!nickname || !pin || !/^[0-9]{4}$/.test(pin)) {
    return res.status(400).json({
      status: "error",
      message: "入力形式が不正です",
      data: null,
    });
  }

  const existing = await prisma.user.findUnique({ where: { nickname } });
  if (existing) {
    return res.status(400).json({
      status: "error",
      message: "このニックネームは既に使われています",
      data: null,
    });
  }

  const hashed = await hash(pin);
  const user = await prisma.user.create({ data: { nickname, pin: hashed } });

  return res.json({ status: "success", message: "登録完了", data: { user } });
}

/**
 * 現在のユーザー情報取得（暫定版）
 * - 認証トークン機能追加予定
 */
export async function me(_req: Request, res: Response) {
  res.json({ status: "success", message: "ok", data: { user: null } });
}
