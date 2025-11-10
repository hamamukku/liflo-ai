import type { AuthUser } from "../modules/auth/model";

declare global {
  namespace Express {
    // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
    interface Request {
      user?: AuthUser;
      token?: string;
    }
  }
}

export {};
