# Speaking Commercial Authority v2 — Brick 6

Date: 2026-10-03  
Branch: `feature/speaking-commercial-authority-v2`  
Status: COMPLETE ON BRANCH — pending final six-brick reconciliation and CI

## Purpose

Brick 6 closes the Speaking Commercial Authority v2 build with one broad evergreen informational owner:

`/blog/why-public-speaking-is-important-for-kids`

Title:

**Why Public Speaking Is Important for Kids: Communication Skills in the AI Era**

This page owns the informational question **why public speaking is important for kids**.

It does **not** own:
- public speaking classes for kids;
- public speaking classes in India;
- pricing;
- enrolment;
- Spoken English;
- Grammar;
- confidence-only support.

Those remain with their existing canonical owners.

## Why a new article was justified

The existing Speaking knowledge library is already strong on specific skills:
- conversation;
- confidence;
- storytelling;
- speech structure;
- debate/reasoning;
- delivery;
- visual aids;
- video feedback;
- competition preparation;
- family practice.

The missing intent was the broad parent question:

**Why does public speaking matter at all, what age is appropriate, and why does communication matter in an AI-enabled world?**

That question is materially different from the existing skill guides and from the commercial `/speaking` page.

## Live search / competitor verification — 2026-10-03

Current search results show active content around this intent.

Examples inspected:
- PlanetSpark has multiple public-speaking commercial and informational surfaces, including future-skills content.
- VoxStar currently has an article titled around public speaking for kids in the age of AI.
- Other education providers publish broad “why public speaking matters” guides.

The search landscape confirms demand, but Brick 6 does not copy competitor claims, wording, page structure or unsupported outcomes.

The Tiny Steps article is differentiated by:
1. separating communication, Public Speaking, Spoken English, Grammar and confidence;
2. developmentally bounding age four;
3. publishing source-specific international evidence;
4. separating child-development evidence from labour-market evidence;
5. using assessment-first placement;
6. linking the broad rationale into the existing specialist knowledge cluster instead of creating many overlapping pages.

## Article architecture

### Quick answer
Public speaking for children is defined as organised communication rather than stage performance alone.

### Why public speaking matters
The article explains:
- idea organisation;
- explanation;
- listening and response;
- audience awareness;
- opinions and reasoning;
- increasing independence.

### Child/young-person evidence
National Literacy Trust 2025:
- 105,583 respondents aged 8–18;
- 81.4% self-rated good/very good at listening to others and understanding their point of view;
- 47.4% self-rated good at giving a presentation;
- 40.2% self-rated good at speaking in front of an audience.

Boundary:
- self-perception data;
- not an objective speaking-skill score;
- population is ages 8–18, not preschool children.

### Right age
The article explicitly says there is no universal international starting age.

Developmental guidance:
- ages 4–5: communication foundations;
- ages 6–8: structured speaking foundations;
- ages 9–12: more advanced communication/public speaking.

Age four is explicitly framed as communication foundations, not podium speeches.

### AI era
The article explains that easier information generation does not remove the need to:
- ask;
- judge;
- organise;
- explain;
- listen;
- respond.

It uses the Tiny Steps framework:

**ASK → THINK → ORGANISE → EXPLAIN → LISTEN → RESPOND**

The page explicitly says this is a Tiny Steps teaching scaffold.

It also explicitly says young children do not need to use AI tools.

### Questioning
The article adds a progression from recall and clarification into cause, comparison, evidence and perspective questions.

### Programme-fit boundary
The article differentiates:
- Spoken English;
- Grammar;
- Confidence Building;
- Public Speaking & Communication.

### Teaching quality
The article expects:
- real child speaking time;
- modelling and prompting;
- specific feedback and retry;
- fading support;
- fresh-task transfer;
- age-appropriate tasks;
- parent-visible progress.

### Clinical boundary
Broader speech/language/hearing concerns are referred to appropriately qualified professionals, with ASHA milestone guidance linked.

## Authoritative sources

### ASHA
https://www.asha.org/public/developmental-milestones/communication-milestones-4-to-5-years/

Use:
- 4–5 communication milestones;
- story connections;
- longer/more complex sentences;
- development varies by child.

Boundary:
- milestone information is not used as a diagnosis.

### England National Curriculum — English / Spoken Language
https://www.gov.uk/government/publications/national-curriculum-in-england-english-programmes-of-study/national-curriculum-in-england-english-programmes-of-study

Use:
- relevant questions;
- justification;
- structured explanations/narratives;
- discussion;
- presentations;
- debate;
- audience awareness.

### Education Endowment Foundation — Oral Language
https://educationendowmentfoundation.org.uk/education-evidence/teaching-learning-toolkit/oral-language-interventions/

Use:
- purposeful dialogue;
- structured questioning;
- speaking/listening;
- modelling;
- scaffolding;
- feedback.

Boundary:
- EEF explicitly notes formal public-speaking/presentational talk is not the direct focus of this evidence strand.

### National Literacy Trust
https://literacytrust.org.uk/research-services/research-reports/children-and-young-peoples-speaking-and-listening-in-2025/

Use:
- current child/young-person self-perception evidence about everyday listening vs presentation/audience speaking.

### UNESCO
https://www.unesco.org/en/articles/ai-competency-framework-students

Use:
- human-centred mindset;
- responsibility;
- critical judgement of AI solutions.

Boundary:
- AI competency framework, not a public-speaking curriculum.

### OECD Learning Compass 2030
https://www.oecd.org/en/data/tools/oecd-learning-compass-2030.html

Use:
- student agency;
- navigating unfamiliar contexts;
- globally informed, locally contextualised future education.

Boundary:
- not an endorsement of Tiny Steps or a speaking intervention.

### UNICEF Innocenti — Skills for an AI World
https://www.unicef.org/innocenti/reports/skills-ai-world

Use:
- critical thinking;
- information literacy;
- autonomy;
- moderation;
- human relationships.

Boundary:
- 97 children aged 9–17;
- five African countries;
- not a universal developmental sample;
- not evidence for preschool AI use.

### World Economic Forum — Future of Jobs 2025
https://www.weforum.org/publications/the-future-of-jobs-report-2025/in-full/3-skills-outlook/

Use:
- future-work context around analytical thinking, technology skills and human capabilities.

Boundary:
- employer/labour-market evidence;
- not a child-development benchmark;
- no claim that speaking lessons guarantee future employment outcomes.

## Ownership reconciliation

New canonical informational topic:
- ID: `why-public-speaking-matters-for-kids`
- Owner: `/blog/why-public-speaking-is-important-for-kids`
- Intent: informational
- Role: editorial pillar
- Hub: `/resources/speaking`

Protected commercial owner remains:
- `/speaking`
- query: public speaking classes for kids in India
- high-commercial intent

The informational and commercial owners are kept distinct by separate canonical topic records: the article owns the broad informational question, while `/speaking` retains the high-commercial class query. The existing R5 registry contract is preserved; no non-hub path is inserted into `forbiddenCompetingOwners`.

## Frozen knowledge-cluster safeguard

The established SP6 specialist cluster remains frozen at 14 URLs.

Brick 6 does **not** add the broad authority article to:
- `SPEAKING_KNOWLEDGE_CLUSTER_PATHS`;
- the frozen Tier-1 owner count;
- the specialist taxonomy.

Instead the new article sits one level above as a broad explanatory authority guide and links into the existing specialist resources.

## Internal links added

Inbound:
- `/speaking` → new authority article;
- `/resources/speaking` → new authority article;
- canonical query aliases and LLM retrieval guidance point broad parent questions to the article without expanding the frozen AI answer-layer corpus.

Outbound from article:
- `/speaking`;
- `/resources/speaking`;
- Spoken English;
- Grammar;
- Confidence Building;
- Public Speaking Foundations;
- Public Speaking Excellence;
- conversation;
- storytelling/speech structure;
- debate/reasoning;
- public-speaking delivery;
- class samples;
- curriculum;
- progress framework;
- pricing.

## AI / retrieval surfaces

Added:
- canonical query aliases for broad parent questions;
- `public/llms.txt`;
- `public/llms-full.txt`.

The frozen AI answer-layer revision and concept count remain unchanged, and the frozen 14-URL Speaking Knowledge Cluster heading remains unchanged.

## Discovery

Added the new canonical URL to:
- blog sitemap;
- site RSS;
- site feed;
- blog RSS;
- blog feed.

## Claim safety

The article does not claim:
- public speaking guarantees leadership;
- public speaking guarantees academic success;
- public speaking guarantees confidence;
- AI will replace children’s future jobs;
- a universal starting age;
- that UNESCO/OECD/UNICEF/WEF endorses Tiny Steps;
- that labour-market evidence is child-development evidence;
- that developmental milestones diagnose a child.

## Files

Major Brick 6 files:
- `src/content/blog/posts/public-speaking/why-public-speaking-is-important-for-kids.ts`
- `src/content/blog/shared/technicalAuthority.ts`
- `src/content/blog/shared/authorityLinking.ts`
- `src/content/blog/shared/heroFamilies.ts`
- `src/lib/canonicalTopicOwnershipRegistry.js`
- `src/pages/SubjectResourcesPage.tsx`
- `src/pages/speaking.tsx`
- `public/llms.txt`
- `public/llms-full.txt`
- `public/sitemap-blog.xml`
- RSS/feed files
- `src/tests/seo/speakingCommercialAuthorityBrick6.spec.ts`
- this document

## Final Brick 6 position

Brick 6 closes the planned feature work.

The next step is **not another feature brick**. It is full six-brick reconciliation:
- branch vs main drift;
- canonical ownership;
- duplicate intent;
- metadata;
- internal links;
- blog indexing/discovery;
- schema;
- build/tests;
- CI;
- then merge only when the combined branch is clean.
