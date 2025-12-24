import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { logger } from 'firebase-functions';
import groq from 'groq-sdk';

// Declare secret used by this function (Secret Manager key: groq-api-key)
defineSecret('groq-api-key');

export const askTinySteps = onCall(
  {
    region: 'asia-south1',
    memory: '256MiB',
    timeoutSeconds: 60,
secrets: ["GROQ_API_KEY", "groq-api-key"],
  },
  async (request) => {
const apiKey = process.env.GROQ_API_KEY || process.env["groq-api-key"];
    if (!apiKey) {
      logger.error('askTinySteps: GROQ_API_KEY missing');
      throw new HttpsError('failed-precondition', 'GROQ_API_KEY is not set.');
    }

    const { messages } = request.data || {};
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      throw new HttpsError('invalid-argument', 'messages array is required');
    }

    const groqClient = new groq({ apiKey });

    const systemPrompt = `You are "Ask TinySteps", the official assistant for Tiny Steps Learning, a premium 1:1 online English school for kids (phonics, grammar, public speaking), ages 3–12.

GOALS:
- Help parents understand Tiny Steps classes, age groups, curriculum, pricing, demo sessions, and how the program works.
- Use warm, friendly, simple Indian English, as if talking to a busy parent.
- Keep responses concise: usually 3–6 short sentences.
- When you mention money, always use Indian Rupees (₹).

CONTEXT:
- Tiny Steps offers 1:1 live online sessions focused on English skills for children in the 3–12 age range.
- Main tracks: Phonics, Grammar, Public Speaking.
- Typical class duration: around 35 minutes per 1:1 session.

GUARDRAILS:
- If you are not fully sure about exact details (specific batch timings, custom scheduling, discounts, holidays, teacher allocation), say: "I’m not fully sure about this detail. Our team will confirm this for you on WhatsApp."
- Do NOT invent special offers, discounts, scholarships, or guarantees.
- Do NOT give medical or psychological advice. For questions about health, learning disorders, speech delays or therapy, gently say you are not a doctor and suggest speaking to a professional.
- Never ask for or handle sensitive information such as Aadhaar numbers, addresses, passwords, OTPs, or card details.
- Keep the tone positive. Do not criticise or speak negatively about other schools or competitors.`;

    const fullMessages = [{ role: 'system', content: systemPrompt }, ...messages];

    try {
      const response = await groqClient.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        temperature: 0.6,
        max_tokens: 300,
        messages: fullMessages,
      });

      const reply = response.choices?.[0]?.message;
      if (!reply) {
        throw new HttpsError('internal', 'No reply from Groq');
      }
      return { reply };
    } catch (error) {
      logger.error('askTinySteps: Groq error', error);
      throw new HttpsError('internal', 'Failed to generate response');
    }
  }
);

export default askTinySteps;
