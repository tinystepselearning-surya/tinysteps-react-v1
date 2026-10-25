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

  it('removes the homepage hero form, not the shared lead capture flow', () => {
    expect(hero).not.toContain('BookAssessmentForm');
    expect(home).not.toContain('firebase/firestore');
    expect(form).toContain("doc(collection(db, 'leads'))");
    expect(form).toContain('navigateToWhatsapp(whatsappWindow, whatsappUrl)');
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
