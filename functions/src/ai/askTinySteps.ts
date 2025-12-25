import { onCall, HttpsError } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { logger } from "firebase-functions";
import Groq from "groq-sdk";

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

    const fullMessages = [{ role: "system", content: systemPrompt }, ...cleanMessages];

    try {
      const response = await groqClient.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        temperature: 0.6,
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
