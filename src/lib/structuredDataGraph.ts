import {
  FOUNDER_ID,
  ORGANIZATION_ID,
  PUBLIC_FACTS,
  SITE_ORIGIN,
  WEBSITE_ID,
} from './schemas';
import { PUBLIC_COURSE_PAGE_CONFIGS } from './publicCoursePages.js';

export const PHONICS_SERVICE_ID = `${SITE_ORIGIN}/phonics#service`;
export const READING_SERVICE_ID = `${SITE_ORIGIN}/reading-classes-for-kids#service`;
export const BLOG_ID = `${SITE_ORIGIN}/blog#blog`;

const PHONICS_COURSE_PATHS = new Set([
  '/courses/phonics-foundation',
  '/courses/phonics-brush-up',
  '/courses/phonics-advanced',
]);

const PHONICS_COURSE_CONFIGS = (PUBLIC_COURSE_PAGE_CONFIGS as any[]).filter((course) =>
  PHONICS_COURSE_PATHS.has(String(course.routePath || '')),
);

const PUBLIC_COURSE_BY_PATH = new Map(
  (PUBLIC_COURSE_PAGE_CONFIGS as any[]).map((course) => [String(course.routePath || ''), course]),
);

const PUBLIC_COURSE_BY_NAME = new Map(
  (PUBLIC_COURSE_PAGE_CONFIGS as any[]).map((course) => [normalizeName(course.name), course]),
);

function normalizeName(value: unknown): string {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function schemaTypes(node: any): string[] {
  const type = node?.['@type'];
  if (typeof type === 'string') return [type];
  return Array.isArray(type) ? type.filter((item): item is string => typeof item === 'string') : [];
}

function hasType(node: any, type: string): boolean {
  return schemaTypes(node).includes(type);
}

function uniqueJsonValues(values: any[]): any[] {
  const seen = new Set<string>();
  const result: any[] = [];
  for (const value of values) {
    const key = typeof value === 'string' ? `s:${value}` : `j:${JSON.stringify(value)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(value);
  }
  return result;
}

function mergeTypes(left: unknown, right: unknown): string | string[] | undefined {
  const values = uniqueJsonValues([
    ...(typeof left === 'string' ? [left] : Array.isArray(left) ? left : []),
    ...(typeof right === 'string' ? [right] : Array.isArray(right) ? right : []),
  ].filter((value): value is string => typeof value === 'string'));
  if (values.length === 0) return undefined;
  return values.length === 1 ? values[0] : values;
}

function mergeSchemaObjects(base: any, incoming: any): any {
  if (!base || typeof base !== 'object' || Array.isArray(base)) return incoming;
  if (!incoming || typeof incoming !== 'object' || Array.isArray(incoming)) return incoming;

  const merged: Record<string, any> = { ...base };
  for (const [key, value] of Object.entries(incoming)) {
    if (value === undefined) continue;

    if (key === '@type') {
      merged[key] = mergeTypes(merged[key], value);
      continue;
    }

    if (Array.isArray(value)) {
      merged[key] = Array.isArray(merged[key])
        ? uniqueJsonValues([...merged[key], ...value])
        : value;
      continue;
    }

    if (
      value &&
      typeof value === 'object' &&
      merged[key] &&
      typeof merged[key] === 'object' &&
      !Array.isArray(merged[key])
    ) {
      merged[key] = mergeSchemaObjects(merged[key], value);
      continue;
    }

    merged[key] = value;
  }
  return merged;
}

/**
 * Merge top-level JSON-LD nodes that share an @id instead of discarding the
 * richer later node. Nodes without @id are deduplicated only when identical.
 */
export function mergeSchemasByIdentity(schemas: any[]): any[] {
  const result: any[] = [];
  const byId = new Map<string, number>();
  const anonymous = new Set<string>();

  for (const schema of schemas.filter(Boolean)) {
    const id = typeof schema?.['@id'] === 'string' ? schema['@id'] : '';
    if (id) {
      const existingIndex = byId.get(id);
      if (existingIndex === undefined) {
        byId.set(id, result.length);
        result.push(schema);
      } else {
        result[existingIndex] = mergeSchemaObjects(result[existingIndex], schema);
      }
      continue;
    }

    const key = JSON.stringify(schema);
    if (anonymous.has(key)) continue;
    anonymous.add(key);
    result.push(schema);
  }

  return result;
}

export function getCanonicalWebPageId(url: string): string {
  return `${url}#webpage`;
}

export function getCourseEntityId(url: string): string {
  return `${url}#course`;
}

function organizationRef() {
  return { '@id': ORGANIZATION_ID };
}

function websiteRef() {
  return { '@id': WEBSITE_ID };
}

function webpageRef(url: string) {
  return { '@id': getCanonicalWebPageId(url) };
}

function serviceRef(id: string) {
  return { '@id': id };
}

function courseRef(url: string) {
  return { '@id': getCourseEntityId(url) };
}

function absoluteUrl(path: string): string {
  return path === '/' ? `${SITE_ORIGIN}/` : `${SITE_ORIGIN}${path}`;
}

function upsertById(nodes: any[], incoming: any): any {
  const id = incoming?.['@id'];
  if (!id) {
    nodes.push(incoming);
    return incoming;
  }

  const index = nodes.findIndex((node) => node?.['@id'] === id);
  if (index === -1) {
    nodes.push(incoming);
    return incoming;
  }

  nodes[index] = mergeSchemaObjects(nodes[index], incoming);
  return nodes[index];
}

function findById(nodes: any[], id: string): any | undefined {
  return nodes.find((node) => node?.['@id'] === id);
}

function findFirstType(nodes: any[], type: string): any | undefined {
  return nodes.find((node) => hasType(node, type));
}

function normalizeKnownEntityReferences(node: any): any {
  if (Array.isArray(node)) return node.map(normalizeKnownEntityReferences);
  if (!node || typeof node !== 'object') return node;

  const normalized: Record<string, any> = {};
  for (const [key, value] of Object.entries(node)) {
    normalized[key] = normalizeKnownEntityReferences(value);
  }

  const types = schemaTypes(normalized);
  const name = normalizeName(normalized.name);
  const founderNames = new Set(
    [
      PUBLIC_FACTS.founder.displayName,
      PUBLIC_FACTS.founder.fullName,
      ...PUBLIC_FACTS.founder.alternateNames,
    ].map(normalizeName),
  );

  if (
    (types.includes('Organization') || types.includes('EducationalOrganization')) &&
    (name === normalizeName(PUBLIC_FACTS.organizationName) ||
      name === normalizeName(PUBLIC_FACTS.brandName) ||
      name === normalizeName(PUBLIC_FACTS.shortBrandName))
  ) {
    normalized['@id'] = ORGANIZATION_ID;
    normalized.url = `${SITE_ORIGIN}/`;
  }

  if (types.includes('WebSite') && name === normalizeName(PUBLIC_FACTS.brandName)) {
    normalized['@id'] = WEBSITE_ID;
    normalized.url = SITE_ORIGIN;
  }

  if (types.includes('Person') && founderNames.has(name)) {
    normalized['@id'] = FOUNDER_ID;
  }

  if (types.includes('Course') && typeof normalized.url === 'string' && normalized.url.startsWith(SITE_ORIGIN)) {
    normalized['@id'] = normalized['@id'] || getCourseEntityId(normalized.url);
    normalized.provider = mergeSchemaObjects(normalized.provider || {}, organizationRef());
  }

  if (types.includes('Service') && typeof normalized.url === 'string' && normalized.url.startsWith(SITE_ORIGIN)) {
    normalized['@id'] = normalized['@id'] || `${normalized.url}#service`;
    normalized.provider = mergeSchemaObjects(normalized.provider || {}, organizationRef());
  }

  return normalized;
}

function addStablePageIds(nodes: any[], canonicalUrl: string) {
  for (const node of nodes) {
    if (hasType(node, 'BreadcrumbList') && !node['@id']) {
      node['@id'] = `${canonicalUrl}#breadcrumb`;
    }
    if (hasType(node, 'FAQPage') && !node['@id']) {
      node['@id'] = `${canonicalUrl}#faq`;
    }
  }
}

function ensureWebPage(
  nodes: any[],
  canonicalUrl: string,
  title: string,
  description?: string,
) {
  const id = getCanonicalWebPageId(canonicalUrl);
  return upsertById(nodes, {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': id,
    name: title,
    url: canonicalUrl,
    ...(description ? { description } : {}),
    isPartOf: websiteRef(),
    publisher: organizationRef(),
    inLanguage: 'en-IN',
  });
}

function buildCanonicalCourseNode(course: any) {
  const url = absoluteUrl(course.routePath);
  return {
    '@type': 'Course',
    '@id': getCourseEntityId(url),
    name: course.name,
    description: course.description,
    url,
    provider: organizationRef(),
    educationalLevel: course.educationalLevel,
    ...(Array.isArray(course.teaches) && course.teaches.length ? { teaches: course.teaches } : {}),
    audience: {
      '@type': 'EducationalAudience',
      educationalRole: 'student',
      audienceType: 'Children',
    },
    inLanguage: 'en-IN',
    isAccessibleForFree: false,
  };
}

function enhancePhonics(nodes: any[], canonicalUrl: string, webpage: any) {
  for (let index = nodes.length - 1; index >= 0; index -= 1) {
    const node = nodes[index];
    if (hasType(node, 'Course') && node.url === canonicalUrl) {
      nodes.splice(index, 1);
    }
  }

  const phonicsService = upsertById(nodes, {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': PHONICS_SERVICE_ID,
    name: 'Tiny Steps Phonics Programme',
    description:
      'Live online phonics teaching for children, with assessment-led placement across Foundation, Early, and Advanced Phonics stages.',
    serviceType: 'Live online phonics classes for children',
    url: canonicalUrl,
    provider: organizationRef(),
    areaServed: ['India', 'Worldwide online'],
    audience: {
      '@type': 'EducationalAudience',
      educationalRole: 'student',
      audienceType: 'Children ages 3–12',
    },
    subjectOf: webpageRef(canonicalUrl),
  });

  const courseList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    '@id': `${canonicalUrl}#courses`,
    name: 'Tiny Steps phonics course stages',
    numberOfItems: PHONICS_COURSE_CONFIGS.length,
    itemListOrder: 'https://schema.org/ItemListOrderAscending',
    itemListElement: PHONICS_COURSE_CONFIGS.map((course, index) => {
      const courseNode = buildCanonicalCourseNode(course);
      courseNode.mainEntityOfPage = webpageRef(courseNode.url);
      return {
        '@type': 'ListItem',
        position: index + 1,
        url: courseNode.url,
        item: courseNode,
      };
    }),
  };
  upsertById(nodes, courseList);

  webpage.mainEntity = serviceRef(phonicsService['@id']);
  webpage.about = serviceRef(phonicsService['@id']);
  webpage.mentions = PHONICS_COURSE_CONFIGS.map((course) =>
    courseRef(absoluteUrl(course.routePath)),
  );
}

function enhancePhonicsCourse(nodes: any[], canonicalPath: string, canonicalUrl: string, webpage: any) {
  const config = PUBLIC_COURSE_BY_PATH.get(canonicalPath);
  if (!config) return;

  let course = nodes.find((node) => hasType(node, 'Course') && node.url === canonicalUrl);
  if (!course) {
    course = buildCanonicalCourseNode(config);
    nodes.push(course);
  }

  course['@id'] = getCourseEntityId(canonicalUrl);
  course.url = canonicalUrl;
  course.provider = organizationRef();
  course.mainEntityOfPage = webpageRef(canonicalUrl);
  if (!course.educationalLevel) course.educationalLevel = config.educationalLevel;
  if (!course.teaches && Array.isArray(config.teaches)) course.teaches = config.teaches;

  webpage.mainEntity = courseRef(canonicalUrl);
  webpage.about = courseRef(canonicalUrl);

  const stageList = nodes.find((node) => node?.['@id'] === `${canonicalUrl}#phonics-program-stages`);
  if (Array.isArray(stageList?.itemListElement)) {
    stageList.itemListElement = stageList.itemListElement.map((entry: any) => {
      const itemUrl = typeof entry.item === 'string' ? entry.item : entry?.item?.url;
      if (!itemUrl || !itemUrl.startsWith(SITE_ORIGIN)) return entry;
      return {
        ...entry,
        url: entry.url || itemUrl,
        item: {
          '@id': getCourseEntityId(itemUrl),
          url: itemUrl,
        },
      };
    });
  }
}

function enhanceComparisonPage(nodes: any[], canonicalUrl: string, webpage: any) {
  const decisionFrameworkId = `${canonicalUrl}#decision-framework`;
  if (findById(nodes, decisionFrameworkId)) {
    webpage.mainEntity = { '@id': decisionFrameworkId };
  }
  webpage.mentions = uniqueJsonValues([
    ...(Array.isArray(webpage.mentions) ? webpage.mentions : []),
    serviceRef(PHONICS_SERVICE_ID),
  ]);
}

function enhanceReading(nodes: any[], canonicalUrl: string, webpage: any) {
  const readingService = upsertById(nodes, {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': READING_SERVICE_ID,
    name: 'Tiny Steps Reading Support Programme',
    description:
      'Live online reading support for children across decoding, accurate word reading, fluency, vocabulary, comprehension, and reading confidence.',
    serviceType: 'Live online reading classes for children',
    url: canonicalUrl,
    provider: organizationRef(),
    areaServed: ['India', 'Worldwide online'],
    audience: {
      '@type': 'EducationalAudience',
      educationalRole: 'student',
      audienceType: 'Children ages 3–12',
    },
    subjectOf: webpageRef(canonicalUrl),
  });

  webpage.mainEntity = serviceRef(readingService['@id']);
  webpage.about = serviceRef(readingService['@id']);
  webpage.mentions = uniqueJsonValues([
    ...(Array.isArray(webpage.mentions) ? webpage.mentions : []),
    serviceRef(PHONICS_SERVICE_ID),
  ]);
}

function enhanceCurriculum(nodes: any[], canonicalUrl: string, webpage: any) {
  const roadmapId = `${canonicalUrl}#program-roadmap`;
  const roadmap = findById(nodes, roadmapId);
  if (roadmap) {
    webpage.mainEntity = { '@id': roadmapId };
    if (Array.isArray(roadmap.itemListElement)) {
      roadmap.itemListElement = roadmap.itemListElement.map((entry: any) => {
        const url = entry?.url;
        if (typeof url !== 'string' || !url.startsWith(SITE_ORIGIN)) return entry;
        return {
          ...entry,
          item: {
            '@id': getCanonicalWebPageId(url),
            url,
          },
        };
      });
    }
  }

  webpage.mentions = uniqueJsonValues([
    ...(Array.isArray(webpage.mentions) ? webpage.mentions : []),
    serviceRef(PHONICS_SERVICE_ID),
    serviceRef(READING_SERVICE_ID),
  ]);
}

function enhancePricing(nodes: any[], canonicalUrl: string, webpage: any) {
  const catalog = findFirstType(nodes, 'OfferCatalog');
  if (!catalog) return;

  catalog['@id'] = catalog['@id'] || `${canonicalUrl}#offer-catalog`;
  if (Array.isArray(catalog.itemListElement)) {
    catalog.itemListElement = catalog.itemListElement.map((offer: any) => {
      const itemOffered = offer?.itemOffered;
      if (!itemOffered || !hasType(itemOffered, 'Course')) return offer;

      const config = PUBLIC_COURSE_BY_NAME.get(normalizeName(itemOffered.name));
      if (!config) {
        return {
          ...offer,
          itemOffered: {
            ...itemOffered,
            provider: organizationRef(),
          },
        };
      }

      const courseUrl = absoluteUrl(config.routePath);
      return {
        ...offer,
        url: offer.url || courseUrl,
        itemOffered: {
          ...itemOffered,
          '@id': getCourseEntityId(courseUrl),
          url: courseUrl,
          provider: organizationRef(),
          educationalLevel: config.educationalLevel,
        },
      };
    });
  }

  webpage.mainEntity = { '@id': catalog['@id'] };
  const organization = findById(nodes, ORGANIZATION_ID);
  if (organization) organization.hasOfferCatalog = { '@id': catalog['@id'] };
}

function stripSelfServingReviewMarkup(node: any): any | undefined {
  if (Array.isArray(node)) {
    return node
      .map(stripSelfServingReviewMarkup)
      .filter((value) => value !== undefined);
  }
  if (!node || typeof node !== 'object') return node;
  if (hasType(node, 'Review') || hasType(node, 'AggregateRating')) return undefined;

  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(node)) {
    if (key === 'review' || key === 'aggregateRating') continue;
    const next = stripSelfServingReviewMarkup(value);
    if (next !== undefined) result[key] = next;
  }
  return result;
}

function enhanceTestimonials(nodes: any[], canonicalUrl: string, webpage: any): any[] {
  const decisionSignalsId = `${canonicalUrl}#decision-signals`;
  if (findById(nodes, decisionSignalsId)) webpage.mainEntity = { '@id': decisionSignalsId };
  return nodes
    .map(stripSelfServingReviewMarkup)
    .filter((node): node is Record<string, any> => node !== undefined);
}

function enhanceClassSamples(nodes: any[], canonicalUrl: string, webpage: any) {
  const collection = findFirstType(nodes, 'CollectionPage');
  if (collection) {
    collection['@id'] = getCanonicalWebPageId(canonicalUrl);
    collection['@type'] = mergeTypes(collection['@type'], 'WebPage');
    collection.url = canonicalUrl;
    collection.isPartOf = websiteRef();
    collection.publisher = organizationRef();
  }

  const videoList = nodes.find(
    (node) => hasType(node, 'ItemList') && normalizeName(node.name) === 'tiny steps real class samples',
  );
  if (videoList && !videoList['@id']) videoList['@id'] = `${canonicalUrl}#video-list`;
  if (videoList?.['@id']) webpage.mainEntity = { '@id': videoList['@id'] };

  for (const node of nodes) {
    if (!hasType(node, 'VideoObject')) continue;
    node.isPartOf = webpageRef(canonicalUrl);
    node.publisher = organizationRef();
    node.isFamilyFriendly = true;
  }

  webpage.mentions = uniqueJsonValues([
    ...(Array.isArray(webpage.mentions) ? webpage.mentions : []),
    serviceRef(PHONICS_SERVICE_ID),
    serviceRef(READING_SERVICE_ID),
  ]);
}

function enhanceBookDemo(nodes: any[], canonicalUrl: string, webpage: any) {
  const serviceId = `${canonicalUrl}#assessment-service`;
  const service = findById(nodes, serviceId) || nodes.find((node) => hasType(node, 'Service'));
  if (!service) return;

  service['@id'] = serviceId;
  service.url = canonicalUrl;
  service.provider = organizationRef();
  service.mainEntityOfPage = webpageRef(canonicalUrl);
  if (service.offers && typeof service.offers === 'object') {
    service.offers.seller = organizationRef();
  }

  webpage.mainEntity = { '@id': serviceId };
  webpage.about = { '@id': serviceId };
}

function enhanceBlog(nodes: any[], canonicalUrl: string, webpage: any) {
  const article = findFirstType(nodes, 'BlogPosting');
  if (!article) return;

  article.mainEntityOfPage = webpageRef(canonicalUrl);
  article.publisher = organizationRef();
  webpage.mainEntity = { '@id': article['@id'] || `${canonicalUrl}#article` };
  if (article.about) webpage.about = article.about;

  upsertById(nodes, {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    '@id': BLOG_ID,
    name: 'Tiny Steps Learning Blog',
    url: `${SITE_ORIGIN}/blog`,
    isPartOf: websiteRef(),
    publisher: organizationRef(),
    inLanguage: 'en-IN',
  });
}

export type StructuredDataGraphInput = {
  canonicalPath: string;
  canonicalUrl: string;
  title: string;
  description?: string;
  schemas: any[];
};

/**
 * B8 structured-data authority layer.
 *
 * The function deliberately strengthens relationships between schemas that
 * pages already justify. It does not manufacture reviews, ratings,
 * credentials, outcomes, videos, prices, courses, or new public URLs.
 */
export function enhanceStructuredDataGraph({
  canonicalPath,
  canonicalUrl,
  title,
  description,
  schemas,
}: StructuredDataGraphInput): any[] {
  let nodes = schemas.map((schema) => normalizeKnownEntityReferences(schema));
  nodes = mergeSchemasByIdentity(nodes);
  addStablePageIds(nodes, canonicalUrl);
  const webpage = ensureWebPage(nodes, canonicalUrl, title, description);

  if (canonicalPath === '/phonics') {
    enhancePhonics(nodes, canonicalUrl, webpage);
  } else if (PHONICS_COURSE_PATHS.has(canonicalPath)) {
    enhancePhonicsCourse(nodes, canonicalPath, canonicalUrl, webpage);
  } else if (canonicalPath === '/best-online-phonics-classes-for-kids-in-india') {
    enhanceComparisonPage(nodes, canonicalUrl, webpage);
  } else if (canonicalPath === '/reading-classes-for-kids') {
    enhanceReading(nodes, canonicalUrl, webpage);
  } else if (canonicalPath === '/curriculum') {
    enhanceCurriculum(nodes, canonicalUrl, webpage);
  } else if (canonicalPath === '/pricing') {
    enhancePricing(nodes, canonicalUrl, webpage);
  } else if (canonicalPath === '/testimonials') {
    nodes = enhanceTestimonials(nodes, canonicalUrl, webpage);
  } else if (canonicalPath === '/class-samples') {
    enhanceClassSamples(nodes, canonicalUrl, webpage);
  } else if (canonicalPath === '/book-demo') {
    enhanceBookDemo(nodes, canonicalUrl, webpage);
  } else if (canonicalPath.startsWith('/blog/')) {
    enhanceBlog(nodes, canonicalUrl, webpage);
  }

  return mergeSchemasByIdentity(nodes);
}
