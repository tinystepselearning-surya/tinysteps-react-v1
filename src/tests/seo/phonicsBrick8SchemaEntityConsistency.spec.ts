import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  FOUNDER_ID,
  ORGANIZATION_ID,
  PUBLIC_FACTS,
  SITE_ORIGIN,
  WEBSITE_ID,
  organizationSchema,
  websiteSchema,
} from '../../lib/schemas';
import {
  BLOG_ID,
  PHONICS_SERVICE_ID,
  READING_SERVICE_ID,
  enhanceStructuredDataGraph,
  getCanonicalWebPageId,
  getCourseEntityId,
  mergeSchemasByIdentity,
} from '../../lib/structuredDataGraph';

const repoRoot = process.cwd();
const read = (relativePath: string) => fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');

const types = (node: any): string[] => {
  const type = node?.['@type'];
  return typeof type === 'string' ? [type] : Array.isArray(type) ? type : [];
};
const hasType = (node: any, type: string) => types(node).includes(type);
const byId = (nodes: any[], id: string) => nodes.find((node) => node?.['@id'] === id);

function baseSchemas(url: string, title = 'Test page') {
  return [
    organizationSchema,
    websiteSchema,
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      '@id': getCanonicalWebPageId(url),
      name: title,
      url,
      isPartOf: { '@id': WEBSITE_ID },
      publisher: { '@id': ORGANIZATION_ID },
    },
  ];
}

function enhance(pathname: string, schemas: any[], title = 'Test page') {
  const url = `${SITE_ORIGIN}${pathname}`;
  return enhanceStructuredDataGraph({
    canonicalPath: pathname,
    canonicalUrl: url,
    title,
    description: 'Test description',
    schemas,
  });
}

describe('Phonics Brick 8 schema, entity graph and technical consistency', () => {
  it('keeps the canonical Tiny Steps organization and website identities while using the dedicated founder profile ID', () => {
    expect(ORGANIZATION_ID).toBe('https://tinystepslearning.com/#educational-organization');
    expect(WEBSITE_ID).toBe('https://tinystepslearning.com/#website');
    expect(FOUNDER_ID).toBe('https://tinystepslearning.com/team/vannala-ravali-priya#person');
    expect(PUBLIC_FACTS.organizationName).toBe('Tiny Steps Early Education');
    expect(PUBLIC_FACTS.brandName).toBe('Tiny Steps Learning');
  });

  it('merges duplicate @id nodes so richer page schema is not discarded by the base WebPage', () => {
    const id = `${SITE_ORIGIN}/phonics#webpage`;
    const merged = mergeSchemasByIdentity([
      { '@type': 'WebPage', '@id': id, name: 'Base', about: { '@id': ORGANIZATION_ID } },
      { '@type': 'WebPage', '@id': id, name: 'Richer', mainEntity: { '@id': PHONICS_SERVICE_ID } },
    ]);

    expect(merged).toHaveLength(1);
    expect(merged[0].name).toBe('Richer');
    expect(merged[0].about).toEqual({ '@id': ORGANIZATION_ID });
    expect(merged[0].mainEntity).toEqual({ '@id': PHONICS_SERVICE_ID });
  });

  it('models /phonics as a service authority with exactly three canonical course-stage entities', () => {
    const pathName = '/phonics';
    const url = `${SITE_ORIGIN}${pathName}`;
    const nodes = enhance(pathName, [
      ...baseSchemas(url),
      {
        '@context': 'https://schema.org',
        '@type': 'Course',
        name: 'Online Phonics Classes for Kids',
        url,
        provider: { '@type': 'EducationalOrganization', name: PUBLIC_FACTS.organizationName },
      },
    ]);

    expect(nodes.some((node) => hasType(node, 'Course') && node.url === url)).toBe(false);

    const service = byId(nodes, PHONICS_SERVICE_ID);
    expect(service).toMatchObject({
      '@type': 'Service',
      url,
      provider: { '@id': ORGANIZATION_ID },
    });

    const webpage = byId(nodes, getCanonicalWebPageId(url));
    expect(webpage.mainEntity).toEqual({ '@id': PHONICS_SERVICE_ID });
    expect(webpage.about).toEqual({ '@id': PHONICS_SERVICE_ID });

    const courseList = byId(nodes, `${url}#courses`);
    expect(courseList.numberOfItems).toBe(3);
    expect(courseList.itemListElement).toHaveLength(3);
    expect(courseList.itemListElement.map((item: any) => item.item.url)).toEqual([
      `${SITE_ORIGIN}/courses/phonics-foundation`,
      `${SITE_ORIGIN}/courses/phonics-brush-up`,
      `${SITE_ORIGIN}/courses/phonics-advanced`,
    ]);
    for (const item of courseList.itemListElement) {
      expect(item.item['@id']).toBe(getCourseEntityId(item.item.url));
      expect(item.item.provider).toEqual({ '@id': ORGANIZATION_ID });
      expect(item.item.teaches.length).toBeGreaterThan(0);
    }
  });

  it('gives every phonics stage page one canonical Course @id and closes WebPage ↔ Course references', () => {
    for (const pathName of [
      '/courses/phonics-foundation',
      '/courses/phonics-brush-up',
      '/courses/phonics-advanced',
    ]) {
      const url = `${SITE_ORIGIN}${pathName}`;
      const stageUrls = [
        `${SITE_ORIGIN}/courses/phonics-foundation`,
        `${SITE_ORIGIN}/courses/phonics-brush-up`,
        `${SITE_ORIGIN}/courses/phonics-advanced`,
      ];
      const nodes = enhance(pathName, [
        ...baseSchemas(url),
        {
          '@context': 'https://schema.org',
          '@type': 'Course',
          name: 'Stage course',
          description: 'Stage description',
          url,
          provider: { '@type': 'EducationalOrganization', name: PUBLIC_FACTS.organizationName },
        },
        {
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          '@id': `${url}#phonics-program-stages`,
          itemListElement: stageUrls.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            item,
          })),
        },
      ]);

      const course = byId(nodes, getCourseEntityId(url));
      expect(course.url).toBe(url);
      expect(course.provider).toEqual({ '@id': ORGANIZATION_ID });
      expect(course.mainEntityOfPage).toEqual({ '@id': getCanonicalWebPageId(url) });

      const webpage = byId(nodes, getCanonicalWebPageId(url));
      expect(webpage.mainEntity).toEqual({ '@id': getCourseEntityId(url) });
      expect(webpage.about).toEqual({ '@id': getCourseEntityId(url) });

      const stages = byId(nodes, `${url}#phonics-program-stages`);
      for (const item of stages.itemListElement) {
        expect(item.item['@id']).toBe(getCourseEntityId(item.item.url));
      }
    }
  });

  it('keeps the best-phonics page a comparison WebPage instead of turning it into a competing Course or Service owner', () => {
    const pathName = '/best-online-phonics-classes-for-kids-in-india';
    const url = `${SITE_ORIGIN}${pathName}`;
    const nodes = enhance(pathName, [
      ...baseSchemas(url),
      {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        '@id': `${url}#decision-framework`,
        name: 'How parents compare phonics classes',
      },
    ]);

    expect(nodes.some((node) => hasType(node, 'Course') && node.url === url)).toBe(false);
    expect(nodes.some((node) => hasType(node, 'Service') && node.url === url)).toBe(false);
    const webpage = byId(nodes, getCanonicalWebPageId(url));
    expect(webpage.mainEntity).toEqual({ '@id': `${url}#decision-framework` });
    expect(webpage.mentions).toContainEqual({ '@id': PHONICS_SERVICE_ID });
  });

  it('creates a separate reading-service entity without collapsing reading into phonics', () => {
    const pathName = '/reading-classes-for-kids';
    const url = `${SITE_ORIGIN}${pathName}`;
    const nodes = enhance(pathName, baseSchemas(url));

    const service = byId(nodes, READING_SERVICE_ID);
    expect(service).toMatchObject({ '@type': 'Service', url, provider: { '@id': ORGANIZATION_ID } });
    const webpage = byId(nodes, getCanonicalWebPageId(url));
    expect(webpage.mainEntity).toEqual({ '@id': READING_SERVICE_ID });
    expect(webpage.about).toEqual({ '@id': READING_SERVICE_ID });
    expect(webpage.mentions).toContainEqual({ '@id': PHONICS_SERVICE_ID });
  });

  it('makes the curriculum roadmap the curriculum page main entity and links roadmap destinations to canonical WebPages', () => {
    const pathName = '/curriculum';
    const url = `${SITE_ORIGIN}${pathName}`;
    const nodes = enhance(pathName, [
      ...baseSchemas(url),
      {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        '@id': `${url}#program-roadmap`,
        itemListElement: ['/phonics', '/grammar', '/speaking'].map((route, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: route,
          url: `${SITE_ORIGIN}${route}`,
        })),
      },
    ]);

    const webpage = byId(nodes, getCanonicalWebPageId(url));
    expect(webpage.mainEntity).toEqual({ '@id': `${url}#program-roadmap` });
    expect(webpage.mentions).toContainEqual({ '@id': PHONICS_SERVICE_ID });
    expect(webpage.mentions).toContainEqual({ '@id': READING_SERVICE_ID });

    const roadmap = byId(nodes, `${url}#program-roadmap`);
    for (const item of roadmap.itemListElement) {
      expect(item.item['@id']).toBe(getCanonicalWebPageId(item.url));
    }
  });

  it('connects pricing OfferCatalog entries to canonical course entities instead of anonymous duplicated courses', () => {
    const pathName = '/pricing';
    const url = `${SITE_ORIGIN}${pathName}`;
    const nodes = enhance(pathName, [
      ...baseSchemas(url),
      {
        '@context': 'https://schema.org',
        '@type': 'OfferCatalog',
        name: 'Tiny Steps Course Pricing',
        itemListElement: [
          {
            '@type': 'Offer',
            price: '12400',
            priceCurrency: 'INR',
            itemOffered: { '@type': 'Course', name: 'Phonics Foundations', description: 'Foundation' },
          },
        ],
      },
    ]);

    const catalog = byId(nodes, `${url}#offer-catalog`);
    expect(catalog).toBeDefined();
    const offer = catalog.itemListElement[0];
    expect(offer.url).toBe(`${SITE_ORIGIN}/courses/phonics-foundation`);
    expect(offer.itemOffered).toMatchObject({
      '@id': `${SITE_ORIGIN}/courses/phonics-foundation#course`,
      url: `${SITE_ORIGIN}/courses/phonics-foundation`,
      provider: { '@id': ORGANIZATION_ID },
      educationalLevel: 'Foundation',
    });
    expect(byId(nodes, ORGANIZATION_ID).hasOfferCatalog).toEqual({ '@id': `${url}#offer-catalog` });
    expect(byId(nodes, getCanonicalWebPageId(url)).mainEntity).toEqual({ '@id': `${url}#offer-catalog` });
  });

  it('keeps first-party testimonial schema free of self-serving Review and AggregateRating markup', () => {
    const pathName = '/testimonials';
    const url = `${SITE_ORIGIN}${pathName}`;
    const nodes = enhance(pathName, [
      ...baseSchemas(url),
      {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        '@id': `${url}#decision-signals`,
      },
      {
        '@context': 'https://schema.org',
        '@type': 'EducationalOrganization',
        '@id': ORGANIZATION_ID,
        aggregateRating: { '@type': 'AggregateRating', ratingValue: 5, ratingCount: 10 },
        review: [{ '@type': 'Review', reviewBody: 'Self-published review' }],
      },
    ]);

    const serialized = JSON.stringify(nodes);
    expect(serialized).not.toContain('AggregateRating');
    expect(serialized).not.toContain('"Review"');
    expect(byId(nodes, getCanonicalWebPageId(url)).mainEntity).toEqual({ '@id': `${url}#decision-signals` });
  });

  it('connects only real class VideoObject nodes to the canonical class-samples collection and publisher', () => {
    const pathName = '/class-samples';
    const url = `${SITE_ORIGIN}${pathName}`;
    const nodes = enhance(pathName, [
      ...baseSchemas(url),
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'Real class samples',
        url,
        isPartOf: { '@type': 'WebSite', name: PUBLIC_FACTS.brandName, url: `${SITE_ORIGIN}/` },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: 'Tiny Steps real class samples',
        itemListElement: [],
      },
      {
        '@context': 'https://schema.org',
        '@type': 'VideoObject',
        '@id': `${url}#video-real`,
        name: 'Real video',
        thumbnailUrl: 'https://i.ytimg.com/example.jpg',
      },
    ]);

    const collection = byId(nodes, getCanonicalWebPageId(url));
    expect(types(collection)).toEqual(expect.arrayContaining(['WebPage', 'CollectionPage']));
    expect(collection.isPartOf).toEqual({ '@id': WEBSITE_ID });
    expect(collection.publisher).toEqual({ '@id': ORGANIZATION_ID });

    const video = byId(nodes, `${url}#video-real`);
    expect(video.isPartOf).toEqual({ '@id': getCanonicalWebPageId(url) });
    expect(video.publisher).toEqual({ '@id': ORGANIZATION_ID });
    expect(video.isFamilyFriendly).toBe(true);
  });

  it('closes the demo-assessment WebPage ↔ Service relationship without changing the canonical duration or zero-price offer', () => {
    const pathName = '/book-demo';
    const url = `${SITE_ORIGIN}${pathName}`;
    const serviceId = `${url}#assessment-service`;
    const nodes = enhance(pathName, [
      ...baseSchemas(url),
      {
        '@context': 'https://schema.org',
        '@type': 'Service',
        '@id': serviceId,
        name: 'Free demo assessment',
        url,
        duration: 'PT35M',
        provider: { '@type': 'EducationalOrganization', name: PUBLIC_FACTS.organizationName },
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR', url },
      },
    ]);

    const service = byId(nodes, serviceId);
    expect(service.mainEntityOfPage).toEqual({ '@id': getCanonicalWebPageId(url) });
    expect(service.provider).toEqual({ '@id': ORGANIZATION_ID });
    expect(service.duration).toBe('PT35M');
    expect(service.offers.price).toBe('0');
    expect(service.offers.seller).toEqual({ '@id': ORGANIZATION_ID });

    const webpage = byId(nodes, getCanonicalWebPageId(url));
    expect(webpage.mainEntity).toEqual({ '@id': serviceId });
  });

  it('closes BlogPosting, WebPage, Blog, publisher and organization-author references for article pages', () => {
    const pathName = '/blog/how-kids-learn-blending';
    const url = `${SITE_ORIGIN}${pathName}`;
    const articleId = `${url}#article`;
    const nodes = enhance(pathName, [
      ...baseSchemas(url),
      {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        '@id': articleId,
        headline: 'How Kids Learn Blending',
        url,
        author: { '@type': 'Organization', name: PUBLIC_FACTS.brandName, url: `${SITE_ORIGIN}/team` },
        about: [{ '@type': 'Thing', name: 'phonics blending' }],
      },
    ]);

    const article = byId(nodes, articleId);
    expect(article.publisher).toEqual({ '@id': ORGANIZATION_ID });
    expect(article.mainEntityOfPage).toEqual({ '@id': getCanonicalWebPageId(url) });
    expect(article.author['@id']).toBe(ORGANIZATION_ID);

    const webpage = byId(nodes, getCanonicalWebPageId(url));
    expect(webpage.mainEntity).toEqual({ '@id': articleId });
    expect(webpage.about).toEqual([{ '@type': 'Thing', name: 'phonics blending' }]);

    const blog = byId(nodes, BLOG_ID);
    expect(blog.publisher).toEqual({ '@id': ORGANIZATION_ID });
    expect(blog.isPartOf).toEqual({ '@id': WEBSITE_ID });
  });

  it('keeps B8 centralized, evidence-bounded and zero-route', () => {
    const seoSource = read('src/lib/seo.ts');
    const graphSource = read('src/lib/structuredDataGraph.ts');
    const routesSource = read('src/app/routes.tsx');
    const testimonialsSource = read('src/pages/TestimonialsPage.tsx');
    const classSamplesSource = read('src/pages/ClassSamplesPage.tsx');
    const bookDemoSource = read('src/pages/public/BookDemoPage.tsx');

    expect(seoSource).toContain('enhanceStructuredDataGraph');
    expect(seoSource).toContain('mergeSchemasByIdentity');
    expect(graphSource).toContain('It does not manufacture reviews, ratings');
    expect(graphSource).toContain("canonicalPath === '/phonics'");
    expect(graphSource).toContain("canonicalPath.startsWith('/blog/')");

    expect(testimonialsSource).not.toContain("'@type': 'AggregateRating'");
    expect(testimonialsSource).not.toContain("'@type': 'Review'");
    expect(classSamplesSource).toContain(".filter((video) => isValidYouTubeVideoId(video.youtubeVideoId))");
    expect(bookDemoSource).toContain('duration: `PT${FREE_DEMO_DURATION_MINUTES}M`');
    expect(bookDemoSource).not.toContain("duration: 'PT35M'");

    expect(routesSource).not.toContain("path: 'schema-entity-graph'");
    expect(routesSource).not.toContain("path: 'phonics-schema-authority'");
  });
});