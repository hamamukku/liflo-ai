// api/src/repositories/firestore/records.repo.ts
import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

if (!getApps().length) initializeApp();
const db = getFirestore();

const COL = "records";
const clean = <T extends Record<string, any>>(o: T) =>
  Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as T;

export const recordsFirestore = {
  /** 保存時の最低限ルール：
   *  - date は "YYYY-MM-DD"（string）
   *  - dateMs は number（任意：将来/互換用）
   *  - createdAt は Firestore Timestamp
   */
  async create(input: any): Promise<any> {
    const doc = clean({
      ...input,
      createdAt: input?.createdAt ?? Timestamp.now(),
    });
    const ref = await db.collection(COL).add(doc);
    const got = await ref.get();
    return { id: got.id, ...(got.data() as any) };
  },
  // 必要になれば listRange(date/dateMs) などを追加
};
