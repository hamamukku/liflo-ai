// src/repositories/postgres/users.repo.ts
import { prisma } from './prisma.client.js';
import { mapUser } from './mappers.js';
import type { IUsersRepo, User } from '../index.js';

export const usersPostgres: IUsersRepo = {
  async findByNickname(nickname: string): Promise<User | null> {
    const u = await prisma.user.findUnique({ where: { nickname } });
    return u ? mapUser(u) : null;
  },

  async create(data: { nickname: string; pinHash: string }): Promise<User> {
    const u = await prisma.user.create({ data });
    return mapUser(u);
  },
};
