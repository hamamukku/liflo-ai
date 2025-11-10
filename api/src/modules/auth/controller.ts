import type { Request, Response, NextFunction } from "express";
import { loginSchema, signupSchema } from "./dtos";
import { AuthService } from "./service";
import { AppError, sendSuccess } from "../../utils/http";

const TOKEN_COOKIE = "liflo_token";
const TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export class AuthController {
  constructor(private readonly service: AuthService) {}

  signup = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = signupSchema.parse(req.body);
      const user = await this.service.signup(parsed.nickname, parsed.pin);
      return sendSuccess(res, { user }, "登録完了", 201);
    } catch (error) {
      return next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = loginSchema.parse(req.body);
      const result = await this.service.login(parsed.nickname, parsed.pin);
      this.setTokenCookie(res, result.token);
      return sendSuccess(res, result, "ログイン成功");
    } catch (error) {
      return next(error);
    }
  };

  me = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError("認証が必要です。", 401);
      }
      return sendSuccess(res, req.user, "ユーザー情報を取得しました。");
    } catch (error) {
      return next(error);
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction) => {
    try {
      this.service.logout(req.token);
      res.clearCookie(TOKEN_COOKIE);
      return sendSuccess(res, { ok: true }, "ログアウトしました。");
    } catch (error) {
      return next(error);
    }
  };

  private setTokenCookie(res: Response, token: string) {
    res.cookie(TOKEN_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: TOKEN_MAX_AGE_MS,
    });
  }
}
