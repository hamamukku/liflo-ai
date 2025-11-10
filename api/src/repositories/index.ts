import { createMemoryRepositories } from "./memory";
import { createPostgresRepositories } from "./postgres";
import { createFirestoreRepositories } from "./firestore";
import { RepositoryBundle } from "./types";

export type RepositoryKind = "memory" | "postgres" | "firestore";

export const createRepositories = (kind: RepositoryKind): RepositoryBundle => {
  switch (kind) {
    case "memory":
      return createMemoryRepositories();
    case "postgres":
      return createPostgresRepositories();
    case "firestore":
      return createFirestoreRepositories();
    default:
      return createMemoryRepositories();
  }
};
