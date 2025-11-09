// src/repositories/postgres/users.repo.ts
import { prisma } from './prisma.client.js';
import { mapUser } from './mappers.js';
export const usersPostgres = {
    async findByNickname(nickname) {
        const u = await prisma.user.findUnique({ where: { nickname } });
        return u ? mapUser(u) : null;
    },
    async create(data) {
        const u = await prisma.user.create({ data });
        return mapUser(u);
    },
};
