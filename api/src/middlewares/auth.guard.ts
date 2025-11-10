import type { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/http";
import { AuthService } from "../modules/auth/service";

const TOKEN_COOKIE = "liflo_token";

export const createAuthGuard =
  (authService: AuthService) => async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const header = req.headers.authorization;
      const bearerToken = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
      const cookieToken = (req as Request & { cookies?: Record<string, string> }).cookies?.[
        TOKEN_COOKIE
      ];
      const token = bearerToken ?? cookieToken;

      if (!token) {
        throw new AppError("認証が必要です。", 401);
      }

      const user = await authService.verifyToken(token);
      req.user = user;
      req.token = token;

      return next();
    } catch (error) {
      return next(error);
    }
  };
