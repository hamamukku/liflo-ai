import type { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { hash, verify } from "argon2";
import { randomUUID } from "node:crypto";

const prisma = new PrismaClient();
const PIN_PATTERN = /^[0-9]{4}$/;

type AppError = Error & { status?: number };

const ERROR_MESSAGES = {
  invalidInput: "入力形式が不正です",
  duplicateNickname: "このニックネームは既に使われています",
  authFailed: "認証に失敗しました",
  serverError: "サーバーエラーが発生しました",
} as const;

function makeError(status: number, message: string): AppError {
  const err = new Error(message) as AppError;
  err.status = status;
  return err;
}

function normalizeNickname(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizePin(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

async function createUserAccount(rawNickname: unknown, rawPin: unknown) {
  const nickname = normalizeNickname(rawNickname);
  const pin = normalizePin(rawPin);

  if (!nickname || !PIN_PATTERN.test(pin)) {
    throw makeError(400, ERROR_MESSAGES.invalidInput);
  }

  const existing = await prisma.user.findUnique({ where: { nickname } });
  if (existing) {
    throw makeError(400, ERROR_MESSAGES.duplicateNickname);
  }

  const hashed = await hash(pin);
  return prisma.user.create({
    data: { nickname, pin: hashed },
    select: { id: true, nickname: true, createdAt: true },
  });
}

function sendError(res: Response, status: number, message: string) {
  return res.status(status).json({ status: "error", message, data: null });
}

/**
 * 新規アカウント作成
 * - ニックネームと4桁PINで登録
 * - ニックネーム重複時はエラー
 */
export async function signup(req: Request, res: Response) {
  try {
    const user = await createUserAccount(req.body?.nickname, req.body?.pin);
    return res.json({ status: "success", message: "登録完了", data: { user } });
  } catch (error) {
    const status = (error as AppError)?.status ?? 500;
    const message =
      status >= 500 ? ERROR_MESSAGES.serverError : (error as Error).message || ERROR_MESSAGES.invalidInput;
    console.error("[auth] signup failed:", error);
    return sendError(res, status, message);
  }
}

/**
 * 現在のユーザー情報取得（暫定版）
 * - 認証トークン機能追加予定
 */
export async function me(_req: Request, res: Response) {
  return res.json({ status: "success", message: "ok", data: { user: null } });
}

/**
 * 既存コントローラー互換：nickname/pin を受け取りトークンを返す
 */
export async function login(nickname: string, pin: string): Promise<{ customToken: string; userId: string }> {
  const normalizedNickname = normalizeNickname(nickname);
  const normalizedPin = normalizePin(pin);

  if (!normalizedNickname || !normalizedPin) {
    throw makeError(400, ERROR_MESSAGES.invalidInput);
  }

  const user = await prisma.user.findUnique({ where: { nickname: normalizedNickname } });
  if (!user || !user.pin) {
    throw makeError(401, ERROR_MESSAGES.authFailed);
  }

  const ok = await verify(user.pin, normalizedPin);
  if (!ok) {
    throw makeError(401, ERROR_MESSAGES.authFailed);
  }

  const customToken = `ct_${user.id}_${randomUUID()}`;
  return { customToken, userId: user.id };
}

/**
 * 既存コントローラー互換：登録API
 */
export async function register(nickname: string, pin: string): Promise<{ userId: string }> {
  const user = await createUserAccount(nickname, pin);
  return { userId: user.id };
}

