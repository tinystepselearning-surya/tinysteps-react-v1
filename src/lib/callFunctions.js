var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var _a, _b;
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from './firebaseConfig';
// Map known callable functions to the regions where they are actually deployed.
// This avoids relying on env misconfigurations and ensures game functions hit us-central1.
const FUNCTION_REGION_OVERRIDES = {
    // Game / Groq-backed functions (us-central1)
    // (game-related functions removed)
    // Admin / payments / LP functions (asia-south1)
    verifyPhonePePayment: 'asia-south1',
    setUserRole: 'asia-south1',
    adminResetPassword: 'asia-south1',
    adminCreateUser: 'asia-south1',
    webhookPhonePe: 'asia-south1',
    assignLPToParent: 'asia-south1',
    unassignLPFromParent: 'asia-south1',
    createRazorpayOrder: 'asia-south1',
    unassignLPFromTeacher: 'asia-south1',
    createPhonePeOrder: 'asia-south1',
    adminGenerateResetLink: 'asia-south1',
    assignLPToTeacher: 'asia-south1',
    adminProcessEnrollmentCSV: 'asia-south1',
    getUidByEmail: 'asia-south1',
    subscribeNewsletter: 'asia-south1',
};
const FALLBACK_REGIONS = Array.from(new Set([(_b = (_a = import.meta) === null || _a === void 0 ? void 0 : _a.env) === null || _b === void 0 ? void 0 : _b.VITE_FUNCTIONS_REGION, 'us-central1', 'asia-south1'].filter(Boolean)));
/**
 * Calls a Firebase callable function, preferring the region where it is actually deployed.
 * Falls back across known regions if needed. Throws the last error if all regions fail.
 */
export function callFunction(name, payload) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        const preferredRegion = FUNCTION_REGION_OVERRIDES[name];
        const regionsToTry = preferredRegion
            ? [preferredRegion, ...FALLBACK_REGIONS.filter((r) => r !== preferredRegion)]
            : FALLBACK_REGIONS;
        let lastError = null;
        for (const region of regionsToTry) {
            try {
                const client = getFunctions(app, region);
                const fn = httpsCallable(client, name);
                const resp = yield fn(payload);
                return (_a = resp === null || resp === void 0 ? void 0 : resp.data) !== null && _a !== void 0 ? _a : resp;
            }
            catch (err) {
                lastError = err;
                // Surface details in dev to help diagnose auth/region/network issues.
                if ((_b = import.meta.env) === null || _b === void 0 ? void 0 : _b.DEV) {
                    console.error(`Callable ${name} failed in region ${region}`, err);
                }
            }
        }
        if (lastError) {
            throw lastError;
        }
        throw new Error(`Callable ${name} failed in all regions`);
    });
}
export default callFunction;
