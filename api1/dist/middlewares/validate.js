function apply(part, schema) {
    return (req, _res, next) => {
        const result = schema.safeParse(req[part]);
        if (!result.success) {
            const details = result.error.issues.map(i => ({
                path: Array.isArray(i.path) ? i.path.join('.') : String(i.path ?? ''),
                message: i.message,
            }));
            // error.handler.ts が 400 {error:'validation', details} に整形
            next({ status: 400, issues: result.error.issues, details });
            return;
        }
        // 変換後の値で上書き（trim/number変換などが効く）
        req[part] = result.data;
        next();
    };
}
export const validateBody = apply.bind(null, 'body');
export const validateQuery = apply.bind(null, 'query');
export const validateParams = apply.bind(null, 'params');
