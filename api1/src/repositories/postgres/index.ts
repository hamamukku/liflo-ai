// Postgres 実装の束ね
export type { IGoalsRepo, IRecordsRepo, IUsersRepo } from "../index.js";

export { goalsPostgres } from "./goals.repo.js";
export { recordsPostgres } from "./records.repo.js";
export { usersPostgres } from "./users.repo.js";
