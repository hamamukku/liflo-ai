import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema } from 'zod';

function apply<T>(
  part: 'body' | 'query' | 'params',
  schema: ZodSchema<T>
) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse((req as any)[part]);
    if (!result.success) {
      const details = result.error.issues.map(i => ({
        path: Array.isArray(i.path) ? i.path.join('.') : String(i.path ?? ''),
        message: i.message,
      }));
      // error.handler.ts が 400 {error:'validation', details} に整形
      (next as any)({ status: 400, issues: result.error.issues, details });
      return;
    }
    // 変換後の値で上書き（trim/number変換などが効く）
    (req as any)[part] = result.data as any;
    next();
  };
}

export const validateBody = apply.bind(null, 'body');
export const validateQuery = apply.bind(null, 'query');
export const validateParams = apply.bind(null, 'params');
