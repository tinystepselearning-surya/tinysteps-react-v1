# FAQ Parent Decision Hub — 2026-09-02

## Objective

Upgrade `/faq` from a mostly educational FAQ into a parent decision and support hub without weakening the existing phonics, grammar, reading, and speaking guidance.

## Research basis

- Current Google Search guidance prioritises people-first content, descriptive titles/headings, and crawlable descriptive internal links.
- Google removed FAQ rich-result support from Search in May 2026; FAQ structured data is retained only as semantic page markup, not as a rich-result growth tactic.
- FAQ/search UX should surface the questions parents actually ask, provide strong recovery when no result matches, and keep a direct route to human support.

## Implemented changes

- Reconciled `/faq` title, description, canonical, and robots metadata in the shared route SEO registry.
- Expanded the FAQ from 24 to 42 parent questions with decision-stage questions prioritised before deeper educational guidance.
- Added parent-intent categories covering getting started, classes/teachers, learning areas, fees, progress/support, and scheduling/policies.
- Added a “Most parents ask these first” decision layer for fees, class duration, class format, free assessment, placement, and Microsoft Teams.
- Added synonym-aware search terms and a useful no-results recovery state.
- Replaced generic internal-link labels with destination-specific anchor text.
- Added stable question anchors, better accordion accessibility, and expand/collapse behaviour that remains correct after filtering.
- Added privacy-safe GA4 interaction events without sending raw search queries.
- Strengthened the Ask Tiny Steps source registry so `/faq` is retrievable for class duration, format, teacher fit, scheduling, parent support, recordings, and related operational questions.
- Added regression tests for FAQ metadata and Ask Tiny Steps retrieval signals.

## Authoritative site facts used

- Standard 1:1 class: 35 minutes.
- Standard 1:1 pricing: ₹400 per class.
- Standard small-group formats: 1:2 through 1:6; durations vary from 40 to 60 minutes by group size.
- Free assessment: one free 35-minute 1:1 online demo assessment per child before enrolment, ₹0, no credit card, no obligation to enrol.
- Live-class platform: Microsoft Teams.
- Children served: ages 3–12.
- Rescheduling: at least 24 hours’ notice, subject to teacher availability.
- Refund and mentor-fit answers mirror the published refund/guarantee policy.
- Progress, recordings, worksheets, and parent support wording is intentionally conditional where the published service terms do not promise a universal entitlement.

## Validation target

Run the repository’s unit tests, typecheck, build/prerender, route-integrity checks, public-facts audits, and generated-feed steps through normal CI before merge.
