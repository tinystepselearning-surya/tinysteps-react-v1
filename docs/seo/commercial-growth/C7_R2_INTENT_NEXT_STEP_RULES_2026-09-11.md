# C7-R2 — Intent-Based Next-Step Rules

**Date:** 11 September 2026  
**Status:** architecture-only  
**Prerequisite:** C7-R1 knowledge → commercial owner mapping

## Objective

Turn the R1 owner map into controlled next-step rules without changing live knowledge pages yet.

R1 answers **where** a commercially relevant knowledge surface belongs. R2 answers **when and how strongly** that route should be offered.

## Rule classes

### 1. SOFT_DISCOVERY

Use for pure practice, parent-routine or other early-discovery surfaces where R1 found no evidence-backed commercial owner.

- no commercial destination
- no direct assessment CTA
- maximum commercial prompts: 0

### 2. OWNER_HANDOFF

Use when the knowledge intent clearly matches one frozen programme or specialist owner and an assessment prompt is not yet necessary.

- primary destination: mapped C2 owner
- no secondary commercial destination
- maximum commercial prompts: 1

### 3. RESEARCH_HANDOFF

Use for comparison, fee or value research intent.

- primary destination: the frozen comparison/fee/value owner
- do not bypass the research step with an assessment-first CTA
- maximum commercial prompts: 1

### 4. OWNER_THEN_ASSESSMENT

Use for problem-aware knowledge where the correct programme/specialist owner is known but a child-specific starting point may still be useful.

- primary destination: mapped programme/specialist owner
- secondary destination: `/book-demo`
- maximum commercial prompts: 2
- `/book-demo` remains secondary

### 5. ASSESSMENT_FIRST

Use only when the underlying programme need genuinely cannot be resolved from the knowledge intent.

- primary destination: `/book-demo`
- no secondary commercial destination
- maximum commercial prompts: 1

## Key decisions

- `/blog/online-english-classes-for-kids-india` → broad-English owner first, not `/book-demo`.
- Phonics comparison knowledge → dedicated phonics comparison owner; do not bypass it.
- Explicit reading-fluency problems → `/reading-fluency-program`, with assessment permitted secondarily when appropriate.
- Grammar, writing, speaking, spoken-English and confidence knowledge follow their R1 owner before any secondary assessment prompt.
- Pure practice and home-routine content stays non-commercial unless later evidence changes the mapping.

## Guardrails

- No live knowledge-page copy changes in R2.
- No new knowledge or commercial URLs.
- No C2 ownership changes.
- No C4 metadata changes.
- No C5 conversion-owner changes.
- No C6 architecture changes.
- `/book-demo` remains the single conversion owner.
- Maximum two commercial prompts on any knowledge surface.

## Next

**C7-R3 — Contextual Commercial Handoffs** may implement only the placements and copy permitted by the validated R1 owner map and R2 next-step rules.
