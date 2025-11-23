// functions/src/soundDetective.ts
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import Groq from 'groq-sdk';

type Level = 'easy' | 'medium' | 'hard';

export interface SoundDetectiveRequest {
  targetSound: string;          // e.g. "s", "sh", "ch"
  level?: Level;                // "easy" | "medium" | "hard"
  kidName?: string;
  kidAge?: number;
}

export interface SoundOption {
  word: string;
  isCorrect: boolean;
  pictureHint?: string;
  exampleSentence?: string;
}

export interface SoundDetectiveResponse {
  targetSound: string;
  level: Level;
  instruction: string;
  options: SoundOption[];
}

// 🔐 Read the Secret Manager secret "groq-api-key"
const groqApiKey = defineSecret('groq-api-key');

/**
 * Static fallback so the game still works even if Groq fails.
 * You can extend this table later.
 */
function fallbackRound(
  targetSound: string,
  level: Level,
): { instruction: string; options: SoundOption[] } {
  const sound = targetSound.toLowerCase();

  if (sound === 's') {
    return {
      instruction: 'Tap the word that starts with the /s/ sound.',
      options: [
        {
          word: 'sun',
          isCorrect: true,
          pictureHint: 'A bright yellow circle in the sky.',
          exampleSentence: 'The sun is shining.',
        },
        { word: 'cat', isCorrect: false },
        { word: 'map', isCorrect: false },
        { word: 'dog', isCorrect: false },
      ],
    };
  }

  // default generic fallback
  return {
    instruction: `Tap the word that starts with the /${sound}/ sound.`,
    options: [
      {
        word: `${sound}${sound === 'a' ? 'nt' : 'an'}`, // silly but safe default
        isCorrect: true,
      },
      { word: 'cat', isCorrect: false },
      { word: 'ball', isCorrect: false },
      { word: 'tree', isCorrect: false },
    ],
  };
}

export const soundDetectiveRound = onCall(
  {
    region: 'asia-south1', // 👈 keep same region you use elsewhere
    secrets: [groqApiKey],
  },
  async (request): Promise<SoundDetectiveResponse> => {
    const data = (request.data || {}) as SoundDetectiveRequest;

    const rawSound = data.targetSound;
    if (!rawSound || typeof rawSound !== 'string') {
      throw new HttpsError(
        'invalid-argument',
        'targetSound (like "s" or "sh") is required.',
      );
    }

    const targetSound = rawSound.trim().toLowerCase();
    const level: Level = data.level ?? 'easy';

    let instruction = '';
    let options: SoundOption[] = [];

    try {
      const apiKey = groqApiKey.value();
      if (!apiKey) {
        throw new Error('Groq API key missing from secret groq-api-key');
      }

      const groq = new Groq({ apiKey });

      const prompt = `
You are creating a phonics game for a 5-year-old child.

Target sound: "${targetSound}"
Level: "${level}"

Return JSON only, in this exact shape:
{
  "instruction": "short, friendly instruction for the child",
  "options": [
    { "word": "sun", "isCorrect": true, "pictureHint": "…", "exampleSentence": "…" },
    ...
  ]
}

Rules:
- Exactly 4 options.
- Exactly 1 option must have the target sound at the BEGINNING of the word.
- Other 3 options must clearly not start with that sound.
- Use simple, kid-friendly words and sentences.
      `.trim();

      const completion = await groq.chat.completions.create({
        model: 'mixtral-8x7b-32768',
        temperature: 0.7,
        max_tokens: 512,
        messages: [
          {
            role: 'system',
            content: 'You are a phonics game generator for 5-year-old children.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const content = completion.choices[0]?.message?.content ?? '';
      let parsed: any;

      try {
        parsed = JSON.parse(content);
      } catch {
        const match = content.match(/\{[\s\S]*\}/);
        if (!match) {
          throw new Error('Could not parse Groq JSON content');
        }
        parsed = JSON.parse(match[0]);
      }

      if (!parsed.options || !Array.isArray(parsed.options)) {
        throw new Error('Groq response missing "options" array');
      }

      instruction =
        typeof parsed.instruction === 'string'
          ? parsed.instruction
          : `Tap the word that starts with /${targetSound}/.`;

      options = parsed.options
        .map((o: any): SoundOption => ({
          word: String(o.word),
          isCorrect: Boolean(o.isCorrect),
          pictureHint:
            typeof o.pictureHint === 'string' ? o.pictureHint : undefined,
          exampleSentence:
            typeof o.exampleSentence === 'string'
              ? o.exampleSentence
              : undefined,
        }))
        .slice(0, 4);

      if (!options.some((o) => o.isCorrect)) {
        throw new Error('No correct option flagged in Groq response');
      }
    } catch (err) {
      console.error('[soundDetectiveRound] Groq failed, using fallback', err);
      const fb = fallbackRound(targetSound, level);
      instruction = fb.instruction;
      options = fb.options;
    }

    return {
      targetSound,
      level,
      instruction,
      options,
    };
  },
);
