from pathlib import Path


def change(name, before, after):
    p = Path(name)
    text = p.read_text()
    assert text.count(before) == 1, (name, before[:120], text.count(before))
    p.write_text(text.replace(before, after))

change('scripts/prerender-readiness.mjs',
       'const matchingArticle = schemas.some((schema) => {',
       'const matchingArticle = schemas.find((schema) => {')
change('scripts/prerender-readiness.mjs',
       "    if (!matchingArticle) problems.push('matching article headline and BlogPosting schema are not ready');",
       """    if (!matchingArticle) problems.push('matching article headline and BlogPosting schema are not ready');
    else {
      const normalize = (value) => typeof value === 'string' ? value.replace(/\\s+/g, ' ').trim() : '';
      const headline = normalize(matchingArticle.headline);
      // These are the two title formats supported by the existing blog renderers.
      // A nonempty title from the previous route is not sufficient.
      if (document.head.querySelectorAll('title').length !== 1
          || ![headline, `${headline} | Tiny Steps Blog`].includes(normalize(document.title))) {
        problems.push('document title does not match the current article');
      }
      const canonicalPage = schemas.find((node) => hasType(node, 'WebPage') && node.url === contract.canonicalUrl);
      const articleDescription = normalize(matchingArticle.description ?? canonicalPage?.description);
      if (!articleDescription || normalize(descriptions[0]) !== articleDescription) {
        problems.push('description does not match the current article schema');
      }
    }""")

change('scripts/test/prerender-readiness.spec.mjs',
       "const title = 'How Video Feedback Helps Kids Improve Public Speaking';",
       "const title = 'How Video Feedback Helps Kids Improve Public Speaking';\nconst description = 'A parent guide to useful video feedback for children.';")
change('scripts/test/prerender-readiness.spec.mjs',
       "url: canonicalUrl, headline: title })}",
       "url: canonicalUrl, headline: title, description })}")
change('scripts/test/prerender-readiness.spec.mjs',
       "  it('rejects duplicate canonical tags', () => {",
       """  it('rejects a stale nonempty title even with the correct article and canonical', () => {
    document.title = 'SATPIN Phonics Guide | Tiny Steps Blog';
    expect(readPrerenderReadiness(contract)).toBe(false);
  });

  it('rejects a stale nonempty description even with the correct article and canonical', () => {
    document.querySelector('meta[name="description"]').content = 'An unrelated guide about vowel sounds.';
    expect(readPrerenderReadiness(contract)).toBe(false);
  });

  it('rejects a missing description identity in otherwise matching schema', () => {
    const script = document.querySelector('script');
    const schema = JSON.parse(script.textContent);
    delete schema.description;
    script.textContent = JSON.stringify(schema);
    expect(readPrerenderReadiness(contract)).toBe(false);
  });

  it('rejects duplicate title elements', () => {
    document.head.append(document.querySelector('title').cloneNode(true));
    expect(readPrerenderReadiness(contract)).toBe(false);
  });

  it('rejects duplicate canonical tags', () => {""")
change('scripts/test/prerender-special-layouts.spec.mjs',
       "'@type': 'BlogPosting', headline: articleTitle, mainEntityOfPage, ...extra",
       "'@type': 'BlogPosting', headline: articleTitle, description: 'A parent guide to phonics and supporting reading at home.', mainEntityOfPage, ...extra")
change('scripts/test/prerender-schema-graph.spec.mjs',
       "  it('still requires a matching visible headline after graph identity resolves', () => {",
       """  it('rejects stale metadata even when the canonical WebPage identity resolves', () => {
    document.querySelector('meta[name="description"]').content = 'The previous article description.';
    expect(readPrerenderReadiness(contract)).toBe(false);
  });

  it('rejects a stale document title even with a matching visible headline and graph', () => {
    document.title = 'SATPIN Phonics Guide | Tiny Steps Blog';
    expect(readPrerenderReadiness(contract)).toBe(false);
  });

  it('still requires a matching visible headline after graph identity resolves', () => {""")

name = 'src/config/seoRecoveryBrick8InternalLinks.ts'
change(name, 'export const SEO_RECOVERY_BRICK8_RETIRED_INTERNAL_PATHS = Object.freeze({',
       """// Retired aliases are lookup data, not outgoing links. Compose their paths so
// the Vite outgoing-link rewrite cannot collapse distinct keys into one owner.
// This also keeps deprecated full href literals out of the production bundle.
function retiredBlogPath<Slug extends string>(slug: Slug): `/blog/${Slug}` {
  return ['/blog', slug].join('/') as `/blog/${Slug}`;
}

export const SEO_RECOVERY_BRICK8_RETIRED_INTERNAL_PATHS = Object.freeze({""")
for slug in ['child-knows-letter-sounds-but-cannot-read', 'how-to-choose-phonics-classes',
             'best-online-phonics-classes-for-kids', 'best-phonics-classes-for-kids', 'week-1-phonics-satpin-launch']:
    change(name, "  '/blog/" + slug + "':", "  [retiredBlogPath('" + slug + "')]:")

change('.github/workflows/seo-dead-url-guard.yml',
       '      - name: Build and prerender public pages\n        run: npm run build',
       """      - name: Verify browser readiness and production alias normalization
        run: node --test scripts/test/prerender-browser.test.mjs scripts/test/recovery-internal-links-build.test.mjs

      - name: Build and prerender public pages
        run: npm run build

      - name: Verify generated article identity in Chromium
        run: node --test scripts/test/prerender-output.test.mjs""")
