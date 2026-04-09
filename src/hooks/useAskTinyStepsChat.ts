// src/hooks/useAskTinyStepsChat.ts
import { useCallback, useState } from "react";
import { db } from "../lib/firebaseConfig";
import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import {
  formatINR,
  ONE_TO_ONE_MONTHLY_PACKAGES,
  PER_CLASS_PRICE,
  ULTRA_PREMIUM_PRICING,
} from "../config/pricing";
import { callAskTinySteps } from "../services/askTinyStepsService";

type ChatRole = "user" | "assistant";
export type AskChatMessage = { role: ChatRole; content: string };

/**
 * ✅ Curated, deterministic KB (no model calls).
 * Keep this aligned with website copy.
 */
const CANONICAL_PRICING_PACKAGES = ONE_TO_ONE_MONTHLY_PACKAGES.map((pkg) => ({
  classes: pkg.classes,
  price: pkg.monthlyFee,
  perClass: PER_CLASS_PRICE,
}));

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
      `Tiny Steps Pricing has two options. Standard Program (classes with expert Indian teachers): ${formatINR(PER_CLASS_PRICE)}/class, Starter ${formatINR(CANONICAL_PRICING_PACKAGES[0].price)} for ${CANONICAL_PRICING_PACKAGES[0].classes} classes, Growth ${formatINR(CANONICAL_PRICING_PACKAGES[1].price)} for ${CANONICAL_PRICING_PACKAGES[1].classes} classes, Intensive ${formatINR(CANONICAL_PRICING_PACKAGES[2].price)} for ${CANONICAL_PRICING_PACKAGES[2].classes} classes. Ultra Premium Program (classes with native English-speaking teachers): 1:1 ${formatINR(ULTRA_PREMIUM_PRICING[0].perClass)} per class or ${formatINR(ULTRA_PREMIUM_PRICING[0].package12)} for 12 classes; 1:2 ${formatINR(ULTRA_PREMIUM_PRICING[1].package12)} for 12 classes per child; 1:3 ${formatINR(ULTRA_PREMIUM_PRICING[2].package12)}; 1:4 ${formatINR(ULTRA_PREMIUM_PRICING[3].package12)}; 1:5 ${formatINR(ULTRA_PREMIUM_PRICING[4].package12)}; 1:6 ${formatINR(ULTRA_PREMIUM_PRICING[5].package12)}.`,
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
      "Parents share the child’s age/level. We do a FREE assessment, recommend the best track + level, confirm slots, then start 1:1 sessions with stage-based progress updates.",
  },
  {
    id: "summer_camps",
    title: "Summer Camp Programs",
    text:
      "Tiny Steps Summer Camp 2026 runs as a structured online summer season from 27 April 2026 to 13 June 2026 for ages 4–12. Each child joins one 4-week small-group batch with 24 live classes from Monday to Saturday, with Sunday kept as a holiday. Available batch start dates are 27 April, 4 May, 11 May and 18 May 2026. Tracks: Phonics Fast Track (4–8), Grammar Fast Track (6–12), Speaking Fast Track (6–12). Fast Track Pack list fee is ₹5,000 per child. Effective price: ₹2,400 per child. Sessions are typically 50–60 minutes with worksheets and class recordings. The final batch is designed to close before schools reopen on 15 June 2026. Details: https://tinystepslearning.com/summer-camps",
  },
];

export const ASK_TINYSTEPS_FACTS = {
  classDurationMins: 35,
  classModes: ["1:1"] as const,

  // ✅ Important: keep these consistent with website CTA.
  freeAssessmentPrice: 0,

  // Optional paid single class (not the demo)
  paidSingleClassPrice: PER_CLASS_PRICE,

  pricingPackages: CANONICAL_PRICING_PACKAGES,
  ultraPremiumPricing: ULTRA_PREMIUM_PRICING,

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
  | "summer_camp"
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

  // Summer camp related (keep above generic pricing/courses so "summer camp fees" maps correctly)
  if (/(summer\s*camp|summer\s*camps|fast\s*track|vacation\s*course|holiday\s*course)/.test(s))
    return "summer_camp";

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
      (p) => `• Standard: ${p.classes} classes — ${formatINR(p.price)} (₹${p.perClass}/class)`
    );

    lines.unshift(
      `✅ Free Assessment Class (Demo): FREE (₹${ASK_TINYSTEPS_FACTS.freeAssessmentPrice})`
    );
    lines.push("• Ultra Premium (native English-speaking teachers):");
    ASK_TINYSTEPS_FACTS.ultraPremiumPricing.forEach((row) => {
      lines.push(
        `  - ${row.format} — ${formatINR(row.perClass)} ${row.unitLabel} | ${formatINR(row.package12)} ${row.packageLabel}`
      );
    });
    lines.push(
      `• Standard single paid class: ₹${ASK_TINYSTEPS_FACTS.paidSingleClassPrice}`
    );
    lines.push(`\n${wa}`);

    return { text: lines.join("\n"), sourcesUsed: ["pricing", "assessment"] };
  }

  if (intent === "single_class") {
    return {
      text:
        `Standard single paid class (35 minutes, 1:1): ₹${ASK_TINYSTEPS_FACTS.paidSingleClassPrice}.\n` +
        `Ultra Premium 1:1 class (native English-speaking teacher): ₹${ASK_TINYSTEPS_FACTS.ultraPremiumPricing[0].perClass}.\n` +
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

  if (intent === "summer_camp") {
    return {
      text:
        "Summer Camp 2026 runs as a structured season from 27 April 2026 to 13 June 2026 for ages 4–12.\n" +
        "Each child joins one 4-week batch with 24 live classes from Monday to Saturday, with Sunday kept as a holiday.\n" +
        "Available batch start dates are 27 April, 4 May, 11 May and 18 May 2026, and the final batch closes before schools reopen on 15 June 2026.\n" +
        "Tracks: Phonics Fast Track (4–8), Grammar Fast Track (6–12), Speaking Fast Track (6–12).\n" +
        "Fast Track Pack list fee: ₹5,000 per child. Effective price: ₹2,400 per child.\n" +
        "Details: https://tinystepslearning.com/summer-camps\n\n" +
        `${wa}`,
      sourcesUsed: ["summer_camps"],
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

function historyForCloud(messages: AskChatMessage[], maxMessages = 10): AskChatMessage[] {
  return messages.slice(-maxMessages).map((m) => ({
    role: m.role,
    content: String(m.content || "").slice(0, 2000),
  }));
}

function extractSourcesFromReply(text: string): string[] {
  const urls = String(text || "").match(/https?:\/\/[^\s,)]+/g) || [];
  const uniq = Array.from(new Set(urls.map((u) => u.trim())));
  return uniq.slice(0, 3);
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
      let answeredBy = "local";

      // ✅ Greeting first (no model call needed)
      if (intent === "greeting") {
        const res = greetingReply();
        assistantText = res.text;
        sourcesUsed = res.sourcesUsed;
      } else {
        // Try cloud function first for richer page-grounded responses.
        try {
          const conversation = historyForCloud([...messages, userMsg], 10);
          const cloudReply = await callAskTinySteps(conversation, {
            useRetrieval: true,
          });
          if (cloudReply?.trim()) {
            assistantText = cloudReply.trim();
            sourcesUsed = extractSourcesFromReply(assistantText);
            answeredBy = "cloud";
          }
        } catch (cloudErr) {
          console.warn("AskTinySteps cloud fallback to local:", cloudErr);
        }
      }

      // Local deterministic fallback when cloud is unavailable.
      if (!assistantText) {
        if (
          intent === "assessment" ||
          intent === "pricing" ||
          intent === "single_class" ||
          intent === "timings" ||
          intent === "courses" ||
          intent === "summer_camp"
        ) {
          const res = formatFactsForIntent(intent);
          assistantText = res.text;
          sourcesUsed = res.sourcesUsed;
        } else {
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
          answeredBy,
        });
      } catch (e) {
        // Do not break chat UX if logging fails
         
        console.error("AskTinySteps logging error:", e);
        // Optional lightweight UI hint:
        // setError("Chat saved locally, but logging failed.");
      } finally {
        setLoading(false);
      }
    },
    [input, loading, sessionId, messages]
  );

  return { messages, input, setInput, loading, error, sendMessage, resetChat };
}
