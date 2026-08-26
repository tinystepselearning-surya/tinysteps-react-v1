import { useEffect, useMemo, useState } from "react";
import { doc, getDoc } from "firebase/firestore";

import { db } from "../../../../lib/firebaseConfig";
import { queryClient } from "../../../../lib/queryClient";
import {
  currentIndiaMonthKey,
  requestClassAttendanceBootstrap,
} from "../../../../lib/parentCanonicalProjectionBootstrap";
import {
  parentChildClassAttendanceInvariantErrors,
  selectCanonicalParentChildMonthClassAttendance,
  type MaterializedParentChildMonthClassAttendance,
  type ParentClassAttendanceReadModel,
} from "../../../../lib/parentClassAttendanceProjection";
import { useAuthStore } from "../../../../store/useAuthStore";

export type ParentCanonicalClassMonthState =
  | "idle"
  | "loading"
  | "available"
  | "unavailable"
  | "error";

type ParentMonthlyReadModelEnvelope = {
  attendance?: ParentClassAttendanceReadModel | null;
};

type ParentKidIdentity = {
  id?: string;
};

type ParentCanonicalClassMonthSnapshot = {
  state: ParentCanonicalClassMonthState;
  monthKey: string;
  monthLabel: string;
  row: MaterializedParentChildMonthClassAttendance | null;
};

const repairAttempted = new Set<string>();

function formatMonthLabel(monthKey: string): string {
  const [yearRaw, monthRaw] = String(monthKey || "").split("-");
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
    return "This month";
  }
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
}

function requestedKidIdFromLocation(): string {
  if (typeof window === "undefined") return "";
  return String(new URLSearchParams(window.location.search).get("kidId") || "").trim();
}

/**
 * Mirrors ParentDashboard child-selection semantics without adding another Firestore read.
 * The parent kids query is already loaded under ["parentKids", parentId]. A valid URL kidId
 * wins; otherwise the first linked child is the dashboard default. Invalid/stale URL ids never
 * become a canonical P4 lookup key.
 */
export function resolveParentClassKidId(
  requestedKidId: string,
  cachedKids: readonly ParentKidIdentity[] | null | undefined,
): string {
  const kidIds = (cachedKids || [])
    .map((kid) => String(kid?.id || "").trim())
    .filter(Boolean);
  const requested = String(requestedKidId || "").trim();
  if (requested && kidIds.includes(requested)) return requested;
  return kidIds[0] || "";
}

async function readParentMonth(parentId: string, monthKey: string): Promise<ParentMonthlyReadModelEnvelope | null> {
  const snap = await getDoc(
    doc(db, "parentMonthlyReadModels", parentId, "months", monthKey),
  );
  return snap.exists() ? (snap.data() as ParentMonthlyReadModelEnvelope) : null;
}

function selectValidChildRow(
  envelope: ParentMonthlyReadModelEnvelope | null,
  kidId: string,
): MaterializedParentChildMonthClassAttendance | null {
  const row = selectCanonicalParentChildMonthClassAttendance(
    envelope?.attendance,
    kidId,
    Date.now(),
  );
  if (!row) return null;
  return parentChildClassAttendanceInvariantErrors(row).length === 0 ? row : null;
}

/**
 * P8 class-month reader.
 *
 * This deliberately reuses the existing monthly read-model document and the same React Query
 * cache key used by the Overview. Opening Classes directly therefore costs at most one bounded
 * monthly-document read; navigating from Overview normally reuses the cached document.
 *
 * Child identity is resolved from the already-cached ParentDashboard kids query so a normal
 * dashboard entry with no kidId URL parameter still selects the same first child as the shell.
 * No extra child lookup is introduced.
 *
 * The selected child row is strict P4 schema v3. Family totals and legacy attendance aliases
 * are never substituted when byKid[kidId] is missing.
 */
export function useParentCanonicalClassMonth(): ParentCanonicalClassMonthSnapshot {
  const { user } = useAuthStore();
  const parentId = String(user?.uid || "").trim();
  const cachedKids = parentId
    ? queryClient.getQueryData<ParentKidIdentity[]>(["parentKids", parentId])
    : undefined;
  const kidId = resolveParentClassKidId(requestedKidIdFromLocation(), cachedKids);
  const monthKey = currentIndiaMonthKey();
  const monthLabel = useMemo(() => formatMonthLabel(monthKey), [monthKey]);
  const [snapshot, setSnapshot] = useState<ParentCanonicalClassMonthSnapshot>({
    state: parentId && kidId ? "loading" : "idle",
    monthKey,
    monthLabel,
    row: null,
  });

  useEffect(() => {
    let disposed = false;

    if (!parentId || !kidId) {
      setSnapshot({ state: "idle", monthKey, monthLabel, row: null });
      return () => {
        disposed = true;
      };
    }

    const queryKey = ["parentMonthlyBillingReadModel", parentId, monthKey] as const;
    const repairKey = `${parentId}:${kidId}:${monthKey}`;

    // Never carry one selected child's class row across an identity/month switch while the
    // replacement row is loading. This is both a correctness and privacy boundary.
    setSnapshot({ state: "loading", monthKey, monthLabel, row: null });

    const fetchEnvelope = (staleTime: number) =>
      queryClient.fetchQuery<ParentMonthlyReadModelEnvelope | null>({
        queryKey,
        queryFn: () => readParentMonth(parentId, monthKey),
        staleTime,
      });

    const run = async () => {
      try {
        let envelope = await fetchEnvelope(2 * 60 * 1000);
        let row = selectValidChildRow(envelope, kidId);

        if (!row && !repairAttempted.has(repairKey)) {
          repairAttempted.add(repairKey);
          try {
            await requestClassAttendanceBootstrap(kidId, monthKey);
            await queryClient.invalidateQueries({ queryKey });
            envelope = await fetchEnvelope(0);
            row = selectValidChildRow(envelope, kidId);
          } catch {
            // The strict unavailable state below is intentional. Do not fall back to family totals.
          }
        }

        if (disposed) return;
        setSnapshot({
          state: row ? "available" : "unavailable",
          monthKey,
          monthLabel,
          row,
        });
      } catch {
        if (disposed) return;
        setSnapshot({ state: "error", monthKey, monthLabel, row: null });
      }
    };

    void run();
    return () => {
      disposed = true;
    };
  }, [kidId, monthKey, monthLabel, parentId]);

  return snapshot;
}
