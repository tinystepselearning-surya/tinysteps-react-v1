# Speaking Commercial Authority v2 — Brick 2

Date: 2026-10-03  
Branch: `feature/speaking-commercial-authority-v2`  
Status: COMPLETE ON BRANCH — pending integration CI

## Purpose

Brick 2 answers the parent question: **What is the right age to start public speaking?**

The implementation deliberately avoids claiming that one universal international starting age exists. Instead, Tiny Steps now presents an evidence-informed developmental progression and keeps assessment-led placement.

## Key decision

**Age 4 remains a valid entry point only for communication foundations.**

At 4–5, Tiny Steps does not frame the goal as formal speech delivery or debate. The page now explicitly says:

> At this age, public speaking begins with communication—not podium speeches.

## Developmental guide

### Ages 4–5 — Communication Foundations
- familiar questions and connected ideas;
- picture/experience description;
- simple story retelling;
- show-and-tell and role play;
- listening, turn-taking and simple questions.

Boundary: short, playful, highly supported speaking turns; no expectation of formal speeches or debate.

### Ages 6–8 — Public Speaking Foundations
- structured answers;
- beginning–middle–end storytelling;
- short prepared presentations;
- opinions supported by reasons;
- question-and-answer, pace, clarity and audience awareness.

### Ages 9–12 — Advanced Communication & Public Speaking
- structured presentations;
- impromptu/extempore speaking;
- persuasive speaking and guided debate;
- reasons, examples and evidence;
- audience adaptation and thoughtful responses to questions.

## Course-architecture safeguard

These are **developmental guidance bands**, not new course products.

The existing Tiny Steps architecture remains:
- Public Speaking Foundations — existing canonical course detail;
- Public Speaking Excellence — existing canonical course detail.

Assessment and readiness continue to determine placement, including the existing overlap at age 7.

## External evidence and curriculum references

### 1. American Speech-Language-Hearing Association (ASHA)
Communication Milestones: 4 to 5 Years  
https://www.asha.org/public/developmental-milestones/communication-milestones-4-to-5-years/

Relevant evidence:
- longer and more complex sentences;
- connected storytelling with characters/settings;
- conversational participation;
- description, directions and questions.

ASHA also states that developmental milestones are not diagnostic and children may reach skills earlier or later.

### 2. NAEYC — Developmentally Appropriate Practice
https://www.naeyc.org/node/3807

Relevant principle:
- teaching should be strengths-based and play-based;
- activities should be appropriate to the child's developmental, cultural, linguistic and ability profile.

This supports Tiny Steps' decision not to treat preschool children as miniature adult speakers.

### 3. England National Curriculum — English / Spoken Language, Years 1–6
https://www.gov.uk/government/publications/national-curriculum-in-england-english-programmes-of-study/national-curriculum-in-england-english-programmes-of-study

Statutory spoken-language expectations include:
- asking relevant questions;
- articulating and justifying answers/opinions;
- structured descriptions, explanations and narratives;
- discussions and presentations;
- debate;
- gaining and maintaining listener interest;
- considering different viewpoints;
- adapting register to context.

The curriculum explicitly says these should be taught at a level appropriate to pupils' age.

### 4. Australian Curriculum v9 — English
https://www.australiancurriculum.edu.au/curriculum-information/understand-this-learning-area/english

Relevant progression:
- listening, speaking and interacting are developed systematically;
- learners adapt language to audience, purpose and context;
- the curriculum develops spoken presentations, arguments/opinions and interaction skills through the primary years.

## Evidence-language policy

The page says:
- there is **no single global rule** for the exact starting age;
- the sources are **reference points**, not proof of a universal public-speaking standard;
- individual assessment remains the placement mechanism.

## SEO and schema

Brick 2 adds:
- one visible age-appropriate progression section;
- one FAQ addressing whether age 4 is too young;
- one `ItemList` schema representing the three developmental stages.

No new URL, redirect, sitemap entry or canonical owner is created.

## Files

- `src/pages/speaking.tsx`
- `src/tests/seo/speakingCommercialAuthorityBrick2.spec.ts`
- this document
