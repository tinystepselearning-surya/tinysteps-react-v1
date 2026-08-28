# Ask Tiny Steps AI-2C — Smart Source Selection + URL Context

## Purpose

AI-2C replaces the legacy `question -> token overlap -> two copied snippets -> Gemini` path with a controlled live-page grounding path:

```text
visitor question
  -> deterministic source selector
  -> approved source IDs from AI-2B registry
  -> canonical Tiny Steps URLs only
  -> Gemini URL Context
  -> grounded answer
  -> verified source attribution
```

This brick is stacked on AI-2B and does not retire the AI-2B registry, `public_kb_chunks`, `public/kb.json`, or `refreshPublicKb`.

## Source-selection contract

- The source selector is deterministic and source-controlled.
- It selects at most **3** URLs per request even though URL Context supports larger URL sets.
- Parent and school audiences are separated.
- Specific support/research pages outrank broad programme pages when the query is specific.
- Archived content is excluded unless the question explicitly targets that archive.
- A vague follow-up may use the last user turn and the current Tiny Steps page for context.
- Clear new questions do not inherit stale school/parent routing from old turns.
- Unrelated general-purpose questions select no Tiny Steps URLs.

The three-URL cap is intentional: it reduces irrelevant context, latency, and input-token consumption while keeping enough evidence for one primary source plus supporting context.

## URL allowlist boundary

Visitor-controlled URLs never become URL Context sources.

The application passes source **IDs**, not arbitrary URLs, into `callAskTinySteps`. The service resolves those IDs against `ASK_TINY_STEPS_KNOWLEDGE_SOURCES` and accepts only canonical URLs under:

```text
https://tinystepslearning.com
```

All complete URLs found in user/assistant conversation text are removed before the conversation reaches Gemini. The only complete URLs in the current grounding prompt are application-selected canonical URLs from the registry.

This prevents a visitor from turning Ask Tiny Steps into a general-purpose URL reader or introducing an untrusted webpage into URL Context.

## Webpage prompt-injection boundary

The system instruction treats retrieved webpage content as **data, not instructions**. Gemini is instructed to ignore page content that attempts to alter its role, rules, tool use, or source policy and not to follow nested links.

## Grounding verification

The model response is not trusted merely because URL Context was requested.

After generation, the service checks the candidate's `urlContextMetadata.urlMetadata` and accepts only URLs reported with successful URL retrieval. For a Tiny Steps factual request, the **primary selected source must have been successfully retrieved**.

If the primary source was not retrieved:

```text
Gemini answer is rejected
  -> safe service error
  -> existing deterministic local fallback
```

The model's own `Source:` line is stripped. The application appends only the approved URLs that URL Context reported as successfully retrieved. This prevents invented or unapproved citations.

## Freshness semantics

"URL Context" means Gemini retrieves context from the selected public page at request time through the Firebase/Gemini URL Context mechanism. The provider may use an indexed/cached representation when available, so this architecture must not claim that every request is a forced origin fetch or instantly reflects a just-published website edit.

The website remains the canonical public source of truth. Exact time-sensitive facts should continue to fail closed when they cannot be confirmed.

## Existing fallback retained

The legacy in-code `ASK_TINYSTEPS_KB` and deterministic pricing/demo/course formatting remain temporarily as a fail-closed fallback. They are **not sent to Gemini in AI-2C**.

This lets AI-2C improve answer quality without making a provider/tool outage a public-site outage.

Retirement of duplicated legacy fallback knowledge belongs to a later brick after evaluation and production confidence.

## Not in AI-2C

AI-2C deliberately does **not**:

- change Firebase project or App Check architecture;
- change from `gemini-3.5-flash-lite` to a different model;
- enable Google Search grounding;
- allow arbitrary web browsing;
- enable prompt-template-only mode;
- write conversations to Firestore;
- add anonymous public Firestore permissions;
- delete `public_kb_chunks`;
- delete `refreshPublicKb`;
- delete `public/kb.json`;
- turn archived Summer Camp content into a current offer.

## Validation targets

Before promotion, validate at least:

1. `What courses do you offer?`
2. `What are your fees / packages?`
3. `Is the demo assessment free?`
4. `How long is each class?`
5. `My child knows letter sounds but cannot read words. What should I do?`
6. `Does CBSE / NCF include phonics?` (school routing)
7. `How much is it?` after a school-programme question (conversation routing)
8. `Who won the cricket match?` (no URL Context / scope redirect)
9. a pasted external URL (must never be fetched)
10. Summer Camp 2026 (historical-only handling)
11. student-specific account/progress question (secure dashboard boundary)
12. forced URL retrieval failure (deterministic fallback)

## AI-2D handoff

After AI-2C is evaluated, AI-2D can move the stable system instruction into Firebase server prompt templates. Template-only enforcement must not be enabled until the application has migrated and production smoke tests confirm template-backed requests succeed.
