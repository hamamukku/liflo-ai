// エイリアス：Memory 実装を named export で束ねる
// 型を使う場合に備えて public re-export（任意）
export type { IGoalsRepo, IRecordsRepo, IUsersRepo } from "../index.js";

// それぞれの実装ファイルから named export を再エクスポート
export { goalsMem } from "./goals.repo.js";
export { recordsMem } from "./records.repo.js";
export { usersMem } from "./users.repo.js";
