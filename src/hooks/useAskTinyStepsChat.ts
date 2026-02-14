// src/hooks/useAskTinyStepsChat.ts
import { useCallback, useMemo, useState } from "react";
import { db } from "../lib/firebaseConfig";
import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

type ChatRole = "user" | "assistant";
export type AskChatMessage = { role: ChatRole; content: string };

/**
 * ✅ Curated, deterministic KB (no model calls).
 * Keep this aligned with website copy.
 */
export const ASK_TINYSTEPS_KB: { id: string; title: string; text: string }[] = [
  {
    id: "assessment",
    title: "Free Assessment Class (Demo)",
    text:
      "Free Assessment Class / Demo is FREE (₹0). We check the child’s level and recommend the right track + level, then confirm a suitable slot on WhatsApp.",
  },
  {
    id: "pricing",
    title: "Pricing & Packages",
    text:
      "1:1 classes (35 minutes). Free Assessment Class (Demo) is FREE (₹0). 30% OFF Plans: Starter (8 classes) ₹3,360; Growth (16 classes) ₹6,440; Intensive (24 classes) ₹9,240. Optional single paid class: ₹599.",
  },
  {
    id: "timings",
    title: "Class Timings",
    text:
      "Each class is 35 minutes. Live 1:1 sessions. Timings depend on slots; WhatsApp Advisor helps you pick a suitable slot.",
  },
  {
    id: "courses",
    title: "Courses",
    text:
      "Tracks: Phonics (3–10), Grammar (5–10), Public Speaking (5–12). Personalized 1:1 learning with activities and worksheets.",
  },
  {
    id: "how_it_works",
    title: "How it works",
    text:
      "Parents share the child’s age/level. We do a FREE assessment, recommend the best track + level, confirm slots, then start 1:1 sessions with weekly progress updates.",
  },
];

export const ASK_TINYSTEPS_FACTS = {
  classDurationMins: 35,
  classModes: ["1:1"] as const,

  // ✅ Important: keep these consistent with website CTA.
  freeAssessmentPrice: 0,

  // Optional paid single class (not the demo)
  paidSingleClassPrice: 599,

  pricingPackages: [
    { classes: 8, price: 3360, perClass: 420 },   // Starter: ₹4,800 → 30% OFF → ₹3,360
    { classes: 16, price: 6440, perClass: 402.5 }, // Growth: ₹9,200 → 30% OFF → ₹6,440
    { classes: 24, price: 9240, perClass: 385 },  // Intensive: ₹13,200 → 30% OFF → ₹9,240
  ],

  ageRangeOverall: "3–12",
  tracks: [
    { name: "Phonics", ageRange: "3–10" },
    { name: "Grammar", ageRange: "5–10" },
    { name: "Public Speaking", ageRange: "5–12" },
  ] as const,

  whatsappCtaText: "Chat with our WhatsApp Advisor",
  whatsappLink: "https://wa.me/919618398383",
} as const;

// --------------------
// Helpers: tokenize + retrieve
// --------------------
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    // ✅ keep this regex on ONE line (no line breaks)
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function scoreKB(query: string) {
  const qTokens = new Set(tokenize(query));
  return ASK_TINYSTEPS_KB.map((entry) => {
    const tokens = tokenize(`${entry.title} ${entry.text}`);
    let score = 0;
    for (const t of tokens) if (qTokens.has(t)) score += 1;
    return { ...entry, score };
  }).sort((a, b) => b.score - a.score);
}

function retrieve(query: string, topN = 2) {
  const scored = scoreKB(query).filter((e) => e.score > 0);
  const results = scored
    .slice(0, topN)
    .map((e) => ({ id: e.id, title: e.title, text: e.text }));
  return { results, sourcesUsed: results.map((r) => r.id) };
}

// --------------------
// Intent detection + strict facts formatting
// --------------------
type Intent =
  | "greeting"
  | "assessment" // free demo/free assessment
  | "pricing"
  | "single_class" // paid one class
  | "timings"
  | "courses"
  | "general";

function detectIntent(q: string): Intent {
  const s = q.toLowerCase();
  const trimmed = s.trim();

  // ✅ Greeting intent (short hi/hello type messages)
  if (
    /^(hi|hello|hey|hii+|heyy+|hola|namaste|good morning|good afternoon|good evening)\b/.test(
      trimmed
    ) &&
    trimmed.length <= 30
  ) {
    return "greeting";
  }

  /**
   * ✅ Very important ordering:
   * “demo / free assessment / free trial” must be answered as FREE (₹0)
   * and must NOT fall through to pricing or paid class.
   */
  if (
    /(free\s*assessment|assessment\s*class|demo\s*class|demo|free\s*demo|free\s*trial)/.test(
      s
    )
  ) {
    return "assessment";
  }

  // Paid single class (only when explicitly asked)
  if (
    /(single\s*class|one\s*class|paid\s*class|paid\s*trial|trial\s*price|trial\s*fee)/.test(
      s
    )
  ) {
    return "single_class";
  }

  // Packages / pricing
  if (/(price|prices|cost|fee|fees|pricing|package|packages|plan|plans)/.test(s))
    return "pricing";
  if (/(minute|minutes|min|duration|how long|time per class)/.test(s))
    return "timings";
  if (/(phonics|grammar|public speaking|course|track|classes|do you teach)/.test(s))
    return "courses";

  return "general";
}

function formatFactsForIntent(intent: Intent): { text: string; sourcesUsed: string[] } {
  const wa = `${ASK_TINYSTEPS_FACTS.whatsappCtaText}: ${ASK_TINYSTEPS_FACTS.whatsappLink}`;

  if (intent === "assessment") {
    return {
      text:
        `✅ Free Assessment Class (Demo): FREE (₹${ASK_TINYSTEPS_FACTS.freeAssessmentPrice}).\n` +
        `We check your child’s level and recommend the right track + level, then confirm a suitable slot.\n\n` +
        `${wa}`,
      sourcesUsed: ["assessment"],
    };
  }

  if (intent === "pricing") {
    const lines = ASK_TINYSTEPS_FACTS.pricingPackages.map(
      (p) => `• ${p.classes} classes — ₹${p.price} (₹${p.perClass}/class)`
    );

    lines.unshift(
      `✅ Free Assessment Class (Demo): FREE (₹${ASK_TINYSTEPS_FACTS.freeAssessmentPrice})`
    );
    lines.push(`• Optional single paid class — ₹${ASK_TINYSTEPS_FACTS.paidSingleClassPrice}`);
    lines.push(`\n${wa}`);

    return { text: lines.join("\n"), sourcesUsed: ["pricing", "assessment"] };
  }

  if (intent === "single_class") {
    return {
      text:
        `Optional single paid class: ₹${ASK_TINYSTEPS_FACTS.paidSingleClassPrice} (35 minutes, 1:1).\n` +
        `✅ Free Assessment Class (Demo) is FREE (₹${ASK_TINYSTEPS_FACTS.freeAssessmentPrice}) — recommended first to pick the right level.\n\n` +
        `${wa}`,
      sourcesUsed: ["pricing", "assessment"],
    };
  }

  if (intent === "timings") {
    return {
      text:
        `Each class is ${ASK_TINYSTEPS_FACTS.classDurationMins} minutes ` +
        `(${ASK_TINYSTEPS_FACTS.classModes.join(", ")}).\n\n${wa}`,
      sourcesUsed: ["timings"],
    };
  }

  if (intent === "courses") {
    const trackLines = ASK_TINYSTEPS_FACTS.tracks
      .map((t) => `• ${t.name} (${t.ageRange})`)
      .join("\n");
    return {
      text: `We offer:\n${trackLines}\n\nOverall age range: ${ASK_TINYSTEPS_FACTS.ageRangeOverall}.\n\n${wa}`,
      sourcesUsed: ["courses"],
    };
  }

  return { text: "", sourcesUsed: [] };
}

function greetingReply(): { text: string; sourcesUsed: string[] } {
  return {
    text:
      "Hi! 👋 I’m Ask TinySteps.\n\n" +
      "You can ask me:\n" +
      "• Free assessment / demo\n" +
      "• Pricing / packages\n" +
      "• Class duration\n" +
      "• Courses (Phonics / Grammar / Public Speaking)\n\n" +
      "Tell me your child’s age and what you’re looking for.",
    sourcesUsed: [],
  };
}

// --------------------
// Firestore logging helpers
// --------------------
function getPagePathSafe(): string {
  try {
    return typeof window !== "undefined" ? window.location.pathname : "";
  } catch {
    return "";
  }
}

function readSessionId(): string | null {
  try {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("ts_ask_session_v1");
  } catch {
    return null;
  }
}

function writeSessionId(id: string) {
  try {
    if (typeof window === "undefined") return;
    localStorage.setItem("ts_ask_session_v1", id);
  } catch {
    // ignore
  }
}

function clearSessionId() {
  try {
    if (typeof window === "undefined") return;
    localStorage.removeItem("ts_ask_session_v1");
  } catch {
    // ignore
  }
}

function newSessionId(): string {
  const sid = `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  writeSessionId(sid);
  return sid;
}

function getOrCreateSessionId(): string {
  const existing = readSessionId();
  if (existing) return existing;
  return newSessionId();
}

// --------------------
// Hook
// --------------------
export function useAskTinyStepsChat() {
  const [messages, setMessages] = useState<AskChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ IMPORTANT FIX:
  // sessionId is STATE (not useMemo) so resetChat can truly start a fresh session.
  const [sessionId, setSessionId] = useState<string>(() => getOrCreateSessionId());

  const resetChat = useCallback(() => {
    setMessages([]);
    setError(null);
    setInput("");
    clearSessionId();
    setSessionId(newSessionId());
  }, []);

  // ✅ Allow optionally sending an explicit text (useful for quick-reply chips)
  const sendMessage = useCallback(
    async (textOverride?: string) => {
      const trimmed = (textOverride ?? input).trim();
      if (!trimmed || loading) return;

      const userMsg: AskChatMessage = { role: "user", content: trimmed };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setLoading(true);
      setError(null);

      const intent = detectIntent(trimmed);

      let assistantText = "";
      let sourcesUsed: string[] = [];

      // ✅ Greeting first
      if (intent === "greeting") {
        const res = greetingReply();
        assistantText = res.text;
        sourcesUsed = res.sourcesUsed;
      }
      // ✅ Guardrails: structured facts for known intents
      else if (
        intent === "assessment" ||
        intent === "pricing" ||
        intent === "single_class" ||
        intent === "timings" ||
        intent === "courses"
      ) {
        const res = formatFactsForIntent(intent);
        assistantText = res.text;
        sourcesUsed = res.sourcesUsed;
      } else {
        // General: retrieve from curated KB deterministically
        const { results, sourcesUsed: s } = retrieve(trimmed, 2);
        if (results.length > 0) {
          assistantText = results
            .map((r) => `• ${r.title}: ${r.text}`)
            .join("\n\n");
          assistantText += `\n\n${ASK_TINYSTEPS_FACTS.whatsappCtaText}: ${ASK_TINYSTEPS_FACTS.whatsappLink}`;
          sourcesUsed = s;
        } else {
          assistantText =
            `I don’t have that confirmed in my notes yet.\n\n` +
            `${ASK_TINYSTEPS_FACTS.whatsappCtaText}: ${ASK_TINYSTEPS_FACTS.whatsappLink}`;
          sourcesUsed = [];
        }
      }

      const assistantMsg: AskChatMessage = { role: "assistant", content: assistantText };
      setMessages((prev) => [...prev, assistantMsg]);

      // Firestore logging (best effort)
      try {
        const pagePath = getPagePathSafe();
        const sessionRef = doc(db, "askTinysteps_sessions", sessionId);

        await setDoc(
          sessionRef,
          {
            sessionId,
            lastSeenAt: serverTimestamp(),
            pagePath,
          },
          { merge: true }
        );

        const msgsCol = collection(sessionRef, "messages");

        await addDoc(msgsCol, {
          role: "user",
          text: trimmed,
          createdAt: serverTimestamp(),
          pagePath,
          sourcesUsed: [],
          intent,
        });

        await addDoc(msgsCol, {
          role: "assistant",
          text: assistantText,
          createdAt: serverTimestamp(),
          pagePath,
          sourcesUsed,
          intent,
        });
      } catch (e) {
        // Do not break chat UX if logging fails
        // eslint-disable-next-line no-console
        console.error("AskTinySteps logging error:", e);
        // Optional lightweight UI hint:
        // setError("Chat saved locally, but logging failed.");
      } finally {
        setLoading(false);
      }
    },
    [input, loading, sessionId]
  );

  return { messages, input, setInput, loading, error, sendMessage, resetChat };
}
