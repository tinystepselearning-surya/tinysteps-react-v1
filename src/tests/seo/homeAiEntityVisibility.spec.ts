import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { ROUTE_SEO_REGISTRY } from '../../lib/routeSeoRegistry.js';
import { HOMEPAGE_SEO_META } from '../../lib/homeSeoMeta.js';

const root = process.cwd();
const read = (relativePath: string) => fs.readFileSync(path.join(root, relativePath), 'utf8');

describe('homepage premium gateway', () => {
  const home = read('src/pages/HomePage.tsx');
  const hero = read('src/components/Home/ConversionHero.tsx');
  const index = read('index.html');
  const routes = read('src/app/routes.tsx');
  const form = read('src/components/forms/PublicAssessmentForm.tsx');
  const footer = read('src/components/common/Footer.tsx');
  const backToTop = read('src/components/common/BackToTopButton.tsx');
  const floatingAssistant = read('src/components/common/FloatingAssistant.tsx');
  const registry = ROUTE_SEO_REGISTRY['/'];

  it('keeps shared homepage metadata and canonical ownership', () => {
    expect(registry.title).toBe('Tiny Steps Learning | Online English Classes for Kids');
    expect(registry.description).toContain('phonics, reading, grammar and speaking');
    expect(registry.canonicalPath).toBe('/');
    expect(ROUTE_SEO_REGISTRY['/']).toEqual(HOMEPAGE_SEO_META);
    expect(home).toContain('const homeSeo = HOMEPAGE_SEO_META;');
    expect(home).not.toContain('ROUTE_SEO_REGISTRY');
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
    expect(hero).toContain('sizes="(max-width: 639px)');
    for (const width of [480, 720, 960]) {
      expect(hero).toContain(`Tiny_Steps_Speaking_${width}.webp ${width}w`);
    }
    expect(hero).toContain('${HERO_IMAGE} 1131w');
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
    expect(home).toContain('mt-5 grid gap-4 text-base leading-7 text-slate-600 sm:mt-6 sm:gap-5 sm:text-lg sm:leading-8 lg:grid-cols-2 lg:gap-12');
    expect(home).toContain('mt-3 flex-1 text-[15px] leading-6 text-slate-600');
    expect(home).toContain('mt-4 w-fit border-b border-transparent pb-1 text-sm font-semibold');
    expect(home).toContain('From Letter Sounds to Confident Communication.');
    expect(home).toContain('Tiny Steps brings together phonics, blending and spelling;');
    expect(home).toContain('Instead of following one fixed sequence for every child');
    expect(home).toContain('id="learning-pathways"');
  });

  it('keeps responsive breakpoints and avoids fixed-width or overflow-prone homepage content', () => {
    expect(hero).toContain('grid max-w-7xl items-center');
    expect(hero).toContain('px-5 pb-10 pt-20 sm:gap-10 sm:px-8 sm:pb-20 sm:pt-28');
    expect(hero).toContain('lg:grid-cols-[minmax(0,1.03fr)_minmax(0,0.97fr)]');
    expect(hero).toContain('min-w-0');
    expect(hero).toContain('aspect-[6/5] h-auto w-full');
    expect(hero).toContain('sm:flex-row sm:items-center');
    expect(home).toContain('sm:grid-cols-2 lg:grid-cols-4');
    expect(home).toContain('min-h-[164px] min-w-0 flex-col');
    expect(home).toContain('lg:grid-cols-2');
    expect(home).toContain('max-w-6xl');
    expect(home).not.toContain('whitespace-nowrap');
  });

  it('uses meaningful educational card copy with clean Explore CTAs and no decorative numbers', () => {
    const cardCopy = [
      ['Phonics', '/phonics', 'Connect sounds to letters, blend and decode words, and build spelling skills.'],
      ['Reading', '/reading-classes-for-kids', 'Build reading fluency, vocabulary and comprehension with meaningful texts.'],
      ['Grammar', '/grammar', 'Strengthen grammar, punctuation and sentence building for clearer expression.'],
      ['Public Speaking', '/speaking', 'Develop storytelling, presentations and confident communication.'],
    ] as const;

    for (const [label, destination, description] of cardCopy) {
      expect(home).toContain(`label: '${label}'`);
      expect(home).toContain(`path: '${destination}'`);
      expect(home).toContain(`description: '${description}'`);
    }

    expect(home).not.toContain("number: '01'");
    expect(home).not.toContain('path.number');
    expect(home).not.toContain('path.action');
    expect(home).toContain('aria-label={`Explore ${path.label} online classes for kids`}');
    expect(home).toContain('                Explore');
  });

  it('uses one aligned feature panel instead of decorated raised tiles', () => {
    expect(home).toContain('mt-6 grid gap-px overflow-hidden rounded-[1.75rem]');
    expect(home).toContain('sm:grid-cols-2 lg:grid-cols-4');
    expect(home).toContain('min-h-[164px] min-w-0 flex-col');
    expect(home).toContain('sm:min-h-[220px] sm:px-7 sm:py-8 lg:px-6');
    expect(home).toContain('text-[clamp(1.18rem,1.7vw,1.45rem)]');
    expect(home).toContain('group-hover:border-[#FF7A00]');
    expect(home).not.toContain('rounded-full border border-orange-200');
    expect(home).not.toContain('motion-safe:hover:-translate-y-1');
    expect(home).not.toContain('motion-safe:group-hover:translate-x-[2px]');
  });

  it('preserves gentle hover, visible keyboard focus and reduced-motion behaviour without animation dependencies', () => {
    expect(home).toContain('motion-safe:transition-colors motion-safe:duration-200');
    expect(home).toContain('hover:bg-[#FAFBFD]');
    expect(home).toContain('focus-visible:ring-2');
    expect(home).toContain('focus-visible:ring-inset');
    expect(home).toContain('group-focus-visible:border-[#FF7A00]');
    expect(home).not.toContain('framer-motion');
    expect(home).not.toContain('react-spring');
    expect(home).not.toContain('requestAnimationFrame');
    expect(home).not.toContain('setInterval');
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

  it('shows distinct, useful child-centred teaching principles without curriculum-affiliation overclaims', () => {
    expect(home).toContain('Child-Centred Teaching. Meaningful Progress.');
    expect(home).toContain('Every lesson combines clear learning goals, live teacher guidance and purposeful practice');
    expect(home).toContain('Start with what the child knows');
    expect(home).toContain('We identify strengths, learning gaps and readiness');
    expect(home).toContain('Learn through active participation');
    expect(home).toContain('Children think, read, speak, practise and try again with supportive teacher feedback.');
    expect(home).toContain('Make progress visible');
    expect(home).toContain('how independently children use new skills');
    expect(home).not.toContain('CBSE, ICSE, IB, Cambridge and other school environments');
    expect(home).not.toContain('not formally affiliated with these school systems');
    expect(home).not.toContain('internationally certified');
    expect(home).not.toContain('aligned to every curriculum');
    expect(home).not.toContain('guaranteed fluency');
  });

  it('uses minimal readable teaching columns and a descriptive link to the method page', () => {
    expect(home).toContain('id="difference-title"');
    expect(home).toContain('aria-labelledby="difference-title"');
    expect(home).toContain('mt-7 grid gap-x-10 gap-y-5 sm:mt-10 sm:gap-y-8 md:grid-cols-3');
    expect(home).toContain('min-w-0 border-t border-slate-200 pt-6');
    expect(home).toContain('text-[#9B4300]');
    expect(home).toContain("to=\"/why-tiny-steps\"");
    expect(home).toContain('See how Tiny Steps teaches');
    expect(home).not.toContain('{reason.label} <span');
    expect(home).not.toContain('0{index + 1}');
    expect(home).not.toContain('animate-');
  });

  it('shows technology responsibly, without fabricated AI capability', () => {
    expect(home).toContain('Child-Centred Teaching. Meaningful Progress.');
    expect(home).toContain('Live Teaching. A Connected Learning Experience.');
    expect(home).toContain('Children learn with real teachers through interactive online lessons');
    expect(home).toContain('Live online classrooms');
    expect(home).toContain('Purposeful practice');
    expect(home).toContain('Parent portal');
    expect(home).toContain('Parents can join scheduled classes, access worksheets and follow learning progress.');
    expect(home).not.toContain('AI-powered');
    expect(home).not.toContain('guaranteed results');
  });

  it('keeps platform features factual, accessible and light without number decorations', () => {
    const technology = home.slice(home.indexOf('function TechnologySection()'), home.indexOf('function ExploreSection()'));
    expect(technology).toContain('aria-labelledby="technology-title"');
    expect(technology).toContain('bg-[#102A43]');
    expect(technology).toContain('Live online classrooms');
    expect(technology).toContain('Purposeful practice');
    expect(technology).toContain('Parent portal');
    expect(technology).not.toContain('0{index + 1}');
    expect(technology).not.toContain('AI-powered');
    expect(technology).not.toContain('setInterval');
    expect(technology).toContain('to="/curriculum"');
    expect(technology).toContain('to="/class-samples"');
  });

  it('distinguishes the final booking CTA from the dark footer and preserves one booking action', () => {
    const final = home.slice(home.indexOf('function FinalInvitationSection()'), home.indexOf('export default function HomePage()'));
    expect(final).toContain('id="homepage-final-invitation"');
    expect(final).toContain('from-[#E7F3FF] via-[#F5F0FF] to-[#FFF4DC]');
    expect(final).toContain('text-[#102A43]');
    expect(final).toContain('Book Free 35-Minute Demo');
    expect(final.match(/to="\/book-demo"/g)).toHaveLength(1);
  });

  it('scopes concise programme and resource footer navigation to the homepage', () => {
    expect(footer).toContain("const isHomePage = location.pathname === '/'");
    expect(footer).toContain('isHomePage ? homeCourseLinks : courseLinks');
    expect(footer).toContain('isHomePage ? homeExploreLinks : exploreLinks');
    for (const route of ['/phonics', '/reading-classes-for-kids', '/grammar', '/spoken-english-classes-for-kids-online', '/speaking']) {
      expect(footer).toContain("href: '" + route + "'");
    }
    expect(footer).toContain("isHomePage ? <span className=\"text-xs font-semibold\">{link.label}</span> : link.icon");
    expect(footer).toContain("label: 'Privacy Policy'");
    expect(footer).toContain("label: 'Terms & Conditions'");
    expect(footer).toContain("label: 'Refund & Guarantee'");
  });

  it('keeps the homepage footer concise while preserving the original Surya credit', () => {
    expect(footer).toContain("!isHomePage ? (");
    expect(footer).toContain('SSL Secure');
    expect(footer).toContain('UPI / Cards / Netbanking');
    expect(footer).toContain("link.label !== 'Pinterest'");
    expect(footer).toContain('© 2026 Tiny Steps Learning™. Foundations Forever for joyful, confident learning — built with ❤️ by Surya. All rights reserved.');
    expect(footer).toContain("label: 'Privacy Policy'");
    expect(footer).toContain("label: 'Terms & Conditions'");
    expect(footer).toContain("label: 'Refund & Guarantee'");
  });

  it('spaces the two supporting programme pathways for readable mobile navigation', () => {
    expect(home).toContain('mt-5 flex flex-col gap-x-10 gap-y-2 text-sm leading-6');
    expect(home).toContain('sm:mt-7 sm:flex-row sm:flex-wrap');
    expect(home).toContain('Explore Spoken English Classes');
    expect(home).toContain('Browse all courses');
  });

  it('keeps homepage assistant animation quiet and honours reduced motion', () => {
    expect(floatingAssistant).toContain("useReducedMotion");
    expect(floatingAssistant).toContain("quietDock = isHomePage");
    expect(floatingAssistant).toContain('askOpen || quietDock');
    expect(floatingAssistant).toContain('!quietDock && isExpanded');
    expect(floatingAssistant).toContain("quietDock ? '' : 'animate-ping'");
    expect(floatingAssistant).toContain('transition={quietDock ? { duration: 0 }');
    expect(floatingAssistant).toContain('suppressDock = false');
  });

  it('keeps fixed support widgets away from the final homepage booking area', () => {
    expect(routes).toContain("normalizedPath !== '/' || hideMarketingChrome");
    expect(routes).toContain("document.getElementById('homepage-final-invitation')");
    expect(routes).toContain('suppressDock={hideHomepageBottomWidgets}');
    expect(routes).toContain('!hideHomepageBottomWidgets ? <BackToTopButton /> : null');
    expect(floatingAssistant).toContain("suppressDock = false");
    expect(floatingAssistant).toContain("${suppressDock ? 'hidden' : 'flex'}");
    expect(floatingAssistant).toContain('<AskTinyStepsModal open={askOpen} onClose={() => setAskOpen(false)} />');
    expect(routes).toContain('showDeferredSupportWidgets');
    expect(backToTop).toContain("const isHomePage = pathname === '/'");
    expect(backToTop).toContain("prefers-reduced-motion: reduce");
  });

  it('keeps all six deep destinations without duplicating the previewed pages in Explore', () => {
    for (const destination of ['/curriculum', '/resources', '/blog']) {
      expect(home).toContain("path: '" + destination + "'");
    }
    for (const destination of ['/class-samples', '/pricing#standard-pricing', '/faq']) {
      expect(home).toContain('to="' + destination + '"');
    }
    expect(home).toContain('to="/why-tiny-steps"');
    const explore = home.slice(home.indexOf('const exploreLinks = ['), home.indexOf('function LearningPathwaysSection()'));
    expect(explore).not.toContain("path: '/class-samples'");
    expect(explore).not.toContain("path: '/pricing'");
    expect(explore).not.toContain("path: '/faq'");
  });

  it('provides useful class samples, canonical standard pricing and a compact collapsed FAQ', () => {
    const decisions = home.slice(home.indexOf('function BeforeYouBookSection()'), home.indexOf('function ExploreSection()'));
    expect(decisions).toContain('aria-labelledby="before-you-book-title"');
    expect(decisions).toContain('See how Tiny Steps classes actually work.');
    expect(decisions).toContain('to="/class-samples"');
    expect(decisions).toContain('Real class samples');
    expect(decisions).toContain('ONE_TO_ONE_MONTHLY_PACKAGES.map((plan)');
    expect(decisions).toContain('formatINR(plan.monthlyFee)');
    expect(decisions).toContain('formatINR(PER_CLASS_PRICE)');
    expect(decisions).toContain('to="/pricing#standard-pricing"');
    expect(decisions).toContain('Standard plans only.');
    expect(decisions).not.toContain('ULTRA_PREMIUM_PRICING');
    expect(decisions).toContain('to="/faq"');
    expect(decisions.match(/<details className="group py-3">/g)).toHaveLength(3);
    expect(decisions).not.toContain(' defaultOpen');
    expect(decisions).not.toContain(' open=');
    expect(decisions).toContain('What happens in the free demo?');
    expect(decisions).toContain('Are classes live or recorded?');
    expect(decisions).toContain('How can parents follow progress?');
    expect(home).not.toContain('FAQPage');
    expect(home).not.toContain('createFAQPageSchema');
  });

  it('renders essential sections without interaction- or idle-dependent mounting', () => {
    const chapterOrder = [
      '<ConversionHero />',
      '<LearningPathwaysSection />',
      '<DifferenceSection />',
      '<TechnologySection />',
      '<BeforeYouBookSection />',
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

  it('uses compact homepage sunrise chrome without changing other routes', () => {
    expect(routes).toContain("normalizedPath === '/'");
    expect(routes).toContain("'min-h-screen bg-[#F4F8FF] pb-0 pt-0'");
    expect(routes).toContain("data-ts-surface={!hideMarketingChrome && !isContactPage ? 'public' : undefined}");
    expect(routes).toContain('pt-8 md:pt-12 lg:pt-16');
  });
});
