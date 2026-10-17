#!/usr/bin/env node
// Nonblocking diagnosis for owner-reported Google Search Console Live Test Soft 404.
// These filenames come from the 17 Oct 2026 Search Console "More info" resource
// and JavaScript console diagnostics; a 404 for an older hash can indicate a
// deployment/stale-document problem, but does not by itself identify its cause.
const origin = 'https://tinystepslearning.com';
const paths = [
  '/assets/NotFoundPage-CWMBoDmE.js',
  '/assets/KnowledgeBreadcrumbs-DlRRC8qj.js',
  '/assets/breadcrumbAeoGeoRegistry-D-jbDi0W.js',
  '/assets/semanticFacts-DNwzDSmK.js',
  '/assets/speakingCommunicationKnowledgeArchitecture-BfdqaylW.js',
  '/assets/speakingKnowledgeCluster-DtOCC9h4.js',
  '/assets/AnalyticsTracker-DQQ36tNO.js',
  '/assets/speakingCommunicationCompletionArchitecture-D82eGEXs.js',
  '/assets/vocabularyAuthoritySeoManifest-DNGEbWd7.js',
  '/commercial-owner-experience.js',
  '/seo-indexability-guard.js',
];
const agents = [
  ['ordinary-chrome', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'],
  ['googlebot-ua-simulation', 'Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'],
];
const observations = [];
for (const [label, agent] of agents) {
  for (const pathname of ['/resources/grammar', ...paths]) {
    const row = { agent: label, pathname };
    try {
      const response = await fetch(origin + pathname, {
        method: 'GET',
        redirect: 'manual',
        headers: { 'user-agent': agent, 'accept': pathname === '/resources/grammar' ? 'text/html' : '*/*' },
        signal: AbortSignal.timeout(12000),
      });
      row.status = response.status;
      row.contentType = response.headers.get('content-type');
      row.cacheControl = response.headers.get('cache-control');
      row.location = response.headers.get('location') || null;
      if (pathname === '/resources/grammar') {
        const html = await response.text();
        row.hasExpectedGrammarH1 = /<h1\b[^>]*>\s*Grammar (?:&amp;|&) Writing Resources/i.test(html);
        row.hasPrerenderedSequence = html.includes('grammar-programmatic-sequence');
        row.hasRootErrorFallback = html.includes("We've been notified and will fix it soon");
      } else if (!response.ok || !/javascript|ecmascript/i.test(row.contentType || '')) {
        row.bodyPrefix = (await response.text()).replace(/\s+/g, ' ').slice(0, 160);
      } else {
        await response.body?.cancel();
      }
    } catch (error) {
      row.error = error instanceof Error ? error.message : String(error);
    }
    observations.push(row);
    console.log(JSON.stringify(row));
  }
}
const failed = observations.filter(row => row.error || row.status !== 200 || (row.pathname !== '/resources/grammar' && !/javascript|ecmascript/i.test(row.contentType || '')));
console.log(JSON.stringify({
  note: 'Read-only production HTTP probes from GitHub runner; not a verified Googlebot fetch and not an indexing test.',
  checked: observations.length,
  failures: failed.length,
  failedPaths: [...new Set(failed.map(row => row.pathname))],
}));
console.log('Diagnostics are nonblocking. CI success does not establish that Google Live Test can index the page.');
