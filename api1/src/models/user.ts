/** 認証・所有者識別の最小単位 */
export interface User {
  id: string;
  nickname: string;
  /** 本番は Argon2 ハッシュ。PoCでは空の可能性あり（移行中想定） */
  pinHash?: string;
  createdAt?: string; // ISO-8601
  lastLogin?: string; // ISO-8601
}

/** 登録入力（任意機能） */
export interface RegisterInput {
  nickname: string;
  pin: string; // ハッシュ化はサービス層
}
