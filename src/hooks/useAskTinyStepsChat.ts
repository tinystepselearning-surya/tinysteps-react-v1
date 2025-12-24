// src/hooks/useAskTinyStepsChat.ts
import { useCallback, useMemo, useState } from "react";
import { db } from "../lib/firebaseConfig";
import { addDoc, collection, doc, serverTimestamp, setDoc } from "firebase/firestore";

type ChatRole = "user" | "assistant";
export type AskChatMessage = { role: ChatRole; content: string };

export const ASK_TINYSTEPS_KB: { id: string; title: string; text: string }[] = [
  {
    id: "pricing",
    title: "Pricing",
    text:
      "1:1 classes (35 minutes). Packages: 8 classes ₹4,400; 16 classes ₹8,400; 24 classes ₹12,000. Single class/trial: ₹599.",
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
    id: "trial",
    title: "Trial Class",
    text:
      "You can book a paid trial class (₹599). WhatsApp Advisor will help confirm the right level and slot.",
  },
  {
    id: "how_it_works",
    title: "How it works",
    text:
      "Parents share the child’s age/level. We recommend the best track + level, then confirm slots and start 1:1 sessions.",
  },
];

export const ASK_TINYSTEPS_FACTS = {
  pricingPackages: [
    { classes: 8, price: 4400, perClass: 550 },
    { classes: 16, price: 8400, perClass: 525 },
    { classes: 24, price: 12000, perClass: 500 },
  ],
  singleClassPrice: 599,
  classDurationMins: 35,
  classModes: ["1:1"] as const,
  ageRange: "3–10",
  tracks: ["Phonics", "Grammar", "Public Speaking"] as const,
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
type Intent = "greeting" | "pricing" | "timings" | "courses" | "trial" | "general";

function detectIntent(q: string): Intent {
  const s = q.toLowerCase();
  const trimmed = s.trim();

  // ✅ Greeting intent (short hi/hello type messages)
  if (
    /^(hi|hello|hey|hii+|heyy+|hola|namaste|good morning|good afternoon|good evening)\b/.test(trimmed) &&
    trimmed.length <= 30
  ) {
    return "greeting";
  }

  // put TRIAL first so "trial price" doesn't get classified as pricing
  if (/(trial|trial class|single class|try)/.test(s)) return "trial";
  if (/(price|prices|cost|fee|fees|pricing|package|packages)/.test(s)) return "pricing";
  if (/(minute|minutes|min|duration|how long|time per class)/.test(s)) return "timings";
  if (/(phonics|grammar|public speaking|course|track|classes|do you teach)/.test(s)) return "courses";

  return "general";
}

function formatFactsForIntent(intent: Intent): { text: string; sourcesUsed: string[] } {
  const wa = `${ASK_TINYSTEPS_FACTS.whatsappCtaText}: ${ASK_TINYSTEPS_FACTS.whatsappLink}`;

  if (intent === "pricing") {
    const lines = ASK_TINYSTEPS_FACTS.pricingPackages.map(
      (p) => `• ${p.classes} classes — ₹${p.price} (₹${p.perClass}/class)`
    );
    lines.push(`• Single class / trial — ₹${ASK_TINYSTEPS_FACTS.singleClassPrice}`);
    lines.push(`\n${wa}`);
    return { text: lines.join("\n"), sourcesUsed: ["pricing"] };
  }

  if (intent === "timings") {
    return {
      text: `Each class is ${ASK_TINYSTEPS_FACTS.classDurationMins} minutes (${ASK_TINYSTEPS_FACTS.classModes.join(
        ", "
      )}).\n\n${wa}`,
      sourcesUsed: ["timings"],
    };
  }

  if (intent === "courses") {
    return {
      text: `We offer: ${ASK_TINYSTEPS_FACTS.tracks.join(", ")}.\nAge range: ${
        ASK_TINYSTEPS_FACTS.ageRange
      }.\n\n${wa}`,
      sourcesUsed: ["courses"],
    };
  }

  if (intent === "trial") {
    return {
      text: `You can book a trial class for ₹${ASK_TINYSTEPS_FACTS.singleClassPrice}.\n\n${wa}`,
      sourcesUsed: ["trial"],
    };
  }

  return { text: "", sourcesUsed: [] };
}

function greetingReply(): { text: string; sourcesUsed: string[] } {
  return {
    text:
      "Hi! 👋 I’m Ask TinySteps.\n\n" +
      "You can ask me:\n" +
      "• Pricing / packages\n" +
      "• Class duration (minutes)\n" +
      "• Courses (Phonics / Grammar / Public Speaking)\n" +
      "• Trial class details\n\n" +
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

function makeSessionId(): string {
  try {
    if (typeof window !== "undefined") {
      const existing = localStorage.getItem("ts_ask_session_v1");
      if (existing) return existing;
      const sid = `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
      localStorage.setItem("ts_ask_session_v1", sid);
      return sid;
    }
  } catch {
    // ignore
  }
  return `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

// --------------------
// Hook
// --------------------
export function useAskTinyStepsChat() {
  const [messages, setMessages] = useState<AskChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sessionId = useMemo(() => makeSessionId(), []);

  const resetChat = useCallback(() => {
    setMessages([]);
    setError(null);
    setInput("");
    try {
      if (typeof window !== "undefined") localStorage.removeItem("ts_ask_session_v1");
    } catch {
      // ignore
    }
  }, []);

  const sendMessage = useCallback(async () => {
    const trimmed = input.trim();
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
    // Guardrails: pricing/timings/courses/trial must be facts-only
    else if (intent === "pricing" || intent === "timings" || intent === "courses" || intent === "trial") {
      const res = formatFactsForIntent(intent);
      assistantText = res.text;
      sourcesUsed = res.sourcesUsed;
    } else {
      // General: retrieve from curated KB deterministically (no Groq call here)
      const { results, sourcesUsed: s } = retrieve(trimmed, 2);
      if (results.length > 0) {
        assistantText = results.map((r) => `• ${r.title}: ${r.text}`).join("\n\n");
        assistantText += `\n\n${ASK_TINYSTEPS_FACTS.whatsappCtaText}: ${ASK_TINYSTEPS_FACTS.whatsappLink}`;
        sourcesUsed = s;
      } else {
        assistantText = `I don’t have that confirmed in my notes yet.\n\n${ASK_TINYSTEPS_FACTS.whatsappCtaText}: ${ASK_TINYSTEPS_FACTS.whatsappLink}`;
        sourcesUsed = [];
      }
    }

    const assistantMsg: AskChatMessage = { role: "assistant", content: assistantText };
    setMessages((prev) => [...prev, assistantMsg]);

    // Firestore logging (best effort)
    try {
      const sessionRef = doc(collection(db, "askTinysteps_sessions"), sessionId);

      await setDoc(
        sessionRef,
        {
          sessionId,
          lastSeenAt: serverTimestamp(),
          pagePath: getPagePathSafe(),
        },
        { merge: true }
      );

      const msgsCol = collection(sessionRef, "messages");
      const pagePath = getPagePathSafe();

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
    } finally {
      setLoading(false);
    }
  }, [input, loading, sessionId]);

  return { messages, input, setInput, loading, error, sendMessage, resetChat };
}
