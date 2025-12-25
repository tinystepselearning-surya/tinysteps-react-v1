import { onCall, HttpsError } from "firebase-functions/v2/https";
import { logger } from "firebase-functions";
import * as admin from "firebase-admin";

if (!admin.apps.length) admin.initializeApp();

type ChunkDoc = {
  url: string;
  path: string;
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

// Keep list small + high-signal pages first.
const DEFAULT_PATHS = [
  "/",
  "/pricing",
  "/courses",
  "/curriculum",
  "/blog",
  "/why-tiny-steps",
  "/how-it-works",
  "/faq",
];

// --------------------
// Admin check helpers
// --------------------
async function assertAdmin(request: any) {
  if (!request.auth?.uid) throw new HttpsError("unauthenticated", "Login required.");
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
    logger.warn("refreshPublicKb: admin role check failed", e as any);
  }

  throw new HttpsError("permission-denied", "Admin only.");
}

// --------------------
// URL/path helpers
// --------------------
function normalizePath(p: string) {
  const s = String(p || "").trim();
  if (!s) return "/";
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  return s.startsWith("/") ? s : `/${s}`;
}

function toUrl(pathOrUrl: string) {
  const s = normalizePath(pathOrUrl);
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  return `${SITE_ORIGIN}${s}`;
}

function toPath(pathOrUrl: string) {
  const s = String(pathOrUrl || "").trim();
  if (!s) return "/";
  if (s.startsWith("http://") || s.startsWith("https://")) {
    try {
      const u = new URL(s);
      return u.pathname || "/";
    } catch {
      return "/";
    }
  }
  return normalizePath(s);
}

// --------------------
// HTML -> text helpers (no deps)
// --------------------
function decodeEntities(s: string) {
  return s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function extractTitle(html: string) {
  const m = String(html || "").match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? decodeEntities(m[1]).replace(/\s+/g, " ").trim().slice(0, 140) : "";
}

function stripHtmlToText(html: string) {
  let s = String(html || "");

  // remove scripts/styles/noscript/svg
  s = s.replace(/<script[\s\S]*?<\/script>/gi, " ");
  s = s.replace(/<style[\s\S]*?<\/style>/gi, " ");
  s = s.replace(/<noscript[\s\S]*?<\/noscript>/gi, " ");
  s = s.replace(/<svg[\s\S]*?<\/svg>/gi, " ");

  // add line breaks for structure
  s = s.replace(/<(br|BR)\s*\/?>/g, "\n");
  s = s.replace(/<\/(p|div|section|article|li|h1|h2|h3|h4|h5|h6)>/gi, "\n");

  // remove tags
  s = s.replace(/<[^>]+>/g, " ");

  // decode entities and normalize
  s = decodeEntities(s);
  s = s.replace(/\r/g, " ");
  s = s.replace(/[ \t]+/g, " ");
  s = s.replace(/\n\s*\n\s*\n+/g, "\n\n");
  s = s.trim();

  return s;
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
    .filter((t) => t.length >= 2) // drop 1-letter noise
    .slice(0, 6000);
}

function uniqTokenCap(tokens: string[], max = 140) {
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

function chunkText(text: string, maxLen = 1100, minLen = 650): string[] {
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
    // huge paragraph -> split by sentences
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

// --------------------
// Firestore helpers
// --------------------
async function deactivateAllForUrl(url: string, runId: string) {
  const col = admin.firestore().collection("public_kb_chunks");

  let last: admin.firestore.QueryDocumentSnapshot | null = null;
  let updated = 0;

  while (true) {
    let q = col
      .where("url", "==", url)
      .orderBy(admin.firestore.FieldPath.documentId())
      .limit(400);

    if (last) q = q.startAfter(last);

    const snap = await q.get();
    if (snap.empty) break;

    const batch = admin.firestore().batch();
    snap.docs.forEach((d) => {
      batch.update(d.ref, {
        active: false,
        runId,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      updated += 1;
    });

    await batch.commit();

    last = snap.docs[snap.docs.length - 1];
    if (snap.size < 400) break;
  }

  return updated;
}

function chunkDocId(url: string, idx: number) {
  const safe = url
    .replace(/https?:\/\//, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .slice(0, 120);
  return `${safe}__${String(idx).padStart(3, "0")}`;
}

// --------------------
// Callable
// --------------------
export const refreshPublicKb = onCall(
  {
    region: "asia-south1",
    timeoutSeconds: 180,
    memory: "512MiB",
    // If you ever still see CORS issues after deploy, uncomment:
    // cors: ["https://tinystepslearning.com", "https://tinysteps-react-v1.web.app", /localhost:\d+$/],
  },
  async (request) => {
    await assertAdmin(request);

    const rawPaths =
      Array.isArray(request.data?.paths) && request.data.paths.length
        ? request.data.paths
        : DEFAULT_PATHS;

    // normalize + cap
    const paths = rawPaths
      .map((p: any) => String(p || "").trim())
      .filter(Boolean)
      .slice(0, 25);

    const runId = `run_${Date.now().toString(36)}`;

    const results: any[] = [];
    let totalChunks = 0;
    let pagesOk = 0;

    for (const p of paths) {
      const url = toUrl(p);
      const path = toPath(p);

      logger.info("refreshPublicKb: fetching", { url, path });

      try {
        const res = await fetch(url, {
          method: "GET",
          headers: {
            "user-agent": "TinyStepsBotIndexer/1.0",
            accept: "text/html",
          },
        });

        if (!res.ok) {
          results.push({ url, path, ok: false, status: res.status });
          continue;
        }

        const html = await res.text();
        const title = extractTitle(html) || "Tiny Steps";
        const text = stripHtmlToText(html);

        if (!text || text.length < 200) {
          results.push({ url, path, ok: false, reason: "too_little_text" });
          continue;
        }

        const chunks = chunkText(text, 1100, 650);
        if (chunks.length === 0) {
          results.push({ url, path, ok: false, reason: "no_chunks" });
          continue;
        }

        // deactivate old docs
        const deactivated = await deactivateAllForUrl(url, runId);

        // write new chunks deterministically (await every commit ✅)
        const col = admin.firestore().collection("public_kb_chunks");

        const batchSize = 400;
        let batch = admin.firestore().batch();
        let ops = 0;

        for (let idx = 0; idx < chunks.length; idx++) {
          const chunk = chunks[idx];
          const docId = chunkDocId(url, idx);
          const ref = col.doc(docId);

          const tokens = uniqTokenCap(tokenize(`${title} ${chunk}`), 140);

          const doc: ChunkDoc = {
            url,
            path,
            title,
            text: chunk,
            tokens,
            active: true,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            runId,
          };

          batch.set(ref, doc, { merge: true });
          ops += 1;
          totalChunks += 1;

          if (ops >= batchSize) {
            await batch.commit();
            batch = admin.firestore().batch();
            ops = 0;
          }
        }

        if (ops > 0) await batch.commit();

        pagesOk += 1;
        results.push({
          url,
          path,
          ok: true,
          title,
          chunks: chunks.length,
          deactivated,
        });
      } catch (e: any) {
        logger.error("refreshPublicKb: failed", { url, path, error: e?.message || String(e) });
        results.push({ url, path, ok: false, error: e?.message || String(e) });
      }
    }

    return {
      ok: true,
      runId,
      pagesRequested: paths.length,
      pagesOk,
      totalChunks,
      results,
    };
  }
);

export default refreshPublicKb;
