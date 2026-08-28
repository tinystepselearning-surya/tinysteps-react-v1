from pathlib import Path

path = Path('src/pages/BlogPostPage.tsx')
source = path.read_text()


def replace_once(old: str, new: str, label: str) -> None:
    global source
    count = source.count(old)
    if count != 1:
        raise RuntimeError(f'{label}: expected exactly 1 match, found {count}')
    source = source.replace(old, new, 1)


replace_once(
    """} from '../content/blog/shared/technicalAuthority';\nimport { ORGANIZATION_ID, PUBLIC_FACTS, SITE_ORIGIN } from '../lib/schemas';\nimport AboutAuthor from '../components/AboutAuthor';\nimport ParentsAlsoAsk from '../components/ParentsAlsoAsk';\nimport ResearchArticleHero from '../components/blog/ResearchArticleHero';\n""",
    """} from '../content/blog/shared/technicalAuthority';\nimport { getBlogConversionConfig } from '../content/blog/shared/conversionFamilies';\nimport { ORGANIZATION_ID, PUBLIC_FACTS, SITE_ORIGIN } from '../lib/schemas';\nimport { buildBlogDemoPath, captureBlogArticleContext, captureBlogCtaContext } from '../lib/blogLeadAttribution';\nimport { trackBlogArticleView, trackBlogCtaClick, trackBlogProgramClick } from '../lib/blogConversionTracking';\nimport AboutAuthor from '../components/AboutAuthor';\nimport ParentsAlsoAsk from '../components/ParentsAlsoAsk';\nimport BlogConversionCard from '../components/blog/BlogConversionCard';\nimport ResearchArticleHero from '../components/blog/ResearchArticleHero';\n""",
    'B11 imports',
)

replace_once(
    """};\n\nconst POST_CTA_OVERRIDES: Record<string, {\n""",
    """};\n\nconst SCHOOL_RESEARCH_SEARCH_PAIN_POINTS = [\n  'How can our school implement phonics consistently across classrooms?',\n  'How should teachers assess decoding rather than memorisation?',\n  'What support helps teachers apply a structured literacy progression?',\n  'How can we turn research guidance into a practical school routine?',\n];\n\nconst SCHOOL_RESEARCH_HERO_POINTS = [\n  {\n    label: 'Best for',\n    value: 'School literacy implementation',\n    detail: 'For school leaders and teachers planning structured phonics, decoding assessment, and classroom progression.',\n  },\n  {\n    label: 'Use this when',\n    value: 'Consistency matters across classrooms',\n    detail: 'Useful when a school needs a shared instructional route rather than isolated activities or one-off training.',\n  },\n  {\n    label: 'Next best route',\n    value: 'Tiny Steps for Schools',\n    detail: 'Continue to the school partnership route for implementation support, teacher development, and program planning.',\n  },\n];\n\nconst SCHOOL_RESEARCH_SIDEBAR = {\n  sidebarTitle: 'Planning a school implementation?',\n  sidebarDescription:\n    'Explore school partnership support, teacher implementation, and a direct contact route for your leadership team.',\n  sidebarLinks: [\n    { label: 'Explore Tiny Steps for Schools', to: '/for-schools' },\n    { label: 'Contact Tiny Steps about your school', to: '/contact' },\n  ],\n};\n\nconst POST_CTA_OVERRIDES: Record<string, {\n""",
    'school conversion fallback content',
)

start = source.index("const PHONICS_ROUTE = {")
end = source.index("function buildHeadingMeta(", start)
source = source[:start] + source[end:]

replace_once(
    """  const evidenceSummary = useMemo(\n    () => (post ? getBlogEvidenceSummary(post) : null),\n    [post],\n  );\n\nfunction buildMetaDescription(src: any) {\n""",
    """  const evidenceSummary = useMemo(\n    () => (post ? getBlogEvidenceSummary(post) : null),\n    [post],\n  );\n  const blogConversionConfig = useMemo(\n    () => (post ? getBlogConversionConfig(post) : null),\n    [post],\n  );\n\nfunction buildMetaDescription(src: any) {\n""",
    'conversion config hook',
)

replace_once(
    """  }, [articleAuthor, slug, metaSource, jsonLd, breadcrumbSchema, post]);\n\n  const categoryConfig = CATEGORY_ARTICLE_CONFIG[metaSource.category] || CATEGORY_ARTICLE_CONFIG['Parent Tips'];\n""",
    """  }, [articleAuthor, slug, metaSource, jsonLd, breadcrumbSchema, post]);\n\n  useEffect(() => {\n    if (!post || !slug || !blogConversionConfig) return;\n    captureBlogArticleContext({\n      slug,\n      family: blogConversionConfig.family,\n      intentCluster: blogConversionConfig.intentCluster,\n      path: `/blog/${slug}`,\n    });\n    trackBlogArticleView({\n      article_slug: slug,\n      conversion_family: blogConversionConfig.family,\n      intent_cluster: blogConversionConfig.intentCluster,\n      authority_cluster: blogConversionConfig.authorityCluster,\n      program: blogConversionConfig.program,\n    });\n  }, [blogConversionConfig, post, slug]);\n\n  const categoryConfig = CATEGORY_ARTICLE_CONFIG[metaSource.category] || CATEGORY_ARTICLE_CONFIG['Parent Tips'];\n""",
    'article conversion capture',
)

replace_once(
    """  const primaryAction = postCtaOverride?.primaryAction || categoryConfig.primaryAction;\n  const learningPathIntro = postCtaOverride?.learningPathIntro || categoryConfig.learningPathIntro;\n  const weekMatch = String(metaSource.title || '').match(/^Week\\s+(\\d+)/i);\n""",
    """  const primaryAction = postCtaOverride?.primaryAction || categoryConfig.primaryAction;\n  const isSchoolConversion = blogConversionConfig?.family === 'schools-partnership';\n  const weekMatch = String(metaSource.title || '').match(/^Week\\s+(\\d+)/i);\n""",
    'school conversion flag',
)

replace_once(
    """  const heroSearchPainPoints =\n    Array.isArray(post?.faq) && post.faq.length > 0\n      ? post.faq.slice(0, 4).map((item) => item.question)\n      : categoryConfig.searchPainPoints;\n""",
    """  const heroSearchPainPoints =\n    Array.isArray(post?.faq) && post.faq.length > 0\n      ? post.faq.slice(0, 4).map((item) => item.question)\n      : isSchoolConversion\n        ? SCHOOL_RESEARCH_SEARCH_PAIN_POINTS\n        : categoryConfig.searchPainPoints;\n""",
    'audience-aware search pain points',
)

replace_once(
    """  const heroDescription = metaSource.metaDescription || metaSource.excerpt || buildMetaDescription(metaSource);\n  const nextStepPrimaryRoute = useMemo(\n    () => resolveNextStepRoute({ category: metaSource.category, slug, title: metaSource.title }),\n    [metaSource.category, metaSource.title, slug],\n  );\n  const headingItems = useMemo(() => buildHeadingMeta(post?.body || []), [post]);\n""",
    """  const heroDescription = metaSource.metaDescription || metaSource.excerpt || buildMetaDescription(metaSource);\n  const sidebarConfig = isSchoolConversion ? SCHOOL_RESEARCH_SIDEBAR : categoryConfig;\n  const recommendedPrimaryAction = isSchoolConversion\n    ? blogConversionConfig?.primaryAction\n    : blogConversionConfig?.secondaryAction || primaryAction;\n\n  const buildTrackedHeroAction = (action: any, variant?: 'primary' | 'secondary') => {\n    if (!action || !slug || !blogConversionConfig) return null;\n    const destinationPath = action.kind === 'demo'\n      ? buildBlogDemoPath({ slug, family: blogConversionConfig.family, ctaPosition: 'hero' })\n      : action.to;\n    return {\n      label: action.label,\n      to: destinationPath,\n      variant,\n      onClick: () => {\n        captureBlogCtaContext({\n          slug,\n          family: blogConversionConfig.family,\n          intentCluster: blogConversionConfig.intentCluster,\n          ctaLabel: action.label,\n          ctaPosition: 'hero',\n          destinationPath,\n        });\n        const event = {\n          article_slug: slug,\n          conversion_family: blogConversionConfig.family,\n          intent_cluster: blogConversionConfig.intentCluster,\n          authority_cluster: blogConversionConfig.authorityCluster,\n          program: blogConversionConfig.program,\n          cta_position: 'hero',\n          cta_label: action.label,\n          destination_path: destinationPath,\n        };\n        trackBlogCtaClick(event);\n        if (action.kind === 'program' || action.kind === 'schools') trackBlogProgramClick(event);\n      },\n    };\n  };\n\n  const heroActions = blogConversionConfig\n    ? (isSchoolConversion\n      ? [\n          buildTrackedHeroAction(blogConversionConfig.primaryAction),\n          buildTrackedHeroAction(blogConversionConfig.secondaryAction, 'secondary'),\n        ]\n      : [\n          buildTrackedHeroAction(blogConversionConfig.secondaryAction || blogConversionConfig.primaryAction),\n          blogConversionConfig.secondaryAction\n            ? buildTrackedHeroAction(blogConversionConfig.primaryAction, 'secondary')\n            : null,\n        ]).filter(Boolean)\n    : [primaryAction, categoryConfig.secondaryAction];\n\n  const headingItems = useMemo(() => buildHeadingMeta(post?.body || []), [post]);\n""",
    'hero conversion routing',
)

replace_once(
    """        actions={[primaryAction, categoryConfig.secondaryAction]}\n        searchPainPoints={heroSearchPainPoints}\n        heroPoints={categoryConfig.heroPoints}\n""",
    """        actions={heroActions}\n        searchPainPoints={heroSearchPainPoints}\n        searchLabel={isSchoolConversion ? 'Schools often ask' : 'Parents often search'}\n        heroPoints={isSchoolConversion ? SCHOOL_RESEARCH_HERO_POINTS : categoryConfig.heroPoints}\n""",
    'hero rendering',
)

old_dark = """            <section className=\"rounded-[2rem] border border-slate-200 bg-[linear-gradient(135deg,#101828,#1b2a46)] px-6 py-8 text-white shadow-[0_28px_80px_rgba(15,23,42,0.18)] sm:px-8\">\n              <div className=\"grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-center\">\n                <div>\n                  <p className=\"text-xs font-semibold uppercase tracking-[0.24em] text-sky-100\">Continue with Tiny Steps learning paths</p>\n                  <h2 className=\"mt-3 text-3xl font-black tracking-tight\">Turn this article into a clearer next step</h2>\n                  <p className=\"mt-3 max-w-2xl text-sm leading-7 text-slate-200\">\n                    {learningPathIntro || 'Choose a program aligned to your child&apos;s current stage and next learning goal.'}\n                  </p>\n                </div>\n                <div className=\"flex flex-wrap gap-3 lg:justify-end\">\n                  {learningPathLinks.map((link, index) => (\n                    <Link\n                      key={link.to}\n                      to={link.to}\n                      className={\n                        index === 0\n                          ? 'inline-flex items-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100'\n                          : 'inline-flex items-center rounded-full border border-white/18 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15'\n                      }\n                    >\n                      {link.label}\n                    </Link>\n                  ))}\n                </div>\n              </div>\n            </section>\n\n"""
replace_once(old_dark, '', 'remove duplicate generic dark CTA')

old_author_parent = """            <AboutAuthor\n              author={articleAuthor}\n              variant={metaSource.category === 'Research' ? 'research' : 'standard'}\n              evidenceLabel={evidenceSummary?.label}\n              reviewLabel={reviewLabel}\n            />\n\n            <section className=\"rounded-[2rem] border border-slate-200 bg-[linear-gradient(135deg,#f8fbff_0%,#eef8f2_100%)] p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)] sm:p-8\">\n              <p className=\"text-xs font-semibold uppercase tracking-[0.24em] text-primary-700\">Parent Guidance</p>\n              <h2 className=\"mt-3 text-3xl font-black tracking-tight text-slate-950\">Next Step for Parents</h2>\n              <p className=\"mt-3 max-w-3xl text-sm leading-7 text-slate-600\">\n                If your child is facing this challenge, start with the right learning path instead of trying random worksheets. Tiny Steps can help identify whether your child needs support with phonics, grammar, reading, sentence formation, or speaking confidence.\n              </p>\n              <div className=\"mt-5 flex flex-wrap gap-3 text-sm font-semibold\">\n                <Link to={nextStepPrimaryRoute.to} className=\"inline-flex items-center rounded-full bg-slate-950 px-5 py-3 text-white transition hover:bg-slate-800\">\n                  {nextStepPrimaryRoute.label}\n                </Link>\n                <Link to=\"/courses\" className=\"inline-flex items-center rounded-full border border-slate-300 bg-white px-5 py-3 text-slate-900 shadow-sm transition hover:bg-slate-50\">\n                  Explore Courses\n                </Link>\n                <Link to=\"/book-demo\" className=\"inline-flex items-center rounded-full border border-slate-300 bg-white px-5 py-3 text-slate-900 shadow-sm transition hover:bg-slate-50\">\n                  Book Free 35-Minute Demo\n                </Link>\n              </div>\n            </section>\n\n"""
new_author_conversion = """            <AboutAuthor\n              author={articleAuthor}\n              variant={metaSource.category === 'Research' ? 'research' : 'standard'}\n              evidenceLabel={evidenceSummary?.label}\n              reviewLabel={reviewLabel}\n            />\n\n            {blogConversionConfig && slug ? (\n              <BlogConversionCard slug={slug} config={blogConversionConfig} />\n            ) : null}\n\n"""
replace_once(old_author_parent, new_author_conversion, 'replace duplicate parent guidance with B11 conversion card')

replace_once(
    """              <p className=\"text-xs font-semibold uppercase tracking-[0.24em] text-primary-700\">Recommended Next for Parents</p>\n              <h2 className=\"mt-3 text-3xl font-black tracking-tight text-slate-950\">Looking for more structured support?</h2>\n              <p className=\"mt-3 max-w-3xl text-sm leading-7 text-slate-600\">\n                Explore our main programs, related guides, or compare courses directly.\n              </p>\n""",
    """              <p className=\"text-xs font-semibold uppercase tracking-[0.24em] text-primary-700\">\n                {isSchoolConversion ? 'Recommended Next for Schools' : 'Recommended Next for Parents'}\n              </p>\n              <h2 className=\"mt-3 text-3xl font-black tracking-tight text-slate-950\">\n                {isSchoolConversion ? 'Continue with school implementation resources' : 'Looking for more structured support?'}\n              </h2>\n              <p className=\"mt-3 max-w-3xl text-sm leading-7 text-slate-600\">\n                {isSchoolConversion\n                  ? 'Explore the school partnership route and related implementation guidance.'\n                  : 'Explore the most relevant program, related guides, or compare courses directly.'}\n              </p>\n""",
    'recommended audience copy',
)

replace_once(
    """                {primaryAction && (\n                  <Link to={primaryAction.to} className=\"inline-flex items-center rounded-full bg-slate-950 px-5 py-3 text-white transition hover:bg-slate-800\">\n                    {primaryAction.label}\n                  </Link>\n                )}\n""",
    """                {recommendedPrimaryAction && (\n                  <Link to={recommendedPrimaryAction.to} className=\"inline-flex items-center rounded-full bg-slate-950 px-5 py-3 text-white transition hover:bg-slate-800\">\n                    {recommendedPrimaryAction.label}\n                  </Link>\n                )}\n""",
    'recommended primary action',
)

replace_once(
    """                  .filter(\n                    p =>\n                      p.category === metaSource.category\n                      && p.slug !== slug\n                      && !p.hideFromList\n                      && !shouldNoindexBlogSlug(p.slug),\n                  )\n""",
    """                  .filter((p) => {\n                    const sameAudience = isSchoolConversion\n                      ? getBlogTechnicalAuthority(p).audience === 'Schools & Research'\n                      : p.category === metaSource.category;\n                    return sameAudience\n                      && p.slug !== slug\n                      && !p.hideFromList\n                      && !shouldNoindexBlogSlug(p.slug);\n                  })\n""",
    'audience-aware related posts',
)

replace_once(
    """                {!hasCoursesLink && !suppressCoursesFallback ? (\n""",
    """                {!isSchoolConversion && !hasCoursesLink && !suppressCoursesFallback ? (\n""",
    'school courses fallback suppression',
)

replace_once(
    """                  <p className=\"mt-2 text-sm leading-7 text-slate-600\">{categoryConfig.sidebarDescription}</p>\n""",
    """                  <p className=\"mt-2 text-sm leading-7 text-slate-600\">{sidebarConfig.sidebarDescription}</p>\n""",
    'sidebar next move description',
)

replace_once(
    """              <p className=\"text-xs font-semibold uppercase tracking-[0.24em] text-slate-500\">{categoryConfig.sidebarTitle}</p>\n              <p className=\"mt-3 text-sm leading-7 text-slate-600\">{categoryConfig.sidebarDescription}</p>\n              <div className=\"mt-5 space-y-3\">\n                {categoryConfig.sidebarLinks.map((link) => (\n""",
    """              <p className=\"text-xs font-semibold uppercase tracking-[0.24em] text-slate-500\">{sidebarConfig.sidebarTitle}</p>\n              <p className=\"mt-3 text-sm leading-7 text-slate-600\">{sidebarConfig.sidebarDescription}</p>\n              <div className=\"mt-5 space-y-3\">\n                {sidebarConfig.sidebarLinks.map((link) => (\n""",
    'audience-aware sidebar links',
)

for forbidden in [
    'nextStepPrimaryRoute',
    'resolveNextStepRoute',
    'Continue with Tiny Steps learning paths',
    '>Parent Guidance<',
]:
    if forbidden in source:
        raise RuntimeError(f'forbidden legacy B11 pattern remains: {forbidden}')

for required in [
    'getBlogConversionConfig',
    'captureBlogArticleContext',
    'trackBlogArticleView',
    '<BlogConversionCard slug={slug} config={blogConversionConfig} />',
    "searchLabel={isSchoolConversion ? 'Schools often ask' : 'Parents often search'}",
    "getBlogTechnicalAuthority(p).audience === 'Schools & Research'",
]:
    if required not in source:
        raise RuntimeError(f'required B11 pattern missing: {required}')

path.write_text(source)
print('Patched BlogPostPage.tsx for B11 conversion and attribution architecture.')
