// api/src/index.ts
import * as functions from "firebase-functions";
import expressApp from "./app.js"; // ← app.ts からExpressインスタンスをインポート
// Firebase Functions で Expressアプリを公開
export const app = functions.https.onRequest(expressApp);
