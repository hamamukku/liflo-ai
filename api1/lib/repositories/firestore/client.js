import admin from 'firebase-admin';
// .envの \n を実改行へ
function getPrivateKey() {
    const raw = process.env.FIREBASE_PRIVATE_KEY || '';
    return raw.includes('\\n') ? raw.replace(/\\n/g, '\n') : raw;
}
const hasCreds = !!process.env.FIREBASE_PROJECT_ID &&
    !!process.env.FIREBASE_CLIENT_EMAIL &&
    (process.env.FIREBASE_PRIVATE_KEY || '').length > 0;
if (!admin.apps.length && hasCreds) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: getPrivateKey(),
        }),
    });
}
// 準備済みかを公開（providers でのフォールバック判定に使用）
export const isFirestoreReady = admin.apps.length > 0;
// Firestore 本体（未設定なら null）
export const db = isFirestoreReady
    ? admin.firestore()
    : null;
// undefined を無視（merge時のクラッシュ回避）
if (db) {
    try {
        db.settings({ ignoreUndefinedProperties: true });
    }
    catch {
        /* no-op: 古いSDKでも安全 */
    }
}
