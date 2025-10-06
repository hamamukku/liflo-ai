import type { Goal, GoalStatus } from '../models/goal.js';
import { repos } from '../config/providers.js';

function httpError(status: number, code?: string) {
  const e: any = new Error(code || '');
  e.status = status;
  e.code = code;
  return e;
}

export async function list(userId: string): Promise<Goal[]> {
  return repos.goals.list(userId);
}

export async function create(userId: string, dto: { content: string; reasonU?: string }): Promise<Goal> {
  const now: GoalStatus = 'active';
  return repos.goals.create({ userId, content: dto.content, status: now, reasonU: dto.reasonU });
}

export async function update(
  userId: string,
  id: string,
  patch: Partial<Goal> & { status?: GoalStatus; reasonU?: string }
): Promise<Goal> {
  const s = patch.status;
  // 終了遷移は理由必須（zodに加えてサービス層でも二重チェック）
  if ((s === 1000 || s === 999) && !patch.reasonU) {
    throw httpError(400, 'validation');
  }
  // 所有者ガードはRepo層で userId 不変として二重化済み
  return repos.goals.update(id, { ...patch, userId });
}
