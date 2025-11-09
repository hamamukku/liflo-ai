import { repos } from "../config/providers.js";
function httpError(status, code) {
    const e = new Error(code || "");
    e.status = status;
    e.code = code;
    return e;
}
// 内部整形：createdAt/updatedAt を補完し、status を number に正規化
function normalizeGoal(g) {
    const now = new Date().toISOString();
    const numericStatus = typeof g.status === "string" ? 1000 : (g.status ?? 1000);
    return {
        ...g,
        status: numericStatus,
        createdAt: g.createdAt ?? now,
        updatedAt: g.updatedAt ?? now,
    };
}
export async function list(userId) {
    const items = await repos.goals.list(userId);
    return items.map(normalizeGoal);
}
export async function create(userId, dto) {
    // repos の create は repo型（status:number 等）しか受け付けないため、
    // createdAt/updatedAt はサービス層で付与して返す
    const createdRepo = await repos.goals.create({
        userId,
        content: dto.content,
        status: 1000, // "active" を数値に正規化
        reasonU: dto.reasonU,
    });
    return normalizeGoal(createdRepo);
}
export async function update(userId, id, patch) {
    // 終了遷移(1000/999)は理由必須（サービス層でも二重チェック）
    const s = patch.status;
    if ((s === 1000 || s === 999) && !patch.reasonU) {
        throw httpError(400, "validation");
    }
    // repos の update は repo型（status:number 等）想定のため、入力を正規化
    const updateInput = {
        ...patch,
        status: typeof patch.status === "string" ? 1000 : patch.status,
        userId,
        // createdAt は触らず、更新時刻のみサービス層で付与して返す
    };
    const updatedRepo = await repos.goals.update(id, updateInput);
    return normalizeGoal(updatedRepo);
}
