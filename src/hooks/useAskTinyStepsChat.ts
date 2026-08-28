// src/hooks/useAskTinyStepsChat.ts
import { useCallback, useRef, useState } from "react";
import {
  formatINR,
  ONE_TO_ONE_MONTHLY_PACKAGES,
  PER_CLASS_PRICE,
  ULTRA_PREMIUM_PRICING,
} from "../config/pricing";
import {
  FREE_DEMO_DURATION_MINUTES,
  FREE_DEMO_FULL_DESCRIPTION,
  FREE_DEMO_OFFER_NAME,
  FREE_DEMO_PRICE,
  FREE_DEMO_SESSION_COUNT,
  STANDARD_PRICING_SUMMARY,
} from "../config/publicOffer";
import {
  ASK_TINY_STEPS_MAX_PROMPT_LENGTH,
  ASK_TINY_STEPS_SAFE_ERROR,
  callAskTinySteps,
} from "../services/askTinyStepsService";

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

export const ASK_TINYSTEPS_KB: { id: string; title: string; text: string; url: string }[] = [
  {
    id: "assessment",
    title: FREE_DEMO_OFFER_NAME,
    url: "https://tinystepslearning.com/book-demo",
    text:
      `${FREE_DEMO_FULL_DESCRIPTION} It is FREE (₹${FREE_DEMO_PRICE}), requires no credit card, and there is no obligation to enrol.`,
  },
  {
    id: "pricing",
    title: "Pricing & Packages",
    url: "https://tinystepslearning.com/pricing",
    text:
      `${STANDARD_PRICING_SUMMARY}. Standard 1:1 monthly plans: Starter ${formatINR(CANONICAL_PRICING_PACKAGES[0].price)} for ${CANONICAL_PRICING_PACKAGES[0].classes} classes, Growth ${formatINR(CANONICAL_PRICING_PACKAGES[1].price)} for ${CANONICAL_PRICING_PACKAGES[1].classes} classes, Intensive ${formatINR(CANONICAL_PRICING_PACKAGES[2].price)} for ${CANONICAL_PRICING_PACKAGES[2].classes} classes. Ultra Premium Program (classes with native English-speaking teachers): 1:1 ${formatINR(ULTRA_PREMIUM_PRICING[0].perClass)} per class or ${formatINR(ULTRA_PREMIUM_PRICING[0].package12)} for 12 classes; 1:2 ${formatINR(ULTRA_PREMIUM_PRICING[1].package12)} for 12 classes per child; 1:3 ${formatINR(ULTRA_PREMIUM_PRICING[2].package12)}; 1:4 ${formatINR(ULTRA_PREMIUM_PRICING[3].package12)}; 1:5 ${formatINR(ULTRA_PREMIUM_PRICING[4].package12)}; 1:6 ${formatINR(ULTRA_PREMIUM_PRICING[5].package12)}.`,
  },
  {
    id: "timings",
    title: "Class Timings",
    url: "https://tinystepslearning.com/book-demo",
    text:
      "Each class is 35 minutes. Live 1:1 sessions. Timings depend on slots; WhatsApp Advisor helps you pick a suitable slot.",
  },
  {
    id: "courses",
    title: "Courses",
    url: "https://tinystepslearning.com/courses",
    text:
      "Tracks: Phonics (3–10), Grammar (5–10), Public Speaking (5–12). Personalized 1:1 learning with activities and worksheets.",
  },
  {
    id: "how_it_works",
    title: "How it works",
    url: "https://tinystepslearning.com/why-tiny-steps",
    text:
      `${FREE_DEMO_FULL_DESCRIPTION} We then confirm slots and start classes with stage-based progress updates.`,
  },
  {
    id: "summer_camps",
    title: "Summer Camp 2026 — Enrolment Closed",
    url: "https://tinystepslearning.com/summer-camps",
    text:
      "Tiny Steps Summer Camp 2026 ended on 13 June 2026. Each child joined one four-week small-group batch with 24 live classes from Monday to Saturday. The historical list fee was ₹5,000 per child and the effective fee was ₹2,400 per child. Enrolment is closed. Current families can book one free 35-minute demo assessment class for the regular Tiny Steps programmes.",
  },
  {
    id: "curriculum",
    title: "Connected, stage-based curriculum",
    url: "https://tinystepslearning.com/curriculum",
    text:
      "The Tiny Steps curriculum is a structured English pathway for ages 3–12, with placement based on current skill rather than age alone. It connects phonics decoding, grammar and sentence control, reading, communication, and public speaking through stage-based progression.",
  },
  {
    id: "methodology",
    title: "Tiny Steps teaching methodology",
    url: "https://tinystepslearning.com/why-tiny-steps",
    text:
      "Tiny Steps uses personalized live teaching, active child participation, explicit instruction, immediate correction, level-appropriate practice, and progress evidence from fresh examples. The free assessment helps identify the strongest current learning gap before a course is chosen.",
  },
  {
    id: "phonics_learning",
    title: "Phonics and reading pathway",
    url: "https://tinystepslearning.com/phonics",
    text:
      "The structured phonics path moves from sound-letter links and phonemic awareness to oral blending, printed-word blending, CVC words, digraphs, vowel patterns, decoding, spelling, fluency, and sentence reading. Older children can also benefit when a decoding gap remains.",
  },
  {
    id: "learning_guidance",
    title: "English-learning guidance",
    url: "https://tinystepslearning.com/faq",
    text:
      "Weak unfamiliar-word decoding points toward phonics; accurate but effortful reading may need fluency or comprehension; repeated sentence errors may need grammar and writing; short hesitant answers may need sentence formation and speaking confidence. Progress should be checked on fresh tasks with increasing independence.",
  },
  {
    id: "resources",
    title: "Tiny Steps parent resources",
    url: "https://tinystepslearning.com/blog",
    text:
      "Tiny Steps publishes public parent resources about phonics, blending, decoding, reading fluency, grammar, sentence formation, speaking confidence, home practice, and choosing suitable English-learning support.",
  },
];

export const ASK_TINYSTEPS_FACTS = {
  classDurationMins: 35,
  classModes: ["1:1"] as const,
  freeDemoSessionCount: FREE_DEMO_SESSION_COUNT,
  freeDemoDurationMins: FREE_DEMO_DURATION_MINUTES,

  // ✅ Important: keep these consistent with website CTA.
  freeAssessmentPrice: FREE_DEMO_PRICE,

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
    .map((e) => ({ id: e.id, title: e.title, text: e.text, url: e.url }));
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
        `✅ ${FREE_DEMO_OFFER_NAME}: FREE (₹${FREE_DEMO_PRICE}).\n` +
        `${FREE_DEMO_FULL_DESCRIPTION}\n` +
        `No credit card or enrolment commitment is required.\n\n` +
        `${wa}`,
      sourcesUsed: ["assessment"],
    };
  }

  if (intent === "pricing") {
    const lines = ASK_TINYSTEPS_FACTS.pricingPackages.map(
      (p) => `• Standard: ${p.classes} classes — ${formatINR(p.price)} (₹${p.perClass}/class)`
    );

    lines.unshift(
      `✅ ${STANDARD_PRICING_SUMMARY}`,
      `✅ ${FREE_DEMO_OFFER_NAME}: FREE (₹${FREE_DEMO_PRICE})`
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
        `✅ ${FREE_DEMO_OFFER_NAME} is FREE (₹${FREE_DEMO_PRICE}) and is recommended before purchasing paid classes.\n\n` +
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
        "Summer Camp 2026 ended on 13 June 2026. Enrolment is closed.\n" +
        "Each child joined one four-week small-group batch with 24 live classes from Monday to Saturday.\n" +
        "Historical tracks were Phonics Fast Track, Grammar Fast Track, and Speaking Fast Track.\n" +
        "Historical list fee: ₹5,000 per child. Historical effective fee: ₹2,400 per child.\n" +
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
      "• One Free 35-Minute Demo Assessment Class\n" +
      "• Pricing / packages\n" +
      "• Class duration\n" +
      "• Courses (Phonics / Grammar / Public Speaking)\n\n" +
      "Tell me your child’s age and what you’re looking for.",
    sourcesUsed: [],
  };
}

function historyForAI(messages: AskChatMessage[], maxMessages = 10): AskChatMessage[] {
  return messages.slice(-maxMessages).map((m) => ({
    role: m.role,
    content: String(m.content || "").slice(0, 2000),
  }));
}

// --------------------
// Hook
// --------------------
export function useAskTinyStepsChat() {
  const [messages, setMessages] = useState<AskChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestInFlightRef = useRef(false);

  const resetChat = useCallback(() => {
    setMessages([]);
    setError(null);
    setInput("");
  }, []);

  // ✅ Allow optionally sending an explicit text (useful for quick-reply chips)
  const sendMessage = useCallback(
    async (textOverride?: string) => {
      const trimmed = (textOverride ?? input).trim();
      if (!trimmed || loading || requestInFlightRef.current) return;
      if (trimmed.length > ASK_TINY_STEPS_MAX_PROMPT_LENGTH) {
        setError(`Please keep your question under ${ASK_TINY_STEPS_MAX_PROMPT_LENGTH} characters.`);
        return;
      }

      requestInFlightRef.current = true;

      const userMsg: AskChatMessage = { role: "user", content: trimmed };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setLoading(true);
      setError(null);

      const intent = detectIntent(trimmed);

      let assistantText = "";

      // ✅ Greeting first (no model call needed)
      if (intent === "greeting") {
        const res = greetingReply();
        assistantText = res.text;
      } else {
        // Try Firebase AI Logic first for richer, approved-context responses.
        try {
          const conversation = historyForAI([...messages, userMsg], 10);
          const approvedSnippets = retrieve(trimmed, 2).results.map(({ title, text, url }) => ({
            title,
            text,
            url,
          }));
          const aiReply = await callAskTinySteps(conversation, {
            approvedSnippets,
          });
          if (aiReply?.trim()) {
            assistantText = aiReply.trim();
          }
        } catch {
          console.warn("AskTinySteps AI unavailable; using the approved local fallback.");
          setError(ASK_TINY_STEPS_SAFE_ERROR);
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
        } else {
          const { results } = retrieve(trimmed, 2);
          if (results.length > 0) {
            assistantText = results
              .map((r) => `• ${r.title}: ${r.text}`)
              .join("\n\n");
            assistantText += `\n\n${ASK_TINYSTEPS_FACTS.whatsappCtaText}: ${ASK_TINYSTEPS_FACTS.whatsappLink}`;
          } else {
            assistantText =
              `I don’t have that confirmed in my notes yet.\n\n` +
              `${ASK_TINYSTEPS_FACTS.whatsappCtaText}: ${ASK_TINYSTEPS_FACTS.whatsappLink}`;
          }
        }
      }

      const assistantMsg: AskChatMessage = { role: "assistant", content: assistantText };
      setMessages((prev) => [...prev, assistantMsg]);

      requestInFlightRef.current = false;
      setLoading(false);
    },
    [input, loading, messages]
  );

  return { messages, input, setInput, loading, error, sendMessage, resetChat };
}
