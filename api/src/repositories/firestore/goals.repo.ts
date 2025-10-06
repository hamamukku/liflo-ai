import { db } from './client.js';
import type { IGoalsRepo, Goal, GoalStatus } from '../index.js';

const COL = 'goals';
const clean = <T extends Record<string, any>>(o: T) =>
  Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as T;

export const goalsFirestore: IGoalsRepo = {
  async list(userId: string): Promise<Goal[]> {
    if (!db) throw new Error('Firestore is not configured');
    const snap = await db.collection(COL).where('userId', '==', userId).get();
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) } as Goal));
  },

  async create(input: { userId: string; content: string; status: GoalStatus; reasonU?: string }): Promise<Goal> {
    if (!db) throw new Error('Firestore is not configured');
    const now = new Date().toISOString();
    const ref = await db.collection(COL).add(clean({ ...input, createdAt: now, updatedAt: now }));
    const got = await ref.get();
    return { id: got.id, ...(got.data() as any) } as Goal;
  },

  async update(id: string, patch: Partial<Goal> & { userId?: string }): Promise<Goal> {
    if (!db) throw new Error('Firestore is not configured');
    const docRef = db.collection(COL).doc(id);
    const got = await docRef.get();
    if (!got.exists) throw new Error('goal not found');

    // userId を不変化（所有者の上書き防止：サービス層検証の“第二関門”）
    const now = new Date().toISOString();
    const { userId: _drop, ...rest } = patch || {};
    const toSave = clean({
      // 許可フィールドのみ
      content: (rest as any).content,
      status: (rest as any).status,
      reasonU: (rest as any).reasonU,
      updatedAt: now,
    });

    await docRef.set(toSave, { merge: true });
    const after = await docRef.get();
    return { id: after.id, ...(after.data() as any) } as Goal;
  },
};
