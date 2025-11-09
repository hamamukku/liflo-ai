import { db } from './client.js';
const COL = 'users';
const clean = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined));
export const usersFirestore = {
    async findByNickname(nickname) {
        if (!db)
            throw new Error('Firestore is not configured');
        const snap = await db.collection(COL).where('nickname', '==', nickname).limit(1).get();
        if (snap.empty)
            return null;
        const doc = snap.docs[0];
        return { id: doc.id, ...doc.data() };
    },
    async create(input) {
        if (!db)
            throw new Error('Firestore is not configured');
        const now = new Date().toISOString();
        // 本番: 平文は保存しない（DoD）。pinPlain は破棄。
        const { nickname, pinHash } = input;
        const ref = await db.collection(COL).add(clean({ nickname, pinHash, createdAt: now }));
        const got = await ref.get();
        return { id: got.id, ...got.data() };
    },
};
