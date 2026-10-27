import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(path, 'utf8');
const css = read('src/index.css');

const contrast = (fg, bg) => {
  const lum = (hex) => {
    const rgb = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255)
      .map(v => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
    return .2126 * rgb[0] + .7152 * rgb[1] + .0722 * rgb[2];
  };
  const [a, b] = [lum(fg), lum(bg)];
  return (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
};

test('the shared Sunrise/Ocean palette scopes protected surfaces without recolouring public routes', () => {
  const routes = read('src/app/routes.tsx');
  assert.ok(routes.includes("data-ts-surface={hideMarketingChrome ? 'app' : isContactPage ? undefined : 'public'}"));
  for (const token of [
    '--ts-app-ink: #17284C',
    '--ts-app-navy: #212B5C',
    '--ts-app-orange-text: #C2410C',
    '--ts-app-purple-text: #604577',
    '--ts-app-page: #F4F8FF',
    '--ts-app-lavender: #F1EDFC',
  ]) assert.ok(css.includes(token), token);
  assert.ok(css.includes('[data-ts-surface="app"] .ts-app-page'));
  assert.ok(css.includes('html.dark [data-ts-surface="app"]'));
  assert.ok(!css.includes('[data-ts-surface="app"] .text-orange-'), 'do not blanket-overwrite semantic orange text');
});

test('all five authenticated portal types adopt the theme shell', () => {
  const roots = [
    'src/pages/admin/AdminDashboard.tsx',
    'src/pages/teacher/TeacherDashboard.tsx',
    'src/pages/lp/LPDashboard.tsx',
    'src/pages/school/SchoolPortalFoundationPage.tsx',
  ];
  for (const path of roots) assert.ok(read(path).includes('ts-app-page'), path);
  assert.ok(read('src/pages/parent/ParentDashboard.tsx').includes('ts-parent-page'));
  assert.ok(css.includes('--ts-parent-bg: #F4F8FF'));
  assert.ok(css.includes('--ts-parent-border: #D7E5F4'));
  assert.ok(read('src/pages/admin/components/Header.tsx').includes('ts-app-header'));
  assert.ok(read('src/pages/admin/components/Sidebar.tsx').includes('ts-app-sidebar'));
  assert.ok(read('src/components/common/AppShellHeader.tsx').includes('ts-app-header'));
  assert.ok(read('src/components/common/MobileTabBar.tsx').includes('ts-app-mobile-tabs'));
});

test('retains functional severity badges, reduced motion and native safe areas', () => {
  assert.ok(read('src/pages/school/SchoolPortalFoundationPage.tsx').includes('text-red-700'));
  assert.ok(read('src/components/common/MobileTabBar.tsx').includes('bg-red-600'));
  assert.ok(read('src/components/common/MobileTabBar.tsx').includes('safe-area-inset-bottom'));
  assert.ok(css.includes('prefers-reduced-motion'));
});

test('approved core text colours meet AA for normal-size text', () => {
  for (const [fg, bg] of [
    ['#17284C', '#FFFFFF'],
    ['#405678', '#F4F8FF'],
    ['#C2410C', '#FFFFFF'],
    ['#604577', '#F1EDFC'],
    ['#315B8A', '#E7F3FF'],
    ['#D3B9E1', '#212B5C'],
    ['#FFFFFF', '#212B5C'],
  ]) assert.ok(contrast(fg, bg) >= 4.5, `${fg} on ${bg}`);
});


test('consolidated portal headers retain readable light and dark text', () => {
  const header = read('src/components/common/AppShellHeader.tsx');
  for (const required of ['text-[#17284C] dark:text-white', 'text-[#405678] dark:text-[#D3B9E1]', 'text-[#604577] dark:text-[#D3B9E1]']) {
    assert.ok(header.includes(required), required);
  }
  assert.ok(read('src/pages/parent/components/layout/ParentHeader.tsx').includes('ts-app-parent-hero'));
  assert.ok(read('src/pages/lp/components/layout/LPHeader.tsx').includes('dark:text-white'));
  assert.ok(read('src/pages/admin/components/Header.tsx').includes('dark:text-white'));
  assert.ok(css.includes('[data-ts-surface="app"] .ts-app-header.ts-app-parent-hero'));
  assert.ok(css.includes('html.dark [data-ts-surface="app"] .ts-app-header.ts-app-parent-hero'));
});

test('reconciliation preserves curriculum/error colours and removes competing root themes', () => {
  const routes = read('src/app/routes.tsx');
  assert.ok(routes.includes("data-ts-surface={hideMarketingChrome ? 'app'"), 'authenticated styling stays routed');
  assert.ok(!css.includes('.ts-auth-surface {'), 'avoid a second conflicting authenticated root theme');
  assert.ok(read('src/pages/school/SchoolPortalFoundationPage.tsx').includes('text-red-700'), 'preserve errors');
  assert.ok(read('src/pages/admin/AdminDashboard.tsx').includes('text-red-600'), 'preserve access alerts');
  assert.ok(read('src/pages/parent/ParentDashboard.tsx').includes('ts-native-no-x-scroll'), 'preserve native viewport safety');
});


test('teacher and shared mobile tab navigation preserve readable dark-mode contrast', () => {
  const teacher = read('src/pages/teacher/components/layout/TeacherSidebar.tsx');
  const mobile = read('src/components/common/MobileTabBar.tsx');
  assert.ok(teacher.includes('text-[#604577] dark:text-[#D3B9E1]'), 'teacher greeting needs a light dark-mode foreground');
  assert.ok(teacher.includes('text-[#405678] hover:bg-[#F1EDFC] hover:text-[#17284C] dark:text-[#D3B9E1]'), 'inactive teacher tabs need a light dark-mode foreground');
  assert.ok(teacher.includes('dark:hover:bg-[#384C80] dark:hover:text-white'), 'teacher tabs must remain legible on hover');
  assert.ok(mobile.includes('font-semibold text-slate-950 dark:text-white'), 'active mobile tab label must remain legible');
  assert.ok(mobile.includes('dark:bg-[#384C80] dark:text-white'), 'active mobile tab icon needs readable foreground');
  assert.ok(mobile.includes('dark:text-[#D3B9E1] dark:active:bg-[#384C80]'), 'inactive mobile labels need dark-mode foreground');
  assert.ok(mobile.includes('dark:group-hover:bg-[#384C80] dark:group-hover:text-white'), 'mobile icons need legible dark-mode hover');
  for (const [fg, bg] of [
    ['#D3B9E1', '#17284C'],
    ['#D3B9E1', '#0F172A'],
    ['#FFFFFF', '#384C80'],
  ]) assert.ok(contrast(fg, bg) >= 4.5, `dark mode contrast: ${fg} on ${bg}`);
});

test('whole-source text inventory separates educational game directories from protected operations', () => {
  const inventory = read('scripts/audit-public-text-palette.mjs');
  const gameMatch = inventory.indexOf("if (interactiveSpecialDirectory.test(file)) return 'specialised';");
  const portalMatch = inventory.indexOf("if (protectedPath.test(file)) return 'protected';");
  assert.ok(gameMatch >= 0 && portalMatch > gameMatch, 'classify child-games before generic kids portal');
  assert.ok(inventory.includes("if (specialPath.test(file)) return 'specialised';"));
});
