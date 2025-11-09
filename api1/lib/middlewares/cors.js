// api/src/middlewares/cors.ts
// ESM / NodeNext / Functions v2 前提
// ★ 修正ポイント：logger は「名前付きの logger ではなく」モジュール名前空間として読み込む
import * as logger from 'firebase-functions/logger';
/** CSVを配列へ（空や空白は除去） */
function splitCsv(v) {
    return (v ?? '')
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
}
/** 許可オリジン解決（env → フォールバック） */
const fromEnv = [
    ...splitCsv(process.env.APP_CORS_ORIGIN),
    ...splitCsv(process.env.CORS_ORIGIN),
    ...splitCsv(process.env.APP__CORS_ORIGIN),
];
const DEFAULT_PROD = ['https://liflo-ai.web.app'];
const DEFAULT_DEV = ['http://localhost:5173'];
const ALLOW_LIST = (() => {
    if (fromEnv.length > 0)
        return fromEnv;
    const isDev = process.env.NODE_ENV !== 'production' || process.env.FUNCTIONS_EMULATOR === 'true';
    return isDev ? [...DEFAULT_PROD, ...DEFAULT_DEV] : DEFAULT_PROD;
})();
// 1回だけ起動時に出す
try {
    logger.info('CORS allowList', { allowList: ALLOW_LIST });
}
catch {
    // もし logger が使えない環境でも壊さない
    // eslint-disable-next-line no-console
    console.info('CORS allowList', ALLOW_LIST);
}
/** Liflo 用 CORS ミドルウェア（プリフライト即返し・安全ヘッダ） */
export const lifloCors = (req, res, next) => {
    const origin = req.headers.origin;
    if (origin && ALLOW_LIST.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Vary', 'Origin'); // キャッシュの整合性
        res.setHeader('Access-Control-Allow-Credentials', 'true');
    }
    // メソッド＆ヘッダ
    res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,POST,PUT,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization,Accept,Content-Type,Origin,X-Requested-With,If-None-Match,If-Match');
    res.setHeader('Access-Control-Max-Age', '86400'); // 24h
    // プリフライトは 204 で即返し
    if (req.method === 'OPTIONS') {
        res.status(204).end();
        return;
    }
    next();
};
export default lifloCors;
