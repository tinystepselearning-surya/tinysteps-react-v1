"use strict";
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
exports.createAdmin = void 0;
const https_1 = require("firebase-functions/v2/https");
const params_1 = require("firebase-functions/params");
const admin = __importStar(require("firebase-admin"));
admin.apps.length || admin.initializeApp();
const bootstrapToken = (0, params_1.defineSecret)("BOOTSTRAP_TOKEN");
exports.createAdmin = (0, https_1.onRequest)({
    region: "us-central1",
    secrets: [bootstrapToken]
}, async (req, res) => {
    try {
        const allowed = bootstrapToken.value();
        const token = req.get("X-Bootstrap-Token") || "";
        if (!allowed || token !== allowed) {
            res.status(401).json({ ok: false, error: "Unauthorized: bad token" });
            return;
        }
        if (req.method !== "POST") {
            res.status(405).json({ ok: false, error: "Use POST" });
            return;
        }
        const { email, username, name, createIfMissing } = req.body || {};
        if (!email) {
            res.status(400).json({ ok: false, error: "Missing email" });
            return;
        }
        let user;
        try {
            user = await admin.auth().getUserByEmail(email);
        }
        catch {
            if (createIfMissing) {
                user = await admin.auth().createUser({
                    email,
                    emailVerified: true,
                    password: "Temp@123456"
                });
            }
            else {
                res.status(404).json({ ok: false, error: `User not found: ${email}` });
                return;
            }
        }
        await admin.auth().setCustomUserClaims(user.uid, { role: "admin" });
        await admin.auth().revokeRefreshTokens(user.uid);
        const db = admin.firestore();
        const uname = (username || email.split("@")[0]).trim();
        const usernameLower = uname.toLowerCase();
        await db.doc(`usernames/${usernameLower}`).set({ uid: user.uid });
        await db.doc(`users/${user.uid}`).set({
            email,
            username: uname,
            usernameLower,
            displayName: name || user.displayName || uname,
            role: "admin",
            status: "active",
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            createdBy: "bootstrap-fn"
        }, { merge: true });
        res.status(200).json({ ok: true, uid: user.uid, username: uname });
    }
    catch (err) {
        console.error("[createAdmin] Error:", err?.stack || err?.message || String(err));
        res.status(500).json({ ok: false, error: err?.message || String(err) });
    }
});
