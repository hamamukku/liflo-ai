// in-memory users repo (ダミー)
export type User = { id: string; nickname: string };

const users = new Map<string, User>();

export const usersMem = {
  async findById(id: string) {
    return users.get(id) ?? null;
  },
  async create(nickname: string) {
    const id = crypto.randomUUID?.() ?? String(Date.now());
    const u = { id, nickname };
    users.set(id, u);
    return u;
  },
};
