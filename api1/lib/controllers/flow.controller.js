import { sendSuccess } from "../utils/http.js";
import { getFlowTips } from "../services/flow.service.js";
export async function getTips(_req, res, next) {
    try {
        const data = getFlowTips();
        return sendSuccess(res, data, "Flow tips");
    }
    catch (error) {
        return next(error);
    }
}
