import { useRef, useCallback } from "react";
import { GameEngine } from "../engine/core/GameEngine";
import { selectNextItem, phaseSpeedCapMs, optionsPerRound } from "../engine/adaptive/policy";
import { writeSession } from "../engine/providers/firestoreProgress";
import type { Item, Phase } from "../engine/types";

interface UseBalloonEngineProps {
  uid: string;
  studentId: string;
  gameId: string;
  phase: Phase;
  ageYears: number;
  itemPool: Item[];
  onRoundStart?: (item: Item) => void;
  onChoice?: (correct: boolean, timeMs: number, firstTry: boolean) => void;
  onAssist?: (hint: "highlight" | "replay" | "slowdown") => void;
  onSessionEnd?: (scorePct: number) => void;
}

export function useBalloonEngine({
  uid,
  studentId,
  gameId,
  phase,
  ageYears,
  itemPool,
  onRoundStart,
  onChoice,
  onAssist,
  onSessionEnd
}: UseBalloonEngineProps) {
  const recentRef = useRef<any[]>([]);
  const weakestSkillIdsRef = useRef<string[]>([]); // TODO: fill from summary hook
  const engineRef = useRef<GameEngine | null>(null);

  const initEngine = useCallback(() => {
    const engine = new GameEngine({
      uid,
      gameId,
      phase,
      ageYears,
      maxRounds: 8,
      optionsPerRound: optionsPerRound(phase),
      speedCapMs: phaseSpeedCapMs(phase, ageYears),
      assistPolicy: { highlightOnTwoMisses: true, allowReplay: true },
      picker: () => selectNextItem({
        phase,
        ageYears,
        recent: recentRef.current,
        weakestSkillIds: weakestSkillIdsRef.current,
        pool: itemPool
      }),
      onEvent: (e) => {
        if (e.type === "ROUND_START") {
          onRoundStart?.(e.item);
        } else if (e.type === "CHOICE") {
          recentRef.current.push({
            itemId: engine.getCurrentItem()?.id,
            correct: e.correct,
            firstTry: e.firstTry,
            timeMs: e.timeMs
          });
          onChoice?.(e.correct, e.timeMs, e.firstTry);
        } else if (e.type === "ASSIST") {
          onAssist?.(e.hint);
        } else if (e.type === "SESSION_END") {
          // Write session to Firestore
          writeSession(studentId, engine.getSession()).catch(err => {
            console.error("Failed to write session:", err);
          });
          onSessionEnd?.(e.scorePct);
        }
      }
    });

    engineRef.current = engine;
    return engine;
  }, [uid, studentId, gameId, phase, ageYears, itemPool, onRoundStart, onChoice, onAssist, onSessionEnd]);

  const startRound = useCallback(() => {
    if (!engineRef.current) {
      const engine = initEngine();
      engine.startRound();
    } else {
      engineRef.current.startRound();
    }
  }, [initEngine]);

  const choose = useCallback((choiceIndex: number) => {
    engineRef.current?.choose(choiceIndex);
  }, []);

  const endSession = useCallback(() => {
    engineRef.current?.endSession();
  }, []);

  const getCurrentItem = useCallback(() => {
    return engineRef.current?.getCurrentItem() ?? null;
  }, []);

  return {
    startRound,
    choose,
    endSession,
    getCurrentItem,
    engine: engineRef.current
  };
}
