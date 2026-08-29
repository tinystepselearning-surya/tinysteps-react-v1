# B14 — Trust, Entity Authority & Schools Audit

## Objective

Brick 14 strengthens the parts of Tiny Steps that answer five trust questions:

1. **Who is Tiny Steps Learning?**
2. **Who is responsible for its academic direction?**
3. **How is curriculum and lesson planning designed?**
4. **How do teachers apply that design while responding to the child?**
5. **What exactly does the school partnership provide, and what does it not claim?**

B14 is a trust-and-precision brick. It does not create new search pages, invent credentials, add endorsement language, or turn third-party ratings into permanent site facts.

## Baseline after B13

B13 established the commercial learning ownership model:

- `/curriculum` — complete learning roadmap
- `/courses` — course comparison and selection
- `/phonics`, `/grammar`, `/speaking` — programme owners
- canonical `/courses/...` routes — detailed course owners

B14 preserves that model. `/team` owns the substantial academic-design explanation, `/curriculum` receives only a concise methodology reinforcement, `/for-schools` owns school implementation, and `/phonics`, `/grammar`, and `/speaking` explain programme-specific teacher delivery.

## Audit: `/team`

### Strong existing foundations

The Team page already has substantially more trust infrastructure than a generic staff page:

- canonical `/team` route;
- `AboutPage` structured data;
- the canonical Tiny Steps `EducationalOrganization` entity;
- a founder `Person` entity using the shared founder ID;
- visible founder photography;
- founder responsibilities covering curriculum direction, teacher development and academic quality;
- an explicit teacher preparation sequence: **Select → Prepare → Strengthen**;
- an explicit academic quality sequence: **Assess → Place → Teach → Practise → Review → Communicate**;
- teaching-community role descriptions;
- a school-partnership bridge;
- visible parent assessment and FAQ sections.

This is already useful first-party evidence. B14 refines it rather than replacing it.

### Gap 1 — visible founder identity was weaker than the canonical entity

The canonical public fact contract identifies the founder as **Vannala Ravali Priya**, with **Priya** as the familiar display name. The structured data uses the full identity, while prominent visible Team copy used only “Priya”.

**B14 decision:** show the canonical full identity in the dedicated founder section while retaining “Priya” as the familiar name used with families. Keep the existing global founder `@id`; connect it to the visible `/team#founder` section with a `url` and `mainEntityOfPage` relationship.

This improves entity consistency without publishing any new private or unverified biography.

### Gap 2 — do not manufacture expertise signals

No verified personal degree, CELTA, TESOL, TEFL, Cambridge qualification or similar founder/teacher credential is present in the canonical public fact contract.

**B14 decision:** do not add one.

Trust should come from verifiable responsibility and process:

- curriculum direction;
- lesson design;
- teacher preparation;
- teaching-quality review;
- assessment and placement;
- parent communication;
- programme consistency.

### Gap 3 — the backend academic design work was not visible enough

Tiny Steps invests substantial academic work before a live lesson reaches a child. That work should be visible because it distinguishes a connected teaching system from a teacher marketplace or worksheet library.

**B14 decision:** add a dedicated **How Tiny Steps designs learning** trust layer using the public language:

> **child development, learning science and evidence-informed teaching practice**

The page explains that academic planning draws on:

- child development and readiness;
- learning science, including prerequisites, guided practice, retrieval, cumulative review and gradual reduction of support;
- early-literacy pedagogy, including phonological awareness, sound-to-print connection, blending, decoding, spelling patterns, fluency and connected reading;
- language development across grammar, sentence building, vocabulary and speaking;
- recurring learner difficulties seen through teaching and assessment.

The visible research-to-classroom pathway is:

**Child-development and pedagogy review → prerequisite mapping → curriculum progression → lesson-plan design → teacher preparation → child observation → pace/prompt/practice adjustment → progress review and next teaching focus.**

This is a description of instructional design. It is **not** presented as clinical psychology, therapy, diagnosis or a claim that Tiny Steps has proprietary access to child-psychology research.

### Gap 4 — “child-friendly” needed observable meaning

Generic claims such as “personalised” or “child-friendly” are weak unless the site explains what teachers actually do.

**B14 decision:** establish the principle:

> **Structured curriculum. Responsive teaching.**

The sequence and learning objective remain structured, but the child is not forced through a fixed lesson speed. Teachers observe accuracy, independence, recurring errors and readiness, then adapt:

- modelling;
- prompts;
- examples;
- repetition;
- practice time.

Child-friendly delivery is defined through observable behaviours:

- short, age-appropriate tasks;
- predictable routines;
- clear modelling before independent work;
- guided retries when a child is not yet secure;
- specific, encouraging feedback;
- additional practice when a prerequisite is weak;
- deliberate reduction of support as accuracy and independence become more secure;
- progression because the child is ready, not simply because the lesson number is complete.

B14 does **not** label children as “kinesthetic learners”, claim that a technique makes children learn faster, or promise that every child progresses at the same rate.

### Gap 5 — outcome wording should describe evidence, not guarantees

The founder section previously framed the goal as helping children “demonstrate visible progress” across several skills. That is directionally reasonable but can sound like a guaranteed learner outcome.

**B14 decision:** describe the academic goal as keeping learning progress **observable through evidence** such as reading accuracy, sentence formation, language use and increasingly independent communication.

## Audit: `/for-schools`

### Strong existing foundations

The school route is already a genuine B2B authority page, not a repurposed parent landing page. It has:

- canonical `/for-schools`;
- school-specific page title and description;
- school-specific proposal actions;
- school-leadership audience structured data;
- a `Service` entity for the school programme;
- a provider relationship to Tiny Steps Learning;
- India + worldwide service geography;
- official NCF, CBSE and UK DfE reference links;
- a ten-stage implementation pathway;
- teacher training, assessment, reteaching and year-long support;
- school-specific pricing plans;
- explicit FAQ language saying Tiny Steps is **not** CBSE-endorsed or government-approved;
- school-focused authority articles.

### Gap 1 — schools should see the academic design behind the materials

A curriculum PDF or lesson deck alone is not an implementation methodology.

**B14 decision:** add a school-facing **How academic design becomes classroom practice** section. It makes the common teaching contract explicit:

**Model → guided practice → observe → correct → retry → reduce support.**

School teachers retain the protected learning objective and progression while adjusting modelling, prompts, examples, repetition and practice time to learner evidence. This communicates both implementation consistency and child-responsive delivery.

The school page defines child-friendly practice through age-appropriate tasks, predictable routines, guided retries, specific feedback, extra prerequisite practice and readiness-based progression.

### Gap 2 — independence disclosure was too deep

The strongest independence statement existed mainly in the FAQ. A school leader could encounter CBSE/NCF/DfE evidence long before seeing that qualification.

**B14 decision:** place a concise independence disclosure directly beside the official-framework evidence:

> Tiny Steps Learning is an independent education provider. Referencing NCF, CBSE or international phonics criteria explains the evidence and implementation context; it does not imply endorsement, approval, certification or affiliation.

### Gap 3 — evidence relationships should be machine-readable without schema inflation

The page already has a strong schema set. More schema types would add clutter rather than clarity.

**B14 decision:** preserve the existing `WebPage`, `Service`, `DefinedTermSet`, breadcrumb and FAQ graph, but attach the three existing public evidence URLs as `citation` values on the WebPage entity. Reuse the canonical `ORGANIZATION_ID` for the service provider instead of duplicating the organisation URL as a string.

### Gap 4 — commercial outcome claims were too causal

The school page contained a section implying that visible reading progress supports continued enrolment, reputation and referrals.

Those may be reasonable business hopes, but they are not outcomes Tiny Steps should promise or imply as caused by a phonics implementation.

**B14 decision:** replace that framing with operational school value that Tiny Steps can directly support:

- parent communication;
- implementation consistency;
- teacher readiness;
- leadership visibility.

The related FAQ is reframed from enrolment/reputation to communicating reading progress to families.

## Third-party trust decision

B14 deliberately does **not** hard-code a Trustpilot score, app-store rating, review count, or other volatile third-party metric into entity facts.

## Canonical entity decision

The canonical schema identity is **Tiny Steps Early Education** at
`https://tinystepslearning.com/#educational-organization`, with **Tiny Steps Learning** and **Tiny Steps** retained as alternate public brand names. The website, founder, course, service, article and page relationships reuse that single `@id`. Legacy hard-coded `/#organization` references are removed from production source.

The separately defined `LocalBusiness` helper is not emitted by the public SEO layer and therefore does not create a competing organisation node. The public metadata path emits the canonical `EducationalOrganization` unless a page already supplies an organisation entity.

## Temporary machinery cleanup

The final implementation is committed directly in production source. The self-modifying B14 workflow and both B14 Python patch helpers are removed; no validation job edits source or pushes a bot-authored implementation commit.

Stable profile links can be evaluated in later distribution work, but changing external ratings are not suitable as permanent schema facts unless they are fetched and displayed through a properly maintained source-of-truth integration.

## Methodology decision carried forward from external audits

The useful insight is that Tiny Steps should show real instructional process, not generic marketing adjectives.

B14 uses only methods supported by the site and programme materials, including:

- systematic progression;
- sound-to-print connection;
- blending and segmenting;
- modelling and guided practice;
- correction and retry routines;
- cumulative review;
- transfer checks;
- assessment-led placement;
- teacher preparation and academic review;
- child-responsive pacing within a structured sequence.

B14 does **not** claim these methods are proprietary unless there is evidence Tiny Steps created them, and does not claim they make children learn “faster”.

## Protected boundaries

B14 must not:

- create a new public URL;
- change `/team` or `/for-schools` canonicals;
- change redirects, sitemap, RSS or indexability;
- add fabricated education or teaching credentials;
- imply CBSE, NCERT, DfE, Cambridge, IB or government endorsement;
- reintroduce IB/Cambridge positioning removed by B13;
- alter B0–B13 blog/program ownership;
- introduce a parent demo CTA into the school-partnership conversion path;
- hard-code a volatile external review rating;
- add schema solely to chase a retired rich-result feature;
- describe instructional design as clinical psychology;
- use unsupported learning-style labels;
- promise accelerated or guaranteed learner outcomes.

## Acceptance condition

B14 is complete when the visible and machine-readable site tell the same trust story:

**Tiny Steps Early Education (Tiny Steps Learning) → Vannala Ravali Priya (Founder) → child-development and pedagogy-informed academic design → structured curriculum and lesson planning → prepared teachers → child-responsive live teaching → observable progress review → independent school implementation service → source-linked evidence → no invented credentials, affiliations or guaranteed outcomes.**
