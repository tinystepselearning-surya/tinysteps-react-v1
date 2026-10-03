#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const DEFAULT_REPORT = 'reports/shared-experience-inventory.json';
const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.css']);

const PORTAL_ROOTS = {
  admin: 'src/pages/admin/AdminDashboard.tsx',
  teacher: 'src/pages/teacher/TeacherDashboard.tsx',
  parent: 'src/pages/parent/ParentDashboard.tsx',
  learningPartner: 'src/pages/lp/LPDashboard.tsx',
  school: 'src/pages/school/SchoolPortalFoundationPage.tsx',
};

const PORTAL_SHELL_FILES = {
  admin: [
    'src/pages/admin/components/Header.tsx',
    'src/pages/admin/components/Sidebar.tsx',
  ],
  teacher: [
    'src/pages/teacher/components/layout/TeacherHeader.tsx',
    'src/pages/teacher/components/layout/TeacherSidebar.tsx',
  ],
  parent: [
    'src/pages/parent/components/ParentMobileHeader.tsx',
    'src/pages/parent/components/layout/ParentHeader.tsx',
    'src/pages/parent/components/layout/ParentSidebar.tsx',
  ],
  learningPartner: [
    'src/pages/lp/components/layout/LPHeader.tsx',
    'src/pages/lp/components/layout/LPSidebar.tsx',
  ],
  school: [
    'src/pages/school/SchoolPortalFoundationPage.tsx',
  ],
};

const SHARED_COMPONENTS = [
  'MobileTabBar',
  'AppShellHeader',
  'TinyStepsBrand',
  'HolidayCalendar2026',
  'MessagesPanel',
  'KnowledgeBreadcrumbs',
  'PageHero',
];

const UI_PRIMITIVES = [
  'Button',
  'Card',
  'Dialog',
  'Tabs',
  'Table',
  'Badge',
  'Input',
  'Select',
  'Textarea',
  'Spinner',
  'Alert',
  'Form',
];

const TOKEN_FILES = [
  'tailwind.config.cjs',
  'src/index.css',
  'src/styles/designTokens.js',
  'src/pages/parent/parentVisualTokens.ts',
];

const LEGACY_SHELL_CANDIDATES = [
  'src/components/Layout.tsx',
  'src/pages/parent/components/layout/ParentSidebar.tsx',
  'src/pages/teacher/components/layout/TeacherHeader.tsx',
  'src/components/teacher/TeacherHeader.tsx',
];

function normalizePath(value) {
  return String(value || '').replaceAll('\\', '/');
}

function sourceEntry(file, content) {
  return { file: normalizePath(file), content: String(content || '') };
}

function countMatches(content, regex) {
  return [...content.matchAll(regex)].length;
}

function includesComponent(content, name) {
  return (
    content.includes(`<${name}`) ||
    content.includes(`from '../../components/common/${name}'`) ||
    content.includes(`from "../../../components/common/${name}"`) ||
    content.includes(`from '../../../../components/common/${name}'`) ||
    content.includes(`from "@components/ui/`) && content.includes(name)
  );
}

function importReferencesCandidate(entries, candidate) {
  const base = path.posix.basename(candidate).replace(/\.(tsx?|jsx?)$/, '');
  const candidateNormalized = normalizePath(candidate);
  const references = [];
  for (const entry of entries) {
    if (entry.file === candidateNormalized) continue;
    const content = entry.content;
    const importLike =
      content.includes(`/${base}'`) ||
      content.includes(`/${base}"`) ||
      content.includes(`from './${base}'`) ||
      content.includes(`from "./${base}"`) ||
      content.includes(`from '../${base}'`) ||
      content.includes(`from "../${base}"`) ||
      content.includes(`<${base}`);
    if (importLike) references.push(entry.file);
  }
  return [...new Set(references)].sort();
}

function portalSummary(entriesByFile, portal) {
  const root = PORTAL_ROOTS[portal];
  const rootSource = entriesByFile.get(root)?.content || '';
  const shellFiles = PORTAL_SHELL_FILES[portal] || [];
  const combined = [root, ...shellFiles]
    .map((file) => entriesByFile.get(file)?.content || '')
    .join('\n');

  return {
    root,
    rootPresent: entriesByFile.has(root),
    shellFiles: shellFiles.filter((file) => entriesByFile.has(file)),
    usesMobileTabBar: combined.includes('MobileTabBar'),
    usesAppShellHeader: combined.includes('AppShellHeader'),
    usesTinyStepsBrand: combined.includes('TinyStepsBrand'),
    usesDedicatedSidebar: /Sidebar/.test(combined),
    usesDrawerDialog: combined.includes('<Dialog') && /menu/i.test(combined),
    usesTabsNavigation: combined.includes('<Tabs'),
    hasStickyHeaderPattern: /sticky\s+top-0/.test(combined),
    hasSafeAreaHandling: /--ts-safe-|safe-area|ts-native/.test(combined),
    hasDarkModeClasses: /dark:/.test(combined),
    directHtmlControls: {
      button: countMatches(combined, /<button\b/g),
      select: countMatches(combined, /<select\b/g),
      input: countMatches(combined, /<input\b/g),
      table: countMatches(combined, /<table\b/g),
    },
    rootLineCount: rootSource ? rootSource.split('\n').length : 0,
  };
}

export function analyzeSharedExperienceFiles(fileMap) {
  const entries = Object.entries(fileMap)
    .map(([file, content]) => sourceEntry(file, content))
    .sort((a, b) => a.file.localeCompare(b.file));
  const entriesByFile = new Map(entries.map((entry) => [entry.file, entry]));

  const tsxEntries = entries.filter((entry) => /\.(tsx|jsx)$/.test(entry.file));

  const sharedComponentUsage = Object.fromEntries(
    SHARED_COMPONENTS.map((component) => {
      const files = tsxEntries
        .filter((entry) => includesComponent(entry.content, component))
        .map((entry) => entry.file);
      return [component, { files: [...new Set(files)].sort(), count: new Set(files).size }];
    }),
  );

  const uiPrimitiveUsage = Object.fromEntries(
    UI_PRIMITIVES.map((primitive) => {
      const files = tsxEntries
        .filter((entry) => {
          const content = entry.content;
          const importRegex = new RegExp(`(?:@components|@/components|\\.\\./|\\./).*ui/[^'"]+`, 'i');
          return (
            (content.includes(`<${primitive}`) && importRegex.test(content)) ||
            content.includes(`import { ${primitive}`) ||
            content.includes(`, ${primitive}`) ||
            content.includes(`${primitive},`)
          );
        })
        .map((entry) => entry.file);
      return [primitive, { files: [...new Set(files)].sort(), count: new Set(files).size }];
    }),
  );

  const portals = Object.fromEntries(
    Object.keys(PORTAL_ROOTS).map((portal) => [portal, portalSummary(entriesByFile, portal)]),
  );

  const legacyShellCandidates = LEGACY_SHELL_CANDIDATES.map((candidate) => {
    const references = importReferencesCandidate(entries, candidate);
    return {
      file: candidate,
      exists: entriesByFile.has(candidate),
      inboundReferenceFiles: references,
      inboundReferenceCount: references.length,
      classification: references.length === 0 ? 'RETIRE_LATER_CANDIDATE' : 'REVIEW_ACTIVE_USAGE',
    };
  });

  const directControls = {
    buttonFiles: tsxEntries.filter((e) => /<button\b/.test(e.content)).map((e) => e.file),
    selectFiles: tsxEntries.filter((e) => /<select\b/.test(e.content)).map((e) => e.file),
    inputFiles: tsxEntries.filter((e) => /<input\b/.test(e.content)).map((e) => e.file),
    tableFiles: tsxEntries.filter((e) => /<table\b/.test(e.content)).map((e) => e.file),
  };

  const statePatterns = {
    loadingFiles: tsxEntries
      .filter((e) => /isLoading|loading\.\.\.|Loading…|Loading /.test(e.content))
      .map((e) => e.file),
    errorFiles: tsxEntries
      .filter((e) => /isError|text-red-|Error:|could not load|failed to load/i.test(e.content))
      .map((e) => e.file),
    emptyFiles: tsxEntries
      .filter((e) => /EmptyState|No [A-Za-z].*(yet|available|found)|length === 0/.test(e.content))
      .map((e) => e.file),
    skeletonFiles: tsxEntries
      .filter((e) => /Skeleton|animate-pulse/.test(e.content))
      .map((e) => e.file),
  };

  const accessibility = {
    ariaLabelFiles: tsxEntries.filter((e) => /aria-label=/.test(e.content)).map((e) => e.file),
    ariaCurrentFiles: tsxEntries.filter((e) => /aria-current=/.test(e.content)).map((e) => e.file),
    srOnlyFiles: tsxEntries.filter((e) => /sr-only/.test(e.content)).map((e) => e.file),
    reducedMotionFiles: entries.filter((e) => /prefers-reduced-motion/.test(e.content)).map((e) => e.file),
  };

  const tokenSources = TOKEN_FILES.map((file) => ({
    file,
    exists: entriesByFile.has(file),
    lineCount: entriesByFile.get(file)?.content.split('\n').length || 0,
  }));

  const publicShell = {
    commonHeaderPresent: entriesByFile.has('src/components/common/Header.tsx'),
    commonFooterPresent: entriesByFile.has('src/components/common/Footer.tsx'),
    legacyLayoutPresent: entriesByFile.has('src/components/Layout.tsx'),
    routesUsesCommonHeader:
      entriesByFile.get('src/app/routes.tsx')?.content.includes('components/common/Header') || false,
    routesUsesCommonFooter:
      entriesByFile.get('src/app/routes.tsx')?.content.includes('components/common/Footer') || false,
  };

  const notableFindings = [];

  const sharedMobilePortals = Object.values(portals).filter((portal) => portal.usesMobileTabBar).length;
  if (sharedMobilePortals >= 3) {
    notableFindings.push({
      code: 'MOBILE_NAV_SHARED_FOUNDATION',
      severity: 'asset',
      detail: `MobileTabBar is already shared by ${sharedMobilePortals} portal shells.`,
    });
  }

  const appShellPortals = Object.values(portals).filter((portal) => portal.usesAppShellHeader).length;
  if (appShellPortals > 0 && appShellPortals < Object.keys(portals).length) {
    notableFindings.push({
      code: 'HEADER_CONVERGENCE_PARTIAL',
      severity: 'converge',
      detail: `AppShellHeader is shared by ${appShellPortals} portal shells; other portal headers remain bespoke.`,
    });
  }

  if (portals.school.rootPresent && !portals.school.usesMobileTabBar && !portals.school.usesAppShellHeader) {
    notableFindings.push({
      code: 'SCHOOL_PORTAL_BESPOKE_SHELL',
      severity: 'converge',
      detail: 'School portal uses a bespoke page-level shell rather than shared authenticated shell primitives.',
    });
  }

  const unusedShells = legacyShellCandidates.filter((item) => item.exists && item.inboundReferenceCount === 0);
  if (unusedShells.length) {
    notableFindings.push({
      code: 'LEGACY_SHELL_CANDIDATES',
      severity: 'retire_later',
      detail: `${unusedShells.length} shell/header/sidebar files have no inbound source reference in this static inventory.`,
      files: unusedShells.map((item) => item.file),
    });
  }

  if (
    entriesByFile.has('src/styles/designTokens.js') &&
    entriesByFile.has('tailwind.config.cjs')
  ) {
    notableFindings.push({
      code: 'TOKEN_AUTHORITIES_MULTIPLE',
      severity: 'converge',
      detail: 'Tailwind theme, global CSS variables and JavaScript design tokens coexist; canonical ownership should be narrowed.',
    });
  }

  const lpSource = entriesByFile.get('src/pages/lp/LPDashboard.tsx')?.content || '';
  if (
    /<Tabs[\s\S]*<\/Tabs>/.test(lpSource) &&
    lpSource.includes('My Assigned Teachers') &&
    lpSource.includes('My Assigned Parents')
  ) {
    notableFindings.push({
      code: 'LP_DUPLICATED_POST_TAB_CONTENT',
      severity: 'converge',
      detail: 'Learning Partner dashboard renders separate assigned-teacher/parent sections after the tab workspace, duplicating portal content concepts.',
    });
  }

  return {
    generatedAt: new Date().toISOString(),
    mode: 'static_shared_experience_inventory',
    scope: {
      sourceFiles: entries.length,
      componentFiles: tsxEntries.length,
    },
    portals,
    sharedComponentUsage,
    uiPrimitiveUsage,
    publicShell,
    tokenSources,
    legacyShellCandidates,
    directControls: {
      buttonFileCount: directControls.buttonFiles.length,
      selectFileCount: directControls.selectFiles.length,
      inputFileCount: directControls.inputFiles.length,
      tableFileCount: directControls.tableFiles.length,
      ...directControls,
    },
    statePatterns: Object.fromEntries(
      Object.entries(statePatterns).map(([key, files]) => [key, { count: files.length, files }]),
    ),
    accessibility: Object.fromEntries(
      Object.entries(accessibility).map(([key, files]) => [key, { count: files.length, files }]),
    ),
    notableFindings,
    canonicalDecisions: {
      authenticatedShell:
        'Create one shared authenticated AppShell composition with role-scoped navigation/configuration and controlled portal variants; do not merge portal business content.',
      navigation:
        'Keep MobileTabBar as the shared mobile navigation primitive. Converge desktop side navigation and mobile drawer configuration around shared navigation item contracts rather than copied portal sidebars.',
      headers:
        'Keep AppShellHeader/TinyStepsBrand as shared header primitives. Admin, teacher and school header needs become controlled variants rather than parallel design systems.',
      pageTemplates:
        'Standardize authenticated Workspace, List, Detail and Form page frames before refactoring feature content.',
      stateComponents:
        'Introduce shared LoadingState, EmptyState, ErrorState and AccessState patterns; current state handling is widespread but inconsistent.',
      status:
        'Introduce a semantic StatusBadge/StatusPill contract by domain status token, avoiding page-local color mappings where possible.',
      designTokens:
        'Tailwind theme plus semantic CSS variables should become the canonical token layer. Feature semantic tokens may alias it. JavaScript design token duplication should be retired when no longer required.',
      publicShell:
        'Keep common public Header/Footer as the canonical public shell. Legacy src/components/Layout.tsx should not become a second public shell authority.',
      accessibility:
        'Shared primitives must own focus visibility, keyboard semantics, reduced-motion behavior, responsive safe-area handling and WCAG 2.2 AA defaults.',
    },
  };
}

async function walk(dir) {
  const output = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.git') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) output.push(...await walk(full));
    else if (SOURCE_EXTENSIONS.has(path.extname(entry.name))) output.push(full);
  }
  return output;
}

async function readRepoFiles(root) {
  const files = await walk(path.join(root, 'src'));
  for (const extra of ['tailwind.config.cjs']) {
    const absolute = path.join(root, extra);
    try {
      await fs.access(absolute);
      files.push(absolute);
    } catch {
      // optional
    }
  }

  const map = {};
  for (const absolute of files) {
    const relative = normalizePath(path.relative(root, absolute));
    map[relative] = await fs.readFile(absolute, 'utf8');
  }
  return map;
}

async function main() {
  const reportIndex = process.argv.indexOf('--report');
  const reportPath = reportIndex >= 0 ? process.argv[reportIndex + 1] : DEFAULT_REPORT;
  const root = process.cwd();
  const fileMap = await readRepoFiles(root);
  const report = analyzeSharedExperienceFiles(fileMap);

  const absoluteReport = path.resolve(root, reportPath || DEFAULT_REPORT);
  await fs.mkdir(path.dirname(absoluteReport), { recursive: true });
  await fs.writeFile(absoluteReport, JSON.stringify(report, null, 2) + '\n', 'utf8');

  console.log('\n=== Tiny Steps Shared Experience Inventory ===');
  console.log(`Source files: ${report.scope.sourceFiles}; component files: ${report.scope.componentFiles}`);
  console.log(`MobileTabBar portal adoption: ${Object.values(report.portals).filter((p) => p.usesMobileTabBar).length}/${Object.keys(report.portals).length}`);
  console.log(`AppShellHeader portal adoption: ${Object.values(report.portals).filter((p) => p.usesAppShellHeader).length}/${Object.keys(report.portals).length}`);
  console.log(`Button primitive files: ${report.uiPrimitiveUsage.Button.count}`);
  console.log(`Card primitive files: ${report.uiPrimitiveUsage.Card.count}`);
  console.log(`Direct <button> files: ${report.directControls.buttonFileCount}`);
  console.log(`State pattern files: loading ${report.statePatterns.loadingFiles.count}, error ${report.statePatterns.errorFiles.count}, empty ${report.statePatterns.emptyFiles.count}`);
  console.log(`Notable findings: ${report.notableFindings.length}`);
  report.notableFindings.forEach((finding) => console.log(`- ${finding.code}: ${finding.detail}`));
  console.log(`Report: ${absoluteReport}\n`);
}

const isDirectExecution =
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (isDirectExecution) {
  main().catch((error) => {
    console.error('Shared experience inventory failed:', error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
