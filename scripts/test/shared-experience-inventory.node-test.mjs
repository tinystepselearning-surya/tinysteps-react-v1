import test from 'node:test';
import assert from 'node:assert/strict';

import { analyzeSharedExperienceFiles } from '../audit-shared-experience.mjs';

function fixture() {
  return {
    'src/app/routes.tsx': [
      "import Header from '../components/common/Header';",
      "import Footer from '../components/common/Footer';",
    ].join('\n'),
    'src/components/common/Header.tsx': 'export default function Header(){return <header aria-label="public" />}',
    'src/components/common/Footer.tsx': 'export default function Footer(){return <footer />}',
    'src/components/common/MobileTabBar.tsx': 'export default function MobileTabBar(){return <nav aria-label="Mobile navigation" />}',
    'src/components/common/AppShellHeader.tsx': 'export default function AppShellHeader(){return <header />}',
    'src/components/common/TinyStepsBrand.tsx': 'export default function TinyStepsBrand(){return <div />}',
    'src/components/Layout.tsx': 'export default function Layout(){return <div />}',
    'src/pages/admin/AdminDashboard.tsx': [
      "import MobileTabBar from '../../components/common/MobileTabBar';",
      "import { Button } from '@components/ui/button';",
      '<Dialog><button>Menu</button></Dialog>',
      '<MobileTabBar />',
      '<Button />',
    ].join('\n'),
    'src/pages/admin/components/Header.tsx': '<header className="sticky top-0" />',
    'src/pages/admin/components/Sidebar.tsx': 'export default function Sidebar(){return <aside />}',
    'src/pages/teacher/TeacherDashboard.tsx': [
      "import MobileTabBar from '../../components/common/MobileTabBar';",
      '<MobileTabBar />',
      '<Dialog>Teacher menu</Dialog>',
      '<Tabs />',
    ].join('\n'),
    'src/pages/teacher/components/layout/TeacherSidebar.tsx': 'export function TeacherSidebar(){return <aside />}',
    'src/pages/teacher/components/layout/TeacherHeader.tsx': 'export function TeacherHeader(){return <header />}',
    'src/components/teacher/TeacherHeader.tsx': 'export function TeacherHeader(){return <header />}',
    'src/pages/parent/ParentDashboard.tsx': [
      "import MobileTabBar from '../../components/common/MobileTabBar';",
      '<MobileTabBar />',
      '<Dialog>Parent menu</Dialog>',
    ].join('\n'),
    'src/pages/parent/components/ParentMobileHeader.tsx': '<header className="sticky top-0" />',
    'src/pages/parent/components/layout/ParentHeader.tsx': [
      "import AppShellHeader from '../../../../components/common/AppShellHeader';",
      '<AppShellHeader />',
    ].join('\n'),
    'src/pages/parent/components/layout/ParentSidebar.tsx': 'export default function ParentSidebar(){return <aside />}',
    'src/pages/lp/LPDashboard.tsx': [
      "import MobileTabBar from '../../components/common/MobileTabBar';",
      '<Tabs><div>tabs</div></Tabs>',
      '<MobileTabBar />',
      '<h2>My Assigned Teachers</h2>',
      '<h2>My Assigned Parents</h2>',
    ].join('\n'),
    'src/pages/lp/components/layout/LPHeader.tsx': [
      "import AppShellHeader from '../../../../components/common/AppShellHeader';",
      '<AppShellHeader />',
    ].join('\n'),
    'src/pages/lp/components/layout/LPSidebar.tsx': 'export function LPSidebar(){return <aside />}',
    'src/pages/school/SchoolPortalFoundationPage.tsx': '<main><select /><button>Logout</button></main>',
    'src/index.css': ':root { --ts-safe-top: 0px; } @media (prefers-reduced-motion: reduce) {}',
    'src/styles/designTokens.js': 'export const designTokens = {};',
    'src/pages/parent/parentVisualTokens.ts': 'export const parentVisualTokens = {};',
    'tailwind.config.cjs': 'module.exports = { theme: { extend: {} } };',
  };
}

test('inventory recognizes existing shared mobile navigation and partial header convergence', () => {
  const report = analyzeSharedExperienceFiles(fixture());

  assert.equal(report.portals.admin.usesMobileTabBar, true);
  assert.equal(report.portals.teacher.usesMobileTabBar, true);
  assert.equal(report.portals.parent.usesMobileTabBar, true);
  assert.equal(report.portals.learningPartner.usesMobileTabBar, true);
  assert.equal(report.portals.school.usesMobileTabBar, false);

  assert.equal(report.portals.parent.usesAppShellHeader, true);
  assert.equal(report.portals.learningPartner.usesAppShellHeader, true);
  assert.equal(report.portals.school.usesAppShellHeader, false);

  assert.ok(report.notableFindings.some((item) => item.code === 'MOBILE_NAV_SHARED_FOUNDATION'));
  assert.ok(report.notableFindings.some((item) => item.code === 'HEADER_CONVERGENCE_PARTIAL'));
});

test('inventory identifies legacy shell candidates and token-authority overlap', () => {
  const report = analyzeSharedExperienceFiles(fixture());

  const legacyLayout = report.legacyShellCandidates.find(
    (item) => item.file === 'src/components/Layout.tsx',
  );
  assert.equal(legacyLayout?.classification, 'RETIRE_LATER_CANDIDATE');

  assert.ok(report.notableFindings.some((item) => item.code === 'TOKEN_AUTHORITIES_MULTIPLE'));
});

test('inventory keeps public common header and footer as the routed public shell', () => {
  const report = analyzeSharedExperienceFiles(fixture());

  assert.equal(report.publicShell.commonHeaderPresent, true);
  assert.equal(report.publicShell.commonFooterPresent, true);
  assert.equal(report.publicShell.routesUsesCommonHeader, true);
  assert.equal(report.publicShell.routesUsesCommonFooter, true);
});

test('inventory flags LP post-tab content duplication and school bespoke shell', () => {
  const report = analyzeSharedExperienceFiles(fixture());

  assert.ok(report.notableFindings.some((item) => item.code === 'LP_DUPLICATED_POST_TAB_CONTENT'));
  assert.ok(report.notableFindings.some((item) => item.code === 'SCHOOL_PORTAL_BESPOKE_SHELL'));
});
