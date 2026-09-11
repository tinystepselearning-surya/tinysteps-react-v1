# LLM & Search Discovery Hardening — 11 September 2026

## Scope

This change keeps the C1-C3 commercial ownership model intact while improving machine discovery for the 14 unique canonical commercial owner URLs.

## Commercial LLM discovery

`public/llms.txt` now contains a dedicated **Commercial Programme & Decision Pages** section covering all 14 unique C1-C3 commercial owners:

- `/phonics`
- `/best-online-phonics-classes-for-kids-in-india`
- `/phonics-fees-india`
- `/reading-classes-for-kids`
- `/reading-fluency-program`
- `/grammar`
- `/writing-classes-for-kids`
- `/spoken-english-classes-for-kids-online`
- `/speaking`
- `/confidence-building-program-kids`
- `/online-english-classes-for-kids`
- `/online-english-classes-hyderabad`
- `/pricing`
- `/book-demo`

Public Speaking and general Communication intentionally share `/speaking`. Broad/global English and generic English-tutor intent intentionally share `/online-english-classes-for-kids`.

The stale LLM-facing `no credit card required` demo statement was removed so the discovery file matches the C3 demo trust repair.

## Crawler access

`public/robots.txt` continues to allow the public site while blocking private/admin/teacher/parent/kids routes. It now explicitly includes the following additional search and AI discovery controls while repeating the private-route exclusions:

- Bingbot
- Googlebot
- Google-Extended
- Applebot
- Applebot-Extended
- DuckDuckBot
- DuckAssistBot

Existing explicit rules remain for OpenAI, Anthropic, Perplexity and Common Crawl agents.

Brave Search does not expose a dedicated crawler user-agent and follows Googlebot crawlability, so preserving Googlebot access also preserves Brave Search eligibility.

## Bing / Copilot freshness

The repository already contains production IndexNow support. The deployment workflow verifies the IndexNow ownership key and submits canonical sitemap URLs when `INDEXNOW_KEY` is configured. The sitemap remains referenced from `robots.txt`.

## Regression protection

`src/tests/seo/blogQuality51LlmDiscovery.spec.js` now verifies that:

- all 14 canonical commercial owner URLs occur in `llms.txt`;
- all 14 occur in `sitemap-static.xml`;
- the expanded search/AI crawler list remains explicitly allowed;
- private Tiny Steps routes remain blocked.
