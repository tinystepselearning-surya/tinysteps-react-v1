# AI-2A — Ask Tiny Steps Public KB Forensic Audit

Date: 2026-08-28

Baseline audited: `main` at `6ba6b988c0203e0641eb149bc18b9e6962f79cd7`

Scope: understand the current `public_kb_chunks` pipeline, refresh behavior, retrieval scoring, prompts, indexed pages, Firestore/functions involved, factual-source drift, and which parts remain useful for the Gemini architecture. **No production code, Firestore rule, collection, prompt, or KB data is deleted or changed in this brick.**

## Executive conclusion

The legacy Ask Tiny Steps KB is a small deterministic keyword-RAG layer built for the previous Groq integration. It is safe and understandable, but it is now too narrow to be the primary knowledge architecture for Gemini.

The most important findings are:

1. **`Refresh Public KB` does not fetch the listed website pages.** It fetches one hosted static file, `https://tinystepslearning.com/kb.json`, then selects entries whose `path` matches the requested list.
2. The repository's `public/kb.json` currently contains **17 curated entries**, but the backend default refresh indexes only **8** of them.
3. The admin UI sends a different default list from the backend. It includes **4 retired paths** and omits `/book-demo`.
4. Retrieval is lexical rather than semantic: query token overlap + title overlap + hard-coded page boosts + hard-coded intent boost.
5. Each answer receives at most **2 snippets × 420 characters**, so the model sees a very small fraction of the public knowledge even when better content exists.
6. The legacy prompt duplicates business facts outside the canonical fact layer. This has already created drift risks around session duration, programme ages, and historical Summer Camp details.
7. The repo now has a much stronger canonical facts/audit foundation (`src/config/publicFacts.ts`, `public/llms.txt`, `public/kb.json`, `scripts/audit-public-facts.mjs`) than the old Ask Tiny Steps prompt/retriever uses.
8. The live public site now contains much richer parent-decision and educational pages that the current 8-page retrieval allowlist cannot use.
9. `public_kb_chunks` is still useful as a **temporary fallback / evaluation baseline**, but the tokenizer/scoring/chunk store should not be the long-term primary Gemini knowledge engine.

The recommended next brick is therefore a **Knowledge Sources registry**, not a destructive replacement of this collection.

---

## 1. Current architecture on `main`

### Legacy request path

```text
Admin-curated public/kb.json
          │
          ▼
refreshPublicKb Cloud Function
          │
          ▼
Firestore: public_kb_chunks
          │
          ▼
askTinySteps Cloud Function
  ├─ detect intent
  ├─ keyword query
  ├─ rank candidates
  ├─ choose max 2 snippets
  └─ inject snippets + hard-coded FACTS
          │
          ▼
Groq / llama-3.3-70b-versatile
          │
          ▼
Ask Tiny Steps modal
```

### Gemini migration delta

The subsequent Groq → Firebase AI Logic migration was reported as:

```text
FloatingAssistant
  → hook
  → Firebase AI Logic SDK
  → Gemini Developer API
  → gemini-3.5-flash-lite
```

The handoff report also states that only two bounded approved public-context snippets are sent per request and that the old Groq Cloud Function/runtime was removed.

**Important audit boundary:** those migration commits (`32d9729a`, `407107ff`, `2850ac64`, `49ed469b`) are not present on the GitHub remote at the time of this audit, so the exact new Gemini prompt/context-selection implementation cannot yet be independently line-audited here. This report therefore distinguishes the repository-observed legacy KB from the migration behavior reported by the implementation handoff.

---

## 2. Inventory — code, data and Firebase resources

### Public source files

| Resource | Role | Current value |
|---|---|---|
| `public/kb.json` | Curated machine-readable facts/content used by the KB refresher | High |
| `public/llms.txt` | Richer AI-oriented public site summary and canonical links | High |
| `src/config/publicFacts.ts` | Canonical public business facts | Very high |
| `src/config/publicOffer.ts` | Canonical public pricing/demo constants | Very high |
| `src/lib/schemas.ts` | Shared public identity/programme/session wording | High |
| `scripts/audit-public-facts.mjs` | Detects public factual drift and expired claims | Very high |

### Ask Tiny Steps legacy runtime

| Resource | Role |
|---|---|
| `functions/src/ai/refreshPublicKb.ts` | Fetches `/kb.json`, chunks/tokenizes selected entries, writes Firestore |
| `functions/src/ai/askTinySteps.ts` | Retrieval, scoring, prompt construction, deterministic fallbacks, Groq call |
| `src/pages/admin/RefreshPublicKbTool.tsx` | Admin manual refresh UI |
| `src/services/askTinyStepsService.ts` | Browser → callable Cloud Function adapter |
| `src/hooks/useAskTinyStepsChat.ts` | Conversation/UI state and submission flow |
| `functions/src/index.ts` | Exports callable functions |

### Firestore

Primary legacy KB collection:

```text
public_kb_chunks/{chunkId}
```

Chunk shape:

```ts
{
  path,
  url,
  title,
  text,
  tokens,
  active,
  updatedAt,
  runId
}
```

Writes and reads in the legacy architecture are server-side via Firebase Admin SDK. There is no need to open public client Firestore access for this collection.

---

## 3. What `Refresh Public KB` actually does

The admin UI describes the action as:

> Fetches your public pages, chunks text, tokenizes it, and updates `public_kb_chunks`.

The implementation is different:

```text
https://tinystepslearning.com/kb.json
                │
                ▼
        select entries by path
                │
                ▼
      chunk already-curated text
```

It **does not fetch each entered URL/page** and does not parse the current live page HTML.

This means pressing `Run Now` cannot make the assistant learn a newly edited page unless the deployed `kb.json` itself has also been updated first.

### Why this matters

The existing admin label creates a false freshness expectation. A user can refresh today and still index manually-curated text that does not reflect today's page content.

---

## 4. Source coverage audit

### `public/kb.json` currently contains 17 entries

1. `/`
2. `/for-schools`
3. `/blog/does-cbse-include-phonics-ncf-foundational-literacy`
4. `/blog/cbse-phonics-curriculum-vs-systematic-phonics-programme`
5. `/blog/phonics-scope-and-sequence-for-cbse-schools`
6. `/blog/international-phonics-benchmarks-for-indian-schools`
7. `/blog/why-letter-sounds-are-not-enough-to-read`
8. `/blog/how-schools-can-assess-decoding-not-memorisation`
9. `/blog/systematic-cumulative-phonics-explained-for-schools`
10. `/blog/phonics-teacher-training-for-schools-implementation`
11. `/book-demo`
12. `/pricing`
13. `/courses`
14. `/faq`
15. `/why-tiny-steps`
16. `/curriculum`
17. `/summer-camps`

### Backend default refresh indexes only 8 paths

`functions/src/ai/refreshPublicKb.ts`:

```text
/
/book-demo
/pricing
/courses
/faq
/why-tiny-steps
/curriculum
/summer-camps
```

Therefore, by default, the KB ignores:

- `/for-schools`
- all 8 current school/phonics authority articles in `kb.json`
- newer parent hub / diagnostic pages that are not represented in `kb.json`
- richer programme-specific live pages such as `/phonics`, `/grammar`, `/speaking`
- class samples, testimonials, reading-support guides, and other current decision pages

This was reasonable for a tiny FAQ assistant but is too restrictive for a more capable Gemini assistant.

---

## 5. Admin UI and backend defaults are out of sync

The admin UI currently pre-populates **11** paths:

```text
/
/summer-camps
/summer-camps/phonics-fast-track
/summer-camps/grammar-fast-track
/summer-camps/speaking-fast-track
/pricing
/courses
/faq
/how-it-works
/why-tiny-steps
/curriculum
```

The backend defines these as retired:

```text
/how-it-works
/summer-camps/phonics-fast-track
/summer-camps/grammar-fast-track
/summer-camps/speaking-fast-track
```

So the admin's default list contains **all four retired paths**.

The current `public/kb.json` no longer contains those retired entries, so they are deactivated and not re-created. However, they still create confusing admin UX and noisy refresh reporting.

More importantly, the admin list **omits `/book-demo`**, even though the backend default and legacy assistant both treat it as a key page.

Because refresh is per requested URL rather than a complete atomic source snapshot, omitting a path does not globally retire its previous active chunks. This permits mixed refresh ages across sources.

---

## 6. Chunking and tokenization audit

### Chunking

`refreshPublicKb.ts`:

- target maximum chunk length: ~1100 characters
- target minimum: ~450 characters
- paragraph-aware with sentence splitting for oversized paragraphs
- maximum 40 chunks per source entry

This is simple and deterministic.

### Stored retrieval tokens

- lowercase
- punctuation removed
- lightweight singularisation (`ies → y`, trailing plural `s` removal)
- stop words removed
- max 5000 raw tokens examined
- max 150 unique stored tokens per chunk

Useful properties:

- easy to debug
- low infrastructure complexity
- no embedding/vector cost
- deterministic behavior

Weaknesses:

- no phrase meaning
- no semantic similarity
- no synonym coverage beyond a small hand-built map
- no topic hierarchy
- no source authority/freshness weighting
- no embedding or reranking
- important context can be split from the matching keyword

---

## 7. Retrieval and scoring audit

Legacy retrieval uses the **last user message only** to choose knowledge.

### Query preparation

1. tokenize question
2. apply a small hard-coded synonym expansion map
3. take up to 10 unique query tokens
4. Firestore query:

```ts
where('tokens', 'array-contains-any', qTokens).limit(25)
```

### Candidate score

```text
score =
  token overlap × 1.8
+ title overlap × 2.4
+ key-page boost
+ exact intent-page boost (4 points)
```

Then:

- reject inactive docs
- reject paths outside a hard-coded allowlist
- reject score ≤ 0.9
- sort descending
- strongly prefer the hard-coded intended path when available
- return maximum **2 snippets**
- truncate each snippet to **420 characters**

### Retrieval strengths

- pricing reliably prefers `/pricing`
- course questions prefer `/courses`
- curriculum prefers `/curriculum`
- FAQ prefers `/faq`
- assessment/duration prefers `/book-demo`
- easy to reason about and debug

### Retrieval weaknesses

- lexical match is brittle for natural parent language
- every new concept requires code changes to intent regexes/synonym tables
- retrieval does not use prior conversation context
- hard-coded intent routing can override a better source
- no relevance confidence beyond a hand-tuned score
- no source freshness signal
- no content hash/version check
- no semantic reranker
- no diversity control across sources
- max 2 × 420 chars artificially starves a capable model of context

### Legacy Firestore cost shape

One retrieval can read up to 25 candidate chunk documents even though only 2 snippets are used. At current traffic this is not necessarily expensive, but it is inefficient compared with selecting authoritative source URLs/metadata first.

---

## 8. Prompt audit

The old Cloud Function hard-codes a large `FACTS` section and then, when retrieval succeeds, instructs the model:

```text
Use ONLY snippets + FACTS. Do not add outside knowledge.
```

It also constrains answers to roughly 2–4 short sentences / under ~75 words.

These controls reduced hallucination risk with the previous provider, but they also limit the value of Gemini for educational explanations and parent guidance.

### Duplicated hard-coded facts

The prompt contains business data that already has better canonical sources elsewhere in the repo.

Examples:

- demo duration and price
- class duration
- programme age ranges
- pricing
- summer-camp status/history
- WhatsApp CTA

This creates multiple competing sources of truth.

### Confirmed factual-drift risks

#### Regular class duration

Legacy prompt/fallback:

```text
Each class is 35 minutes
```

Canonical public fact layer:

```text
35–40 minutes per session
```

The free demo is specifically 35 minutes, but regular class duration is represented elsewhere as 35–40 minutes. The assistant prompt therefore risks conflating the two.

#### Summer Camp details

`public/kb.json` deliberately says that outdated Summer Camp schedules, fees, capacity details and promotional terms are omitted.

The legacy assistant prompt/fallback separately reintroduces historical values such as the old ₹5,000 / ₹2,400 fees and 24-class schedule.

This defeats the newer seasonal-cleanup policy and is exactly the kind of duplicated fact that should disappear from the future prompt architecture.

#### Programme age wording

The repo has multiple public age concepts:

- overall Tiny Steps audience: children aged 3–12
- phonics primary pathway: ages 3–10
- course-specific grammar/speaking age bands on dedicated pages
- broader grammar/writing pages currently publish a wider pathway than the old assistant's fixed grammar age line

The assistant currently has no canonical resolver explaining the distinction between **overall audience**, **primary pathway**, and **specific course age bands**. This can produce confident but contextually wrong age answers.

---

## 9. Canonical facts infrastructure is stronger than the legacy KB prompt

`src/config/publicFacts.ts` already centralizes:

- overall age range
- learner/country proof counts
- regular session duration
- delivery model
- core programmes
- public pricing/demo offer
- school partnership pricing
- proof policy
- outcome policy
- Summer Camp conclusion status

`scripts/audit-public-facts.mjs` already checks parity across:

- `public/llms.txt`
- `public/kb.json`
- schemas
- public pages
- rendered output
- seasonal claims

This architecture should become the foundation for AI factual governance.

The future Ask Tiny Steps prompt should consume/derive from canonical sources instead of introducing a third independent set of hard-coded facts.

---

## 10. `public/llms.txt` is currently underused by Ask Tiny Steps

`public/llms.txt` is significantly richer than the 8-page legacy retrieval set. It already includes:

- clear brand identity
- current public offer/demo facts
- Summer Camp archive policy
- school partnership positioning and pricing
- official research/reference links
- core parent pages
- learning support pages
- explicit notes for AI agents
- canonical/retired content guidance

The legacy Ask Tiny Steps retrieval does not consume this source.

This is a missed opportunity: the repository already contains an AI-oriented public knowledge manifest that is closer to the desired Gemini architecture than the old token chunks are.

---

## 11. Live-site coverage gap observed on 2026-08-28

Current public pages expose significantly richer parent guidance than the 8-page retrieval allowlist. Examples observed in the live site include:

- `/phonics`
- `/grammar`
- `/speaking`
- `/parents`
- `/parents/getting-started`
- `/class-samples`
- `/for-schools`
- current diagnostic/reading-support content

These pages contain the exact types of questions parents are likely to ask Ask Tiny Steps: blending difficulty, grammar application, speaking hesitation, placement, parent progress, class experience, and programme fit.

The legacy KB cannot retrieve most of this material because it is not in the active path allowlist, and much of it is not represented in `public/kb.json` at all.

---

## 12. Freshness model audit

Current chunk metadata has:

- `updatedAt`
- `runId`
- `active`

It does **not** have:

- source content hash
- source modified timestamp
- HTTP status
- fetch status
- last successful fetch
- stale/fresh state
- category
- priority
- canonical/seasonal designation
- redirect target
- source authority level
- last validation result

Therefore an admin cannot currently answer:

- Which knowledge source changed?
- Which source is stale?
- Which page failed?
- Which source was redirected?
- Which facts differ from canonical business facts?
- Which source is seasonal/archived?
- Which source should be preferred for a given topic?

This is the main structural reason `Refresh Public KB` should evolve into a Knowledge Sources registry.

---

## 13. What should be kept

### Keep as long-term foundations

#### `src/config/publicFacts.ts`

Keep and expand only when a fact is genuinely canonical.

#### `scripts/audit-public-facts.mjs`

Keep. Extend future AI source/prompt validation around this rather than bypassing it.

#### `public/llms.txt`

Keep. It is useful both externally and as an AI source manifest/reference.

#### `public/kb.json`

Keep for now as a curated compact factual fallback and migration baseline. It is far safer than blindly scraping every page.

#### Admin-only refresh authorization

Keep the principle that knowledge-management actions are admin-only.

#### Source/path allowlisting

Keep the security/governance principle, but move it from hard-coded arrays into managed source metadata.

---

## 14. What is useful only as a temporary compatibility layer

### `public_kb_chunks`

Useful during transition for:

- regression comparison
- fallback answers
- evaluating Gemini URL/source retrieval against the old system
- ensuring no knowledge regression during migration

Do not delete in AI-2A.

### Hand-built token scoring

Useful as an explainable baseline and possible emergency fallback, but not as the main Gemini retriever.

### Deterministic known-fact fallback

The concept is useful for critical facts, but the facts themselves must come from canonical configuration rather than duplicated strings inside the assistant implementation.

---

## 15. Components that should not drive the long-term Gemini architecture

The following should be considered legacy-primary, not immediately deleted:

- fixed `KEY_PAGES` array
- fixed `ACTIVE_PUBLIC_KB_PATHS`
- manual regex-only intent classifier
- hand-maintained synonym map as the primary semantic layer
- lexical `array-contains-any` retrieval as primary retrieval
- 2 × 420-character hard cap as the default model context
- duplicated hard-coded business FACTS inside the assistant prompt
- manual path textarea as the knowledge-management UI
- treating a `kb.json` reindex as though it were a live website refresh

---

## 16. Risk ranking

| Risk | Severity | Why |
|---|---:|---|
| Duplicated facts in prompt vs canonical facts | High | Can confidently give stale price/age/session/seasonal information |
| Admin refresh UI vs backend path mismatch | High | Admin believes source set is current when it is not |
| Narrow 8-page active coverage | High | Gemini cannot use much of the strongest current Tiny Steps content |
| Static `kb.json` presented as live-page refresh | High | Freshness semantics are misleading |
| 2 × 420-char context cap | Medium-High | Artificially limits educational/recommendation quality |
| Keyword-only retrieval | Medium-High | Misses natural-language intent and related concepts |
| No source freshness/hash/status model | Medium | Hard to operate safely over time |
| Legacy Firestore candidate reads | Medium | Wasted reads compared with source-first routing |
| Retired paths still shown in admin defaults | Medium | Confusing and produces noisy maintenance |
| No exact line audit of local Gemini migration branch yet | Medium | New prompt/context layer must be verified before AI-2B/2C implementation |

---

## 17. AI-2A decision

### Decision: do not delete the current KB yet

The existing KB is sufficiently useful as a safe migration baseline, but it should be demoted from **primary knowledge architecture** to **temporary fallback/evaluation layer** once the next architecture is validated.

### Decision: next brick should be metadata/source governance first

Before introducing URL Context, Search grounding, server prompt templates, or more model freedom, Tiny Steps needs one reliable answer to:

> What public sources is Ask Tiny Steps allowed to trust, and which source is canonical for each type of fact?

That is AI-2B.

---

## 18. Recommended AI-2B boundary

AI-2B should build an **Ask Tiny Steps Knowledge Sources registry** without replacing retrieval yet.

Suggested source metadata:

```ts
type AskTinyStepsKnowledgeSource = {
  id: string;
  path: string;
  url: string;
  title: string;
  category:
    | 'brand'
    | 'pricing'
    | 'courses'
    | 'phonics'
    | 'grammar'
    | 'speaking'
    | 'reading'
    | 'assessment'
    | 'parents'
    | 'proof'
    | 'schools'
    | 'blog'
    | 'seasonal';
  audience: 'parent' | 'school' | 'both';
  enabled: boolean;
  canonical: boolean;
  seasonal: boolean;
  priority: number;
  lastCheckedAt?: Timestamp;
  lastSuccessAt?: Timestamp;
  httpStatus?: number;
  contentHash?: string;
  status: 'healthy' | 'stale' | 'redirected' | 'failed' | 'disabled';
};
```

AI-2B should **not** yet remove `public_kb_chunks`, change Gemini provider/model, or enable Google Search grounding.

---

## 19. Acceptance status for AI-2A

- [x] `public_kb_chunks` write/read flow mapped
- [x] refresh behavior mapped
- [x] backend defaults audited
- [x] admin defaults audited
- [x] current `public/kb.json` inventory audited
- [x] chunking/tokenization audited
- [x] retrieval query/scoring audited
- [x] legacy system/retrieval prompt audited
- [x] fallback behavior audited
- [x] canonical public-facts system compared
- [x] `public/llms.txt` role assessed
- [x] live-site coverage gap assessed
- [x] keep/replace boundaries defined
- [x] no deletion performed
- [x] no Firestore rules changed
- [x] no production functions changed
- [ ] exact line-level audit of the new local-only Firebase AI Logic migration files once those commits are available on the remote branch

## 20. Files changed in AI-2A

Documentation only:

- `docs/ask-tiny-steps-ai/AI-2A-KB-FORENSIC-AUDIT.md`

No runtime behavior changes are part of AI-2A.
