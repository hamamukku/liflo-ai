import { db } from './client.js';
const COL = 'goals';
const clean = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined));
export const goalsFirestore = {
    async list(userId) {
        if (!db)
            throw new Error('Firestore is not configured');
        const snap = await db.collection(COL).where('userId', '==', userId).get();
        return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    },
    async create(input) {
        if (!db)
            throw new Error('Firestore is not configured');
        const now = new Date().toISOString();
        const ref = await db.collection(COL).add(clean({ ...input, createdAt: now, updatedAt: now }));
        const got = await ref.get();
        return { id: got.id, ...got.data() };
    },
    async update(id, patch) {
        if (!db)
            throw new Error('Firestore is not configured');
        const docRef = db.collection(COL).doc(id);
        const got = await docRef.get();
        if (!got.exists)
            throw new Error('goal not found');
        // userId を不変化（所有者の上書き防止：サービス層検証の“第二関門”）
        const now = new Date().toISOString();
        const { userId: _drop, ...rest } = patch || {};
        const toSave = clean({
            // 許可フィールドのみ
            content: rest.content,
            status: rest.status,
            reasonU: rest.reasonU,
            updatedAt: now,
        });
        await docRef.set(toSave, { merge: true });
        const after = await docRef.get();
        return { id: after.id, ...after.data() };
    },
};
