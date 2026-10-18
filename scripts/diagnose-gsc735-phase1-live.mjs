#!/usr/bin/env node
// Read-only production sampling. Not Google's genuine crawler or URL Inspection.
// Run from CI to provide dated origin observations. Never submits forms or URLs.
const BASE = 'https://tinystepslearning.com';
const TARGETS = [
  '/courses',
  '/blog/why-child-knows-letter-sounds-but-cannot-read-words',
  '/blog/sight-words-or-phonics-first',
  '/blog/online-phonics-classes-vs-school',
];
const AGENTS = [
  ['ordinary-chrome', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'],
  ['googlebot-user-agent-simulation', 'Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'],
];
const observations = [];
for (const [agentName, agent] of AGENTS) {
  for (const pathname of TARGETS) {
    const row = { observedAt: new Date().toISOString(), agentName, pathname };
    try {
      const res = await fetch(BASE + pathname, {
        headers: { 'user-agent': agent, accept: 'text/html' },
        redirect: 'follow',
        signal: AbortSignal.timeout(15000),
      });
      row.status = res.status;
      row.finalUrl = res.url;
      row.contentType = res.headers.get('content-type');
      row.cacheControl = res.headers.get('cache-control');
      row.xRobotsTag = res.headers.get('x-robots-tag');
      const html = await res.text();
      row.htmlLength = html.length;
      row.canonical = html.match(/<link\b(?=[^>]*\brel=["']canonical["'])[^>]*\bhref=["']([^"']+)/i)?.[1] ?? null;
      row.h1 = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1].replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 150) ?? null;
      row.hasErrorFallback = html.includes("We've been notified and will fix it soon");
      row.hasIndexBlock = /<meta[^>]*name=["'](?:robots|googlebot)["'][^>]*content=["'][^"']*noindex/i.test(html);
      row.looksLikeHTML = /text\/html/i.test(row.contentType || '');
    } catch (error) {
      row.error = error instanceof Error ? error.message : String(error);
    }
    observations.push(row);
    console.log(JSON.stringify(row));
  }
}
console.log(JSON.stringify({
  note: 'Observations use simulated user-agent headers from GitHub CI, not verified Googlebot identity. HTTP checks do not establish Google Index selection or full JS rendering.',
  total: observations.length,
  failed: observations.filter(row => row.error || row.status !== 200 || row.hasErrorFallback || row.hasIndexBlock).length,
}));
// Read-only discovery sampling, not a blocking gate: transient origin network
// errors should be triaged, not silently equated with site-wide Google failures.
