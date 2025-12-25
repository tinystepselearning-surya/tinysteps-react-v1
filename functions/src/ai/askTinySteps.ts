import { onCall, HttpsError } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { logger } from "firebase-functions";
import Groq from "groq-sdk";
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp();
}

// ✅ Secret Manager key name: "groq-api-key"
const GROQ_API_KEY = defineSecret("groq-api-key");

export const askTinySteps = onCall(
  {
    region: "asia-south1",
    memory: "256MiB",
    timeoutSeconds: 60,
    // ✅ v2 correct usage: pass SecretParam(s), not random env names
    secrets: [GROQ_API_KEY],
  },
  async (request) => {
    const apiKey = GROQ_API_KEY.value(); // ✅ correct way to read secret

    if (!apiKey) {
      logger.error("askTinySteps: groq-api-key missing");
      throw new HttpsError("failed-precondition", "GROQ_API_KEY is not set.");
    }

    const { messages } = request.data || {};
    if (!Array.isArray(messages) || messages.length === 0) {
      throw new HttpsError("invalid-argument", "messages array is required");
    }

    // ✅ basic validation + trimming (prevents weird payloads)
    const cleanMessages = messages
      .filter(
        (m: any) =>
          m &&
          typeof m === "object" &&
          (m.role === "user" || m.role === "assistant") &&
          typeof m.content === "string"
      )
      .map((m: any) => ({ role: m.role, content: String(m.content).slice(0, 2000) }));

    if (cleanMessages.length === 0) {
      throw new HttpsError("invalid-argument", "messages must contain {role, content}");
    }

    const groqClient = new Groq({ apiKey });

    // Helper: simple tokenizer for retrieval (keeps only word tokens)
    function tokenizeForRetrieval(text: string) {
      return (String(text || '')
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(Boolean));
    }

    // Retrieve top snippets from Firestore `public_kb_chunks` by token overlap
    async function retrieveSnippets(question: string) {
      if (!question) return [];
      const qTokens = tokenizeForRetrieval(question);
      const uniq = Array.from(new Set(qTokens)).slice(0, 10);
      if (uniq.length === 0) return [];

      const col = admin.firestore().collection('public_kb_chunks');
      // query by tokens field using array-contains-any (limited to 25 docs)
      const snapshot = await col.where('tokens', 'array-contains-any', uniq).limit(25).get();
      const candidates: { url: string; title: string; text: string; tokens: string[] }[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data() as any;
        candidates.push({ url: data.url || '', title: data.title || '', text: data.text || '', tokens: Array.isArray(data.tokens) ? data.tokens : [] });
      });

      // score by overlap
      const qSet = new Set(qTokens);
      const scored = candidates.map(c => {
        let overlap = 0;
        for (const t of c.tokens) if (qSet.has(t)) overlap += 1;
        return { ...c, score: overlap };
      }).filter(c => c.score > 0).sort((a, b) => b.score - a.score);

      return scored.slice(0, 4).map(s => ({ url: s.url, title: s.title, text: s.text }));
    }

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
- Do NOT give medical or psychological advice. For questions about health, learning disorders, speech delays or therapy, gently say you are not a doctor and suggest speaking to a professional.
- Never ask for or handle sensitive information such as Aadhaar numbers, addresses, passwords, OTPs, or card details.
- Keep the tone positive. Do not criticise or speak negatively about other schools or competitors.`;

    // Check whether the caller requested retrieval-based grounding
    const useRetrieval = Boolean(request.data?.useRetrieval);

    let fullMessages: any[] = [];

    if (useRetrieval) {
      // find last user message for retrieval
      const lastUser = [...cleanMessages].reverse().find((m: any) => m.role === 'user');
      const question = lastUser ? String(lastUser.content) : '';
      let snippets: { url: string; title: string; text: string }[] = [];
      try {
        snippets = await retrieveSnippets(question);
      } catch (err) {
        logger.warn('askTinySteps: retrieval error', err);
        snippets = [];
      }

      if (!snippets || snippets.length === 0) {
        // fallback: no reliable snippets found — return safe fallback to caller
        const fallback = `I’m not fully sure about this detail. Our team will confirm this for you on WhatsApp: https://wa.me/919618398383`;
        return { reply: { role: 'assistant', content: fallback } };
      }

      // include retrieval instruction + snippets as an extra system message
      const retrievalInstructionSuffix = `\nRETRIEVAL RULES (when retrieval is provided):\n- Use ONLY the provided snippets and the FACTS above to form your answer. Do not use any outside knowledge or make assumptions.\n- Keep answers concise (3-6 short sentences).\n- At the end of the response include a short "Sources:" line listing the snippet URLs used.\n- If the provided snippets are insufficient to answer confidently, say you are not sure and provide the WhatsApp CTA: https://wa.me/919618398383`;
      const snippetBundle = snippets.map((s, i) => `[${i + 1}] ${s.url}\n${s.title}\n${s.text}`).join('\n---\n');
      const retrievalSystem = systemPrompt + '\n\n' + retrievalInstructionSuffix + '\n\nProvided snippets:\n' + snippetBundle;
      fullMessages = [{ role: 'system', content: retrievalSystem }, ...cleanMessages];
    } else {
      fullMessages = [{ role: "system", content: systemPrompt }, ...cleanMessages];
    }

    try {
      const response = await groqClient.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        temperature: 0.0,
        max_tokens: 300,
        messages: fullMessages as any,
      });

      const content = response.choices?.[0]?.message?.content?.trim();
      if (!content) {
        throw new HttpsError("internal", "No reply from Groq");
      }

      // ✅ return simple shape to frontend
      return { reply: { role: "assistant", content } };
    } catch (error) {
      logger.error("askTinySteps: Groq error", error);
      throw new HttpsError("internal", "Failed to generate response");
    }
  }
);

export default askTinySteps;
