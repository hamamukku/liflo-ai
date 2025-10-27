// api/src/routes/goals.routes.ts
import { Router, Request, Response } from "express";
import { getApps, initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// 防御的初期化（ESM/モジュール環境での標準）
try {
  if (getApps().length === 0) {
    initializeApp({ credential: applicationDefault() });
    // eslint-disable-next-line no-console
    console.log("[GOALS ROUTES] firebase-admin initialized (modular)");
  } else {
    // eslint-disable-next-line no-console
    console.log("[GOALS ROUTES] firebase-admin already initialized");
  }
} catch (e) {
  console.error("[GOALS ROUTES] admin init failed:", e);
}

let db: any = null;
try {
  db = getFirestore();
} catch (e) {
  console.error("[GOALS ROUTES] getFirestore() failed:", e);
}

const COL = "goals";

type GoalStatus = "active" | 1000 | 999;
const nowISO = () => new Date().toISOString();
const normStatus = (v: any): GoalStatus =>
  v === 1000 || v === "1000" ? 1000 : v === 999 || v === "999" ? 999 : "active";

function pickUserId(req: Request): string {
  const a: any = req;
  return a.userId || a.user?.id || a.user?.uid || "u1";
}

const router = Router();

/** 一覧（最新順） */
router.get("/", async (_req: Request, res: Response) => {
  try {
    if (!db) return res.status(500).json({ message: "datastore unavailable" });
    const snap = await db.collection(COL).orderBy("createdAt", "desc").limit(200).get();
    const items = snap.docs.map((d: any) => ({ id: d.id, ...(d.data() as any) }));
    return res.status(200).json(items);
  } catch (e) {
    console.error("[GET /goals] error:", e);
    return res.status(500).json({ message: "goals list failed", detail: String(e) });
  }
});

/** POST: 新規作成 or 状態更新ユニオン */
router.post("/", async (req: Request, res: Response) => {
  try {
    const b = (req.body || {}) as any;
    if (!db) return res.status(500).json({ message: "datastore unavailable" });

    // 状態更新 (id+status)
    if (b.id && typeof b.status !== "undefined") {
      const id = String(b.id);
      const patch: any = { status: normStatus(b.status), updatedAt: nowISO() };
      if (b.reasonU !== undefined) patch.reasonU = b.reasonU;
      if (b.reason_u !== undefined) patch.reasonU = b.reason_u;

      await db.collection(COL).doc(id).set(patch, { merge: true });
      const got = await db.collection(COL).doc(id).get();
      return res.status(200).json({ id, ...(got.data() as any) });
    }

    // 新規
    const userId = pickUserId(req);
    const content = String(b.content ?? "");
    const category = b.category ?? null;
    const status: GoalStatus = normStatus(b.status);
    const doc = { userId, content, category, status, createdAt: nowISO(), updatedAt: nowISO() };

    const ref = b.id
      ? db.collection(COL).doc(String(b.id))
      : db.collection(COL).doc(`g-${Date.now()}`);

    await ref.set(doc, { merge: true });
    return res.status(201).json({ id: ref.id, ...doc });
  } catch (e) {
    console.error("[POST /goals] error:", e, "body=", req.body);
    return res.status(400).json({ message: "goals create/update failed", detail: String(e) });
  }
});

/** PUT /goals/:id（旧互換） */
router.put("/:id", async (req: Request, res: Response) => {
  try {
    if (!db) return res.status(500).json({ message: "datastore unavailable" });
    const id = String(req.params.id);
    const b = (req.body || {}) as any;
    const patch: any = { updatedAt: nowISO() };
    if (b.content !== undefined) patch.content = String(b.content);
    if (b.category !== undefined) patch.category = b.category;
    if (b.status !== undefined) patch.status = normStatus(b.status);
    if (b.reasonU !== undefined) patch.reasonU = b.reasonU;
    if (b.reason_u !== undefined) patch.reasonU = b.reason_u;

    await db.collection(COL).doc(id).set(patch, { merge: true });
    const got = await db.collection(COL).doc(id).get();
    return res.status(200).json({ id, ...(got.data() as any) });
  } catch (e) {
    console.error("[PUT /goals/:id] error:", e);
    return res.status(400).json({ message: "goals put failed", detail: String(e) });
  }
});

export default router;
