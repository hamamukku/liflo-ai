// api/src/index.ts
import { onRequest } from "firebase-functions/v2/https";

// v2 では関数定義の中で必要なモジュールを import して初期化を遅らせる
export const app = onRequest(
  {
    region: "asia-northeast1",
    timeoutSeconds: 300,
    memory: "512MiB",
  },
  async (req, res) => {
    // ここで遅延ロード
    const { default: expressApp } = await import("./app.js");
    // Express アプリにリクエストを転送
    expressApp(req, res);
  }
);
