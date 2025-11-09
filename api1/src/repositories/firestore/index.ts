// Firestore 実装の束ね
export type { IGoalsRepo, IRecordsRepo, IUsersRepo } from "../index.js";

export { goalsFirestore } from "./goals.repo.js";
export { recordsFirestore } from "./records.repo.js";
export { usersFirestore } from "./users.repo.js";
