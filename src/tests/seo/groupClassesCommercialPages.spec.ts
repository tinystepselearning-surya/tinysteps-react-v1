import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (file: string) => fs.readFileSync(path.join(process.cwd(), file), 'utf8');

const groupPages = [
  ['group-phonics-classes-for-kids', 'GroupPhonicsClassesPage', 'Online Group Phonics Classes for Kids'],
  ['group-grammar-classes-for-kids', 'GroupGrammarClassesPage', 'Online Group Grammar Classes for Kids'],
  ['group-public-speaking-classes-for-kids', 'GroupPublicSpeakingClassesPage', 'Group Public Speaking Classes for Kids'],
] as const;

describe('Group-class commercial page integration', () => {
  const routes = read('src/app/routes.tsx');
  const seo = read('src/lib/routeSeoRegistry.js');
  const manifest = read('src/lib/publicRouteManifest.js');
  const content = read('src/pages/public/GroupClassPage.tsx');

  it('registers distinct public canonical and prerendered routes for all group programmes', () => {
    groupPages.forEach(([slug, component, title]) => {
      expect(routes).toContain(`{ path: '${slug}', element: <${component} /> }`);
      expect(seo).toContain(`'/${slug}': {`);
      expect(seo).toContain(`title: '${title} | Tiny Steps'`);
      expect(seo).toContain(`canonicalPath: '/${slug}'`);
      expect(manifest).toContain(`route('/${slug}', 'static')`);
    });
  });

  it('uses original format-specific page content and a qualified group-enquiry CTA', () => {
    expect(content).toContain('Register Group Interest');
    expect(content).toContain('/book-demo?format=small_group&program=');
    expect(content).toContain('not guarantee an immediate batch');
    expect(content).toContain('createCourseSchema');
    expect(content).toContain('createFAQPageSchema');
    expect(content).toContain('createWebPageSchema');
    expect(content).toContain("premiumPath: '/phonics'");
    expect(content).toContain("premiumPath: '/grammar'");
    expect(content).toContain("premiumPath: '/speaking'");
  });

  it('shows only two parent-facing class formats and correct prices', () => {
    expect(content).toContain('const GROUP_PLAN = NEW_GROUP_CLASS_PLAN');
    expect(content).toContain('GROUP_PLAN.monthlyFee / GROUP_PLAN.classes');
    expect(content).toContain('GROUP_PLAN.durationMinutes');
    expect(content).toContain('Group Classes or One-to-One Classes?');
    expect(content).toContain('maximum of four children per teacher');
    expect(content).toContain('₹250 per child');
    expect(content).toContain('formatINR(PER_CLASS_PRICE)');
    expect(content).toContain('ONE_TO_ONE_MONTHLY_PACKAGES[0].durationMinutes');
    expect(content).not.toContain('1:2 Group');
    expect(content).not.toContain('Maximum: 5 children per teacher.');
    expect(content).not.toContain('1:4 group');
    expect(content).not.toContain('₹220');
    expect(read('src/config/pricing.ts')).toContain('monthlyFee: 3000');
    expect(read('src/pages/HomePage.tsx')).toContain('Group Classes');
    expect(read('src/pages/HomePage.tsx')).toContain('One-to-One Classes');
    expect(read('src/pages/HomePage.tsx')).toContain('NEW_GROUP_CLASS_PLAN.monthlyFee / NEW_GROUP_CLASS_PLAN.classes');
    expect(read('src/config/pricing.ts')).toContain("NEW_GROUP_CLASS_RATIO = '1:4'");
    expect(read('src/pages/PricingPage.tsx')).toContain('const standardGroups = [NEW_GROUP_CLASS_PLAN]');
  });

  it('keeps the new programme pages light and sky-blue except for the navy pricing band', () => {
    expect(content).toContain('bg-[#F0F8FF]');
    expect(content).toContain('from-[#D9EEFF]');
    expect(content).toContain('bg-gradient-to-br from-[#0C2846]');
    expect(content).toContain("Move beyond memorising grammar rules");
    expect(content).toContain('From hearing letter sounds to blending first words');
    expect(content).toContain('Help your child express ideas clearly');
  });

  it('keeps the shared group page compact and corrects repeated print-header overlays', () => {
    expect(content).toContain('At a glance');
    expect(content).toContain('A group that fits your child');
    expect(content).toContain('How group learning works');
    expect(content).toContain('Interested in Group Classes?');
    expect(content).toContain('lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]');
    expect(content).toContain('body:has(.group-commercial-page) header.fixed');
    expect(content).not.toContain('sm:py-24');
    expect(content).not.toContain('rounded-[32px]');
  });

  it('preserves existing premium commercial titles and links to groups from discovery pages', () => {
    expect(seo).toContain("title: 'Online Phonics Classes for Kids | Live 1:1 | Tiny Steps'");
    expect(seo).toContain("title: 'Online Grammar Classes for Kids | Live 1:1 | Tiny Steps'");
    expect(seo).toContain("title: 'Online Public Speaking Classes for Kids | Live 1:1 | Tiny Steps'");
    for (const page of ['src/pages/HomePage.tsx', 'src/pages/CoursesPage.tsx', 'src/pages/CurriculumPage.tsx']) {
      const source = read(page);
      groupPages.forEach(([slug]) => expect(source).toContain('/' + slug));
    }
  });

  it('keeps group preference in the lead schema and prevents automatic 1:1 demo creation', () => {
    expect(read('src/lib/publicLeadForm.ts')).toContain("classFormatPreference: form.classFormatPreference || 'one_to_one'");
    expect(read('firestore.rules')).toContain("'one_to_one', 'small_group', 'unsure'");
    expect(read('functions/src/leadDemoAutoWorkflow.ts')).toContain("lead.classFormatPreference === 'small_group'");
    expect(read('src/pages/public/BookDemoPage.tsx')).toContain('Register Interest in Group');
  });
});
