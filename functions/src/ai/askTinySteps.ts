import { onCall, HttpsError } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { logger } from "firebase-functions";
import Groq from "groq-sdk";
import * as admin from "firebase-admin";

if (!admin.apps.length) admin.initializeApp();

// Canonical Secret Manager secret name.
const GROQ_SECRET = defineSecret("groq-api-key");

type ChatMsg = { role: "user" | "assistant"; content: string };
type Snippet = { url: string; title: string; text: string };

// ---------- Retrieval helpers ----------
function tokenizeForRetrieval(text: string): string[] {
  return String(text || "")
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .filter((t) => t.length >= 2)
    .slice(0, 80);
}

function uniqTop(tokens: string[], n = 10) {
  const set = new Set<string>();
  const out: string[] = [];
  for (const t of tokens) {
    if (!set.has(t)) {
      set.add(t);
      out.push(t);
      if (out.length >= n) break;
    }
  }
  return out;
}

async function retrieveSnippets(question: string): Promise<Snippet[]> {
  if (!question) return [];

  const qTokensAll = tokenizeForRetrieval(question);
  const qTokens = uniqTop(qTokensAll, 10);
  if (qTokens.length === 0) return [];

  const col = admin.firestore().collection("public_kb_chunks");

  // ✅ Simple query (no composite index). We'll filter active in code.
  const snap = await col.where("tokens", "array-contains-any", qTokens).limit(25).get();

  const qSet = new Set(qTokensAll);

  const candidates: Array<
    Snippet & { tokens: string[]; score: number; active: boolean }
  > = [];

  snap.forEach((d) => {
    const data = d.data() as any;
    const tokens = Array.isArray(data.tokens) ? data.tokens : [];
    const active = data.active !== false; // default true
    const url = String(data.url || "");
    const title = String(data.title || "");
    const text = String(data.text || "");

    let overlap = 0;
    for (const t of tokens) if (qSet.has(t)) overlap += 1;

    candidates.push({ url, title, text, tokens, score: overlap, active });
  });

  return candidates
    .filter((c) => c.active && c.score > 0 && c.url && c.text)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map((s) => ({
      url: s.url,
      title: s.title,
      text: s.text.slice(0, 1200), // cap snippet text
    }));
}

// ---------- Small “facts-only” fallback detector ----------
function looksLikeFactsOnlyQuestion(q: string) {
  const t = String(q || "").toLowerCase();
  // If user asks these, we can safely answer from FACTS even without snippets
  const keywords = [
    "fee",
    "fees",
    "price",
    "cost",
    "package",
    "packages",
    "demo",
    "trial",
    "assessment",
    "duration",
    "minutes",
    "timing",
    "age",
    "ages",
    "phonics",
    "grammar",
    "public speaking",
    "speaking",
    "class",
    "classes",
    "1:1",
    "one to one",
    "whatsapp",
  ];
  return keywords.some((k) => t.includes(k));
}

// ---------- Main callable ----------
export const askTinySteps = onCall(
  {
    region: "asia-south1",
    memory: "256MiB",
    timeoutSeconds: 60,
    secrets: [GROQ_SECRET],
  },
  async (request) => {
    const apiKey = GROQ_SECRET.value();
    if (!apiKey) {
      logger.error("askTinySteps: groq-api-key missing");
      throw new HttpsError("failed-precondition", "Secret Manager secret 'groq-api-key' is not set.");
    }

    const { messages } = request.data || {};
    if (!Array.isArray(messages) || messages.length === 0) {
      throw new HttpsError("invalid-argument", "messages array is required");
    }

    // ✅ sanitize + cap size
    const cleanMessages: ChatMsg[] = messages
      .filter(
        (m: any) =>
          m &&
          typeof m === "object" &&
          (m.role === "user" || m.role === "assistant") &&
          typeof m.content === "string"
      )
      .map((m: any) => ({
        role: m.role,
        content: String(m.content).slice(0, 2000),
      }))
      .slice(-12); // keep last 12

    if (cleanMessages.length === 0) {
      throw new HttpsError("invalid-argument", "messages must contain {role, content}");
    }

    const groqClient = new Groq({ apiKey });

    const systemPrompt = `You are "Ask TinySteps", the official assistant for Tiny Steps Learning, a premium 1:1 online English school for kids (phonics, grammar, public speaking), ages 3–12.

GOALS:
- Help parents understand Tiny Steps classes, age groups, curriculum, pricing, demo sessions, and how the program works.
- Use warm, friendly, simple Indian English, as if talking to a busy parent.
- Keep responses concise: usually 3–6 short sentences.
- When you mention money, always use Indian Rupees (₹).

FACTS (do not change):
- Class duration: 35 minutes (1:1 live online).
- Free Assessment Class / Demo: FREE (₹0).
- Packages: 8 classes ₹4,400; 16 classes ₹8,400; 24 classes ₹12,000.
- Optional single paid class: ₹599.
- Tracks: Phonics (3–10), Grammar (5–10), Public Speaking (5–12).
- WhatsApp CTA: https://wa.me/919618398383

GUARDRAILS:
- If you are not fully sure about exact details (specific batch timings, custom scheduling, discounts, holidays, teacher allocation), say:
  "I’m not fully sure about this detail. Our team will confirm this for you on WhatsApp."
- Do NOT invent special offers, discounts, scholarships, or guarantees.
- Do NOT give medical or psychological advice.
- Never ask for or handle sensitive information (Aadhaar, address, OTPs, card details).
- Keep tone positive; do not criticise competitors.
- If the user asks for something not on our website snippets and not in FACTS, be honest and send WhatsApp CTA.`;

    // ✅ Default retrieval ON (unless explicitly false)
    const useRetrieval = request.data?.useRetrieval === false ? false : true;

    const baseMessages: any[] = [{ role: "system", content: systemPrompt }];

    // Find last user question (for retrieval)
    const lastUser = [...cleanMessages].reverse().find((m) => m.role === "user");
    const question = lastUser?.content || "";

    let snippets: Snippet[] = [];

    if (useRetrieval) {
      try {
        snippets = await retrieveSnippets(question);
      } catch (err) {
        logger.warn("askTinySteps: retrieval error", err);
        snippets = [];
      }

      if (snippets.length > 0) {
        const bundle = snippets
          .map((s, i) => `[${i + 1}] ${s.url}\n${s.title}\n${s.text}`)
          .join("\n---\n");

        const retrievalRules = `RETRIEVAL MODE:
- Prefer the snippets below for website-specific info (how-it-works, curriculum, FAQ, policies, pages).
- Use ONLY the snippets below + the FACTS above. Do not add outside knowledge.
- Keep answer 3–6 short sentences.
- End with a short "Sources:" line listing only the URLs you actually used.

SNIPPETS:
${bundle}`;

        baseMessages.push({ role: "system", content: retrievalRules });
      } else {
        // No snippets found:
        // If it looks like fees/demo/duration/tracks etc, we can still answer from FACTS safely.
        // Otherwise, avoid hallucination and WhatsApp fallback.
        if (!looksLikeFactsOnlyQuestion(question)) {
          const fallback =
            "I’m not fully sure about this detail. Our team will confirm this for you on WhatsApp: https://wa.me/919618398383";
          return { reply: { role: "assistant", content: fallback } };
        }
      }
    }

    const fullMessages = baseMessages.concat(cleanMessages);

    try {
      const response = await groqClient.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        temperature: useRetrieval ? 0.0 : 0.6,
        max_tokens: 320,
        messages: fullMessages as any,
      });

      const content = response.choices?.[0]?.message?.content?.trim();
      if (!content) throw new HttpsError("internal", "No reply from Groq");

      return { reply: { role: "assistant", content } };
    } catch (error) {
      logger.error("askTinySteps: Groq error", error);
      throw new HttpsError("internal", "Failed to generate response");
    }
  }
);

export default askTinySteps;
