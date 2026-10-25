import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { ROUTE_SEO_REGISTRY } from '../../lib/routeSeoRegistry.js';

const root = process.cwd();
const read = (relativePath: string) => fs.readFileSync(path.join(root, relativePath), 'utf8');

describe('homepage premium gateway', () => {
  const home = read('src/pages/HomePage.tsx');
  const hero = read('src/components/Home/ConversionHero.tsx');
  const index = read('index.html');
  const routes = read('src/app/routes.tsx');
  const form = read('src/components/forms/PublicAssessmentForm.tsx');
  const registry = ROUTE_SEO_REGISTRY['/'];

  it('keeps shared homepage metadata and canonical ownership', () => {
    expect(registry.title).toBe('Tiny Steps Learning | Online English Classes for Kids');
    expect(registry.description).toContain('phonics, reading, grammar and speaking');
    expect(registry.canonicalPath).toBe('/');
    expect(home).toContain("const homeSeo = ROUTE_SEO_REGISTRY['/']");
    expect(home).toContain('title={homeSeo.title}');
    expect(home).toContain('description={homeSeo.description}');
    expect(index).toContain('<title>' + registry.title + '</title>');
    expect(index).toContain('content="' + registry.description + '"');
    expect(index).toContain('https://tinystepslearning.com/og-default.jpg');
    expect(index).not.toContain('https://tinystepslearning.com/og-image.png');
  });

  it('retains brand schema without orphaned FAQ schema', () => {
    expect(home).toContain('createWebPageSchema');
    expect(home).toContain('organizationSchema');
    expect(home).toContain('websiteSchema');
    expect(home).toContain('homeWebPageSchema');
    expect(home).toContain('Children aged 3–12');
    expect(home).toContain('jsonLd={homepageSchemas}');
    expect(home).not.toContain('FAQPage');
    expect(home).not.toContain('homeFaqSchema');
  });

  it('reuses the 94 KB speaking image with eager hero loading', () => {
    expect(fs.existsSync(path.join(root, 'public/blog/hero-families/Tiny_Steps_Speaking.webp'))).toBe(true);
    expect(hero).toContain("const HERO_IMAGE = '/blog/hero-families/Tiny_Steps_Speaking.webp'");
    expect(hero).toContain('loading="eager"');
    expect(hero).toContain('fetchPriority="high"');
    expect(hero).toContain('width={1200}');
    expect(hero).toContain('height={1000}');
    expect(hero).toContain('Online English Classes');
    expect(hero).toContain('for Kids.');
  });

  it('uses approved deep navy and bright sun orange consistently in the hero', () => {
    expect(hero).toContain('text-[#102A43]');
    expect(hero).toContain('text-[#FF7A00]');
    expect(hero).toContain('bg-[#102A43]');
    expect(hero).toContain('hover:bg-[#0B2138]');
    expect(hero).not.toContain('tracking-[-0.055em] text-slate-950');
    expect(hero).not.toContain('<span className="text-orange-600">for Kids.</span>');
  });

  it('removes the homepage hero form, not the shared lead capture flow', () => {
    expect(hero).not.toContain('BookAssessmentForm');
    expect(home).not.toContain('firebase/firestore');
    expect(form).toContain("doc(collection(db, 'leads'))");
    expect(form).toContain('navigateToWhatsapp(whatsappWindow, whatsappUrl)');
  });

  it('links each hero learning phrase to its canonical specialist programme', () => {
    const expected = [
      ['/phonics', 'phonics'],
      ['/reading-classes-for-kids', 'reading'],
      ['/grammar', 'grammar'],
      ['/spoken-english-classes-for-kids-online', 'spoken English'],
      ['/speaking', 'public speaking'],
    ] as const;

    for (const [destination, label] of expected) {
      expect(hero).toContain(
        `<Link to="${destination}" className={HERO_PROGRAMME_LINK_CLASS}>${label}</Link>`,
      );
    }

    expect(hero.match(/className=\{HERO_PROGRAMME_LINK_CLASS\}/g)).toHaveLength(5);
    expect(hero).toContain('decoration-[#FF7A00]');
    expect(hero).toContain('underline-offset-[5px]');
    expect(hero).toContain('hover:bg-[#FFF1E6]');
    expect(hero).toContain('focus-visible:outline');
    expect(hero).toContain('Live, personalised one-to-one online English classes for children aged 3–12.');
    expect(hero).not.toContain('small-group options where suitable');
  });

  it('keeps the hero compact with accessible, non-repetitive branding and clear CTA reassurance', () => {
    expect(hero).not.toContain('mb-6 h-1 w-14 rounded-full bg-[#FF7A00]');
    expect(hero).toContain('id="homepage-title"');
    expect(hero).not.toContain('Tiny Steps Learning <span aria-hidden="true"');
    expect(hero).toContain('sm:flex-row sm:items-center sm:gap-5');
    expect(hero).toContain('Live 1:1 assessment. No obligation to enrol.');
    expect(hero).not.toContain('One free, live 35-minute 1:1 demo assessment.');
    expect(hero).toContain('href="#learning-pathways"');
    expect(hero).toContain('Explore our learning pathways');
    expect(hero).not.toContain('animate-marquee');
  });

  it('uses the full desktop learning-journey width without sacrificing readable line lengths', () => {
    expect(home).toContain('max-w-5xl text-3xl');
    expect(home).toContain('text-[#FF7A00] sm:text-base');
    expect(home).toContain('rounded-lg bg-[#102A43] px-3 py-2');
    expect(home).toContain('mt-6 grid gap-5 text-base leading-8 text-slate-600 sm:text-lg lg:grid-cols-2 lg:gap-12');
    expect(home).toContain('mt-3 flex-1 text-[15px] leading-7 text-slate-600');
    expect(home).toContain('mt-6 text-base font-semibold text-slate-900');
    expect(home).toContain('From Letter Sounds to Confident Communication.');
    expect(home).toContain('Tiny Steps brings together phonics, blending and spelling;');
    expect(home).toContain('Instead of following one fixed sequence for every child');
    expect(home).toContain('id="learning-pathways"');
  });

  it('keeps responsive breakpoints and avoids fixed-width or overflow-prone homepage content', () => {
    expect(hero).toContain('grid max-w-7xl items-center');
    expect(hero).toContain('px-5 pb-14 pt-10 sm:px-8');
    expect(hero).toContain('lg:grid-cols-[minmax(0,1.03fr)_minmax(0,0.97fr)]');
    expect(hero).toContain('min-w-0');
    expect(hero).toContain('aspect-[6/5] h-auto w-full');
    expect(hero).toContain('sm:flex-row sm:items-center');
    expect(home).toContain('sm:grid-cols-2 lg:grid-cols-4');
    expect(home).toContain('min-h-[245px] min-w-0 flex-col');
    expect(home).toContain('lg:grid-cols-2');
    expect(home).toContain('max-w-6xl');
    expect(home).not.toContain('whitespace-nowrap');
  });

  it('keeps a single prominent assessment CTA using the existing modal flow', () => {
    expect(hero).toContain('to="/book-demo"');
    expect(hero.match(/to="\/book-demo"/g)).toHaveLength(1);
    expect(hero).toContain('Book Free 35-Minute Demo');
    expect(hero).not.toContain('Open Assessment Form');
    expect(hero).not.toContain('to="/book-demo#assessment-form"');
    expect(routes).toContain('setIsAssessmentModalOpen(true)');
  });

  it('retains four commercial topic owner links', () => {
    for (const ownerPath of ['/phonics', '/reading-classes-for-kids', '/grammar', '/speaking']) {
      expect(home).toContain("path: '" + ownerPath + "'");
    }
    expect(home).toContain('to="/spoken-english-classes-for-kids-online"');
    expect(home).toContain('to="/courses"');
    expect(home).not.toContain("ages: 'Ages 3–12'");
  });

  it('shows a connected English-learning scope while preserving specialist topic ownership', () => {
    expect(home).toContain('From Letter Sounds to Confident Communication.');
    expect(home).toContain('The complete English-learning journey');
    expect(home).toContain('Tiny Steps brings together phonics, blending and spelling;');
    expect(home).toContain('reading fluency, vocabulary and comprehension; grammar and sentence building;');
    expect(home).toContain('spoken English, public speaking and communication skills.');
    expect(home).toContain('Instead of following one fixed sequence for every child');
    expect(home).toContain('age-appropriate activities, guided practice and teacher feedback.');
    expect(home).toContain('Spoken English and everyday conversation');
    expect(home).toContain('Public speaking and communication skills');
    expect(home).toContain("label: 'Public Speaking'");
    expect(home).toContain('Explore Spoken English Classes');
    expect(hero).not.toContain('One connected learning journey through');
    expect(hero).toContain('learning needs, current skills and pace.');
  });

  it('keeps pedagogy claims and school-environment context responsible', () => {
    expect(home).toContain('Age-aware, skill-led placement');
    expect(home).toContain('Purposeful, engaging activities');
    expect(home).toContain('Individual pace, visible progress');
    expect(home).toContain('helping each learner understand, practise and use English');
    expect(home).toContain('CBSE, ICSE, IB, Cambridge and other school environments');
    expect(home).toContain('not formally affiliated with these school systems');
    expect(home).not.toContain('internationally certified');
    expect(home).not.toContain('aligned to every curriculum');
    expect(home).not.toContain('guaranteed fluency');
  });

  it('shows technology responsibly, without fabricated AI capability', () => {
    expect(home).toContain('Thoughtful learning, without the guesswork.');
    expect(home).toContain('Human-led learning. Technology that helps.');
    expect(home).toContain('Technology supports the teacher-child connection; it does not replace it.');
    expect(home).not.toContain('AI-powered');
    expect(home).not.toContain('guaranteed results');
  });

  it('provides links to deeper resources and legal-page access through existing footer', () => {
    for (const destination of ['/curriculum', '/class-samples', '/pricing', '/resources', '/blog', '/faq']) {
      expect(home).toContain("path: '" + destination + "'");
    }
    expect(home).toContain('to="/why-tiny-steps"');
  });

  it('renders essential sections without interaction- or idle-dependent mounting', () => {
    const chapterOrder = [
      '<ConversionHero />',
      '<LearningPathwaysSection />',
      '<DifferenceSection />',
      '<TechnologySection />',
      '<ExploreSection />',
      '<FinalInvitationSection />',
    ].map((chapter) => home.indexOf(chapter));
    expect(chapterOrder.every((offset) => offset >= 0)).toBe(true);
    for (let i = 1; i < chapterOrder.length; i += 1) {
      expect(chapterOrder[i]).toBeGreaterThan(chapterOrder[i - 1]);
    }
    expect(home).not.toContain('IntersectionObserver');
    expect(home).not.toContain('requestIdleCallback');
    expect(home).not.toContain('showDeferredSections');
    expect(home).not.toContain('GlobalLearnersMapSection');
    expect(home).not.toContain('ClassSamplesSection');
    expect(home).not.toContain('PricingCrispSection');
  });

  it('uses compact homepage-only white chrome without changing other routes', () => {
    expect(routes).toContain("normalizedPath === '/'");
    expect(routes).toContain("'min-h-screen bg-white pb-0 pt-0'");
    expect(routes).toContain('pt-8 md:pt-12 lg:pt-16');
  });
});
