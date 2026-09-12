/**
 * Runs in the browser via Playwright. Keep this function closure-free.
 * A heading in a 404 page is not evidence that an article finished rendering.
 */
export function readPrerenderReadiness(contract) {
  const root = document.getElementById('root');
  const text = (root?.innerText || root?.textContent || '').trim();
  const headings = Array.from(root?.querySelectorAll('h1, h2') || [])
    .map((node) => (node.textContent || '').trim());
  const canonicals = Array.from(document.head.querySelectorAll('link[rel="canonical"]'))
    .map((node) => node.getAttribute('href') || '');
  const descriptions = Array.from(document.head.querySelectorAll('meta[name="description"]'))
    .map((node) => (node.getAttribute('content') || '').trim());
  const robots = ['robots', 'googlebot', 'bingbot'].flatMap((name) =>
    Array.from(document.head.querySelectorAll(`meta[name="${name}"]`))
      .map((node) => ({ name, content: node.getAttribute('content') || '' })),
  );
  const isNoindex = (value) => /(?:^|[,\s])(?:noindex|none)(?:[,\s]|$)/i.test(value);
  const problems = [];

  // This existing full-screen game has no h1/h2. Require its actual start-screen
  // controls and assets, not arbitrary HTML size or an exception for all games.
  const isChristmasGame = contract.canonicalUrl === 'https://tinystepslearning.com/seasonal/christmas-tree';
  const buttonLabels = Array.from(root?.querySelectorAll('button') || [])
    .map((node) => (node.textContent || '').trim());
  const gameReady = isChristmasGame
    && text.includes('Christmas Tree Decorator')
    && text.includes('Tap Start to enable music and touch controls.')
    && ['Start Game', 'Reset', 'Exit'].every((label) => buttonLabels.includes(label))
    && Boolean(root?.querySelector('img[src="/seasonal/christmas/tree.png"][alt="Christmas tree"]'))
    && Boolean(root?.querySelector('img[src="/seasonal/christmas/gamebg.jpeg"][alt="Christmas background"]'));
  const contentReady = isChristmasGame
    ? gameReady
    : headings.length > 0 && text.length > (contract.requireArticle ? 600 : 200);
  if (!root || !contentReady) problems.push('meaningful route content is not ready');

  if (/\b(?:404|page not found|article not found|unexpected application error)\b/i.test(document.title)
      || headings.some((heading) => /^(?:404\b|page not found|article not found|unexpected application error)/i.test(heading))) {
    problems.push('router rendered an error or not-found page');
  }
  if (contract.requireArticle && !root?.querySelector('article, .ts-blog-hero-title')) {
    problems.push('article markup is missing');
  }

  // Article routes must finish their own SEO effect. Do not use static metadata
  // injection to turn a missing article into an indexable page.
  if (contract.checkArticleMetadata) {
    if (canonicals.length !== 1 || canonicals[0] !== contract.canonicalUrl) {
      problems.push('article canonical is missing or belongs to another route');
    }
    if (descriptions.length !== 1 || !descriptions[0]) {
      problems.push('article description is missing or duplicated');
    }
    if (!robots.some((tag) => tag.name === 'robots')) problems.push('article robots metadata is missing');
    if (robots.some((tag) => isNoindex(tag.content) !== contract.expectedNoindex)) {
      problems.push('article robots metadata disagrees with its indexing policy');
    }
    const schemas = [];
    const collect = (value) => {
      if (Array.isArray(value)) value.forEach(collect);
      else if (value && typeof value === 'object') {
        schemas.push(value);
        if (value['@graph']) collect(value['@graph']);
      }
    };
    for (const node of document.head.querySelectorAll('script[type="application/ld+json"]')) {
      try { collect(JSON.parse(node.textContent || '')); } catch { /* Not ready until valid article schema exists. */ }
    }
    const hasType = (schema, type) => (Array.isArray(schema['@type']) ? schema['@type'] : [schema['@type']]).includes(type);
    const matchingArticle = schemas.some((schema) => {
      const mainPage = typeof schema.mainEntityOfPage === 'string'
        ? schema.mainEntityOfPage : schema.mainEntityOfPage?.['@id'];
      // applySeo's graph normalizer links articles to canonicalUrl#webpage.
      // Resolve that reference through a real WebPage node, not a prefix match.
      // An explicit wrong article url is never hidden by the alternative identity.
      const matchesPage = schema.url != null
        ? schema.url === contract.canonicalUrl
        : mainPage === contract.canonicalUrl || schemas.some((node) =>
          hasType(node, 'WebPage') && node['@id'] === mainPage
          && typeof mainPage === 'string' && node.url === contract.canonicalUrl,
        );
      return hasType(schema, 'BlogPosting') && matchesPage
        && typeof schema.headline === 'string' && schema.headline.trim().length > 0
        && headings.some((heading) => heading.replace(/\s+/g, ' ') === schema.headline.trim().replace(/\s+/g, ' '));
    });
    if (!matchingArticle) problems.push('matching article headline and BlogPosting schema are not ready');
  }

  const state = { ready: problems.length === 0, problems, title: document.title, headings, canonicals, descriptions, robots };
  return contract.diagnostics ? state : state.ready;
}

/** Always render from the immutable Vite shell, never a page just written to dist. */
export async function installPrerenderShell(page, origin, shell) {
  if (typeof shell !== 'string' || !shell.includes('id="root"')) {
    throw new Error('Prerender requires the original Vite application shell');
  }
  await page.route(`${origin}/**`, async (route) => {
    const request = route.request();
    if (request.isNavigationRequest() && request.resourceType() === 'document'
        && request.frame() === page.mainFrame()) {
      await route.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: shell });
      return;
    }
    await route.continue();
  });
}

/** Capture only validated output. Invalid attempts never reach writeRouteHtml. */
export async function captureReadyRoute(page, url, contract, options = {}) {
  const { maxRetries = 2, readinessTimeout = 10000, retryDelay = 2000 } = options;
  if (!Number.isInteger(maxRetries) || maxRetries < 1) throw new Error('maxRetries must be a positive integer');
  let lastFailure;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Reset the failed document before retrying rather than reusing an error tree.
      if (attempt > 1) await page.goto('about:blank');
      const response = await page.goto(url, { waitUntil: 'load', timeout: 60000 });
      if (!response || !response.ok()) throw new Error(`Navigation failed: HTTP ${response?.status() ?? 'no response'}`);
      await page.waitForFunction(readPrerenderReadiness, contract, { timeout: readinessTimeout });
      const state = await page.evaluate(readPrerenderReadiness, { ...contract, diagnostics: true });
      if (!state.ready) throw new Error(`Readiness changed before capture: ${state.problems.join('; ')}`);
      const html = await page.content();
      if (html.length < 1000) throw new Error(`HTML too short (${html.length} bytes)`);
      return html;
    } catch (error) {
      const state = await page.evaluate(readPrerenderReadiness, { ...contract, diagnostics: true })
        .catch(() => ({ problems: ['document unavailable for diagnostics'] }));
      lastFailure = new Error(`${url}: ${error.message}; ${JSON.stringify(state)}`, { cause: error });
      console.warn(`[prerender] Rejected attempt ${attempt}/${maxRetries}: ${lastFailure.message}`);
      if (attempt < maxRetries && retryDelay > 0) await new Promise((resolve) => setTimeout(resolve, retryDelay));
    }
  }
  throw lastFailure;
}
