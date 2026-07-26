import { onCall, HttpsError } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { logger } from "firebase-functions";
import Groq from "groq-sdk";
import * as admin from "firebase-admin";

if (!admin.apps.length) admin.initializeApp();

// Canonical Secret Manager secret name.
const GROQ_SECRET = defineSecret("groq-api-key");
const SITE_ORIGIN = "https://tinystepslearning.com";
const WHATSAPP_CTA = "https://wa.me/919618398383";
const MAX_SNIPPETS = 2;
const SNIPPET_TEXT_LIMIT = 420;
const KEY_PAGES = [
  "/pricing",
  "/book-demo",
  "/courses",
  "/faq",
  "/why-tiny-steps",
  "/curriculum",
  "/summer-camps",
  "/",
];
const ACTIVE_PUBLIC_KB_PATHS = new Set(KEY_PAGES);
const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "by",
  "do",
  "for",
  "from",
  "has",
  "have",
  "how",
  "i",
  "if",
  "in",
  "is",
  "it",
  "me",
  "my",
  "of",
  "on",
  "or",
  "our",
  "please",
  "that",
  "the",
  "their",
  "there",
  "they",
  "this",
  "to",
  "was",
  "we",
  "what",
  "when",
  "where",
  "which",
  "who",
  "why",
  "with",
  "you",
  "your",
]);
const TOKEN_EXPANSIONS: Record<string, string[]> = {
  fee: ["fees", "price", "pricing", "cost", "package", "plan"],
  fees: ["fee", "price", "pricing", "cost", "package", "plan"],
  price: ["fees", "pricing", "cost", "package", "plan"],
  pricing: ["fee", "fees", "price", "cost", "package", "plan"],
  package: ["packages", "pricing", "price", "fees"],
  packages: ["package", "pricing", "price", "fees"],
  demo: ["assessment", "trial"],
  trial: ["assessment", "demo"],
  class: ["classes", "session"],
  classes: ["class", "session"],
  course: ["courses", "curriculum", "track"],
  courses: ["course", "curriculum", "track"],
  curriculum: ["course", "courses", "track"],
  timing: ["timings", "schedule", "slot"],
  timings: ["timing", "schedule", "slot"],
  age: ["ages", "kid", "child"],
  ages: ["age", "kid", "child"],
  summer: ["camp", "camps", "vacation", "holiday", "fast", "track"],
  camp: ["summer", "camps", "program"],
  camps: ["camp", "summer", "programs"],
};

type ChatMsg = { role: "user" | "assistant"; content: string };
type Snippet = { url: string; title: string; text: string };
type RetrievalIntent =
  | "pricing"
  | "courses"
  | "recommendation"
  | "curriculum"
  | "faq"
  | "how_it_works"
  | "why_tiny_steps"
  | "assessment"
  | "duration"
  | "summer_camp"
  | "general";

// ---------- Retrieval helpers ----------
function normalizeToken(raw: string): string {
  const token = String(raw || "").trim().toLowerCase();
  if (!token) return "";
  if (token.endsWith("ies") && token.length > 4) return `${token.slice(0, -3)}y`;
  if (token.endsWith("s") && token.length > 4 && !token.endsWith("ss")) {
    return token.slice(0, -1);
  }
  return token;
}

function tokenizeForRetrieval(text: string): string[] {
  return String(text || "")
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .map((t) => normalizeToken(t))
    .filter(Boolean)
    .filter((t) => t.length >= 2)
    .filter((t) => !STOP_WORDS.has(t))
    .slice(0, 120);
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

function expandedTokens(tokens: string[]): string[] {
  const out = [...tokens];
  for (const token of tokens) {
    const ex = TOKEN_EXPANSIONS[token];
    if (ex?.length) out.push(...ex);
  }
  return out.map((t) => normalizeToken(t)).filter(Boolean);
}

function pathFromUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.pathname || "/";
  } catch {
    return "/";
  }
}

function keyPageBoost(path: string): number {
  const idx = KEY_PAGES.indexOf(path);
  if (idx < 0) return 0;
  return Math.max(0.2, (KEY_PAGES.length - idx) * 0.2);
}

function intentForRetrieval(question: string):
  RetrievalIntent {
  const q = String(question || "").toLowerCase();

  if (/(summer camp|summer camps|summer program|summer course|fast track)/.test(q)) {
    return "summer_camp";
  }
  if (/(recommend|suggest|choose|select|which course|best course|help me choose)/.test(q)) {
    return "recommendation";
  }
  if (/(price|pricing|fee|fees|cost|package|plan)/.test(q)) return "pricing";
  if (/(curriculum|syllabus|lesson plan|learning path)/.test(q)) return "curriculum";
  if (/(course|courses|track|phonics|grammar|public speaking)/.test(q)) return "courses";
  if (/(faq|common question|frequently asked)/.test(q)) return "faq";
  if (/(how does|how it works|process|steps|enroll|enrol|join)/.test(q)) {
    return "how_it_works";
  }
  if (/(why tiny|why choose|why should|benefit|advantage)/.test(q)) {
    return "why_tiny_steps";
  }
  if (/(demo|assessment|trial|free class)/.test(q)) return "assessment";
  if (/(duration|minute|minutes|how long|class time|timing|timings)/.test(q)) {
    return "duration";
  }
  return "general";
}

function preferredPathForIntent(
  intent: RetrievalIntent
): string | null {
  if (intent === "summer_camp") return "/summer-camps";
  if (intent === "recommendation") return "/courses";
  if (intent === "pricing") return "/pricing";
  if (intent === "courses") return "/courses";
  if (intent === "curriculum") return "/curriculum";
  if (intent === "faq") return "/faq";
  if (intent === "how_it_works") return "/curriculum";
  if (intent === "why_tiny_steps") return "/why-tiny-steps";
  if (intent === "assessment" || intent === "duration") return "/book-demo";
  return null;
}

async function retrieveSnippets(question: string): Promise<Snippet[]> {
  if (!question) return [];

  const intent = intentForRetrieval(question);
  const qTokensAll = expandedTokens(tokenizeForRetrieval(question));
  const qTokens = uniqTop(qTokensAll, 10);
  if (qTokens.length === 0) return [];
  const preferredPath = preferredPathForIntent(intent);

  const col = admin.firestore().collection("public_kb_chunks");

  // ✅ Simple query (no composite index). We'll filter active in code.
  const snap = await col.where("tokens", "array-contains-any", qTokens).limit(25).get();

  const qSet = new Set(qTokensAll);

  const candidates: Array<
    Snippet & { tokens: string[]; score: number; active: boolean; path: string }
  > = [];

  snap.forEach((d) => {
    const data = d.data() as any;
    const tokens = Array.isArray(data.tokens) ? data.tokens : [];
    const active = data.active !== false; // default true
    const url = String(data.url || "");
    const title = String(data.title || "");
    const text = String(data.text || "");
    const path = String(data.path || pathFromUrl(url));
    const titleTokens = tokenizeForRetrieval(title);

    let overlap = 0;
    for (const t of tokens) if (qSet.has(t)) overlap += 1;

    let titleOverlap = 0;
    for (const t of titleTokens) if (qSet.has(t)) titleOverlap += 1;

    const pathBoost = keyPageBoost(path);
    const intentBoost = preferredPath && path === preferredPath ? 4 : 0;

    const score = overlap * 1.8 + titleOverlap * 2.4 + pathBoost + intentBoost;

    candidates.push({ url, title, text, tokens, score, active, path });
  });

  const ranked = candidates
    .filter(
      (candidate) =>
        candidate.active &&
        ACTIVE_PUBLIC_KB_PATHS.has(candidate.path) &&
        candidate.score > 0.9 &&
        candidate.url &&
        candidate.text
    )
    .sort((a, b) => b.score - a.score);

  // For high-value intents, strongly prefer snippets from the intended page.
  if (preferredPath) {
    const preferred = ranked.filter(
      (c) => c.path === preferredPath || c.path.startsWith(`${preferredPath}/`)
    );
    if (preferred.length > 0) {
      return preferred.slice(0, MAX_SNIPPETS).map((s) => ({
        url: s.url,
        title: s.title,
        text: s.text.slice(0, SNIPPET_TEXT_LIMIT),
      }));
    }
    // If summer-camp page isn't indexed yet, trigger deterministic fallback (no weak snippet fallback).
    if (intent === "summer_camp") return [];
  }

  return ranked.slice(0, MAX_SNIPPETS).map((s) => ({
      url: s.url,
      title: s.title,
      text: s.text.slice(0, SNIPPET_TEXT_LIMIT), // cap snippet text
    }));
}

// ---------- No-snippet fallback ----------
function summerCampDirectAnswer(includeWhatsapp = true): string {
  const base =
    "Tiny Steps Summer Camp 2026 ended on 13 June 2026. Enrolment is closed. " +
    "Each child joined one four-week small-group batch with 24 live classes from Monday to Saturday. " +
    "Historical tracks were Phonics Fast Track, Grammar Fast Track, and Speaking Fast Track. " +
    "The historical list fee was ₹5,000 per child and the effective fee was ₹2,400 per child. " +
    `Source: ${SITE_ORIGIN}/summer-camps`;
  if (!includeWhatsapp) return base;
  return `${base}\n\nFor regular Tiny Steps programme help, message us on WhatsApp: ${WHATSAPP_CTA}`;
}

function fallbackWithoutSnippets(question: string): string {
  const q = String(question || "").toLowerCase();

  if (/(recommend|suggest|choose|select|which course|best course|help me choose)/.test(q)) {
    return (
      "Happy to help you choose the right course. Please share your child’s age and main goal " +
      "(reading, grammar writing, or speaking confidence), and I’ll suggest the best-fit track. " +
      `You can also message us here for quick guidance: ${WHATSAPP_CTA}`
    );
  }

  if (/(summer camp|summer camps|summer program|summer course|fast track)/.test(q)) {
    return summerCampDirectAnswer(true);
  }

  if (/(demo|assessment|trial|free class)/.test(q)) {
    return (
      "Tiny Steps provides one free 35-minute 1:1 online demo assessment class per child before enrolment. It costs ₹0 and requires no credit card. " +
      `To book quickly, please message us on WhatsApp: ${WHATSAPP_CTA}`
    );
  }

  if (/(duration|minute|minutes|how long|class time|timing|timings)/.test(q)) {
    return (
      "Each class is 35 minutes in a live 1:1 format. " +
      `For slot availability, please message us on WhatsApp: ${WHATSAPP_CTA}`
    );
  }

  if (/(phonics|grammar|public speaking|course|track|age|ages|kid|child)/.test(q)) {
    return (
      "We offer Phonics (3–10), Grammar (5–10), and Public Speaking (5–12). " +
      `For the best track recommendation, please message us on WhatsApp: ${WHATSAPP_CTA}`
    );
  }

  if (/(price|pricing|fee|fees|cost|package|plan)/.test(q)) {
    return (
      `For the latest fees and packages, please check ${SITE_ORIGIN}/pricing. ` +
      `If you want help choosing a plan, message us on WhatsApp: ${WHATSAPP_CTA}`
    );
  }

  return (
    "I’m not fully sure about this detail from my current notes. " +
    `Our team will confirm this for you on WhatsApp: ${WHATSAPP_CTA}`
  );
}

function cleanedAssistantReply(content: string, question: string): string {
  let text = String(content || "").trim();
  if (!text) return text;

  // Keep only one WhatsApp URL mention.
  let seenWhatsAppUrl = false;
  text = text.replace(/https:\/\/wa\.me\/919618398383/g, (m) => {
    if (seenWhatsAppUrl) return "";
    seenWhatsAppUrl = true;
    return m;
  });

  // Remove repeated duplicate lines while preserving order.
  const lines = text.split("\n");
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of lines) {
    const line = raw.trim();
    const key = line.replace(/\s+/g, " ").toLowerCase();
    if (!key) {
      if (out.length > 0 && out[out.length - 1] !== "") out.push("");
      continue;
    }
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(line);
  }
  text = out.join("\n").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();

  // If summer intent still produced uncertainty language, force deterministic summer answer.
  if (intentForRetrieval(question) === "summer_camp" && /not fully sure/i.test(text)) {
    return summerCampDirectAnswer(false);
  }

  return text;
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
      .slice(-8); // keep last 8 for token efficiency

    if (cleanMessages.length === 0) {
      throw new HttpsError("invalid-argument", "messages must contain {role, content}");
    }

    const groqClient = new Groq({ apiKey });

    const systemPrompt = `You are "Ask TinySteps", the official assistant for Tiny Steps Learning.

STYLE:
- Polite, respectful, simple Indian English.
- Concise: 2-4 short sentences, usually under 75 words.
- If user asks for list/breakdown, use up to 4 short bullets.
- Mention WhatsApp support at most once.
- Do not repeat the same line.

FACTS (do not change):
- One Free 35-Minute Demo Assessment Class: exactly one live 1:1 online session per child before enrolment, FREE (₹0), no credit card required.
- Class duration: 35 minutes (1:1 live online).
- Tracks: Phonics (3–10), Grammar (5–10), Public Speaking (5–12).
- Standard pricing: 1:1 ₹400 per class; small groups ₹180–₹300 per child per class; 12-class standard 1:1 package ₹4,800.
- Summer Camp 2026 ended on 13 June 2026. Each child joined one four-week batch with 24 live small-group classes from Monday to Saturday. Historical list fee ₹5,000; effective fee ₹2,400. Enrolment is closed.
- WhatsApp CTA: ${WHATSAPP_CTA}

BEHAVIOR:
- Use chat context when available (age/goal already shared).
- For recommendation questions, give a best-fit suggestion and ask at most one follow-up question.
- Use ONLY FACTS + provided snippets for website-specific details.
- If uncertain about exact timings, batches, teacher allocation, custom discounts, or holidays, say exactly:
  "I’m not fully sure about this detail. Our team will confirm this for you on WhatsApp: ${WHATSAPP_CTA}"
- If pricing numbers are missing in snippets, do not guess. Ask parent to check ${SITE_ORIGIN}/pricing.
- Never invent offers/discounts/guarantees.
- Never call the live demo assessment merely a free trial. A separate 3-day digital games trial applies only to the digital games subscription.
- No medical/psychological advice.
- Never ask for sensitive data (OTP, card details, Aadhaar).`;

    // ✅ Default retrieval ON (unless explicitly false)
    const useRetrieval = request.data?.useRetrieval === false ? false : true;

    const baseMessages: any[] = [{ role: "system", content: systemPrompt }];

    // Find last user question (for retrieval)
    const lastUser = [...cleanMessages].reverse().find((m) => m.role === "user");
    const question = lastUser?.content || "";
    const questionIntent = intentForRetrieval(question);

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
- Use ONLY snippets + FACTS. Do not add outside knowledge.
- Keep answer concise and crisp.
- For recommendation questions, infer best fit from age/goal and ask at most one follow-up.
- Use uncertainty sentence only when snippets and FACTS truly lack the answer.
- End with "Source:" and up to 2 URLs you used.

SNIPPETS:
${bundle}`;

        baseMessages.push({ role: "system", content: retrievalRules });
      } else {
        // No snippets found -> factual fallback only
        const fallback = fallbackWithoutSnippets(question);
        return { reply: { role: "assistant", content: fallback } };
      }
    }

    const fullMessages = baseMessages.concat(cleanMessages);

    try {
      const response = await groqClient.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        temperature: useRetrieval ? 0.2 : 0.4,
        max_tokens: 180,
        messages: fullMessages as any,
      });

      const content = response.choices?.[0]?.message?.content?.trim();
      if (!content) throw new HttpsError("internal", "No reply from Groq");

      const normalized = cleanedAssistantReply(content, question);
      if (!normalized) throw new HttpsError("internal", "Empty reply from Groq");

      // Final hard guard: do not return uncertain answer for known summer camp intent.
      if (questionIntent === "summer_camp" && /not fully sure/i.test(normalized)) {
        return { reply: { role: "assistant", content: summerCampDirectAnswer(false) } };
      }

      return { reply: { role: "assistant", content: normalized } };
    } catch (error) {
      logger.error("askTinySteps: Groq error", error);
      throw new HttpsError("internal", "Failed to generate response");
    }
  }
);

export default askTinySteps;
