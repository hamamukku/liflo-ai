import type { PrismaClient, User } from "@prisma/client";
import argon2 from "argon2";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { AppError } from "../../utils/http";
import type { AuthUser } from "./model";

const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

export class AuthService {
  private revokedTokens = new Map<string, number>();

  constructor(
    private readonly prisma: PrismaClient,
    private readonly jwtSecret: string,
  ) {}

  async signup(nickname: string, pin: string): Promise<AuthUser> {
    const existing = await this.prisma.user.findUnique({
      where: { nickname },
    });

    if (existing) {
      throw new AppError("このニックネームはすでに使われています。", 409);
    }

    const hashed = await argon2.hash(pin);
    const user = await this.prisma.user.create({
      data: {
        nickname,
        pin: hashed,
      },
    });

    return this.toAuthUser(user);
  }

  async login(nickname: string, pin: string): Promise<{ token: string; user: AuthUser }> {
    const user = await this.prisma.user.findUnique({
      where: { nickname },
    });

    if (!user) {
      throw new AppError("認証に失敗しました。", 401);
    }

    const isValid = await argon2.verify(user.pin, pin);
    if (!isValid) {
      throw new AppError("認証に失敗しました。", 401);
    }

    const token = jwt.sign(
      {
        sub: user.id,
        nickname: user.nickname,
      },
      this.jwtSecret,
      {
        expiresIn: TOKEN_TTL_SECONDS,
      },
    );

    return {
      token,
      user: this.toAuthUser(user),
    };
  }

  async verifyToken(token: string): Promise<AuthUser> {
    if (this.isRevoked(token)) {
      throw new AppError("トークンが無効です。", 401);
    }

    let payload: jwt.JwtPayload | string;
    try {
      payload = jwt.verify(token, this.jwtSecret);
    } catch {
      throw new AppError("認証が必要です。", 401);
    }

    if (typeof payload === "string" || typeof payload.sub !== "number") {
      throw new AppError("トークンが不正です。", 401);
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new AppError("ユーザーが存在しません。", 401);
    }

    return this.toAuthUser(user);
  }

  logout(token: string | undefined) {
    if (!token) return;
    const decoded = jwt.decode(token) as JwtPayload | null;
    const expiry = decoded?.exp ?? Math.floor(Date.now() / 1000);
    this.revokedTokens.set(token, expiry);
  }

  private isRevoked(token: string): boolean {
    const exp = this.revokedTokens.get(token);
    if (!exp) return false;
    if (exp < Date.now() / 1000) {
      this.revokedTokens.delete(token);
      return false;
    }
    return true;
  }

  private toAuthUser(user: User): AuthUser {
    return {
      id: user.id,
      nickname: user.nickname,
      createdAt: user.createdAt.toISOString(),
    };
  }
}
