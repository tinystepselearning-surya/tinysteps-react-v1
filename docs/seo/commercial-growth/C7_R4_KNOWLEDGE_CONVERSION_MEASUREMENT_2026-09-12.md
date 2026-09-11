# C7-R4 — Knowledge Conversion Measurement

**Date:** 12 September 2026  
**Status:** `knowledge-conversion-measurement-implemented`

## Purpose

Measure the progression:

`knowledge surface → commercial owner → /book-demo → qualified lead`

without redefining a click, page view or form event as a qualified lead.

## Diagnostic events

- `knowledge_commercial_view` — a C7 knowledge surface is viewed.
- `knowledge_commercial_handoff_click` — a visitor clicks the R2-authorised primary or secondary commercial destination.
- `commercial_owner_view` — existing C5 commercial-owner diagnostic.
- `commercial_decision_click` — existing C5 commercial decision diagnostic.
- `funnel_form_start`, `funnel_form_submit`, `generate_lead` — existing funnel diagnostics.

## Source of truth

The primary KPI remains `qualified_organic_leads_per_day` from C0. Qualification requires the canonical lead lifecycle plus stored first-touch organic-search attribution. C7 events are diagnostic sequence signals only.

## Guardrails

- no new URLs
- no C2 ownership changes
- no C4 metadata changes
- no C5 conversion-owner changes
- no C6 architecture changes
- no knowledge-body changes for measurement
- `/book-demo` remains the single conversion owner

## Implementation

- `src/lib/commercialC7KnowledgeMeasurement.ts`
- `src/components/common/ConversionTracker.tsx`
- `src/tests/seo/commercialC7KnowledgeMeasurement.spec.ts`
- `scripts/audit-commercial-c7-r4-knowledge-measurement.mjs`
