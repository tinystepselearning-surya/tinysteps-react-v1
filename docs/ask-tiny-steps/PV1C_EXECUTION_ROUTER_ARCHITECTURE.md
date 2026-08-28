# Ask Tiny Steps — PV-1C Execution Router Architecture

## Decision

Ask Tiny Steps is not a general-purpose chatbot. It is a public educational-site assistant with a controlled first-party knowledge base. The production architecture therefore routes each request through the cheapest trustworthy execution lane before deciding whether Gemini is needed.

## Execution lanes

### 1. Deterministic verified facts — zero Gemini calls

Use application-owned canonical configuration when the answer is an exact Tiny Steps fact already stored in code. Examples include standard pricing, demo price/duration, standard 1:1 class mode and duration, school-plan pricing, archived-offer status, and private-account boundaries.

Benefits: near-zero latency, zero model quota, zero URL retrieval, and no hallucination surface.

### 2. First-party grounded synthesis — URL Context

Use Gemini only when the answer requires synthesis from one or two approved Tiny Steps pages. The source selector resolves exact canonical URLs from the code-controlled registry before the request. URL Context never receives visitor-controlled URLs.

Normal questions should use one source. A second source is reserved for genuinely diagnostic or comparative questions.

### 3. General educational guidance — no retrieval tool

Use the low-cost Flash-Lite model for child-English guidance that does not require a Tiny Steps-specific factual claim and has no strong first-party source route. URL Context is disabled in this lane.

### 4. External/current research — capability gated

Google Search grounding is disabled in the current production configuration. The Gemini Developer API free tier does not provide production Google Search grounding, and Firebase requires compliant source/Search-suggestion presentation when grounding is enabled.

When the project intentionally moves to an eligible paid configuration and the UI supports grounding metadata, this lane can be enabled for explicit requests such as current research, current CBSE/NCF guidance, or comparisons with external evidence. It must never be used for Tiny Steps pricing, course facts, schedules, or other first-party claims.

Visitor-supplied arbitrary URLs remain blocked. Enabling external research later does not make arbitrary visitor URLs approved URL Context inputs.

## Model policy

- First-party grounded synthesis: `gemini-3.5-flash` primary, `gemini-3.5-flash-lite` availability fallback.
- General guidance: `gemini-3.5-flash-lite` only.
- `gemini-3.7-flash` is removed from normal public traffic because live monitoring showed repeated `RESOURCE_EXHAUSTED` failures and Firebase documents it as a short-term-availability model.
- Thinking remains at the minimum compatible budget for the repository's locked Firebase SDK.
- Application-level deadlines protect user-facing latency. A client deadline falls back locally rather than launching another model call and creating duplicate in-flight work.

## Source policy

The code-controlled `ASK_TINY_STEPS_KNOWLEDGE_SOURCES` registry remains the only source allowlist.

- No runtime site crawl.
- No following nested links.
- No arbitrary web browsing.
- Archived sources are eligible only for their explicit historical intent.
- Source selection is performed locally before Gemini is initialized.
- Build/test-time integrity checks validate the registry instead of sweeping the site during a parent request.

## Deterministic fact policy

The execution router imports existing canonical configuration (`publicOffer`, `pricing`, `publicFacts`) rather than maintaining another AI-specific copy of prices, durations or programme facts.

This retires the legacy token-overlap fallback KB. Generic word-overlap retrieval is not acceptable for production fallback because it previously allowed archived Summer Camp content to surface for an unrelated reading-fluency question.

## Conversation policy

A standalone question receives no previous conversation context.

A message is a follow-up only when:

1. its wording is genuinely contextual, and
2. at least one previous user turn exists.

A genuine follow-up may receive only the immediately relevant user/assistant turn plus the current question.

## Failure policy

- App Check/permission failures: fail closed; no model switching.
- Invalid request/configuration errors: fail closed.
- URL Context primary-source retrieval failure: fail closed; no model switching.
- `MAX_TOKENS`: do not publish a partial sentence and do not retry another model.
- Quota/capacity/provider-unavailable errors: model fallback is allowed when another configured model exists.
- Application deadline: return the deterministic verified fallback; do not start a second model request.

## Security roadmap

Firebase's current production security guidance recommends App Check, API-key restrictions, rate limits, AI monitoring, server prompt templates and template-only mode.

App Check remains mandatory in the current architecture. Server prompt templates are intentionally a separate migration because the feature is currently Preview and template-only mode is project-wide: enabling it before every active client uses templates would block older clients. The execution router is designed so the model invocation layer can later move behind locked, versioned server prompt templates without changing routing semantics.

## External research activation checklist

Do not enable Google Search grounding until all are true:

- production tier supports Search grounding;
- explicit cost/quota budget is approved;
- UI renders required grounding sources/Search suggestions;
- external-research intent is explicit and tested;
- first-party factual questions remain excluded from Search;
- monitoring distinguishes grounded-search requests from normal requests;
- regression tests prove visitor URLs are never promoted into approved URL Context inputs.

## Acceptance targets

- Exact public fact: zero Gemini calls, effectively instant.
- Typical first-party grounded answer: target <5 seconds; user-facing deadline <=12 seconds.
- General guidance: target <4 seconds; user-facing deadline <=8 seconds.
- Wrong-audience source leakage: zero.
- Archived-source leakage outside explicit archive intent: zero.
- Visitor-supplied URL Gemini calls: zero.
- `MAX_TOKENS` visible partial responses: zero.
- First-party source cap: two, with one preferred.
