import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (name: string) => fs.readFileSync(path.join(process.cwd(), name), 'utf8');

const pages = [
  'src/pages/phonics.tsx',
  'src/pages/grammar.tsx',
  'src/pages/speaking.tsx',
  'src/pages/public/GroupClassPage.tsx',
  'src/pages/HomePage.tsx',
  'src/pages/CoursesPage.tsx',
  'src/pages/CurriculumPage.tsx',
  'src/pages/PricingPage.tsx',
  'src/pages/ResourcesPage.tsx',
  'src/pages/blog/BlogIndexPage.tsx',
  'src/pages/BlogPostPage.tsx',
  'src/components/marketing/LeadPageSections.tsx',
];

describe('Tiny Steps public sunrise-ocean design system', () => {
  const stylesheet = source('src/index.css');
  const routes = source('src/app/routes.tsx');

  it('defines readable reusable tokens and only enables them in the public shell', () => {
    for (const swatch of ['#17284C', '#212B5C', '#6E95D2', '#755E96', '#CC8994', '#F6CF7E', '#E7F3FF', '#F1EDFC', '#FFE5EB']) {
      expect(stylesheet).toContain(swatch);
    }
    expect(stylesheet).toContain('--ts-sunrise-hero');
    expect(stylesheet).toContain('[data-ts-surface="public"]');
    expect(routes).toContain("data-ts-surface={!hideMarketingChrome && !isContactPage ? 'public' : undefined}");
    expect(routes).toContain("isProtectedAppRoute(normalizedPath)");
  });

  it('uses the common palette throughout high-traffic public pages and blog templates', () => {
    pages.forEach((page) => {
      const code = source(page);
      expect(code, page).toMatch(/#(?:E7F3FF|F4F8FF|F1EDFC|D9EEFF|EAF6FF|CC8994)|ts-sunrise-/);
    });
    expect(source('src/pages/blog/BlogIndexPage.tsx')).toContain('from-[#F1EDFC] to-[#FDECF0]');
    expect(source('src/pages/BlogPostPage.tsx')).toContain('#F1EDFC');
    expect(source('src/components/blog/ResearchArticleHero.tsx')).toContain('#212B5C');
    expect(source('src/components/marketing/LeadPageSections.tsx')).toContain('bg-gradient-to-b from-[#E7F3FF]');
  });

  it('preserves primary programme names, CTA links, blog SEO and conversion mechanics', () => {
    for (const programme of ['phonics', 'grammar', 'speaking']) {
      expect(source(`src/pages/${programme}.tsx`)).toContain('to="/book-demo"');
      expect(routes).toContain(`path: '${programme}', element:`);
    }
    expect(source('src/pages/blog/BlogIndexPage.tsx')).toContain('jsonLd={[breadcrumbSchema, blogSchema, collectionSchema, faqSchema]}');
    expect(source('src/pages/BlogPostPage.tsx')).toContain('buildBlogDemoPath');
    expect(source('src/pages/public/GroupClassPage.tsx')).toContain('createFAQPageSchema(questions)');
    expect(source('src/pages/public/GroupClassPage.tsx')).toContain('maximum of four children per teacher');
  });

  it('renders readable text on all shared navy marketing cards', () => {
    const pagesWithDarkLeadHeadings: Array<[string, string]> = [
      ['src/pages/public/SpokenEnglishClassesForKidsPage.tsx', 'Why children struggle to speak'],
      ['src/pages/parents/choosing-course.tsx', 'Useful next guides'],
      ['src/pages/public/OnlinePhonicsReadingClassesPage.tsx', 'Internal next steps'],
      ['src/pages/public/ConfidenceBuildingProgramKidsPage.tsx', 'Quick answer'],
      ['src/pages/ForSchoolsPage.tsx', 'School partnership pricing'],
    ];
    for (const [file, eyebrow] of pagesWithDarkLeadHeadings) {
      const code = source(file);
      // Check props on the SAME heading, regardless of their order or description length.
      // A fixed character limit falsely rejects valid multi-line JSX attributes.
      const headingProps = [...code.matchAll(/<LeadSectionHeading\\b([\\s\\S]*?)\\/>/g)]
        .map((match) => match[1])
        .find((props) => props.includes(`eyebrow="${eyebrow}"`));

      expect(headingProps, `Missing LeadSectionHeading "${eyebrow}" in ${file}`).toBeDefined();
      expect(headingProps, `Dark card heading "${eyebrow}" must use tone="dark" in ${file}`)
        .toMatch(/\\btone="dark"/);
    }
    const shared = source('src/components/marketing/LeadPageSections.tsx');
    expect(shared).toContain("isDark ? 'text-white' : 'text-slate-900'");
    expect(shared).toContain("isDark ? 'text-slate-200' : 'text-slate-700'");
  });

  it('uses readable ocean-sunrise levels on the five-step Phonics pyramid', () => {
    const page = source('src/pages/phonics.tsx');
    const backgrounds = ['#F6CF7E', '#D3B9E1', '#A5CCEA', '#6E95D2', '#212B5C'];
    for (const colour of backgrounds) expect(page).toContain(colour);
    expect(page).toContain("index === 4 ? '#FFFFFF' : '#17284C'");
    expect(page).not.toContain("'#FFB562'");
    expect(page).not.toContain('from-[#FF7B66] to-[#FF9B72]');
  });

  it('harmonises legacy support and conversion surfaces without changing targets', () => {
    const contact = source('src/pages/ContactPage.tsx');
    expect(contact).toContain('bg-[linear-gradient(115deg,#E7F3FF_0%,#F1EDFC_48%,#FFE5EB_100%)]');
    expect(contact).not.toContain('linear-gradient(115deg,#fff1e6');
    expect(contact).toContain('data-no-booking-intercept="1"');
    expect(contact).toContain('to="/book-demo"');
    const speaking = source('src/pages/public/SpokenEnglishClassesForKidsPage.tsx');
    expect(speaking).toContain('tone="dark"');
    expect(speaking).not.toContain('#fff8ef_0%');
    expect(source('src/pages/ForSchoolsPage.tsx')).toContain('#F6CF7E');
  });

  it('meets WCAG AA normal text contrast for the core pyramid and CTA colours', () => {
    const luminance = (hex: string) => {
      const channel = [1, 3, 5].map((position) => parseInt(hex.slice(position, position + 2), 16) / 255)
        .map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
      return 0.2126 * channel[0] + 0.7152 * channel[1] + 0.0722 * channel[2];
    };
    const ratio = (a: string, b: string) => {
      const aa = luminance(a), bb = luminance(b);
      return (Math.max(aa, bb) + 0.05) / (Math.min(aa, bb) + 0.05);
    };
    for (const background of ['#F6CF7E', '#D3B9E1', '#A5CCEA', '#6E95D2']) {
      expect(ratio('#17284C', background)).toBeGreaterThanOrEqual(4.5);
    }
    expect(ratio('#FFFFFF', '#212B5C')).toBeGreaterThanOrEqual(4.5);
    expect(ratio('#FFFFFF', '#755E96')).toBeGreaterThanOrEqual(4.5);
  });

  it('documents colour contrast restrictions and future rollout boundaries', () => {
    const designSpec = source('docs/design/sunrise-ocean-palette.md');
    expect(designSpec).toContain('Blush on white: 2.77:1');
    expect(designSpec).toContain('ocean on white: 3.05:1');
    expect(designSpec).toContain('authenticated learning');
    expect(designSpec).toContain('canonical URLs');
  });
});
