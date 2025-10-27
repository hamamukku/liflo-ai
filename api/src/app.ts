// api/src/app.ts
import server from "./server.js";
import { onRequest } from "firebase-functions/v2/https";

/**
 * v2 の onRequest を使ってリージョンを指定して公開します。
 * 以前の `functions.region(...).https.onRequest(...)` の代替です。
 */
export const app = onRequest({ region: "asia-northeast1" }, server);

// 互換のため default export も用意
export default app;
