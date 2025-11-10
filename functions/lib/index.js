"use strict";
/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminCreateUser = exports.adminResetPassword = exports.getUidByEmail = exports.setUserRole = void 0;
const firebase_functions_1 = require("firebase-functions");
const logger = __importStar(require("firebase-functions/logger"));
// Start writing functions
// https://firebase.google.com/docs/functions/typescript
// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
(0, firebase_functions_1.setGlobalOptions)({ maxInstances: 10 });
// Import required modules for the new function
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
// Initialize Firebase Admin SDK
if (!admin.apps.length) {
    admin.initializeApp();
}
// Allowed roles
const ALLOWED_ROLES = ["admin", "teacher", "parent", "kid", "learningPartner"];
/**
 * Cloud Function to set user roles and custom claims.
 * Only callable by admins. Sets custom claims on Firebase Auth users for RBAC.
 *
 * @param data - The input data containing uid and role.
 * @param context - The callable context containing auth information.
 * @returns Promise<SetUserRoleSuccessResponse | SetUserRoleErrorResponse>
 */
exports.setUserRole = (0, https_1.onCall)({
    region: "asia-south1",
    memory: "256MiB",
    timeoutSeconds: 60,
}, async (data, context) => {
    var _a, _b, _c;
    const now = new Date().toISOString();
    try {
        // Security check: Only admins can call this function
        if (!context.auth || !context.auth.token.admin) {
            const errorMsg = `Unauthorized setUserRole attempt by uid=${((_a = context.auth) === null || _a === void 0 ? void 0 : _a.uid) || 'unknown'}`;
            logger.warn(errorMsg);
            throw new https_1.HttpsError("permission-denied", "Admin access required");
        }
        // Input validation
        const { uid, role } = data;
        if (!uid || typeof uid !== "string" || uid.length !== 28) {
            throw new https_1.HttpsError("invalid-argument", "Invalid uid: must be a 28-character string");
        }
        if (!role || !ALLOWED_ROLES.includes(role)) {
            throw new https_1.HttpsError("invalid-argument", `Invalid role: must be one of ${ALLOWED_ROLES.join(", ")}`);
        }
        // Get current user to check old role for logging
        let oldRole = "none";
        try {
            const user = await admin.auth().getUser(uid);
            oldRole = ((_b = user.customClaims) === null || _b === void 0 ? void 0 : _b.role) || "none";
        }
        catch (error) {
            // User might not exist, but we'll proceed to set claims anyway
            logger.info(`User ${uid} not found or no custom claims, proceeding to set role`);
        }
        // Set custom claims
        const customClaims = {
            admin: role === "admin",
            teacher: role === "teacher",
            parent: role === "parent",
            kid: role === "kid",
            learningPartner: role === "learningPartner",
            role: role,
        };
        await admin.auth().setCustomUserClaims(uid, customClaims);
        // Log successful operation
        const logMsg = `Role updated: uid=${uid}, oldRole=${oldRole}, newRole=${role}, changedBy=${context.auth.uid}, timestamp=${now}`;
        logger.info(logMsg);
        // Return success response
        const response = {
            success: true,
            uid,
            role,
            message: `User role updated successfully to ${role}`,
            timestamp: now,
        };
        return response;
    }
    catch (error) {
        // Handle known HttpsError
        const httpError = error;
        if (httpError.code) {
            const errorResponse = {
                success: false,
                error: httpError.message,
                code: httpError.code,
            };
            return errorResponse;
        }
        // Handle unexpected errors
        logger.error("Unexpected error in setUserRole", { error, uid: data.uid, role: data.role, caller: (_c = context.auth) === null || _c === void 0 ? void 0 : _c.uid });
        const errorResponse = {
            success: false,
            error: "An unexpected error occurred. Please try again.",
            code: "internal",
        };
        return errorResponse;
    }
});
exports.getUidByEmail = (0, https_1.onCall)({
    region: "asia-south1",
    memory: "256MiB",
    timeoutSeconds: 60,
}, async (data, context) => {
    try {
        // Security check: Only admins can call this function
        if (!context.auth || !context.auth.token.admin) {
            throw new https_1.HttpsError("permission-denied", "Admin access required");
        }
        const { email } = data;
        if (!email || typeof email !== "string") {
            throw new https_1.HttpsError("invalid-argument", "Invalid email");
        }
        const user = await admin.auth().getUserByEmail(email);
        return { uid: user.uid };
    }
    catch (error) {
        const httpError = error;
        if (httpError.code) {
            throw httpError;
        }
        throw new https_1.HttpsError("internal", "Failed to get UID");
    }
});
/**
 * Cloud Function to reset a user's password.
 * Only callable by admins. Updates the user's password in Firebase Auth.
 *
 * @param data - The input data containing uid and newPassword.
 * @param context - The callable context containing auth information.
 * @returns Promise<AdminResetPasswordResponse>
 */
exports.adminResetPassword = (0, https_1.onCall)({
    region: "asia-south1",
    memory: "256MiB",
    timeoutSeconds: 60,
}, async (data, context) => {
    var _a, _b;
    const now = new Date().toISOString();
    try {
        // Security check: Only admins can call this function
        if (!context.auth || !context.auth.token.admin) {
            const errorMsg = `Unauthorized adminResetPassword attempt by uid=${((_a = context.auth) === null || _a === void 0 ? void 0 : _a.uid) || 'unknown'}`;
            logger.warn(errorMsg);
            throw new https_1.HttpsError("permission-denied", "Admin access required");
        }
        // Input validation
        const { uid, newPassword } = data;
        if (!uid || typeof uid !== "string" || uid.length !== 28) {
            throw new https_1.HttpsError("invalid-argument", "Invalid uid: must be a 28-character string");
        }
        if (!newPassword || typeof newPassword !== "string" || newPassword.length < 6) {
            throw new https_1.HttpsError("invalid-argument", "Invalid password: must be at least 6 characters");
        }
        // Update user password
        await admin.auth().updateUser(uid, {
            password: newPassword,
        });
        // Log successful operation
        const logMsg = `Password reset: uid=${uid}, changedBy=${context.auth.uid}, timestamp=${now}`;
        logger.info(logMsg);
        // Return success response
        const response = {
            success: true,
            message: "Password reset successfully",
            timestamp: now,
        };
        return response;
    }
    catch (error) {
        // Handle known HttpsError
        const httpError = error;
        if (httpError.code) {
            throw httpError;
        }
        // Handle unexpected errors
        logger.error("Unexpected error in adminResetPassword", { error, uid: data.uid, caller: (_b = context.auth) === null || _b === void 0 ? void 0 : _b.uid });
        throw new https_1.HttpsError("internal", "An unexpected error occurred. Please try again.");
    }
});
// Export the adminCreateUser function
var adminCreateUser_1 = require("./adminCreateUser");
Object.defineProperty(exports, "adminCreateUser", { enumerable: true, get: function () { return adminCreateUser_1.adminCreateUser; } });
//# sourceMappingURL=index.js.map