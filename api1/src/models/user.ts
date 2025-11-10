/** Minimal representation of an authenticated user */
export interface User {
  id: string;
  nickname: string;
  /** Argon2 hashed PIN */
  pin?: string;
  createdAt?: string;
  lastLogin?: string;
}

/** Registration payload (hashing handled by the service layer) */
export interface RegisterInput {
  nickname: string;
  pin: string;
}
