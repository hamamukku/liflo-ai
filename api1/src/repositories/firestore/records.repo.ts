import { db } from "./client.js";
import type { IRecordsRepo, RecordEntry } from "../index.js";

const COL = "records";

function ensureDb() {
  if (!db) {
    throw new Error("Firestore is not configured");
  }
}

function toIso(value: unknown): string {
  if (!value) return new Date().toISOString();
  if (typeof value === "string") return value;
  if (typeof value === "object" && value !== null && typeof (value as any).toDate === "function") {
    return ((value as any).toDate() as Date).toISOString();
  }
  return new Date().toISOString();
}

function asRecord(doc: FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>): RecordEntry {
  const data = doc.data() ?? {};
  return {
    id: doc.id,
    text: data.text ?? "",
    aiComment: data.aiComment ?? null,
    createdAt: toIso(data.createdAt),
  };
}

export const recordsFirestore: IRecordsRepo = {
  async create(input) {
    ensureDb();
    const ref = await db!.collection(COL).add(input);
    const snapshot = await ref.get();
    return asRecord(snapshot);
  },

  async list(_userId, opts) {
    ensureDb();
    let query: FirebaseFirestore.Query = db!.collection(COL);
    const order = (opts?.order ?? "desc").toLowerCase() === "asc" ? "asc" : "desc";
    query = query.orderBy("createdAt", order as FirebaseFirestore.OrderByDirection);
    if (opts?.limit) {
      query = query.limit(opts.limit);
    }
    const snap = await query.get();
    return snap.docs.map(asRecord);
  },

  async findById(_userId, id) {
    ensureDb();
    const docRef = db!.collection(COL).doc(id);
    const snapshot = await docRef.get();
    if (!snapshot.exists) return null;
    return asRecord(snapshot);
  },

  async delete(_userId, id) {
    ensureDb();
    const docRef = db!.collection(COL).doc(id);
    const snapshot = await docRef.get();
    if (!snapshot.exists) throw new Error("record_not_found");
    await docRef.delete();
  },
};
