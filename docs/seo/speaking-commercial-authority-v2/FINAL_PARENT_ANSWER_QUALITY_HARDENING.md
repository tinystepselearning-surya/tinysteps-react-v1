# Speaking Commercial Authority v2 — Parent Answer Quality Hardening

Date: 2026-10-03  
Branch: `feature/speaking-commercial-authority-v2`  
Status: APPLIED AFTER BRICKS 1–6 — pending final CI

## Purpose

This hardening patch corrects a recurring authority risk:

- **too vague:** hiding a useful answer behind generic uncertainty;
- **too aggressive:** making claims that the curriculum, evidence, or Tiny Steps facts do not support.

The required answer pattern is now:

**direct answer → specific Tiny Steps position → evidence/why → boundary → correct next route**

## Authority rule

When Tiny Steps has a verified programme fact or a clear evidence-supported educational position, state it directly.

Do not write:
- “there could be many reasons” when the page can identify the relevant decision categories;
- “it may perhaps help” when the curriculum clearly teaches a skill;
- generic future-skills language that hides the actual communication capability;
- disclaimers before the answer.

Do write:
- the answer in the first sentence;
- the exact skill or programme distinction;
- the evidence or reasoning next;
- the limitation only where it is genuinely needed.

## Commercial page hardening

### Age four
Before:
- age four “can be appropriate” with the qualification leading the answer.

Now:
- **No—age four is not too young when public speaking is taught as communication foundations rather than adult-style speech performance.**
- Tiny Steps position is explicit:
  **age four is a valid starting point for communication foundations; formal speech and debate come later.**

The developmental reference boundary remains intact.

### AI era
Now:
- **Yes—communication remains important in an AI-enabled world.**
- Reason:
  generating information is different from judging, organising, explaining, questioning, listening and responding.
- Tiny Steps then states what it develops.
- The AI/prompt-engineering boundary follows the answer rather than replacing it.

### Programme fit
Now:
- the page says the correct programme depends on the **actual speaking problem**, not a generic confidence label.
- Spoken English, Grammar, Confidence Building and Public Speaking remain distinct.

### Parent search language
Natural commercial variants added:
- public speaking course for kids;
- public speaking for kids;
- online speaking classes for kids.

These are supporting variants only. The primary commercial proposition remains:
- Online Public Speaking Classes for Kids;
- Public Speaking & Communication;
- live 1:1;
- ages 4–12.

### Personality development
Added only as a comparison FAQ.

Tiny Steps explicitly states that:
- Public Speaking & Communication has a narrower educational scope;
- “personality development” can include broader behaviour, grooming, leadership or social-development claims;
- Tiny Steps does not use personality development as a substitute label for its Speaking programme.

It is **not** added as an SEO keyword target.

## Authority article hardening

The broad informational owner now leads key sections with extractable direct answers:

### Why public speaking matters
**Yes, public speaking is important for children because it teaches them to organise ideas and make those ideas understandable to other people.**

### Starting age
**Children can begin public-speaking development from about age four when the work is communication-focused and developmentally appropriate.**

### AI era
**Communication remains important in an AI-enabled world because generating information is not the same as judging, organising, explaining, questioning, listening, or responding.**

### Programme fit
**Public Speaking is the right first route when the main gap is organising and delivering ideas for a listener or audience.**

The supporting evidence and limitations remain after these answer-first statements.

## AEO / GEO question-owner mappings

Added explicit answer-layer queries:

1. Why is public speaking important for kids?
2. What age should children start public speaking?
3. Is age 4 too young for public speaking classes?
4. What is the difference between public speaking and Spoken English for kids?
5. Why do communication skills matter for children in the AI era?
6. What should parents look for in public speaking classes for kids?

Ownership:
- broad informational questions → `/blog/why-public-speaking-is-important-for-kids`;
- parent provider/class-choice question → `/speaking`.

This prevents the authority article from stealing the commercial class intent.

## LLM retrieval guidance

`llms.txt` and `llms-full.txt` now record the Tiny Steps answer positions directly:

- why public speaking matters;
- age-four starting position;
- AI-era communication position;
- Speaking vs Spoken English vs Grammar vs Confidence boundaries;
- answer-first quality rule.

The retrieval rule is:

> When the canonical owner supports a clear conclusion, state that conclusion first. Add evidence and limitations afterwards.

This is specifically intended to prevent generic hedging from making Tiny Steps appear uncertain about its own verified programme or educational position.

## Tests

Added:
`src/tests/seo/speakingCommercialAuthorityAnswerQuality.spec.ts`

It protects:
- direct-answer wording;
- three supporting commercial keyword variants;
- the non-targeting of personality-development keywords;
- programme boundaries;
- six question-owner mappings;
- informational vs commercial canonical ownership;
- LLM answer-first rules;
- no AI-course or personality-development route drift.
