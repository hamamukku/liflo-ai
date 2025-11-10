export type AuthUser = {
  id: number;
  nickname: string;
  createdAt: string;
};

export type AuthTokenPayload = {
  sub: number;
  nickname: string;
  iat?: number;
  exp?: number;
};
