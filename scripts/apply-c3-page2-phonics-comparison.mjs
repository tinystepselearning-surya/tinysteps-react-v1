#!/usr/bin/env node
import fs from 'node:fs';

const pagePath = 'src/pages/public/BestOnlinePhonicsClassesIndiaPage.tsx';
const registryPath = 'src/lib/routeSeoRegistry.js';
let page = fs.readFileSync(pagePath, 'utf8');
let registry = fs.readFileSync(registryPath, 'utf8');

function required(text, oldValue, newValue, label) {
  if (!text.includes(oldValue)) throw new Error(`Missing expected source: ${label}`);
  return text.replace(oldValue, newValue);
}

// Keep this page tightly focused on best/compare/review/choice intent.
page = required(
  page,
  `const primaryIntentKeywords = [\n  'best online phonics classes in India',\n  'best phonics classes for kids',\n  'best phonics classes online',\n  'best phonics course in India',\n  'how to choose phonics classes',\n  'online phonics classes comparison',\n  'phonics classes fees',\n  'phonics class cost',\n  '1-to-1 vs group phonics classes',\n  'what to look for in a phonics class',\n  'which phonics program is best for my child',\n];`,
  `const primaryIntentKeywords = [\n  'best online phonics classes in India',\n  'best online phonics classes for kids in India',\n  'best phonics classes for kids',\n  'best phonics classes online',\n  'best phonics course in India',\n  'how to choose phonics classes',\n  'compare online phonics classes for kids',\n  'online phonics classes comparison',\n  'phonics class reviews India',\n  'best 1:1 phonics classes for kids',\n  '1-to-1 vs group phonics classes',\n  'what to look for in a phonics class',\n  'which phonics program is best for my child',\n];`,
  'comparison keyword ownership',
);

page = required(
  page,
  `  const seoDescription =\n    'Compare the best online phonics classes for kids in India by child fit, 1:1 vs group format, curriculum, teacher correction, transfer evidence, phonics class cost, fees, and progress visibility.';`,
  `  const seoDescription =\n    routeConfig?.description ??\n    'Compare online phonics classes for kids in India by child fit, 1:1 vs group format, curriculum, live correction, reading transfer, progress visibility and overall value.';`,
  'runtime description alignment',
);

page = required(
  page,
  `      about: [\n        { '@type': 'Thing', name: 'Online phonics classes comparison' },\n        { '@type': 'Thing', name: '1-to-1 vs group phonics classes' },\n        { '@type': 'Thing', name: 'Phonics class fees and cost' },\n      ],`,
  `      about: [\n        { '@type': 'Thing', name: 'Online phonics classes comparison' },\n        { '@type': 'Thing', name: 'How to choose phonics classes for kids' },\n        { '@type': 'Thing', name: '1-to-1 vs group phonics classes' },\n        { '@type': 'Thing', name: 'Phonics provider evaluation' },\n      ],`,
  'comparison webpage about topics',
);

page = required(
  page,
  `            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">\n              This page is the Tiny Steps buyer-comparison guide. For the full Tiny Steps phonics method, levels, and learning pathway, use the{' '}\n              <Link to="/phonics" className="font-semibold text-slate-900 underline decoration-slate-300 underline-offset-4 transition hover:decoration-slate-700">\n                main phonics programme page\n              </Link>\n              .\n            </p>`,
  `            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">\n              This page is the Tiny Steps buyer-comparison guide. It is published by Tiny Steps—not an independent third-party ranking—and deliberately avoids unsupported “#1” claims. For the full Tiny Steps phonics method, levels, and learning pathway, use the{' '}\n              <Link to="/phonics" className="font-semibold text-slate-900 underline decoration-slate-300 underline-offset-4 transition hover:decoration-slate-700">\n                main phonics programme page\n              </Link>\n              .\n            </p>`,
  'publisher disclosure',
);

page = required(
  page,
  `  {\n    criterion: 'Commercial clarity',\n    tinySteps: 'Current public pricing can be reviewed before enrolment.',\n    href: '/pricing',\n    label: 'Check pricing',\n  },`,
  `  {\n    criterion: 'Commercial clarity',\n    tinySteps: 'Parents can review the dedicated Tiny Steps phonics-fee page before enrolment, including the current standard 1:1 reference price and package context.',\n    href: '/phonics-fees-india',\n    label: 'Review phonics fees',\n  },`,
  'fee-owner evidence link',
);

page = required(
  page,
  `  {\n    question: 'How much do Tiny Steps online phonics classes cost?',\n    answer:\n      'The current standard reference is ₹400 per 1:1 class, with the starter 12-class plan at ₹4,800. Parents can review current pricing before enrolment and confirm the suitable package after the free assessment.',\n  },`,
  `  {\n    question: 'How should parents compare phonics class pricing?',\n    answer:\n      'Compare price together with class format, teacher attention, duration, placement, materials, progress visibility and policies. Tiny Steps publishes its phonics fees separately so parents can review the current standard 1:1 reference and package context without turning this comparison guide into a fee page.',\n  },`,
  'comparison FAQ price boundary',
);

page = required(page, `{ id: 'pricing', label: 'Cost' },`, `{ id: 'pricing', label: 'Value' },`, 'navigation price boundary');

page = required(
  page,
  `<SectionHeading eyebrow="Phonics classes fees" title="What does Tiny Steps phonics cost?" />`,
  `<SectionHeading eyebrow="Value comparison" title="How should price factor into a phonics-class decision?" />`,
  'pricing section heading',
);

page = required(
  page,
  `              The current standard reference is <strong>{formatINR(PER_CLASS_PRICE)} per 1:1 class</strong>\n              {starterPlan ? (\n                <>\n                  {' '}and <strong>{formatINR(starterPlan.monthlyFee)} for {starterPlan.classes} classes</strong>\n                </>\n              ) : null}. Parents should compare total programme clarity—not price alone—because a lower cost is not automatically stronger teaching, and a higher cost is not proof of better teaching.`,
  `              Price matters, but it should be compared alongside teaching quality, individual attention, duration, placement, progress visibility and policies. For transparency, Tiny Steps currently references <strong>{formatINR(PER_CLASS_PRICE)} per standard 1:1 class</strong>\n              {starterPlan ? (\n                <>\n                  {' '}and <strong>{formatINR(starterPlan.monthlyFee)} for {starterPlan.classes} classes</strong>\n                </>\n              ) : null}. The dedicated phonics-fee page owns the full fee and package explanation.`,
  'pricing comparison copy',
);

page = required(
  page,
  `              <Link\n                to="/pricing"\n                className="inline-flex min-h-[46px] w-full items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-2.5 font-semibold text-slate-900 shadow-sm motion-safe:transition-all hover:-translate-y-0.5 hover:border-orange-200 hover:bg-orange-50/60 hover:shadow-md sm:w-auto"\n              >\n                View Current Pricing\n              </Link>`,
  `              <Link\n                to="/phonics-fees-india"\n                className="inline-flex min-h-[46px] w-full items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-2.5 font-semibold text-slate-900 shadow-sm motion-safe:transition-all hover:-translate-y-0.5 hover:border-orange-200 hover:bg-orange-50/60 hover:shadow-md sm:w-auto"\n              >\n                Review Phonics Fees\n              </Link>`,
  'pricing owner CTA',
);

page = required(
  page,
  `          { label: 'Comparison focus', value: 'Fit, teaching, transfer evidence, format, progress, fees and cost' },`,
  page.includes(`          { label: 'Comparison focus', value: 'Fit, teaching, transfer evidence, format, progress and value' },`)
    ? `          { label: 'Comparison focus', value: 'Fit, teaching, transfer evidence, format, progress and value' },`
    : `          { label: 'Comparison focus', value: 'Fit, teaching, transfer evidence, format, progress and value' },`,
  'founder-review comparison focus',
);

const description = 'Compare online phonics classes for kids in India by child fit, 1:1 vs group format, curriculum, live correction, reading transfer, progress visibility and overall value.';
for (const route of ['/best-online-phonics-classes-for-kids-in-india', '/best-online-phonics-classes-india']) {
  const escaped = route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`  '${escaped}': \\{[\\s\\S]*?\\n  \\},`);
  const current = registry.match(pattern)?.[0];
  if (!current) throw new Error(`Missing registry route: ${route}`);
  const replacement = `  '${route}': {\n    title: 'Best Online Phonics Classes for Kids in India | Tiny Steps Learning',\n    description:\n      '${description}',\n    canonicalPath: '/best-online-phonics-classes-for-kids-in-india',\n    ogType: 'website',\n  },`;
  registry = registry.replace(current, replacement);
}

fs.writeFileSync(pagePath, page);
fs.writeFileSync(registryPath, registry);
console.log('Page 2 phonics comparison reconciliation applied.');
