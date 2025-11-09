// api/src/middlewares/validate.ts
import type { Request, Response, NextFunction } from "express";
import type { ZodSchema, ZodIssue } from "zod";

type Part = "body" | "query" | "params";
type Detail = { path: string; message: string; code?: string };

/** error.handler.ts で拾いやすい形にして next() へ流す */
class ValidationError extends Error {
  status = 400;
  type = "validation" as const;
  details: Detail[];
  issues: ZodIssue[];
  constructor(issues: ZodIssue[], details: Detail[]) {
    super("validation");
    this.issues = issues;
    this.details = details;
  }
}

function apply<T>(part: Part, schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const value = (req as any)[part];
    const parsed = schema.safeParse(value);

    if (!parsed.success) {
      const details: Detail[] = parsed.error.issues.map((i) => ({
        path: i.path?.length ? i.path.join(".") : "(root)",
        message: i.message,
        code: i.code, // 例: "invalid_type", "too_small" など
      }));
      return next(new ValidationError(parsed.error.issues, details));
    }

    // Zod で strip/coerce 済みの“正しい形”で上書き（ここが超大事）
    (req as any)[part] = parsed.data as any;
    return next();
  };
}

export const validateBody = <T>(schema: ZodSchema<T>) => apply("body", schema);
export const validateQuery = <T>(schema: ZodSchema<T>) => apply("query", schema);
export const validateParams = <T>(schema: ZodSchema<T>) => apply("params", schema);
