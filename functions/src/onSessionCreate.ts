import { onDocumentCreated } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";

// Initialize admin if not already done
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

interface SessionData {
  uid: string;
  gameId: string;
  phase: number;
  scorePct?: number;
  attempts: Array<{
    itemId: string;
    correct: boolean;
    firstTry: boolean;
    timeMs: number;
    ts: number;
  }>;
}

// On session write: update student progress + summary
export const onSessionCreate = onDocumentCreated(
  "students/{sid}/sessions/{sessionId}",
  async (event) => {
    const snap = event.data;
    if (!snap) return;
    
    const session = snap.data() as SessionData;
    const sid = event.params.sid;

    // Compute score band + mastery delta (simple heuristic)
    const score = session.scorePct ?? 0;
    const scoreBand = 
      score < 21 ? "0-20" : 
      score < 41 ? "21-40" : 
      score < 61 ? "41-60" : 
      score < 81 ? "61-80" : 
      "81-100";
    const masteryDelta = score >= 80 ? +1 : score >= 60 ? 0 : -1;

    // Update per-game progress
    const progRef = db.doc(`students/${sid}/progress/${session.gameId}`);
    await db.runTransaction(async tx => {
      const prev = await tx.get(progRef);
      const now = Date.now();
      let mastery = prev.exists ? (prev.data()!.mastery as string) : "not_started";
      const order: string[] = ["not_started", "emerging", "developing", "proficient", "mastered"];
      let idx = Math.max(0, order.indexOf(mastery));
      idx = Math.min(4, Math.max(0, idx + masteryDelta));
      mastery = order[idx];

      tx.set(progRef, {
        mastery,
        lastPlayedAt: now,
        scoreBand,
        streak: (prev.exists && score >= 80) ? (prev.data()!.streak || 0) + 1 : 0
      }, { merge: true });
    });

    // Update student summary (weakest skills naive impl: lowest mastery games)
    const progs = await db.collection(`students/${sid}/progress`).get();
    const byArea: Record<string, number> = { phonics: 0, grammar: 0, speaking: 0, spellbee: 0 };
    const map = new Map<string, number>([
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
