// ESM / NodeNext: 相対 import は .js を付ける
// 1) まず “参照用” に型を import（このファイル内で使うため）
import type { Goal, GoalStatus } from '../models/goal.js';
import type { RecordEntity } from '../models/record.js';
import type { User } from '../models/user.js';

// 2) そのまま “再エクスポート” もして、他所からも単一起点で参照できるようにする
export type { Goal, GoalStatus } from '../models/goal.js';
export type { RecordEntity } from '../models/record.js';
export type { User } from '../models/user.js';

// 3) Ports（リポジトリ I/F）は、上の型をそのまま使う
export interface IGoalsRepo {
  list(userId: string): Promise<Goal[]>;
  create(input: { userId: string; content: string; status: GoalStatus; reasonU?: string }): Promise<Goal>;
  update(id: string, patch: Partial<Goal> & { userId?: string }): Promise<Goal>;
}

export interface IRecordsRepo {
  create(input: Omit<RecordEntity, 'id'>): Promise<RecordEntity>;
}

export interface IUsersRepo {
  findByNickname(nickname: string): Promise<User | null>;
  create(input: { nickname: string; pinHash?: string; pinPlain?: string }): Promise<User>;
}
