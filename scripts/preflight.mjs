#!/usr/bin/env node
import { spawnSync, execFileSync } from 'node:child_process';

const args = new Set(process.argv.slice(2));
const full = args.has('--full');
const planOnly = args.has('--plan');

function git(args, { allowFailure = false } = {}) {
  try {
    return execFileSync('git', args, { encoding: 'utf8' }).trim();
  } catch (error) {
    if (allowFailure) return '';
    throw error;
  }
}

function resolveBase() {
  const explicitIndex = process.argv.indexOf('--base');
  if (explicitIndex >= 0) {
    const value = process.argv[explicitIndex + 1];
    if (!value) throw new Error('--base requires a git ref');
    return git(['merge-base', 'HEAD', value]);
  }

  for (const candidate of ['origin/main', 'main']) {
    const resolved = git(['merge-base', 'HEAD', candidate], { allowFailure: true });
    if (resolved) return resolved;
  }

  const fallback = git(['rev-parse', 'HEAD~1'], { allowFailure: true });
  return fallback || git(['rev-parse', 'HEAD']);
}

function changedFiles(base) {
  const sets = [
    git(['diff', '--name-only', '--diff-filter=ACMRD', `${base}...HEAD`], { allowFailure: true }),
    git(['diff', '--name-only'], { allowFailure: true }),
    git(['diff', '--cached', '--name-only'], { allowFailure: true }),
    git(['ls-files', '--others', '--exclude-standard'], { allowFailure: true }),
  ];
  return [...new Set(
    sets
      .flatMap((value) => value.split(/\r?\n/))
      .map((value) => value.trim())
      .filter(Boolean),
  )].sort();
}

function packageManifestHasMaterialDependencyChange(base) {
  const beforeText = git(['show', `${base}:package.json`], { allowFailure: true });
  if (!beforeText) return true;

  try {
    const before = JSON.parse(beforeText);
    const current = JSON.parse(
      execFileSync(process.execPath, ['-e', "process.stdout.write(require('fs').readFileSync('package.json','utf8'))"], { encoding: 'utf8' }),
    );

    const effectivePackages = (pkg) => {
      const merged = {};
      for (const section of ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies']) {
        for (const [name, version] of Object.entries(pkg[section] || {})) {
          merged[name] = version;
        }
      }
      return Object.fromEntries(Object.entries(merged).sort(([a], [b]) => a.localeCompare(b)));
    };

    const material = (pkg) => ({
      packages: effectivePackages(pkg),
      engines: pkg.engines || {},
      packageManager: pkg.packageManager || '',
      type: pkg.type || '',
    });

    return JSON.stringify(material(before)) !== JSON.stringify(material(current));
  } catch {
    return true;
  }
}

function matchesAny(path, patterns) {
  return patterns.some((pattern) => (
    typeof pattern === 'string'
      ? path === pattern || path.startsWith(pattern.endsWith('/') ? pattern : `${pattern}/`)
      : pattern.test(path)
  ));
}

function run(label, command, commandArgs, options = {}) {
  const printable = [command, ...commandArgs].join(' ');
  console.log(`\n▶ ${label}\n  ${printable}`);
  if (planOnly) return;
  const result = spawnSync(command, commandArgs, {
    cwd: process.cwd(),
    stdio: 'inherit',
    env: { ...process.env, ...(options.env || {}) },
  });
  if (result.status !== 0) {
    throw new Error(`${label} failed with exit code ${result.status ?? 'unknown'}`);
  }
}

const base = resolveBase();
const changed = changedFiles(base);

const packageManifestChanged = changed.includes('package.json');
const packageMaterialChange = packageManifestChanged
  ? packageManifestHasMaterialDependencyChange(base)
  : false;

const globalTestImpact = changed.some((path) => (
  path === 'package-lock.json' ||
  path === 'vitest.config.ts' ||
  path === 'vite.config.ts' ||
  path === 'tsconfig.json' ||
  path.startsWith('tsconfig.')
)) || packageMaterialChange;

const frontendChanged = changed.some((path) => (
  (path.startsWith('src/') && !path.startsWith('src/tests/')) ||
  path.startsWith('public/') ||
  path === 'index.html' ||
  path === 'vite.config.ts' ||
  path === 'package-lock.json' ||
  packageMaterialChange
));

const changedFrontendTests = changed.filter((path) => (
  path.startsWith('src/tests/') &&
  !path.endsWith('blogContentCiRouting.spec.ts')
));

const functionsChanged = changed.some((path) => path.startsWith('functions/'));

const firestoreChanged = changed.some((path) => (
  path === 'firestore.rules' ||
  path === 'firestore.indexes.json' ||
  path.startsWith('src/tests/firestore/')
));

const deploymentChanged = changed.some((path) => (
  path === '.github/workflows/deploy.yml' ||
  path.startsWith('.github/scripts/') ||
  path === 'firebase.json' ||
  path.startsWith('scripts/deployment/') ||
  [
    'scripts/deploy-functions-batched.mjs',
    'scripts/resolve-deployment-impact.mjs',
    'scripts/prepare-firebase-ci-config.mjs',
    'scripts/preflight.mjs',
    'scripts/test/functions-deployment.node-test.mjs',
    'scripts/test/firebase-ci-config.node-test.mjs',
  ].includes(path)
));

const enrollmentChanged = changed.some((path) => matchesAny(path, [
  'functions/src/lifecycle.ts',
  'functions/src/scheduling/rollingScheduleCourseTransition.ts',
  'functions/src/scheduling/rollingScheduleLifecycle.ts',
  'functions/src/scheduling/rollingScheduleMaterializer.ts',
  'src/lib/createEnrollmentCallable.ts',
  'src/pages/admin/EnrollmentManagement/',
  'src/pages/admin/StudentManagement/',
  'src/tests/emulator/',
  'vitest.emulator.config.ts',
]));

const wave1IdentityFoundationChanged = changed.some((path) => matchesAny(path, [
  'functions/src/schoolOS/identity/',
  'functions/src/helpers/adminGuard.ts',
  'functions/src/lifecycle.ts',
  'functions/src/createMakeupSessionFromCredit.ts',
  'functions/src/ai/refreshPublicKb.ts',
  'functions/src/messaging/sendMessage.ts',
  'functions/src/messaging/createOrSyncMessageThread.ts',
  'firestore.rules',
  'scripts/wave1-identity-foundation-dry-run.mjs',
  'scripts/test/wave1-identity-foundation.node-test.mjs',
  'src/tests/functions/wave1IdentityAuthorizationHardening.spec.ts',
  'src/tests/firestore/userRbac.rules.spec.ts',
  'docs/architecture/wave-1/',
  'docs/architecture/wave-0/WAVE_0_EXIT_REVIEW.md',
  'docs/architecture/wave-0/MIGRATION_EXECUTION_STANDARD_V1.md',
]));

const sharedExperienceAuditChanged = changed.some((path) => matchesAny(path, [
  'scripts/audit-shared-experience.mjs',
  'scripts/test/shared-experience-inventory.node-test.mjs',
  'docs/architecture/wave-0/SHARED_EXPERIENCE_DESIGN_SYSTEM_INVENTORY.md',
  'docs/architecture/wave-0/CURRENT_TO_CANONICAL_MAP.md',
  'docs/architecture/wave-0/WAVE_0_ARCHITECTURE_CONTRACTS.md',
]));

const academicEnrollmentAuditChanged = changed.some((path) => matchesAny(path, [
  'scripts/audit-academic-enrollment.mjs',
  'scripts/test/academic-enrollment-audit.node-test.mjs',
  'docs/architecture/wave-0/ACADEMIC_ENROLLMENT_AUDIT.md',
  'docs/architecture/wave-0/CURRENT_TO_CANONICAL_MAP.md',
  'docs/architecture/wave-0/WAVE_0_ARCHITECTURE_CONTRACTS.md',
]));

const identityReferenceAuditChanged = changed.some((path) => matchesAny(path, [
  'scripts/audit-identity-references.mjs',
  'scripts/test/identity-reference-audit.node-test.mjs',
  'docs/architecture/wave-0/IDENTITY_REFERENCE_AUDIT.md',
  'docs/architecture/wave-0/CURRENT_TO_CANONICAL_MAP.md',
  'docs/architecture/wave-0/WAVE_0_ARCHITECTURE_CONTRACTS.md',
]));

const r8Changed = changed.some((path) => matchesAny(path, [
  'src/content/phonicsKnowledge/',
  'src/content/phonicsCurriculum/',
  'src/tests/seo/resourcesR',
  'functions/src/phonicsCurriculumConfig.ts',
  'src/lib/resourcesArchitectureRegistry.js',
  'src/lib/publicRouteManifest.js',
  'src/lib/routeSeoRegistry.js',
  'src/app/routes.tsx',
  'scripts/audit-resources-r8-phonics-knowledge.mjs',
  'scripts/audit-resources-r7-aeo-geo.mjs',
  'scripts/audit-resources-r0.mjs',
  'scripts/audit-resources-r0-rendered.mjs',
  'scripts/audit-semantic-internal-links.mjs',
  'scripts/audit-canonical-topic-ownership.mjs',
  'docs/seo/resources-architecture/',
]));

console.log('Tiny Steps local preflight');
console.log(`Base: ${base}`);
console.log(`Mode: ${full ? 'FULL' : 'AFFECTED'}`);
console.log(`Changed files: ${changed.length}`);
if (changed.length) console.log(changed.map((path) => `  - ${path}`).join('\n'));

if (!full && !changed.length) {
  console.log('\nNo changes detected against main or the working tree. Nothing to validate.');
  process.exit(0);
}


const functionsCompileRequired = functionsChanged || deploymentChanged;

if (functionsChanged) {
  run('Functions lint', 'npm', ['--prefix', 'functions', 'run', 'lint']);
}

if (functionsCompileRequired) {
  // Deployment contract tests inspect functions/lib, so compile first to avoid
  // comparing current source exports against stale local build output.
  run('Functions build', 'npm', ['--prefix', 'functions', 'run', 'build']);
}

if (identityReferenceAuditChanged) {
  run('Identity/reference audit tests', 'npm', ['run', 'test:identity-reference-audit']);
}

if (academicEnrollmentAuditChanged) {
  run('Academic/enrollment audit tests', 'npm', ['run', 'test:academic-enrollment-audit']);
}

if (sharedExperienceAuditChanged) {
  run('Shared experience inventory tests', 'npm', ['run', 'test:shared-experience-inventory']);
}

if (wave1IdentityFoundationChanged) {
  run('Wave 1 identity foundation tests', 'npm', ['run', 'test:wave1-identity-foundation']);
}

if (deploymentChanged) {
  run('Deployment contract tests', 'node', [
    '--test',
    'scripts/test/deployment-impact.node-test.mjs',
    'scripts/test/functions-impact.node-test.mjs',
    'scripts/test/functions-deployment.node-test.mjs',
    'scripts/test/firebase-ci-config.node-test.mjs',
  ]);
}

if (functionsChanged) {
  run('Functions unit tests', 'npm', ['--prefix', 'functions', 'test']);
}

if (firestoreChanged) {
  run('Firestore rules emulator tests', 'npx', [
    'firebase-tools@15.30.0',
    'emulators:exec',
    '--project',
    'tinysteps-react-v1',
    '--only',
    'firestore',
    'FIRESTORE_EMULATOR_HOST=127.0.0.1:8085 npx vitest run src/tests/firestore/publicLeads.rules.spec.ts src/tests/firestore/schoolDomain.rules.spec.ts src/tests/firestore/schoolProgramme.rules.spec.ts src/tests/firestore/teacherIdentity.rules.spec.ts src/tests/firestore/teacherProgressAuthorization.rules.spec.ts src/tests/firestore/childCourseProgress.rules.spec.ts',
  ]);
}

if (enrollmentChanged) {
  run('Enrollment integrity emulator', 'npm', ['run', 'test:emulator:enrollment-integrity']);
}

if (changedFrontendTests.length) {
  run('Changed frontend test files', 'npx', [
    'vitest',
    'run',
    ...changedFrontendTests,
  ]);
}

if (frontendChanged) {
  run('Frontend lint', 'npm', ['run', 'lint']);
  run('Type check', 'npm', ['run', 'typecheck']);

  if (full || globalTestImpact) {
    run('Full unit suite', 'npm', ['run', 'test:full']);
  } else {
    run('Affected unit tests', 'npx', [
      'vitest',
      'run',
      '--changed',
      base,
      '--passWithNoTests',
    ]);
    run('Critical regression pack', 'npm', ['run', 'test:critical']);
  }
}

if (r8Changed) {
  run('R8 phonics/resource tests', 'npx', [
    'vitest',
    'run',
    'src/tests/seo/resourcesR',
    'src/content/phonicsCurriculum',
  ]);
  run('R8 phonics knowledge audit', 'node', ['scripts/audit-resources-r8-phonics-knowledge.mjs', '--r9-approved', '--report']);
  run('Semantic internal-link audit', 'node', ['scripts/audit-semantic-internal-links.mjs']);
  run('Canonical topic ownership audit', 'node', ['scripts/audit-canonical-topic-ownership.mjs']);
  run('R7 breadcrumb/AEO/GEO audit', 'node', ['scripts/audit-resources-r7-aeo-geo.mjs']);
  run('Resources structural safety audit', 'node', ['scripts/audit-resources-r0.mjs']);
}

if (frontendChanged) {
  run(
    (full || globalTestImpact) ? 'Deep local production build + audits' : 'Local deploy-artifact build',
    'npm',
    ['run', (full || globalTestImpact) ? 'build' : 'build:deploy'],
  );
}

if (r8Changed) {
  run('Rendered R8 publication audit', 'node', ['scripts/audit-resources-r8-phonics-knowledge.mjs', '--r9-approved', '--dist']);
  run('Rendered Resources safety audit', 'node', ['scripts/audit-resources-r0-rendered.mjs', '--strict']);
}

console.log('\n✓ Tiny Steps local preflight passed.');
