import type { Item, Attempt, Session, Phase } from "../types";

type EngineEvents =
  | { type: "ROUND_START"; item: Item }
  | { type: "CHOICE"; choiceIndex: number; correct: boolean; timeMs: number; firstTry: boolean }
  | { type: "ASSIST"; hint: "highlight" | "replay" | "slowdown" }
  | { type: "ROUND_END" }
  | { type: "SESSION_END"; scorePct: number };

export interface EngineConfig {
  uid: string;
  gameId: string;
  phase: Phase;
  ageYears: number;
  optionsPerRound: number;     // e.g., 3..6
  speedCapMs: number;          // min time before respawn (age/phase-based)
  maxRounds: number;           // e.g., 6..12
  assistPolicy: { highlightOnTwoMisses: boolean; allowReplay: boolean };
  picker: () => Item | null;   // supplies next item (adaptive selector)
  onEvent: (e: EngineEvents) => void; // telemetry sink (can write to Firestore)
}

export class GameEngine {
  private cfg: EngineConfig;
  private session: Session;
  private roundStartAt = 0;
  private currentItem: Item | null = null;
  private firstTry = true;

  constructor(cfg: EngineConfig) {
    this.cfg = cfg;
    this.session = {
      id: crypto.randomUUID(),
      uid: cfg.uid,
      gameId: cfg.gameId,
      phase: cfg.phase,
      startedAt: Date.now(),
      itemsServed: [],
      attempts: []
    };
  }

  startRound() {
    const next = this.cfg.picker();
    if (!next) return this.endSession();
    this.currentItem = next;
    this.firstTry = true;
    this.roundStartAt = performance.now();
    this.session.itemsServed.push(next.id);
    this.cfg.onEvent({ type: "ROUND_START", item: next });
  }

  choose(choiceIndex: number) {
    if (!this.currentItem) return;
    const elapsed = performance.now() - this.roundStartAt;
    const correct = choiceIndex === this.currentItem.answerIndex;
    const attempt: Attempt = {
      itemId: this.currentItem.id,
      correct,
      firstTry: this.firstTry,
      timeMs: Math.round(elapsed),
      ts: Date.now()
    };
    this.session.attempts.push(attempt);
    this.cfg.onEvent({
      type: "CHOICE",
      choiceIndex,
      correct,
      timeMs: attempt.timeMs,
      firstTry: this.firstTry
    });

    if (correct) {
      this.cfg.onEvent({ type: "ROUND_END" });
      if (this.session.itemsServed.length >= this.cfg.maxRounds) return this.endSession();
      this.startRound();
    } else {
      this.firstTry = false;
      // assistance hook (UI listens for ASSIST to glow correct balloon etc.)
      if (this.cfg.assistPolicy.highlightOnTwoMisses) {
        const missesOnThisItem = this.session.attempts.filter(
          a => a.itemId === this.currentItem!.id && !a.correct
        ).length;
        if (missesOnThisItem === 2) this.cfg.onEvent({ type: "ASSIST", hint: "highlight" });
      }
    }
  }

  endSession() {
    const correct = this.session.attempts.filter(a => a.correct && a.firstTry).length;
    const scorePct = Math.round((correct / Math.max(1, this.session.itemsServed.length)) * 100);
    this.session.endedAt = Date.now();
    this.session.scorePct = scorePct;
    this.cfg.onEvent({ type: "SESSION_END", scorePct });
  }

  getSession(): Session {
    return this.session;
  }

  getCurrentItem(): Item | null {
    return this.currentItem;
  }
}
