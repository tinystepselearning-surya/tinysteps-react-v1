// functions/src/ai/refreshPublicKb.ts
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { logger } from "firebase-functions";
import * as admin from "firebase-admin";

if (!admin.apps.length) admin.initializeApp();

type KbEntry = {
  path: string;
  title: string;
  text: string;
};

type ChunkDoc = {
  url: string;
  title: string;
  text: string;
  tokens: string[];
  active: boolean;
  updatedAt: admin.firestore.FieldValue;
  runId: string;
};

// --------------------
// Config
// --------------------
const SITE_ORIGIN = "https://tinystepslearning.com";
const KB_JSON_URL = `${SITE_ORIGIN}/kb.json`;

// Keep list small + high-signal pages first.
const DEFAULT_PATHS = [
  "/",
  "/pricing",
  "/courses",
  "/faq",
  "/how-it-works",
  "/why-tiny-steps",
  "/curriculum",
];

// --------------------
// Admin check helpers
// --------------------
async function assertAdmin(request: any) {
  if (!request.auth?.uid) {
    throw new HttpsError("unauthenticated", "Login required.");
  }

  const uid = request.auth.uid;

  // Prefer custom claims if you use them
  const tokenRole = request.auth.token?.role;
  const tokenIsAdmin = request.auth.token?.admin === true;
  if (tokenIsAdmin || tokenRole === "admin" || tokenRole === "superadmin") return;

  // Fallback: users/{uid}.role in Firestore
  try {
    const snap = await admin.firestore().doc(`users/${uid}`).get();
    const role = snap.exists ? (snap.data() as any)?.role : null;
    if (role === "admin" || role === "superadmin") return;
  } catch (e) {
    logger.warn("refreshPublicKb: admin role check failed", e);
  }

  throw new HttpsError("permission-denied", "Admin only.");
}

// --------------------
// Chunking + tokenizing
// --------------------
function tokenize(text: string): string[] {
  return String(text || "")
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .filter((t) => t.length >= 2)
    .slice(0, 5000);
}

function uniqTokenCap(tokens: string[], max = 120) {
  const set = new Set<string>();
  const out: string[] = [];
  for (const t of tokens) {
    if (!set.has(t)) {
      set.add(t);
      out.push(t);
      if (out.length >= max) break;
    }
  }
  return out;
}

function chunkText(text: string, maxLen = 1100, minLen = 450): string[] {
  const t = String(text || "").trim();
  if (!t) return [];

  const paras = t.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);

  const chunks: string[] = [];
  let buf = "";

  const flush = () => {
    const out = buf.trim();
    if (out) chunks.push(out);
    buf = "";
  };

  for (const p of paras) {
    if (p.length > maxLen * 1.5) {
      const sentences = p.split(/(?<=[.!?])\s+/);
      for (const s of sentences) {
        if (!s.trim()) continue;
        if ((buf + " " + s).trim().length > maxLen) flush();
        buf = (buf + " " + s).trim();
      }
      if (buf.length >= minLen) flush();
      continue;
    }

    if ((buf + "\n\n" + p).trim().length > maxLen) flush();
    buf = buf ? `${buf}\n\n${p}` : p;

    if (buf.length >= minLen) flush();
  }

  flush();
  return chunks.slice(0, 40);
}

function normalizePath(p: string) {
  const s = String(p || "").trim();
  if (!s) return "/";
  return s.startsWith("/") ? s : `/${s}`;
}

function pageUrlFromPath(path: string) {
  return `${SITE_ORIGIN}${normalizePath(path)}`;
}

function chunkDocId(url: string, idx: number) {
  const safe = url
    .replace(/https?:\/\//, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .slice(0, 120);
  return `${safe}__${String(idx).padStart(3, "0")}`;
}

// --------------------
// Firestore write helpers
// --------------------
async function deactivateAllForUrl(url: string) {
  const col = admin.firestore().collection("public_kb_chunks");
  let last: admin.firestore.QueryDocumentSnapshot | null = null;

  while (true) {
    let q = col
      .where("url", "==", url)
      .orderBy(admin.firestore.FieldPath.documentId())
      .limit(400);

    if (last) q = q.startAfter(last);

    const snap = await q.get();
    if (snap.empty) break;

    const batch = admin.firestore().batch();
    snap.docs.forEach((d) => batch.update(d.ref, { active: false }));
    await batch.commit();

    last = snap.docs[snap.docs.length - 1];
    if (snap.size < 400) break;
  }
}

// --------------------
// Fetch kb.json
// --------------------
async function fetchKbJson(): Promise<KbEntry[]> {
  const res = await fetch(KB_JSON_URL, {
    method: "GET",
    headers: { accept: "application/json" },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`kb.json fetch failed: ${res.status}`);
  }

  const data = (await res.json()) as any;
  if (!Array.isArray(data)) throw new Error("kb.json is not an array");

  const out: KbEntry[] = data
    .map((x: any) => ({
      path: normalizePath(x?.path),
      title: String(x?.title || "").trim(),
      text: String(x?.text || "").trim(),
    }))
    .filter((e) => e.path && e.title && e.text);

  return out;
}

// --------------------
// Callable
// --------------------
export const refreshPublicKb = onCall(
  {
    region: "asia-south1",
    timeoutSeconds: 180,
    memory: "512MiB",
  },
  async (request) => {
    await assertAdmin(request);

    const runId = `run_${Date.now().toString(36)}`;

    // If caller passes paths, index only those. Else index DEFAULT_PATHS.
    const requestedPaths: string[] =
      Array.isArray(request.data?.paths) && request.data.paths.length
        ? request.data.paths.map(normalizePath)
        : DEFAULT_PATHS;

    const wanted = new Set(requestedPaths.map(normalizePath));

    let entries: KbEntry[] = [];
    try {
      entries = await fetchKbJson();
    } catch (e: any) {
      logger.error("refreshPublicKb: failed to load kb.json", {
        error: e?.message || String(e),
      });
      throw new HttpsError("internal", "Failed to load kb.json from hosting.");
    }

    const selected = entries.filter((e) => wanted.has(normalizePath(e.path)));

    const results: any[] = [];
    let totalChunks = 0;
    let pagesOk = 0;

    for (const entry of selected) {
      const url = pageUrlFromPath(entry.path);
      const title = entry.title;
      const rawText = entry.text;

      // kb.json is curated; allow smaller pages too
      if (!rawText || rawText.length < 80) {
        results.push({ url, path: entry.path, ok: false, reason: "too_little_text" });
        continue;
      }

      try {
        const chunks = chunkText(rawText, 1100, 450);

        await deactivateAllForUrl(url);

        const col = admin.firestore().collection("public_kb_chunks");
        const batch = admin.firestore().batch();

        chunks.forEach((chunk, idx) => {
          const ref = col.doc(chunkDocId(url, idx));

          const doc: ChunkDoc = {
            url,
            title,
            text: chunk,
            tokens: uniqTokenCap(tokenize(chunk), 120),
            active: true,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            runId,
          };

          batch.set(ref, doc, { merge: true });
          totalChunks += 1;
        });

        if (chunks.length > 0) await batch.commit();

        pagesOk += 1;
        results.push({ url, path: entry.path, ok: true, chunks: chunks.length, title });
      } catch (e: any) {
        logger.error("refreshPublicKb: write failed", { url, error: e?.message || String(e) });
        results.push({ url, path: entry.path, ok: false, error: e?.message || String(e) });
      }
    }

    // Helpful warning if nothing matched
    if (selected.length === 0) {
      logger.warn("refreshPublicKb: no entries selected from kb.json", {
        requestedPaths,
        kbCount: entries.length,
      });
    }

    return {
      ok: true,
      runId,
      source: "kb.json",
      pagesRequested: requestedPaths.length,
      pagesSelected: selected.length,
      pagesOk,
      totalChunks,
      results,
    };
  }
);

export default refreshPublicKb;
