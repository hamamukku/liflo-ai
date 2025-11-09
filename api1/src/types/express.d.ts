// Express Request に user.id を安全に載せるための型拡張
// tsconfig の "include" に src/types を含めておくこと
import 'express-serve-static-core';

declare global {
  namespace Express {
    interface UserPayload { id: string }
    // middlewares/auth.guard.ts で注入する
    interface Request {
      user?: UserPayload;
    }
  }
}

export {};
