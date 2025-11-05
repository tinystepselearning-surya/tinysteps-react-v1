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
exports.onSessionCreate = void 0;
const firestore_1 = require("firebase-functions/v2/firestore");
const admin = __importStar(require("firebase-admin"));
// Initialize admin if not already done
if (!admin.apps.length) {
    admin.initializeApp();
}
const db = admin.firestore();
// On session write: update student progress + summary
exports.onSessionCreate = (0, firestore_1.onDocumentCreated)("students/{sid}/sessions/{sessionId}", async (event) => {
    const snap = event.data;
    if (!snap)
        return;
    const session = snap.data();
    const sid = event.params.sid;
    // Compute score band + mastery delta (simple heuristic)
    const score = session.scorePct ?? 0;
    const scoreBand = score < 21 ? "0-20" :
        score < 41 ? "21-40" :
            score < 61 ? "41-60" :
                score < 81 ? "61-80" :
                    "81-100";
    const masteryDelta = score >= 80 ? +1 : score >= 60 ? 0 : -1;
    // Update per-game progress
    const progRef = db.doc(`students/${sid}/progress/${session.gameId}`);
    await db.runTransaction(async (tx) => {
        const prev = await tx.get(progRef);
        const now = Date.now();
        let mastery = prev.exists ? prev.data().mastery : "not_started";
        const order = ["not_started", "emerging", "developing", "proficient", "mastered"];
        let idx = Math.max(0, order.indexOf(mastery));
        idx = Math.min(4, Math.max(0, idx + masteryDelta));
        mastery = order[idx];
        tx.set(progRef, {
            mastery,
            lastPlayedAt: now,
            scoreBand,
            streak: (prev.exists && score >= 80) ? (prev.data().streak || 0) + 1 : 0
        }, { merge: true });
    });
    // Update student summary (weakest skills naive impl: lowest mastery games)
    const progs = await db.collection(`students/${sid}/progress`).get();
    const byArea = { phonics: 0, grammar: 0, speaking: 0, spellbee: 0 };
    const map = new Map([
        ["not_started", 0],
        ["emerging", 25],
        ["developing", 50],
        ["proficient", 75],
        ["mastered", 100]
    ]);
    progs.forEach(p => {
        const m = map.get(p.data().mastery) ?? 0;
        // You can join with games to know area; keeping phonics as default fallback
        const area = "phonics";
        byArea[area] += m;
    });
    // naive avg — replace with join to /games later
    const summaryRef = db.doc(`students/${sid}/summary/overall`);
    await summaryRef.set({
        lastUpdated: Date.now(),
        masteryPct: {
            phonics: byArea.phonics,
            grammar: byArea.grammar,
            speaking: byArea.speaking,
            spellbee: byArea.spellbee
        },
        weakestSkills: [] // TODO: compute from low mastery + recent wrong confusions
    }, { merge: true });
});
