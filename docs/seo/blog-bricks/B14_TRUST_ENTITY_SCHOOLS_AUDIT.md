# B14 — Trust, Entity Authority & Schools Audit

## Objective

Brick 14 strengthens the parts of Tiny Steps that answer four trust questions:

1. **Who is Tiny Steps Learning?**
2. **Who is responsible for its academic direction?**
3. **How does Tiny Steps maintain teaching consistency?**
4. **What exactly does the school partnership provide, and what does it not claim?**

B14 is a trust-and-precision brick. It does not create new search pages, invent credentials, add endorsement language, or turn third-party ratings into permanent site facts.

## Baseline after B13

B13 established the commercial learning ownership model:

- `/curriculum` — complete learning roadmap
- `/courses` — course comparison and selection
- `/phonics`, `/grammar`, `/speaking` — programme owners
- canonical `/courses/...` routes — detailed course owners

B14 preserves that model and focuses on `/team`, `/for-schools`, and the canonical organisation/founder entities they already reference.

## Audit: `/team`

### Strong existing foundations

The Team page already has substantially more trust infrastructure than a generic staff page:

- canonical `/team` route;
- `AboutPage` structured data;
- the canonical Tiny Steps `Organization` entity;
- a founder `Person` entity using the shared founder ID;
- visible founder photography;
- founder responsibilities covering curriculum direction, teacher development and academic quality;
- an explicit teacher preparation sequence: **Select → Prepare → Strengthen**;
- an explicit academic quality sequence: **Assess → Place → Teach → Practise → Review → Communicate**;
- teaching-community role descriptions;
- a school-partnership bridge;
- visible parent assessment and FAQ sections.

This is already useful first-party evidence. B14 should refine it rather than replace it.

### Gap 1 — visible founder identity was weaker than the canonical entity

The canonical public fact contract already identifies the founder as **Vannala Ravali Priya**, with **Priya** as the familiar display name. The structured data uses the full identity, while prominent visible Team copy used only “Priya”.

**B14 decision:** show the canonical full identity in the dedicated founder section while retaining “Priya” as the familiar name used with families. Keep the existing global founder `@id`; connect it to the visible `/team#founder` section with a `url` and `mainEntityOfPage` relationship.

This improves entity consistency without publishing any new private or unverified biography.

### Gap 2 — do not manufacture expertise signals

No verified personal degree, CELTA, TESOL, TEFL, Cambridge qualification or similar founder/teacher credential is present in the canonical public fact contract.

**B14 decision:** do not add one.

The trust signal should come from verifiable responsibility and process:

- curriculum direction;
- lesson design;
- teacher preparation;
- teaching-quality review;
- assessment and placement;
- parent communication;
- programme consistency.

### Gap 3 — outcome wording should describe evidence, not guarantees

The founder section previously framed the goal as helping children “demonstrate visible progress” across several skills. That is directionally reasonable but can sound like a guaranteed learner outcome.

**B14 decision:** describe the academic goal as keeping learning progress **observable through evidence** such as reading accuracy, sentence formation, language use and increasingly independent communication.

## Audit: `/for-schools`

### Strong existing foundations

The school route is already a genuine B2B authority page, not a repurposed parent landing page. It has:

- canonical `/for-schools`;
- school-specific page title and description;
- school-specific WhatsApp proposal actions;
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

The page already surfaces the useful “how we teach / how we implement” information that generic GEO audits often recommend. B14 does not invent new method names such as “Super S”, “arm blending”, learning-style labels or speed claims.

### Gap 1 — independence disclosure was too deep

The strongest independence statement existed mainly in the FAQ. A school leader could encounter CBSE/NCF/DfE evidence long before seeing that qualification.

**B14 decision:** place a concise independence disclosure directly beside the official-framework evidence:

> Tiny Steps Learning is an independent education provider. Referencing NCF, CBSE or international phonics criteria explains the evidence and implementation context; it does not imply endorsement, approval, certification or affiliation.

### Gap 2 — evidence relationships should be machine-readable without schema inflation

The page already has a strong schema set. More schema types would add clutter rather than clarity.

**B14 decision:** preserve the existing `WebPage`, `Service`, `DefinedTermSet`, breadcrumb and FAQ graph, but attach the three existing public evidence URLs as `citation` values on the WebPage entity. Reuse the canonical `ORGANIZATION_ID` for the service provider instead of duplicating the organisation URL as a string.

### Gap 3 — commercial outcome claims were too causal

The school page contained a section implying that visible reading progress supports:

- continued enrolment;
- reputation and referrals.

Those may be reasonable business hopes, but they are not outcomes Tiny Steps should promise or imply as caused by a phonics implementation.

**B14 decision:** replace that framing with operational school value that Tiny Steps can directly support:

- parent communication;
- implementation consistency;
- teacher readiness;
- leadership visibility.

The related FAQ is reframed from enrolment/reputation to communicating reading progress to families.

## Third-party trust decision

B14 deliberately does **not** hard-code a Trustpilot score, app-store rating, review count, or other volatile third-party metric into entity facts.

Stable profile links can be evaluated in later distribution work, but changing external ratings are not suitable as permanent schema facts unless they are fetched and displayed through a properly maintained source-of-truth integration.

## Methodology decision carried forward from external audits

The useful insight is that Tiny Steps should show real instructional process, not generic marketing adjectives.

B14 uses only methods already supported by the site and programme materials, including:

- systematic progression;
- sound-to-print connection;
- blending and segmenting;
- modelling and guided practice;
- correction routines;
- cumulative review;
- transfer checks;
- assessment-led placement;
- teacher preparation and academic review.

B14 does **not** claim that these methods are proprietary unless there is evidence that Tiny Steps created them, and does not claim they make children learn “faster”.

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
- add schema solely to chase a retired rich-result feature.

## Acceptance condition

B14 is complete when the visible and machine-readable site tell the same trust story:

**Tiny Steps Learning → Vannala Ravali Priya (Founder) → documented academic responsibilities → prepared teachers and quality process → independent school implementation service → source-linked evidence → no invented credentials or promised business outcomes.**
