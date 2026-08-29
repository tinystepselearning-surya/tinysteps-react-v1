# B14 — Trust, Entity & Schools Authority Map

## Public authority graph

```text
Tiny Steps Learning
  ├─ /team
  │   ├─ founder identity and academic responsibility
  │   ├─ how curriculum and lesson plans are designed
  │   ├─ teacher preparation and shared methodology
  │   ├─ child-responsive teaching principles
  │   └─ quality and progress-review process
  │
  ├─ /curriculum
  │   └─ complete learning-roadmap owner (protected by B13)
  │
  ├─ /phonics /grammar /speaking
  │   └─ programme owners (protected by B13)
  │
  ├─ /courses/...
  │   └─ detailed course / lesson-sequence owners (protected by B13)
  │
  └─ /for-schools
      ├─ school implementation service
      ├─ teacher-training model
      ├─ shared classroom methodology
      ├─ evidence and framework citations
      ├─ implementation checkpoints
      └─ school-specific proposal route
```

## `/team` ownership

`/team` owns the organisation-level answer to:

> **Who designs Tiny Steps learning and how does that design become a child-friendly live class?**

It should expose the connected academic system without taking detailed curriculum ownership away from B13.

### Academic design inputs

- child development and readiness;
- learning science;
- early-literacy pedagogy;
- language development;
- recurring learner difficulties observed through teaching and assessment.

### Research-to-classroom pathway

```text
Evidence / pedagogy review
        ↓
Prerequisite mapping
        ↓
Curriculum progression
        ↓
Lesson-plan design
        ↓
Teacher preparation
        ↓
Child observation during class
        ↓
Modelling / prompt / example / repetition / practice adjustment
        ↓
Progress review
        ↓
Next teaching focus
```

### Core teaching contract

> **Structured curriculum. Responsive teaching.**

The curriculum sequence and lesson objective are protected. The teacher adjusts the amount of modelling, prompting, examples, repetition and practice time according to learner evidence rather than forcing the child through a fixed lesson speed.

Child-friendly teaching is demonstrated through concrete behaviours rather than a marketing label:

- short, age-appropriate tasks;
- predictable routines;
- clear modelling;
- guided retries;
- specific, encouraging feedback;
- prerequisite practice when needed;
- deliberate reduction of support as independence becomes secure;
- readiness-based progression.

## `/for-schools` ownership

`/for-schools` owns the B2B answer to:

> **How can a school implement Tiny Steps phonics with teacher preparation, protected methodology, evidence and review?**

It must not become a parent tutoring page.

### School implementation contract

```text
Protected progression
+ lesson resources
+ teacher preparation
+ Model → guided practice → observe → correct → retry → reduce support
+ learner-responsive pacing
+ baseline / checkpoints / review
+ implementation support
```

Consistency means common instructional principles and progression—not identical pacing for every learner.

## Entity relationships

```text
https://tinystepslearning.com/#organization
  Tiny Steps Learning
       │
       ├─ founder → https://tinystepslearning.com/#founder
       │              Vannala Ravali Priya
       │              visible section: /team#founder
       │
       ├─ AboutPage → /team
       │
       └─ Service → /for-schools
```

The visible founder identity and structured-data identity must stay aligned.

## Evidence boundary

NCF/NCERT, CBSE and UK DfE references are evidence/context sources. They do not imply:

- endorsement;
- accreditation;
- approval;
- certification;
- formal affiliation.

## Claim boundary

B14 may describe process, responsibility, instructional principles and observable review evidence.

B14 must not claim:

- clinical psychology services;
- a child has a fixed learning style;
- proprietary ownership of common teaching methods without proof;
- faster learning caused by a particular technique;
- guaranteed learner outcomes;
- school enrolment, revenue, reputation or referral growth caused by the programme;
- unverified founder or teacher qualifications.

## URL boundary

B14 creates **zero new public URLs** and does not alter canonicals, redirects, sitemap, RSS or indexability. B13 curriculum/program/course ownership remains intact.
