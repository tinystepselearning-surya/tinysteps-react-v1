# Speaking Commercial Authority v2 — Brick 3

Date: 2026-10-03  
Branch: `feature/speaking-commercial-authority-v2`  
Status: COMPLETE ON BRANCH — pending integration CI

## Purpose

Brick 3 converts the existing Speaking diagnostic into a clearer parent decision system:

**observable problem → likely skill gap → pathway to inspect → assessment confirmation**

The goal is to reduce two errors:
1. treating every speaking difficulty as a Public Speaking problem;
2. sending children into a programme based only on age, confidence language, or one visible symptom.

## Six parent scenarios

### 1. Very short everyday answers
Observable sign:
- one-word or very short responses;
- weak back-and-forth conversation;
- difficulty expanding an everyday answer.

Pathway to inspect:
- Spoken English.

Boundary:
- Public Speaking is not used as a substitute for basic conversational fluency.

### 2. Ideas present but sentence formation is inaccurate
Observable sign:
- word order, tense, articles, prepositions, or sentence control reduce clarity.

Pathway to inspect:
- Grammar.

Boundary:
- Speaking practice may still be useful later or alongside Grammar, but the underlying sentence-control issue should not be relabelled as a presentation problem.

### 3. Comfortable one-to-one but avoids groups or unfamiliar situations
Observable sign:
- language and idea structure appear adequate;
- hesitation/participation changes by situation.

Pathway to inspect:
- Confidence Building.

Boundary:
- Tiny Steps does not treat all hesitation as evidence of a Public Speaking structure deficit.

### 4. Ideas are present but answers are poorly organised
Observable sign:
- responses wander;
- ideas arrive out of order;
- answer ends without a clear point;
- listener has difficulty following the response.

Pathway to inspect:
- core Speaking & Communication;
- free assessment confirms level.

### 5. Everyday answers are adequate but storytelling/show-and-tell/presentations are weak
Observable sign:
- sequencing, relevant detail, presentation structure, delivery, or listener awareness need support.

Pathway to inspect:
- Public Speaking Foundations.

### 6. Ready for longer talks, opinions, impromptu speaking, persuasion or debate
Observable sign:
- child needs more independent reasoning, audience adaptation, persuasive structure, or advanced presentation tasks.

Pathway to inspect:
- Public Speaking Excellence.

## Evidence basis

Brick 3 deliberately does **not** claim that the routing matrix is an international diagnostic standard.

It uses two authoritative/research-informed references to support the principle that spoken communication contains multiple dimensions and that parent-visible signs should not be overinterpreted clinically.

### Oracy Cambridge — Oracy Skills Framework
https://oracycambridge.org/wp-content/uploads/2020/06/The-Oracy-Skills-Framework-and-Glossary.pdf

The framework separates oracy into:
- physical;
- linguistic;
- cognitive;
- social/emotional dimensions.

It was developed from research, existing resources and expert consultation. It is intended to support specific targets and formative feedback. The framework itself explicitly says it is **not designed to be used as an assessment framework**.

Tiny Steps uses this only as support for the principle that different speaking difficulties can have different underlying skill dimensions.

### American Speech-Language-Hearing Association (ASHA) — Communication Milestones
https://www.asha.org/public/developmental-milestones/communication-milestones/

ASHA states that:
- children develop uniquely;
- milestones are not a screening or diagnostic tool;
- families with broader developmental concerns should seek appropriately qualified professional assessment.

Tiny Steps therefore uses a clear boundary:
- Tiny Steps can assess **educational programme fit**;
- Tiny Steps does not diagnose speech, language, hearing, or communication disorders.

## Page changes

The old four-card diagnostic is replaced by a six-scenario programme-fit matrix.

Each card now shows:
1. what parents may notice;
2. what the difficulty may indicate educationally;
3. the likely pathway to inspect;
4. the correct CTA.

The page also includes:
- a core Speaking-fit definition;
- Oracy Cambridge and ASHA reference links;
- an educational-assessment boundary;
- an explicit professional-referral note for broader speech/language/hearing concerns.

## Structured data

Brick 3 adds an `ItemList` describing the six parent programme-fit scenarios.

It does not:
- diagnose a child;
- mark the matrix as a medical or clinical assessment;
- create a new commercial owner;
- create a new course;
- create a new URL.

## Ownership retained

- Public Speaking / general communication commercial owner: `/speaking`
- Spoken English owner: `/spoken-english-classes-for-kids-online`
- Grammar owner: `/grammar`
- Confidence owner: `/confidence-building-program-kids`
- Public Speaking Foundations detail: existing canonical course path
- Public Speaking Excellence detail: existing canonical course path
- conversion owner: `/book-demo`

## Files

- `src/pages/speaking.tsx`
- `src/tests/seo/speakingCommercialAuthorityBrick3.spec.ts`
- this document
