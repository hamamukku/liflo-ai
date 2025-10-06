// サービス層等から使える軽量な HttpError ヘルパ（任意）
// error.handler.ts が最終フォーマット化を担当する前提
export class HttpError extends Error {
  status: number;
  code?: string;
  constructor(status: number, code?: string, message?: string) {
    super(message || code || String(status));
    this.status = status;
    this.code = code;
  }
}

export const httpError = (status: number, code?: string, message?: string) =>
  new HttpError(status, code, message);

// ショートカット
export const badRequest = (code = 'bad_request') => httpError(400, code);
export const unauthorized = (code = 'not_found') => httpError(401, code); // 固定文方針に整合
export const tooMany = () => httpError(429, 'too_many_requests');
export const internal = () => httpError(500, 'internal_error');
