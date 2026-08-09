# Tiny Steps School Partnership Portal — Bricks 1–11 International Readiness Audit

Status: **International-readiness gate — PR must remain unmerged until technical release gates pass**

## Executive conclusion

The Bricks 1–11 architecture is suitable for an **internationally informed school implementation and early-reading progress system**. It deliberately avoids high-burden individual student accounts, preserves school curriculum ownership, separates curriculum delivery from demonstrated reading evidence, and gives leaders aggregate evidence that can be interpreted alongside the school’s own assessment framework.

It is **not** correct at this stage to describe TSERB as an “internationally standardized benchmark”, “international norm”, “age-standardized test”, or equivalent psychometric claim. That language would require a separate validation and norming programme.

Recommended external-facing language:

> Tiny Steps provides an internationally informed early-reading implementation and benchmarking framework for partner schools. It combines structured phonics, teacher development, implementation review and repeatable aggregate reading benchmarks while allowing schools to retain their own curriculum and assessment framework.

## International-readiness principles used in this audit

The audit uses widely established expectations reflected in international-school accreditation, IB PYP assessment culture, Cambridge Early Years/Primary practice, educational-testing standards, evidence-based foundational reading guidance, and international web-accessibility standards.

The resulting product principles are:

1. School mission/curriculum remains authoritative; Tiny Steps is an implementation partner, not a replacement school curriculum.
2. Leadership needs evidence of learner progress, implementation quality, teacher development, coverage, and action—not just content completion.
3. Assessment must be fair, transparent, low stakes, versioned, and interpreted within language/cultural context.
4. Progress from starting points and current demonstrated attainment are related but different measures.
5. Multilingual/EAL learners and learners requiring access arrangements must not be disadvantaged by construct-irrelevant barriers.
6. Teachers should not become data-entry operators; operational evidence should be collected at purposeful checkpoints.
7. School leaders need concise aggregate reporting and drill-down only where action is required.
8. Multi-campus, academic-calendar, tenancy, privacy, accessibility, auditability, and data portability matter to international-school procurement.
9. The platform must distinguish validated evidence from operational inference and must not manufacture precision.
10. Tiny Steps must make only claims it can currently evidence.

---

## Brick-by-brick audit

### Brick 1 — School registry, tenancy and access

**What a serious school expects**

- clear separation between schools/campuses;
- named accountable contacts;
- least-privilege access;
- leadership access that cannot alter evidence;
- controlled onboarding/offboarding;
- no accidental access to another school;
- traceability when Learning Partner ownership changes.

**Current Tiny Steps position**

- dedicated school registry;
- School Admin membership records;
- current Learning Partner assignment at the school record;
- server-authorised mutation boundary;
- School Admin/LP tenant isolation;
- assignment history;
- archived-school safeguards;
- stale-role/current-status checks.

**Status: STRONG FOUNDATION**

This is appropriate for the current product phase and materially stronger than using shared user arrays as the tenancy model.

**International enhancement before cross-border scale**

Add an explicit school implementation profile containing at minimum:

- IANA time zone;
- actual academic-year start/end dates or calendar pattern;
- school curriculum/framework context;
- English-language context (first-language, EAL, bilingual/multilingual, mixed);
- reporting contacts and data/privacy contact where required.

Time zone and academic calendar are operational requirements before serving schools across materially different calendars/time zones. Curriculum/language context may initially remain descriptive metadata.

---

### Brick 2 — Academic structure

**What a school expects**

- its own class naming convention;
- multiple sections;
- accurate learner counts;
- multiple teachers where co-teaching/support teaching exists;
- historical academic years;
- current-year corrections without destroying prior evidence;
- support for different international academic calendars.

**Current Tiny Steps position**

- flexible labels such as Nursery/LKG/UKG, PP1/PP2, Pre-K/K1/K2, Grade 1/2 or custom labels;
- multi-teacher sections;
- editable section counts and assignments;
- historical years preserved;
- closed years read-only until deliberately reopened.

**Status: SCHOOL-READY WITH ONE INTERNATIONAL CALENDAR GAP**

The current year model is based on start/end year values and should not be treated as sufficient evidence of the school’s actual calendar. International schools may operate January–December, March–February, August–July, or another local calendar.

**Required operating control until date-level calendar support is implemented**

The implementation agreement must record actual academic-year dates and assessment windows. Portal labels must not be assumed to determine assessment intervals by themselves.

---

### Brick 3 — Learning Partner school workspace

**What a school expects**

- a named implementation owner;
- continuity of support;
- school-specific context rather than generic support;
- clear escalation and next actions;
- no access to unrelated schools.

**Current Tiny Steps position**

- assigned-school workspace;
- current LP ownership is checked against the school;
- operational school programme data is consolidated in one workspace;
- no large reverse `schoolIds[]` array is introduced for LP users.

**Status: STRONG**

**International enhancement**

Define service expectations outside the software: named escalation route, review cadence, response expectations, handover standard when LP changes, and implementation continuity during staff turnover.

---

### Brick 4 — Curriculum implementation progress

**What a school expects**

- clarity about what has actually been taught;
- alignment to an agreed scope and sequence;
- evidence without daily administrative burden;
- curriculum compatibility rather than forced replacement;
- intervention when delivery and learner outcomes diverge.

**Current Tiny Steps position**

- section-level programme/stage verification;
- Tiny Steps phonics progression is reused rather than duplicated;
- periodic verification instead of daily lesson entry;
- current state plus history;
- curriculum stage remains separate from assessment evidence;
- internal “programme reference reading level” is explicitly not a population norm.

**Status: STRONG**

**International enhancement**

Before implementation begins, record a lightweight curriculum crosswalk showing where Tiny Steps supports the school’s existing literacy framework. For IB/PYP-style schools, present Tiny Steps as a focused foundational-literacy intervention/implementation layer inside the wider inquiry and language programme. For Cambridge/national schools, cross-reference the agreed foundational reading objectives without claiming formal programme endorsement unless one exists.

---

### Brick 5 — Teacher professional learning

**What a school expects**

- professional development connected to classroom practice;
- coaching over time, not a one-off workshop;
- evidence of teacher readiness;
- support for staff turnover/new joiners;
- training tied to learner outcomes.

**Current Tiny Steps position**

Six-stage pathway:

1. Foundations & Science of Reading
2. Sound Knowledge & Articulation
3. Blending for Word Reading
4. Segmenting, Encoding & Spelling
5. Advanced Phonics Patterns
6. Assessment, Intervention & Classroom Implementation

Progress is maintained by Tiny Steps rather than requiring teachers to update a dashboard.

**Status: GOOD, BUT COMPLETION MUST NOT BE CONFUSED WITH COMPETENCE**

Training progress is participation/progression evidence. Classroom implementation quality must be confirmed through Brick 7 observations and learner evidence. Management reports should not imply that 100% training completion means high-fidelity classroom delivery.

**International enhancement**

Use the formal Tiny Steps implementation-observation rubric during coaching and provide a short onboarding/re-certification pathway for new staff joining mid-year.

---

### Brick 6 — School Admin / Principal dashboard

**What leadership expects**

- read-only, trusted evidence;
- current status and trends;
- enough detail to ask informed questions;
- no operational clutter or private coaching notes;
- multi-campus switching where applicable;
- printable/exportable evidence for management review.

**Current Tiny Steps position**

- principal/School Admin is a server-enforced reader, not only a UI-level read-only user;
- linked school/campus switching;
- principal-safe programme snapshot;
- internal notes/actor identifiers are restricted where not necessary;
- leadership sees structure, implementation, training, assessments and management reporting.

**Status: STRONG**

**International enhancement**

Leadership copy should always distinguish:

- learner attainment;
- learner growth;
- implementation quality;
- teacher-development status;
- assessment coverage/data quality;
- recommended next action.

Do not use a single opaque “school score”.

---

### Brick 7 — Reviews and implementation observations

**What a school expects**

- a consistent observation standard;
- evidence-based coaching;
- recommendations and follow-up dates;
- historical records rather than overwritten judgments;
- separation between supportive quality assurance and punitive teacher ranking.

**Current Tiny Steps position**

- append-only reviews;
- section or whole-school scope;
- implementation rating;
- blending/segmenting/decoding indicators;
- summary, recommendation and next-review date.

**Status: FUNCTIONALLY READY; RUBRIC STANDARDISATION REQUIRED FOR INTERNATIONAL CONSISTENCY**

Tiny Steps should use the accompanying implementation-observation rubric covering lesson fidelity, phonics modelling accuracy, learner practice, checking for understanding, feedback/pacing and decodable-text alignment. The review record can remain concise while the observation protocol standardises how the judgment is made.

---

### Brick 8 — Tiny Steps Early Reading Benchmark (TSERB)

**What a school expects**

- a clear purpose;
- documented administration;
- baseline and comparable later checkpoints;
- transparent scoring;
- reasonable assessment duration and teacher burden;
- fairness for multilingual/EAL learners;
- access arrangements where appropriate;
- coverage shown with outcomes;
- defensible limits on what the results mean;
- consistency across assessors/forms.

**Current Tiny Steps position**

- aggregate section summaries rather than child accounts;
- TS-0…TS-9 instructional descriptors;
- six foundational reading domains;
- distribution is the source of truth;
- assessed count, coverage and average TS level are derived automatically;
- equivalent-form requirement;
- controlled unseen decoding items/pseudowords where developmentally appropriate;
- baseline, checkpoint, mid, final, custom;
- absent children are not forced into TS-0;
- explicit non-standardised/non-normed disclaimer;
- multilingual/EAL, accent, accessibility, moderation and low-stakes rules in the operating protocol.

**Status: STRONG INTERNAL PROGRAMME BENCHMARK — NOT AN INTERNATIONAL NORM**

This distinction must remain non-negotiable.

**What Tiny Steps may say**

- internal Early Reading Benchmark;
- internationally informed programme benchmark;
- structured early-reading progress framework;
- repeatable school implementation benchmark.

**What Tiny Steps must not yet say**

- internationally standardized assessment;
- internationally normed reading test;
- age-standardized reading age;
- diagnostic assessment;
- validated international cut scores.

**Route to future validation**

A separate psychometric programme would be required, including evidence supporting intended interpretations, reliability/measurement consistency, fairness, accessibility, form equivalence, cross-context samples, administration consistency and external expert review.

---

### Brick 9 — Curriculum vs assessment intelligence

**What a school expects**

- transparent logic;
- no AI-generated unexplained judgment;
- missing evidence shown as missing;
- intervention flags that support action;
- baseline not mistaken for programme impact;
- curriculum completion not mistaken for learner mastery.

**Current Tiny Steps position**

- deterministic health logic;
- baseline-only evidence cannot produce “on track”;
- missing teacher/curriculum/training evidence is handled conservatively;
- stale assessments are not treated as current proof;
- programme-reference gap is separate from the learner’s demonstrated level;
- “insufficient data” exists as a real outcome.

**Status: STRONG AND APPROPRIATELY CONSERVATIVE**

**International enhancement**

Keep the algorithm explainable in leadership reports. Any future AI should summarise or suggest questions, not silently determine programme status.

---

### Brick 10 — Analytics and management reporting

**What leadership expects**

- baseline and current performance;
- growth from starting points;
- cohort coverage;
- class/section comparison without false precision;
- domain strengths/needs;
- implementation and training context;
- exportable evidence;
- caveats where samples differ.

**Current Tiny Steps position**

- matched-section baseline-to-later growth;
- weighted matched growth rather than subtracting unrelated school averages;
- domain growth requires comparable evidence;
- section health table;
- coverage in assessment history;
- CSV export;
- print/PDF management report;
- explicit internal-benchmark disclaimer.

**Status: STRONG**

**International enhancement**

Add a formal data-quality block to leadership reporting before external-school rollout:

- sections represented / total sections;
- children assessed / enrolled;
- matched sections used for growth;
- assessment version(s);
- material accommodation/administration notes where applicable.

For larger multi-campus organisations, later add campus roll-up plus campus-level drill-down rather than a single blended headline.

---

### Brick 11 — Governance, audit and closeout

**What an international school expects**

- role-based access and tenant isolation;
- auditable changes;
- privacy/data minimisation;
- clear retention/deletion expectations;
- accessible digital experience;
- secure exports;
- incident/support process;
- technical reliability;
- evidence that production releases are tested.

**Current Tiny Steps position**

- callable-only school programme mutations;
- server-authorised nested programme read boundary;
- automatic server activity stream;
- Firestore tenant rules tests;
- Cloud Functions compilation in PR CI;
- lint/type/unit/build/SEO gates in the pipeline;
- principal-safe read model;
- no school-child login database introduced for this programme phase.

**Status: GOOD TECHNICAL GOVERNANCE, WITH PROCUREMENT CONTROLS STILL TO FORMALISE**

Before the first serious international-school procurement/security review, Tiny Steps should have documented:

- privacy notice and school data-processing terms/DPA where applicable;
- data categories and data minimisation rationale;
- retention/deletion schedule;
- subprocessor and hosting/data-region information;
- security incident/contact process;
- backup/restore expectations;
- access review/offboarding process;
- vulnerability/dependency remediation process;
- support/availability expectations;
- accessibility review target of WCAG 2.2 AA, without claiming conformance until tested.

MFA/SSO/SAML should be demand-led rather than added prematurely; enterprise schools may later require them.

---

## International school implementation profile — required operating data

Before a new international-school pilot starts, Tiny Steps should capture a one-page implementation profile even if some fields initially live outside the portal:

### School context

- school/campus name and code;
- country and IANA time zone;
- actual academic-year start/end dates;
- school curriculum/framework context;
- grade/class naming convention;
- programme scope and participating sections;
- learner count.

### Language context

- English-first-language, EAL/ESL, bilingual/multilingual, or mixed;
- common home-language considerations if relevant to administration;
- school policy for EAL and learning support;
- known access/accommodation requirements at cohort level.

### Implementation context

- Tiny Steps course/stage starting point;
- teacher cohort;
- training dates;
- classroom implementation start;
- assessment windows;
- planned review cadence;
- LP and school escalation contacts.

### Reporting/governance

- principal/academic leadership recipients;
- reporting cadence;
- school privacy/data contact if required;
- agreed data retention/export process;
- whether the school requires a specific accessibility/security/vendor questionnaire.

This contextual information prevents the software from pretending that all schools operate identically.

---

## International pilot release gates

### Technical blockers — all must pass

1. Cloud Functions build.
2. School-domain Firestore security tests.
3. TypeScript check.
4. Unit tests for TSERB calculations, health logic and matched analytics.
5. Production frontend build.
6. Regression tests for Brick 1 school access and existing Tiny Steps roles.
7. Desktop/mobile manual review for Admin, LP and Principal.
8. Print/PDF and CSV verification with realistic data.

### Educational/evidence blockers — all must be operational before pilot

1. School implementation profile completed.
2. TSERB form and scoring-guide version frozen for the checkpoint.
3. Assessor calibration completed.
4. Baseline administration window agreed.
5. EAL/multilingual/access arrangements documented where relevant.
6. Assessment coverage reported.
7. Implementation observation rubric used consistently.
8. Leadership report distinguishes attainment, growth, implementation and data quality.

### Procurement/scale gates — required as school expectations demand

1. DPA/privacy/retention documentation.
2. Dependency/security review and remediation plan.
3. WCAG 2.2 AA accessibility evaluation target.
4. backup/restore and incident-response documentation.
5. formal support/SLA where contracted.
6. SSO/MFA requirements assessed for the customer.

---

## Final positioning

The strongest Tiny Steps school proposition is not “we have another phonics app” and not “we have an international standardized test.”

It is:

> **Tiny Steps is a teacher-enablement and early-reading implementation partner. We establish the starting point, train the school’s teachers, verify classroom implementation, reassess learners at defined checkpoints, and give leadership transparent evidence of reading progress and areas needing support—without making teachers maintain daily student dashboards.**

This architecture is compatible with international-school expectations precisely because it is focused, transparent and curriculum-respectful. Tiny Steps should keep that focus rather than trying to become the school’s SIS, LMS, full early-years assessment battery, or parent platform in this release.
