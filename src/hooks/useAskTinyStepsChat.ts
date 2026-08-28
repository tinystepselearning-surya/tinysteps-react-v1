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
} from "../config/publicOffer";
import {
  ASK_TINY_STEPS_MAX_PROMPT_LENGTH,
  callAskTinySteps,
} from "../services/askTinyStepsService";
import { selectAskTinyStepsSources } from "../services/askTinyStepsSourceSelector";

type ChatRole = "user" | "assistant";
export type AskChatMessage = { role: ChatRole; content: string };

/**
 * Curated deterministic fallback KB.
 * AI-2C no longer sends these snippets to Gemini. They remain only as the
 * fail-closed local fallback if Firebase AI Logic or URL Context is unavailable.
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
      `Standard 1:1 classes are ₹${PER_CLASS_PRICE} per class. Standard monthly plans are ${CANONICAL_PRICING_PACKAGES.map(
        (pkg) => `${formatINR(pkg.price)} for ${pkg.classes} classes`,
      ).join(", ")}.`,
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
  freeAssessmentPrice: FREE_DEMO_PRICE,
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
// Legacy fallback retrieval only
// --------------------
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
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
// Legacy fallback intent detection + strict facts formatting
// --------------------
type Intent =
  | "greeting"
  | "assessment"
  | "pricing"
  | "single_class"
  | "class_mode"
  | "timings"
  | "courses"
  | "summer_camp"
  | "general";

function detectIntent(q: string): Intent {
  const s = q.toLowerCase();
  const trimmed = s.trim();

  if (
    /^(hi|hello|hey|hii+|heyy+|hola|namaste|good morning|good afternoon|good evening)\b/.test(
      trimmed
    ) &&
    trimmed.length <= 30
  ) {
    return "greeting";
  }

  if (
    /(free\s*assessment|assessment\s*class|demo\s*class|demo|free\s*demo|free\s*trial)/.test(
      s
    )
  ) {
    return "assessment";
  }

  if (
    /\b(single\s*class|one\s*class|paid\s*class|paid\s*trial|trial\s*price|trial\s*fee)\b/.test(
      s
    )
  ) {
    return "single_class";
  }

  if (/\b(1:1|one-to-one|one to one|individual class|private class)\b/.test(s)) {
    return "class_mode";
  }

  if (/(summer\s*camp|summer\s*camps|fast\s*track|vacation\s*course|holiday\s*course)/.test(s))
    return "summer_camp";

  if (/(price|prices|cost|fee|fees|pricing|package|packages|plan|plans)/.test(s))
    return "pricing";
  if (/(minute|minutes|min|duration|how long|time per class)/.test(s))
    return "timings";
  if (/(phonics|grammar|public speaking|course|track|classes|do you teach)/.test(s))
    return "courses";

  return "general";
}

function formatFactsForIntent(intent: Intent): { text: string; sourcesUsed: string[] } {
  if (intent === "assessment") {
    return {
      text:
        `✅ ${FREE_DEMO_OFFER_NAME}: FREE (₹${FREE_DEMO_PRICE}).\n` +
        `${FREE_DEMO_FULL_DESCRIPTION}\n` +
        `No credit card or enrolment commitment is required.`,
      sourcesUsed: ["assessment"],
    };
  }

  if (intent === "pricing") {
    const starter = ASK_TINYSTEPS_FACTS.pricingPackages[0];
    return {
      text:
        `Standard 1:1 classes are ₹${ASK_TINYSTEPS_FACTS.paidSingleClassPrice} per class. ` +
        `The ${starter.classes}-class plan is ${formatINR(starter.price)}. ` +
        `${FREE_DEMO_OFFER_NAME} is free and lasts ${ASK_TINYSTEPS_FACTS.freeDemoDurationMins} minutes.`,
      sourcesUsed: ["pricing", "assessment"],
    };
  }

  if (intent === "single_class") {
    return {
      text:
        `Standard single paid class (${ASK_TINYSTEPS_FACTS.classDurationMins} minutes, 1:1): ₹${ASK_TINYSTEPS_FACTS.paidSingleClassPrice}. ` +
        `${FREE_DEMO_OFFER_NAME} is FREE (₹${FREE_DEMO_PRICE}) and is recommended before purchasing paid classes.`,
      sourcesUsed: ["pricing", "assessment"],
    };
  }

  if (intent === "class_mode") {
    return {
      text: `Yes. Tiny Steps standard classes are live 1:1 sessions, ${ASK_TINYSTEPS_FACTS.classDurationMins} minutes each.`,
      sourcesUsed: ["timings", "courses"],
    };
  }

  if (intent === "timings") {
    return {
      text:
        `Each class is ${ASK_TINYSTEPS_FACTS.classDurationMins} minutes ` +
        `(${ASK_TINYSTEPS_FACTS.classModes.join(", ")}).`,
      sourcesUsed: ["timings"],
    };
  }

  if (intent === "courses") {
    const trackLines = ASK_TINYSTEPS_FACTS.tracks
      .map((t) => `• ${t.name} (${t.ageRange})`)
      .join("\n");
    return {
      text: `We offer:\n${trackLines}\n\nOverall age range: ${ASK_TINYSTEPS_FACTS.ageRangeOverall}.`,
      sourcesUsed: ["courses"],
    };
  }

  if (intent === "summer_camp") {
    return {
      text:
        "Summer Camp 2026 ended on 13 June 2026. Enrolment is closed.\n" +
        "Historical details: https://tinystepslearning.com/summer-camps",
      sourcesUsed: ["summer_camps"],
    };
  }

  return { text: "", sourcesUsed: [] };
}

function schoolFallback(question: string): string {
  if (/(price|prices|pricing|fee|fees|cost|package|packages|plan|plans|how much)/i.test(question)) {
    return (
      "School partnership pricing is separate from parent 1:1 pricing. " +
      "Please see the current For Schools page for the applicable school plan: " +
      "https://tinystepslearning.com/for-schools"
    );
  }

  return (
    "Yes. Tiny Steps has a dedicated For Schools programme. " +
    "You can view the current school partnership details here: " +
    "https://tinystepslearning.com/for-schools"
  );
}

function greetingReply(): { text: string; sourcesUsed: string[] } {
  return {
    text:
      "Hi! 👋 I’m Ask TinySteps.\n\n" +
      "You can ask me:\n" +
      "• One Free 35-Minute Demo Assessment Class\n" +
      "• Pricing / packages\n" +
      "• Class duration\n" +
      "• Courses (Phonics / Grammar / Public Speaking)\n" +
      "• Programmes for schools\n\n" +
      "Tell me what you’re looking for.",
    sourcesUsed: [],
  };
}

const CONTEXTUAL_FOLLOW_UP_PATTERN =
  /^(?:what|how) about\b|^and\b|\b(?:this|that|it|those|same one|same thing)\b|\bhow much is it\b|\bhow much does (?:it|this|that) cost\b|\bhow long is it\b|\btell me more\b/i;

function isContextualFollowUp(question: string): boolean {
  return CONTEXTUAL_FOLLOW_UP_PATTERN.test(question.trim());
}

function historyForAI(messages: AskChatMessage[], maxMessages = 3): AskChatMessage[] {
  return messages.slice(-maxMessages).map((m) => ({
    role: m.role,
    content: String(m.content || "").slice(0, 2000),
  }));
}

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
      let sourceSelection: ReturnType<typeof selectAskTinyStepsSources> | null = null;

      if (intent === "greeting") {
        const res = greetingReply();
        assistantText = res.text;
      } else {
        const recentUserMessages = messages
          .filter((message) => message.role === "user")
          .map((message) => message.content)
          .slice(-2);
        const contextualFollowUp = isContextualFollowUp(trimmed);
        const selectionQuestion =
          contextualFollowUp && recentUserMessages.length > 0
            ? `${recentUserMessages[recentUserMessages.length - 1]} ${trimmed}`
            : trimmed;

        sourceSelection = selectAskTinyStepsSources(selectionQuestion, {
          recentUserMessages,
          currentPath: typeof window !== "undefined" ? window.location.pathname : undefined,
        });

        // A clear standalone question gets a fresh Gemini chat so old parent/school
        // answers cannot contaminate the new audience. A genuine follow-up receives
        // only the immediately preceding user/assistant turn.
        const conversation = contextualFollowUp
          ? historyForAI([...messages.slice(-2), userMsg], 3)
          : [userMsg];

        try {
          const aiReply = await callAskTinySteps(conversation, {
            sourceIds: sourceSelection.sourceIds,
          });
          if (aiReply?.trim()) {
            assistantText = aiReply.trim();
          }
        } catch {
          console.warn("AskTinySteps AI unavailable; using the approved local fallback.");
        }
      }

      // Fail-closed deterministic fallback. These local facts are not sent to Gemini.
      // A successful verified fallback is a valid answer, so it must not display a
      // contradictory red provider-outage banner to the visitor.
      if (!assistantText) {
        if (sourceSelection?.audience === "schools") {
          assistantText = schoolFallback(trimmed);
        } else if (
          intent === "assessment" ||
          intent === "pricing" ||
          intent === "single_class" ||
          intent === "class_mode" ||
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
