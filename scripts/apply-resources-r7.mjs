import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function write(relativePath, content) {
  fs.writeFileSync(path.join(repoRoot, relativePath), content);
}

function replaceOnce(source, search, replacement, label) {
  if (!source.includes(search)) throw new Error(`R7 patch could not find ${label}`);
  return source.replace(search, replacement);
}

function replaceRegexOnce(source, regex, replacement, label) {
  const matches = source.match(regex);
  if (!matches) throw new Error(`R7 patch could not match ${label}`);
  return source.replace(regex, replacement);
}

function patchResourcesPage() {
  const file = 'src/pages/ResourcesPage.tsx';
  let source = read(file);

  source = replaceOnce(
    source,
    "import Meta from '../components/common/Meta';\nimport { getRouteConfig } from '../lib/seo';",
    "import Meta from '../components/common/Meta';\nimport KnowledgeBreadcrumbs from '../components/common/KnowledgeBreadcrumbs';\nimport { buildBreadcrumbListSchema, buildSpeakableSpecification, getBreadcrumbTrail } from '../lib/breadcrumbAeoGeoRegistry.js';\nimport { getRouteConfig } from '../lib/seo';",
    'ResourcesPage R7 imports',
  );

  source = replaceRegexOnce(
    source,
    /  const breadcrumbSchema = \{[\s\S]*?\n  \};\n\n  const pathwayListId/,
    "  const breadcrumbItems = getBreadcrumbTrail({ pathname: canonicalPath, title: 'Resources' });\n  const breadcrumbSchema = buildBreadcrumbListSchema(breadcrumbItems, SITE_ORIGIN);\n\n  const pathwayListId",
    'ResourcesPage breadcrumb schema',
  );

  source = replaceOnce(
    source,
    "    mainEntity: { '@id': pathwayListId },\n  };",
    "    mainEntity: { '@id': pathwayListId },\n    breadcrumb: { '@id': breadcrumbSchema['@id'] },\n    speakable: buildSpeakableSpecification(['.ts-answer-title', '.ts-answer-summary']),\n  };",
    'ResourcesPage CollectionPage graph',
  );

  source = replaceOnce(
    source,
    "        <div className=\"relative mx-auto max-w-7xl px-6 pb-16 pt-16 sm:pb-20 sm:pt-20 lg:pb-24 lg:pt-24\">\n          <div className=\"max-w-4xl\">",
    "        <div className=\"relative mx-auto max-w-7xl px-6 pb-16 pt-16 sm:pb-20 sm:pt-20 lg:pb-24 lg:pt-24\">\n          <KnowledgeBreadcrumbs items={breadcrumbItems} tone=\"dark\" className=\"mb-7\" />\n          <div className=\"max-w-4xl\">",
    'ResourcesPage visible breadcrumb',
  );

  source = replaceOnce(
    source,
    "            <h1 className=\"mt-6 max-w-4xl text-4xl font-black tracking-[-0.035em] text-white sm:text-5xl lg:text-[4.25rem] lg:leading-[1.02]\">",
    "            <h1 className=\"ts-answer-title mt-6 max-w-4xl text-4xl font-black tracking-[-0.035em] text-white sm:text-5xl lg:text-[4.25rem] lg:leading-[1.02]\">",
    'ResourcesPage answer title selector',
  );

  source = replaceOnce(
    source,
    "            <p className=\"mt-6 max-w-3xl text-lg leading-8 text-slate-200 sm:text-xl\">",
    "            <p className=\"ts-answer-summary mt-6 max-w-3xl text-lg leading-8 text-slate-200 sm:text-xl\">",
    'ResourcesPage answer summary selector',
  );

  write(file, source);
}

function patchSubjectResourcesPage() {
  const file = 'src/pages/SubjectResourcesPage.tsx';
  let source = read(file);

  source = replaceOnce(
    source,
    "import Meta from '../components/common/Meta';\nimport { getRouteConfig } from '../lib/seo';",
    "import Meta from '../components/common/Meta';\nimport KnowledgeBreadcrumbs from '../components/common/KnowledgeBreadcrumbs';\nimport { buildBreadcrumbListSchema, buildSpeakableSpecification, getBreadcrumbTrail } from '../lib/breadcrumbAeoGeoRegistry.js';\nimport { getRouteConfig } from '../lib/seo';",
    'SubjectResourcesPage R7 imports',
  );

  source = replaceRegexOnce(
    source,
    /  const breadcrumbSchema = \{[\s\S]*?\n  \};\n\n  const listId/,
    "  const breadcrumbItems = getBreadcrumbTrail({ pathname: config.canonicalPath, title: config.title });\n  const breadcrumbSchema = buildBreadcrumbListSchema(breadcrumbItems, SITE_ORIGIN);\n\n  const listId",
    'SubjectResourcesPage breadcrumb schema',
  );

  source = replaceOnce(
    source,
    "    mainEntity: { '@id': listId },\n  };",
    "    mainEntity: { '@id': listId },\n    breadcrumb: { '@id': breadcrumbSchema['@id'] },\n    speakable: buildSpeakableSpecification(['.ts-answer-title', '.ts-answer-summary']),\n  };",
    'SubjectResourcesPage CollectionPage graph',
  );

  source = replaceRegexOnce(
    source,
    /          <nav aria-label="Breadcrumb" className="text-sm font-semibold text-slate-300">[\s\S]*?          <\/nav>/,
    '          <KnowledgeBreadcrumbs items={breadcrumbItems} tone="dark" />',
    'SubjectResourcesPage visible breadcrumb',
  );

  source = replaceOnce(
    source,
    "            <h1 className=\"mt-4 text-4xl font-black tracking-[-0.035em] text-white sm:text-5xl lg:text-6xl\">{config.title}</h1>",
    "            <h1 className=\"ts-answer-title mt-4 text-4xl font-black tracking-[-0.035em] text-white sm:text-5xl lg:text-6xl\">{config.title}</h1>",
    'SubjectResourcesPage answer title selector',
  );

  source = replaceOnce(
    source,
    "            <p className=\"mt-6 max-w-3xl text-lg leading-8 text-slate-200\">{config.intro}</p>",
    "            <p className=\"ts-answer-summary mt-6 max-w-3xl text-lg leading-8 text-slate-200\">{config.intro}</p>",
    'SubjectResourcesPage answer summary selector',
  );

  write(file, source);
}

function patchBlogPostPage() {
  const file = 'src/pages/BlogPostPage.tsx';
  let source = read(file);

  source = replaceOnce(
    source,
    "import BlogConversionCard from '../components/blog/BlogConversionCard';\nimport ResearchArticleHero from '../components/blog/ResearchArticleHero';",
    "import BlogConversionCard from '../components/blog/BlogConversionCard';\nimport ResearchArticleHero from '../components/blog/ResearchArticleHero';\nimport KnowledgeBreadcrumbs from '../components/common/KnowledgeBreadcrumbs';\nimport { buildBreadcrumbListSchema, buildSpeakableSpecification, getBreadcrumbTrail } from '../lib/breadcrumbAeoGeoRegistry.js';",
    'BlogPostPage R7 imports',
  );

  source = replaceRegexOnce(
    source,
    /  const breadcrumbSchema = useMemo\(\(\) => \(\{[\s\S]*?  \}\), \[canonicalArticleUrl, metaSource\.title\]\);/,
    "  const breadcrumbItems = useMemo(\n    () => getBreadcrumbTrail({\n      pathname: `/blog/${slug || metaSource.slug || ''}`,\n      title: metaSource.title || 'Article',\n      category: metaSource.category,\n    }),\n    [metaSource.category, metaSource.slug, metaSource.title, slug],\n  );\n\n  const breadcrumbSchema = useMemo(\n    () => buildBreadcrumbListSchema(breadcrumbItems, SITE_ORIGIN),\n    [breadcrumbItems],\n  );",
    'BlogPostPage breadcrumb resolver',
  );

  source = replaceOnce(
    source,
    "    const externalCitations = post ? extractExternalCitationUrls(post) : [];\n    const obj: any = {",
    "    const externalCitations = post ? extractExternalCitationUrls(post) : [];\n    const quickAnswer = metaSource.metaDescription || metaSource.excerpt || buildMetaDescription(metaSource);\n    const obj: any = {",
    'BlogPostPage quick answer schema source',
  );

  source = replaceOnce(
    source,
    "      description: buildMetaDescription(metaSource) || undefined,\n      articleSection: authority.discoveryCategory,",
    "      description: buildMetaDescription(metaSource) || undefined,\n      abstract: quickAnswer || undefined,\n      articleSection: authority.discoveryCategory,",
    'BlogPostPage BlogPosting abstract',
  );

  source = replaceRegexOnce(
    source,
    /    \/\/ Speakable schema for voice search \+ assistant integrations[\s\S]*?    \}\n\n    return obj;/,
    "    obj.speakable = buildSpeakableSpecification(['.ts-answer-title', '.ts-answer-summary']) || undefined;\n\n    return obj;",
    'BlogPostPage speakable block',
  );

  source = replaceOnce(
    source,
    "  const faqSchema = useMemo(() => {",
    "  const webPageSchema = useMemo(() => {\n    const articleSlug = metaSource.slug || slug || '';\n    if (!articleSlug || !metaSource.title) return null;\n    const authorityPost = {\n      slug: articleSlug,\n      category: metaSource.category || 'Parent Tips',\n      audience: metaSource.audience,\n      discoveryCategory: metaSource.discoveryCategory,\n    };\n    const quickAnswer = metaSource.metaDescription || metaSource.excerpt || buildMetaDescription(metaSource);\n\n    return {\n      '@context': 'https://schema.org',\n      '@type': 'WebPage',\n      '@id': getBlogWebPageId(articleSlug),\n      url: canonicalArticleUrl,\n      name: metaSource.title,\n      description: buildMetaDescription(metaSource) || undefined,\n      abstract: quickAnswer || undefined,\n      inLanguage: 'en-IN',\n      isPartOf: { '@id': BLOG_ID },\n      publisher: { '@id': ORGANIZATION_ID },\n      mainEntity: { '@id': getBlogArticleId(articleSlug) },\n      breadcrumb: { '@id': breadcrumbSchema['@id'] },\n      about: buildBlogAboutSchema(authorityPost),\n      speakable: buildSpeakableSpecification(['.ts-answer-title', '.ts-answer-summary']),\n    };\n  }, [breadcrumbSchema, canonicalArticleUrl, metaSource, slug]);\n\n  const faqSchema = useMemo(() => {",
    'BlogPostPage WebPage schema',
  );

  source = replaceOnce(
    source,
    "    blocks.push(breadcrumbSchema);\n    if (articleSchema) blocks.push(articleSchema);\n    if (faqSchema) blocks.push(faqSchema);\n    return blocks;\n  }, [breadcrumbSchema, articleSchema, faqSchema]);",
    "    blocks.push(breadcrumbSchema);\n    if (webPageSchema) blocks.push(webPageSchema);\n    if (articleSchema) blocks.push(articleSchema);\n    if (faqSchema) blocks.push(faqSchema);\n    return blocks;\n  }, [breadcrumbSchema, webPageSchema, articleSchema, faqSchema]);",
    'BlogPostPage JSON-LD graph',
  );

  source = replaceOnce(
    source,
    "            <div>\n              <Link to=\"/blog\" className=\"inline-flex items-center text-sm font-semibold text-primary-700\">← Back to Blogs</Link>\n            </div>",
    "            <KnowledgeBreadcrumbs items={breadcrumbItems} tone=\"light\" />",
    'BlogPostPage visible breadcrumb',
  );

  source = replaceOnce(
    source,
    "              <h2 className=\"ts-blog-hero-title mt-3 text-2xl font-black tracking-tight text-slate-950 sm:text-4xl\">",
    "              <h2 className=\"ts-answer-title ts-blog-hero-title mt-3 text-2xl font-black tracking-tight text-slate-950 sm:text-4xl\">",
    'BlogPostPage visible answer title selector',
  );

  source = replaceOnce(
    source,
    "              <p className=\"ts-blog-quick-answer mt-4 max-w-4xl text-lg leading-8 text-slate-700\">",
    "              <p className=\"ts-answer-summary ts-blog-quick-answer mt-4 max-w-4xl text-lg leading-8 text-slate-700\">",
    'BlogPostPage visible answer summary selector',
  );

  write(file, source);
}

patchResourcesPage();
patchSubjectResourcesPage();
patchBlogPostPage();
console.log('Applied Resources R7 integration patch.');
