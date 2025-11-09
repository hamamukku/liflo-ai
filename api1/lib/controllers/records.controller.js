import { logSink } from "../config/providers.js";
import * as svc from "../services/records.service.js";
import { sendSuccess } from "../utils/http.js";
function userIdFrom(req) {
    return req.user?.id ?? req.userId ?? "u1";
}
export async function listRecords(req, res, next) {
    try {
        const userId = userIdFrom(req);
        const records = await svc.listRecords(userId);
        return sendSuccess(res, records, "Records fetched");
    }
    catch (error) {
        return next(error);
    }
}
export async function createRecord(req, res, next) {
    try {
        const userId = userIdFrom(req);
        const record = await svc.createRecord(userId, req.body ?? {});
        await logSink.append({ endpoint: "/api/records", method: "POST", userId, status: "success" });
        return sendSuccess(res, record, "Record stored", 201);
    }
    catch (error) {
        return next(error);
    }
}
export async function getRecord(req, res, next) {
    try {
        const userId = userIdFrom(req);
        const { id } = req.params;
        const record = await svc.getRecord(userId, id);
        return sendSuccess(res, record, "Record detail");
    }
    catch (error) {
        return next(error);
    }
}
export async function deleteRecord(req, res, next) {
    try {
        const userId = userIdFrom(req);
        const { id } = req.params;
        await svc.deleteRecord(userId, id);
        await logSink.append({ endpoint: `/api/records/${id}`, method: "DELETE", userId, status: "success" });
        return sendSuccess(res, { id }, "Record deleted");
    }
    catch (error) {
        return next(error);
    }
}
