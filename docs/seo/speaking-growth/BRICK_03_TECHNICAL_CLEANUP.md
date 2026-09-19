# Brick 03 — Cannibalization & Technical SEO Cleanup

Build date: 2026-09-19 IST  
Branch: feature/speaking-seo-geo-growth  
Status: COMPLETE — structurally verified on branch; not deployed to production.

## 1. Purpose

Brick 3 executes the technical cleanup authorized by Bricks 1 and 2 without changing the underlying Speaking programme proposition.

Primary goals:
1. consolidate the duplicate legacy Public Speaking landing into the canonical owner `/speaking`;
2. remove the retired URL from index/discovery surfaces while preserving its search equity through a permanent redirect;
3. preserve Spoken-English/global-vs-local ownership boundaries without creating new pages;
4. resolve the Brick 1 confidence-indexing mismatch by determining whether code or Google state is stale;
5. repair confirmed public-fact drift in the Speaking age label;
6. add regression guards so the duplicate Speaking landing cannot be accidentally restored.

## 2. Legacy Public Speaking migration

Retired URL:

`/public-speaking-communication-kids`

Canonical commercial owner:

`/speaking`

### Production redirect contract

Firebase Hosting now contains:

`/public-speaking-communication-kids -> /speaking (301)`

The public redirect manifest contains the same permanent redirect.

The client router also maps both slash variants to `/speaking` using React Router `Navigate` as a local/development fallback. Production signal transfer is still performed by the Firebase 301 before SPA routing.

### Indexability and canonical contract

The retired URL:
- is no longer an indexable entry in `PUBLIC_ROUTE_MANIFEST`;
- remains represented in `ROUTE_SEO_REGISTRY` only as a legacy alias;
- has canonicalPath `/speaking`;
- has `robots: noindex, follow`;
- is removed from static sitemap discovery;
- is removed from RSS and Atom/feed discovery.

The destination `/speaking` remains self-canonical and appears exactly once in `sitemap-static.xml`.

## 3. Runtime surfaces reconciled

Brick 3 changed these runtime/SEO surfaces:

- `firebase.json` — production 301.
- `src/lib/publicRouteManifest.js` — retired indexable route removed; redirect contract added.
- `src/app/routes.tsx` — legacy routes fall back to `Navigate -> /speaking`; obsolete page import removed.
- `src/lib/routeSeoRegistry.js` — legacy alias now canonicalizes to `/speaking` and is noindex/follow.
- `src/content/publicSubjectLandings.ts` — Speaking subject data now points to `/speaking`, not the retired route.
- `src/lib/analyticsClassification.ts` — retired URL removed from the live programme-page taxonomy.
- `public/sitemap-static.xml` — legacy URL removed.
- `public/rss.xml` and `public/feed.xml` — legacy discovery item removed.
- `scripts/seo-smoke.mjs` — legacy URL is now required absent from sitemaps and required to have a 301/canonical/noindex alias contract.
- `src/tests/seo/seoInfrastructure.spec.ts` — expectations updated from self-canonical live landing to 301 alias.
- `src/pages/public/PublicSpeakingCommunicationKidsPage.tsx` — deleted because the duplicate landing is retired.

Historical commercial ownership documentation and C2 forbidden-claimant records intentionally continue to mention the retired URL as migration history/guardrail evidence.

## 4. Search-equity protection

Brick 1 recorded the legacy URL at:
- 11 clicks;
- 701 impressions;
- avg position 25.49;
during the exact current 90-day window.

Brick 2 recorded material overlap such as:
- "online public speaking courses for kids": 73 legacy impressions vs 9 on `/speaking`;
- "public speaking online course for beginners (kids focus)": 230 legacy impressions vs 25 on `/speaking`;
- "communication classes for kids": 9 legacy impressions and 1 click vs 2 impressions on `/speaking`.

Therefore Brick 3 uses a direct one-hop 301 to the semantically equivalent owner. It does not delete the legacy path without redirection, chain through another URL, or redirect to a generic home/courses page.

## 5. Confidence programme indexing investigation

Brick 1 URL Inspection recorded:

`/confidence-building-program-kids`  
Google last crawl: 2026-08-27  
Google state: Excluded by noindex tag / BLOCKED_BY_META_TAG.

Current repository source explicitly applies:

`robots: index,follow`

Repository history shows the specialist confidence owner was strengthened/reconciled/finalized on 2026-09-10, after Google's recorded 2026-08-27 crawl.

Conclusion:
- the Google noindex observation predates the current confidence-page implementation;
- Brick 3 does not add a redundant second robots patch;
- the issue is classified as stale Google crawl/index state until the current implementation is deployed and recrawled.

Post-final-deployment verification must re-run Google URL Inspection. If Google still reports a noindex state after crawling the deployed current page, investigate rendered HTML and HTTP headers at that point.

## 6. Spoken English vs Hyderabad technical boundary

Brick 2 corrected the ownership contract:

- broad Hyderabad English → `/online-english-classes-hyderabad`;
- Spoken-English-qualified intent, including Hyderabad modifiers → `/spoken-english-classes-for-kids-online`.

Brick 3 inspected the current Hyderabad page and confirmed its implementation already follows that architecture:
- title/SEO keyword set is broad "Online English Classes for Kids in Hyderabad";
- it explicitly tells users to use specialist programme pages when the need is known;
- its Spoken English card links to the canonical Spoken-English owner;
- its Public Speaking card links to `/speaking`;
- it states Hyderabad is an online service area, not a physical centre.

Therefore no additional Hyderabad runtime rewrite is made in Brick 3. Content/relevance strengthening for the Spoken-English owner remains Brick 5.

## 7. Public-fact repair

Brick 1 found:

`Super Speakers — Ages 4-15`

in `src/components/Home/PopularPrograms.tsx`.

That conflicts with the protected Tiny Steps audience ceiling and the two Speaking levels ending at age 12.

Brick 3 changes only that factual label to:

`Super Speakers — Ages 4-12`

No homepage redesign or unrelated copy change is included.

## 8. Structural verification

A branch-level invariant check returned TRUE for all tested conditions:

- app legacy route redirects to `/speaking`;
- obsolete page import removed;
- redirect manifest contains 301;
- legacy route absent from indexable public manifest;
- Firebase contains direct 301;
- SEO alias canonicalizes to `/speaking`;
- SEO alias is noindex/follow;
- subject data points to `/speaking`;
- analytics live-page classification no longer lists legacy route;
- legacy URL absent from static sitemap;
- `/speaking` occurs exactly once as a static sitemap URL;
- legacy URL absent from RSS;
- legacy URL absent from feed;
- smoke guard enforces migration;
- SEO infrastructure tests encode the migration;
- homepage age label is corrected;
- confidence page currently encodes index,follow.

## 9. Test-execution limitation

A local checkout was attempted for an executable build/test pass, but the execution environment could not resolve `github.com` and therefore could not clone the repository. The latest branch commit also has no pull-request-triggered GitHub Actions run attached.

Accordingly:
- structural/configuration verification is complete;
- source-level regression guards were updated;
- no claim is made that the full npm/Vitest/build suite executed in this environment.

Before the final 13-brick merge gate, the repository's normal executable build, TypeScript, SEO smoke, rendered-HTML, route-integrity and regression suites must run successfully. If an executable CI opportunity becomes available earlier, Brick 3 should be included in that pass.

## 10. Production state

Brick 3 is NOT deployed.

Until the 13-brick branch is finally merged and deployed:
- the live legacy Public Speaking URL remains in its current production state;
- Google will continue seeing the existing production implementation;
- no indexing/request-recrawl action should be treated as completed for these branch-only changes.

## 11. Brick 3 exit gate

Brick 3 is closed on the feature branch when:
1. the direct one-hop 301 contract is consistent across Firebase, manifest and app fallback routing;
2. retired URL is no longer indexable/discoverable in sitemap/feed surfaces;
3. canonical/noindex alias protection exists;
4. duplicate component is retired;
5. `/speaking` remains the sole generic Public Speaking owner;
6. Hyderabad remains broad-local support and does not replace subject owners;
7. confidence noindex mismatch is correctly classified from crawl-vs-code chronology;
8. Speaking public age fact is normalized;
9. regression guards are updated;
10. feature branch remains current with main.

All ten conditions are satisfied at the structural verification gate.
