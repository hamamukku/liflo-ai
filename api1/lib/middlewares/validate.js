/** error.handler.ts で拾いやすい形にして next() へ流す */
class ValidationError extends Error {
    status = 400;
    type = "validation";
    details;
    issues;
    constructor(issues, details) {
        super("validation");
        this.issues = issues;
        this.details = details;
    }
}
function apply(part, schema) {
    return (req, _res, next) => {
        const value = req[part];
        const parsed = schema.safeParse(value);
        if (!parsed.success) {
            const details = parsed.error.issues.map((i) => ({
                path: i.path?.length ? i.path.join(".") : "(root)",
                message: i.message,
                code: i.code, // 例: "invalid_type", "too_small" など
            }));
            return next(new ValidationError(parsed.error.issues, details));
        }
        // Zod で strip/coerce 済みの“正しい形”で上書き（ここが超大事）
        req[part] = parsed.data;
        return next();
    };
}
export const validateBody = (schema) => apply("body", schema);
export const validateQuery = (schema) => apply("query", schema);
export const validateParams = (schema) => apply("params", schema);
