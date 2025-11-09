import { db } from './client.js';
const COL = 'records';
const clean = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined));
export const recordsFirestore = {
    async create(input) {
        if (!db)
            throw new Error('Firestore is not configured');
        const now = new Date().toISOString();
        const ref = await db
            .collection(COL)
            .add(clean({ ...input, createdAt: input.createdAt ?? now }));
        const got = await ref.get();
        return { id: got.id, ...got.data() };
    },
};
