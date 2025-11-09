import cors from 'cors';
import { corsOrigins, isProd } from '../config/env.js';
/** CORSを.envで集中制御（複数可）。未設定時はdevのみ許可。 */
export function buildCors() {
    const allowList = corsOrigins.length ? corsOrigins : (isProd ? [] : ['http://localhost:5173']);
    return cors({
        origin(origin, cb) {
            // same-origin/curl 等は許可
            if (!origin)
                return cb(null, true);
            const ok = allowList.includes(origin);
            return cb(null, ok);
        },
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true,
        maxAge: 86400,
    });
}
