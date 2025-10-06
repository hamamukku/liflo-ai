import { db } from './client.js';
import type { IRecordsRepo, RecordEntity } from '../index.js';

const COL = 'records';
const clean = <T extends Record<string, any>>(o: T) =>
  Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as T;

export const recordsFirestore: IRecordsRepo = {
  async create(input: Omit<RecordEntity, 'id'>): Promise<RecordEntity> {
    if (!db) throw new Error('Firestore is not configured');
    const now = new Date().toISOString();
    const ref = await db
      .collection(COL)
      .add(clean({ ...input, createdAt: input.createdAt ?? now }));
    const got = await ref.get();
    return { id: got.id, ...(got.data() as any) } as RecordEntity;
  },
};
