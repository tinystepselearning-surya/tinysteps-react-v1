# Brick 10 — Video / Class Demonstration Engine

Decision date: 2026-09-19 IST  
Branch: `feature/speaking-seo-geo-growth`  
Status: **SKIPPED — COVERED BY EXISTING CLASS-SAMPLES ARCHITECTURE**  
Production deployment: **NO**

## Decision

Brick 10 will not create a separate Speaking video/class-demonstration engine.

Tiny Steps already has one cross-programme demonstration owner:

`/class-samples`

That surface covers:

- Phonics;
- Grammar;
- Public Speaking.

The Speaking commercial page already links parents to this shared evidence surface.

## Why a separate Brick 10 is unnecessary

Creating a second Speaking-only class-demonstration destination would:

- duplicate an existing evidence owner;
- create unnecessary content/SEO overlap;
- split class-sample maintenance across multiple surfaces;
- increase the risk of stale or inconsistent video metadata;
- weaken the simple parent journey from programme page → shared class samples.

Brick 9 already treats `/class-samples` as the observable-classroom evidence source and explicitly states that a specific Speaking sample is not guaranteed to be available.

## Video schema rule remains

Skipping Brick 10 does not authorize synthetic video metadata.

If real class videos are added or materially changed on `/class-samples`, any `VideoObject` markup must be tied to real published media and real metadata.

No course-specific `VideoObject` should be invented merely for SEO.

## Architecture outcome

- New public URLs: **ZERO**
- New canonical owners: **ZERO**
- Existing class-sample owner: `/class-samples`
- Speaking handoff: `/speaking` → `/class-samples`
- Phonics/Grammar/Speaking class demonstrations remain centralized.
- No production merge or deployment.

## Exit decision

Brick 10 is intentionally skipped because its intended business and evidence function is already satisfied by the shared class-samples architecture.

**Brick 10 status: SKIPPED — COVERED BY EXISTING CLASS-SAMPLES ARCHITECTURE.**

Proceed directly to **Brick 11 — Entity & External Authority**.
