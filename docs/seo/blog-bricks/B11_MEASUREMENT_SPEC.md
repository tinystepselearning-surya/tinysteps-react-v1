# B11 — Blog Conversion Measurement Specification

## Purpose

This specification gives Tiny Steps one stable vocabulary for measuring whether blog authority produces a useful parent or school next step.

The primary parent funnel is:

`blog_article_view → blog_cta_impression → blog_cta_click → blog_demo_start → blog_demo_submit`

`blog_program_click` is an exploration event, not a completed lead.

## Event definitions

| Event | Fires when | Conversion meaning |
| --- | --- | --- |
| `blog_article_view` | an article page resolves its B11 conversion context | content exposure |
| `blog_cta_impression` | the end-of-article conversion card becomes meaningfully visible | conversion opportunity viewed |
| `blog_cta_click` | a tracked blog conversion action is clicked | explicit next-step intent |
| `blog_program_click` | a programme or school-partnership route is clicked | programme exploration |
| `blog_demo_start` | a blog-attributed demo form receives its first focus | assessment form engagement |
| `blog_demo_submit` | the existing public assessment form confirms successful submission | blog-attributed lead conversion |

## Standard event parameters

The B11 tracking helper uses these fields where relevant:

- `article_slug`
- `conversion_family`
- `intent_cluster`
- `authority_cluster`
- `program`
- `cta_position`
- `cta_label`
- `destination_path`

It also carries the existing generic acquisition context when available:

- `landing_page`
- `lead_utm_source`
- `lead_utm_medium`
- `lead_utm_campaign`
- `lead_referrer_domain`

## CTA positions

B11 currently defines two deliberate conversion positions:

- `hero` — a lighter programme/assessment route near the article opening;
- `article_end` — the primary intent-matched conversion card after the useful article/trust content.

The system must not invent dozens of CTA position names for visually similar controls.

## Acquisition versus influence

### Acquisition attribution

The existing `ts_lead_attribution_v1` / public attribution systems remain the source of truth for how a visitor first arrived, such as:

- Google organic;
- paid campaign UTM;
- external referral;
- direct landing page.

B11 must not overwrite that information simply because the visitor later reads another article.

### Blog influence attribution

B11 adds a separate session-scoped content-influence record. It can preserve:

- first blog article in the session;
- latest blog article;
- conversion family/intent;
- CTA that led toward the demo.

This answers a different question: **which Tiny Steps article/problem was influencing the decision when the parent took the next step?**

## Lead source detail

For blog-influenced demo enquiries, the existing public lead form receives:

`blog|<article-slug>|<conversion-family>|<cta-position>`

This is intentionally compact, human-readable and bounded. It uses only Tiny Steps-controlled identifiers and is written through the already-existing `sourceDetail` field.

## Reporting questions B11 enables

After enough real traffic exists, analytics can answer:

1. Which articles receive conversion-card impressions?
2. Which authority articles create the most CTA clicks?
3. Which conversion families produce demo starts?
4. Which article-to-demo journeys actually submit?
5. Which programme links are used as an exploratory step instead of a demo?
6. Which acquisition sources bring visitors who later convert from a blog article?
7. Which high-traffic articles have weak CTA progression and need UX review rather than more SEO copy?

## Interpretation rules

- A page view is not a lead.
- A CTA impression is not intent.
- A CTA click is not a submitted enquiry.
- A programme click is not a demo conversion.
- Only `blog_demo_submit` represents a successfully submitted blog-attributed demo form.
- Conversion rate analysis should use meaningful denominators and adequate sample sizes rather than making claims from a few visits.

## Privacy and data minimisation

B11 introduces no fingerprinting and no additional personal profile fields.

The new event/context fields describe:

- Tiny Steps content;
- Tiny Steps conversion controls;
- existing acquisition metadata.

Contact and child information continues to be handled by the existing public assessment form and backend rules.

## Governance

Future developers should extend the existing event vocabulary rather than creating near-duplicate event names. Any new event should have:

1. one precise trigger;
2. one documented analytical question;
3. stable parameter semantics;
4. no unnecessary personal data.
