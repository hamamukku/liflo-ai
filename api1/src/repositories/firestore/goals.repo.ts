import { db } from "./client.js";
import type { IGoalsRepo, Goal, GoalStatus } from "../index.js";

const COL = "goals";

function ensureDb() {
  if (!db) {
    throw new Error("Firestore is not configured");
  }
}

function asGoal(doc: FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>): Goal {
  const data = doc.data() ?? {};
  return {
    id: doc.id,
    userId: data.userId,
    title: data.title ?? data.content ?? "",
    status: (data.status as GoalStatus) ?? "active",
    createdAt: data.createdAt ?? new Date().toISOString(),
    updatedAt: data.updatedAt ?? new Date().toISOString(),
  };
}

export const goalsFirestore: IGoalsRepo = {
  async list(userId: string) {
    ensureDb();
    const snap = await db!
      .collection(COL)
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc")
      .get();
    return snap.docs.map(asGoal);
  },

  async create(input) {
    ensureDb();
    const ref = await db!.collection(COL).add(input);
    const created = await ref.get();
    return asGoal(created);
  },

  async updateStatus(userId: string, id: string, status: GoalStatus) {
    ensureDb();
    const docRef = db!.collection(COL).doc(id);
    const snapshot = await docRef.get();
    if (!snapshot.exists) throw new Error("goal_not_found");
    if ((snapshot.data() as any)?.userId !== userId) throw new Error("goal_forbidden");
    await docRef.set(
      {
        status,
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    );
    const updated = await docRef.get();
    return asGoal(updated);
  },

  async delete(userId: string, id: string) {
    ensureDb();
    const docRef = db!.collection(COL).doc(id);
    const snapshot = await docRef.get();
    if (!snapshot.exists) throw new Error("goal_not_found");
    if ((snapshot.data() as any)?.userId !== userId) throw new Error("goal_forbidden");
    await docRef.delete();
  },
};
