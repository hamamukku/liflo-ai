import { db } from "./client.js";
const COL = "goals";
function ensureDb() {
    if (!db) {
        throw new Error("Firestore is not configured");
    }
}
function asGoal(doc) {
    const data = doc.data() ?? {};
    return {
        id: doc.id,
        userId: data.userId,
        title: data.title ?? data.content ?? "",
        status: data.status ?? "active",
        createdAt: data.createdAt ?? new Date().toISOString(),
        updatedAt: data.updatedAt ?? new Date().toISOString(),
    };
}
export const goalsFirestore = {
    async list(userId) {
        ensureDb();
        const snap = await db
            .collection(COL)
            .where("userId", "==", userId)
            .orderBy("createdAt", "desc")
            .get();
        return snap.docs.map(asGoal);
    },
    async create(input) {
        ensureDb();
        const ref = await db.collection(COL).add(input);
        const created = await ref.get();
        return asGoal(created);
    },
    async updateStatus(userId, id, status) {
        ensureDb();
        const docRef = db.collection(COL).doc(id);
        const snapshot = await docRef.get();
        if (!snapshot.exists)
            throw new Error("goal_not_found");
        if (snapshot.data()?.userId !== userId)
            throw new Error("goal_forbidden");
        await docRef.set({
            status,
            updatedAt: new Date().toISOString(),
        }, { merge: true });
        const updated = await docRef.get();
        return asGoal(updated);
    },
    async delete(userId, id) {
        ensureDb();
        const docRef = db.collection(COL).doc(id);
        const snapshot = await docRef.get();
        if (!snapshot.exists)
            throw new Error("goal_not_found");
        if (snapshot.data()?.userId !== userId)
            throw new Error("goal_forbidden");
        await docRef.delete();
    },
};
