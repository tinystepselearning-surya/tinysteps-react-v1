# Ask TinySteps – Groq Chatbot Specification (SOURCE OF TRUTH)

This document defines the behaviour, architecture, and files for the **Ask TinySteps** chatbot.

If you change this feature (prompt, function name, files, UX), you **must update this file**.

---

## 1. Purpose

**Ask TinySteps** is a small AI chatbot for **parents** on the public website.

It should:

- Answer parent questions about:
  - Tiny Steps courses (Phonics, Grammar, Public Speaking)
  - Age groups and curriculum levels
  - Class format (1:1, duration, general timings)
  - Demo/assessment sessions and how enrolment works
  - High-level pricing in ₹ (no made-up discounts)
- Live on the **home/hero section** as a button or badge.
- Use **Groq LLM** via **Firebase Functions** (backend only — no direct Groq calls from React).
- Always offer escalation to a **human advisor on WhatsApp**.

This is a **top-of-funnel support assistant**, not a replacement for human counselling.

---

## 2. Architecture Overview

### 2.1 Backend

- Platform: **Firebase Functions**
- Function name (callable): **`askTinySteps`**
- Groq integration:
  - Must **reuse the existing shared Groq client/helper** (e.g. `getGroqClient()`).
  - Must **not** create a second Groq client or embed API keys in code.
- Location suggestion:
  - `functions/src/ai/askTinySteps.ts`
  - Exported from `functions/src/index.ts` as:
    ```ts
    export { askTinySteps } from "./ai/askTinySteps";
    ```

**Input format (callable data):**

```ts
type AskTinyStepsInput = {
  messages: { role: "user" | "assistant" | "system"; content: string }[];
};
Output format:

ts
Copy code
type AskTinyStepsOutput = {
  reply: {
    role: "assistant";
    content: string;
    // extra fields allowed (e.g. id, etc.) but not required
  };
};
Model & settings (baseline):

Model: reuse project default; if none, use:

model: "llama-3.3-70b-versatile"

Suggested options:

temperature: 0.5–0.7 (default to 0.6)

max_tokens: ~300

Function responsibilities:

Validate data.messages:

Must exist, be an array, and non-empty.

Otherwise, throw:

ts
Copy code
new functions.https.HttpsError("invalid-argument", "messages array is required");
Build the final messages array:

Prepend the system prompt (see Section 3).

Then append all user/assistant messages from data.messages (in order).

Call Groq chat completions via the shared client.

Extract the assistant’s message.

Return { reply }.

Handle errors with HttpsError("internal", "…") and do not leak stack traces.

2.2 Frontend
Framework: React (Vite + TypeScript + Tailwind)

Ask TinySteps consists of three layers on the frontend:

Service – API wrapper for the callable function.

Hook – chat state & flow.

UI Component (Modal) – visual chat window.

Planned files
src/services/askTinyStepsService.ts

src/hooks/useAskTinyStepsChat.ts

src/components/Home/AskTinyStepsModal.tsx

Integration in main landing page (e.g. src/pages/HomePage.tsx or equivalent).

3. System Prompt (Behaviour & Guardrails)
The askTinySteps backend function must prepend this system message for every Groq call (you may adjust minor wording, but not the rules):

text
Copy code
You are "Ask TinySteps", the official assistant for Tiny Steps Learning,
a premium 1:1 online English school for kids (phonics, grammar, public speaking), ages 3–12.

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
- If you are not fully sure about exact details (specific batch timings, custom scheduling, discounts, holidays, teacher allocation), say:
  "I’m not fully sure about this detail. Our team will confirm this for you on WhatsApp."
- Do NOT invent special offers, discounts, scholarships, or guarantees.
- Do NOT give medical or psychological advice. For questions about health, learning disorders, speech delays or therapy, gently say you are not a doctor and suggest speaking to a professional.
- Never ask for or handle sensitive information such as Aadhaar numbers, addresses, passwords, OTPs, or card details.
- Keep the tone positive. Do not criticise or speak negatively about other schools or competitors.
If you change pricing, age bands, or course structure, you must update this section.

4. UX Requirements
4.1 Entry point (Homepage)
There should be a clear button or badge on the public home/hero section, e.g.:

“Chat with Ask TinySteps (AI)”

Clicking this opens the AskTinyStepsModal.

The existing WhatsApp advisor button stays as a separate, human-support path.

4.2 Modal Behaviour
Component: AskTinyStepsModal

Props:

ts
Copy code
type AskTinyStepsModalProps = {
  open: boolean;
  onClose: () => void;
};
If open === false, render null.

If open === true, render:

Full-screen semi-transparent backdrop (fixed, top-0 left-0, high z-index).

Centered card (rounded-2xl, white, shadow; max-width ~400px on desktop, full-width on mobile).

Close behaviour:

Clicking the close (X) button.

Clicking on the backdrop outside the card.

Pressing Escape (if implemented).

4.3 Modal Layout
Header:

Title: Ask TinySteps 🤝

Subtitle: small text:

“Ask about classes, timings, pricing, curriculum…”

Close (X) icon/button aligned to the right.

Body (chat area):

Scrollable area with vertical space for messages.

Renders chat history from hook’s messages:

role: "user" → right-aligned bubble

Tailwind example: text-right, bubble with bg-orange-100, rounded-xl, px-2 py-1.

role: "assistant" → left-aligned bubble

Tailwind example: text-left, bubble with bg-white + border + rounded-xl.

Initial state (no messages):

Show a soft hint, e.g.:

“Example: ‘What are your fees for 1:1 phonics classes?’ or ‘Do you teach kids in Grade 1?’”

Loading:

When loading === true, show a small indicator at the bottom:

“Tiny Steps is typing…” or animated dots.

Error:

If error is set, show a small red text near the bottom of the body, e.g.:

“I’m having trouble responding right now. You can WhatsApp our team directly.”

Footer:

Input field bound to hook’s input.

Send button:

Calls sendMessage() from the hook.

Disabled while loading.

Keyboard:

Pressing Enter (without Shift) sends the message.

Under the input row:

A small link/button for human escalation:

Text: Talk to a human advisor on WhatsApp →

Opens https://wa.me/91961839833 in a new tab/window.

5. Hook Responsibilities – useAskTinyStepsChat
File: src/hooks/useAskTinyStepsChat.ts

The hook manages chat state and flow (no direct Groq or Firebase calls).

State:

ts
Copy code
type ChatMessage = { role: "user" | "assistant"; content: string };

const [messages, setMessages] = ...
const [input, setInput] = ...
const [loading, setLoading] = ...
const [error, setError] = ...
API:

ts
Copy code
export function useAskTinyStepsChat() {
  return {
    messages,
    input,
    setInput,
    loading,
    error,
    sendMessage,
    resetChat,
  };
}
Behaviour:

setInput(value: string) – standard setter.

sendMessage():

Trim input.

If empty, do nothing.

Append a user message to messages.

Clear input.

Set loading = true, error = null.

Call callAskTinySteps(messagesWithNewUserMessage) (see Section 6).

On success:

Append assistant reply as { role: "assistant", content: replyContent }.

On failure:

Set error with a simple user-facing message.

Always set loading = false in a finally block.

resetChat():

Clears messages, error and optionally input.

6. Service Responsibilities – askTinyStepsService
File: src/services/askTinyStepsService.ts

This file is the only frontend place that talks to Firebase Functions for Ask TinySteps.

Responsibilities:

Import:

getFunctions, httpsCallable from firebase/functions.

The existing app from firebaseConfig.

Initialize a callable instance for "askTinySteps".

API:

ts
Copy code
export async function callAskTinySteps(
  messages: { role: "user" | "assistant"; content: string }[]
): Promise<string> {
  // ...
}
Behaviour:

Map the simple chat messages to the backend format:

{ role, content } (no system role here; backend adds system prompt).

Call the callable Cloud Function "askTinySteps".

Expect a response matching AskTinyStepsOutput (Section 2.1).

Extract reply.content as string and return it.

If the response is malformed or the call fails:

Throw a descriptive error (for the hook to handle).

The service must not know about UI or browser events.

7. Backend Function Notes – askTinySteps
File (suggested): functions/src/ai/askTinySteps.ts

Key points:

Must reuse shared Groq client (e.g. getGroqClient()).

Must not embed API keys or create a new Groq instance with a hardcoded key.

Pseudo-flow:

ts
Copy code
export const askTinySteps = functions.https.onCall(async (data, context) => {
  // 1. Validate input
  // 2. Build messages = [systemPrompt, ...data.messages]
  // 3. Call groq.chat.completions.create(...)
  // 4. Extract reply
  // 5. Return { reply }
});
Error handling:

For validation issues:

new HttpsError("invalid-argument", "…")

For Groq / runtime failures:

new HttpsError("internal", "Failed to generate reply")

8. Integration in Home Page
Typical steps in main landing page (e.g. src/pages/HomePage.tsx):

Import the modal:

ts
Copy code
import { AskTinyStepsModal } from "../components/Home/AskTinyStepsModal";
Add state:

ts
Copy code
const [askOpen, setAskOpen] = useState(false);
Add a trigger button in the hero / advisor area:

tsx
Copy code
<button
  onClick={() => setAskOpen(true)}
  className="..."
>
  Chat with Ask TinySteps (AI)
</button>
Render the modal:

tsx
Copy code
<AskTinyStepsModal open={askOpen} onClose={() => setAskOpen(false)} />
The existing WhatsApp CTA should remain available and visible.

9. Source of Truth & Change Policy
This file (docs/ai-ask-tinysteps.md) is the source of truth for:

Ask TinySteps behaviour and guardrails.

System prompt text.

Frontend and backend file responsibilities.

Input/output contracts of the askTinySteps function.x₹