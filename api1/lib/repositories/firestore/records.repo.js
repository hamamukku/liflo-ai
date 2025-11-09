import { db } from "./client.js";
const COL = "records";
function ensureDb() {
    if (!db) {
        throw new Error("Firestore is not configured");
    }
}
function toIso(value) {
    if (!value)
        return new Date().toISOString();
    if (typeof value === "string")
        return value;
    if (typeof value === "object" && value !== null && typeof value.toDate === "function") {
        return value.toDate().toISOString();
    }
    return new Date().toISOString();
}
function asRecord(doc) {
    const data = doc.data() ?? {};
    return {
        id: doc.id,
        userId: data.userId,
        text: data.text ?? "",
        aiComment: data.aiComment ?? null,
        createdAt: toIso(data.createdAt),
    };
}
export const recordsFirestore = {
    async create(input) {
        ensureDb();
        const ref = await db.collection(COL).add(input);
        const snapshot = await ref.get();
        return asRecord(snapshot);
    },
    async list(userId, opts) {
        ensureDb();
        let query = db.collection(COL).where("userId", "==", userId);
        const order = (opts?.order ?? "desc").toLowerCase() === "asc" ? "asc" : "desc";
        query = query.orderBy("createdAt", order);
        if (opts?.limit) {
            query = query.limit(opts.limit);
        }
        const snap = await query.get();
        return snap.docs.map(asRecord);
    },
    async findById(userId, id) {
        ensureDb();
        const docRef = db.collection(COL).doc(id);
        const snapshot = await docRef.get();
        if (!snapshot.exists)
            return null;
        if (snapshot.data()?.userId !== userId)
            return null;
        return asRecord(snapshot);
    },
    async delete(userId, id) {
        ensureDb();
        const docRef = db.collection(COL).doc(id);
        const snapshot = await docRef.get();
        if (!snapshot.exists)
            throw new Error("record_not_found");
        if (snapshot.data()?.userId !== userId)
            throw new Error("record_forbidden");
        await docRef.delete();
    },
};
