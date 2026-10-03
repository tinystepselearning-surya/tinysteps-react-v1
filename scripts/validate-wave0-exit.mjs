#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const REPORT = path.join(ROOT, 'reports', 'wave0-exit-validation.json');

const REQUIRED_DOCS = {
  blueprint: 'docs/architecture/TINY_STEPS_SCHOOL_OS_MASTER_BLUEPRINT_V1.md',
  roadmap: 'docs/architecture/SCHOOL_OS_MIGRATION_ROADMAP_V1.md',
  contracts: 'docs/architecture/wave-0/WAVE_0_ARCHITECTURE_CONTRACTS.md',
  map: 'docs/architecture/wave-0/CURRENT_TO_CANONICAL_MAP.md',
  identity: 'docs/architecture/wave-0/IDENTITY_REFERENCE_AUDIT.md',
  academic: 'docs/architecture/wave-0/ACADEMIC_ENROLLMENT_AUDIT.md',
  sharedExperience: 'docs/architecture/wave-0/SHARED_EXPERIENCE_DESIGN_SYSTEM_INVENTORY.md',
  migrationStandard: 'docs/architecture/wave-0/MIGRATION_EXECUTION_STANDARD_V1.md',
  exitReview: 'docs/architecture/wave-0/WAVE_0_EXIT_REVIEW.md',
};

async function read(relative) {
  return fs.readFile(path.join(ROOT, relative), 'utf8');
}

function check(id, passed, evidence) {
  return { id, passed: Boolean(passed), evidence };
}

async function main() {
  const docs = {};
  for (const [key, file] of Object.entries(REQUIRED_DOCS)) {
    docs[key] = await read(file);
  }

  const workflowDir = path.join(ROOT, '.github', 'workflows');
  const workflows = (await fs.readdir(workflowDir)).filter((name) => !name.startsWith('.')).sort();
  const permanentWorkflows = workflows.filter((name) => !name.startsWith('one-off-'));
  const deploy = await read('.github/workflows/deploy.yml');
  const pkg = JSON.parse(await read('package.json'));

  const checks = [
    check('blueprint_frozen', docs.blueprint.includes('FROZEN ARCHITECTURE SOURCE OF TRUTH'), 'Master Blueprint remains frozen'),
    check('roadmap_wave0_complete', docs.roadmap.includes('Implementation status:** COMPLETE — Wave 0 exit review passed.'), 'Roadmap records Wave 0 completion'),
    check('contracts_complete', docs.contracts.includes('Status:** COMPLETE — WAVE 0 CLOSED; WAVE 1 EXPAND AUTHORIZED'), 'Wave 0 contracts are closed'),
    check('work_package_1_complete', docs.contracts.includes('Engineering delivery baseline — COMPLETE'), 'Package 1 complete'),
    check('work_package_2_complete', docs.contracts.includes('Contracts & current-state map — COMPLETE'), 'Package 2 complete'),
    check('work_package_3_complete', docs.contracts.includes('Identity/reference audit — COMPLETE'), 'Package 3 complete'),
    check('work_package_4_complete', docs.contracts.includes('Academic/enrollment audit — COMPLETE'), 'Package 4 complete'),
    check('work_package_5_complete', docs.contracts.includes('Shared experience/design-system inventory — COMPLETE'), 'Package 5 complete'),
    check('work_package_6_complete', docs.contracts.includes('Migration standard & Wave 0 exit review — COMPLETE'), 'Package 6 complete'),
    check('identity_audit_complete', docs.identity.includes('Status:** COMPLETE'), 'Identity audit complete'),
    check('academic_audit_complete', docs.academic.includes('Status:** COMPLETE'), 'Academic/Enrollment audit complete'),
    check('shared_experience_complete', docs.sharedExperience.includes('Status:** COMPLETE'), 'Shared Experience inventory complete'),
    check('map_frozen', docs.map.includes('Status:** WAVE 0 COMPLETE — OWNERSHIP MAP FROZEN FOR WAVE 1 ENTRY'), 'Current-to-canonical map frozen for entry'),
    check(
      'migration_lifecycle_complete',
      [
        'EXPAND',
        'BACKFILL',
        'VERIFY',
        'SWITCH READS',
        'OBSERVE',
        'STOP LEGACY WRITES',
        'RETIRE',
      ].every((phase) => docs.migrationStandard.includes(phase)),
      'Migration standard contains all seven lifecycle phases',
    ),
    check('migration_manifest_defined', docs.migrationStandard.includes('Required migration manifest'), 'Migration manifest standard exists'),
    check('compatibility_registry_defined', docs.migrationStandard.includes('Compatibility-path registry'), 'Compatibility registry exists'),
    check('exception_registry_defined', docs.migrationStandard.includes('Exception registry'), 'Exception registry exists'),
    check('rollback_defined', docs.migrationStandard.includes('Rollback standard'), 'Rollback standard exists'),
    check('wave1_scope_guarded', docs.migrationStandard.includes('Wave 1 entry constraint'), 'Wave 1 scope constraint exists'),
    check('exit_review_complete', docs.exitReview.includes('Status:** COMPLETE'), 'Exit review complete'),
    check('wave1_go', docs.exitReview.includes('GO — WAVE 1 MAY BEGIN AT EXPAND'), 'Formal Wave 1 GO decision present'),
    check(
      'no_blanket_backfill_authorization',
      /does\s+(?:\*\*)?not(?:\*\*)?\s+authorize\s+an\s+unbounded\s+backfill/i.test(docs.exitReview),
      'GO is limited to controlled phase gates',
    ),
    check(
      'single_permanent_workflow',
      permanentWorkflows.length === 1 && permanentWorkflows[0] === 'deploy.yml',
      `Permanent workflows: ${permanentWorkflows.join(', ')}`,
    ),
    check('no_scheduled_ci', !/(^|\n)\s*schedule\s*:/m.test(deploy), 'deploy.yml has no schedule trigger'),
    check('no_pr_ci', !/(^|\n)\s*pull_request\s*:/m.test(deploy), 'deploy.yml has no pull_request trigger'),
    check('local_preflight_present', Boolean(pkg.scripts?.preflight && pkg.scripts?.['preflight:full']), 'Local preflight scripts remain available'),
  ];

  const failed = checks.filter((item) => !item.passed);
  const report = {
    generatedAt: new Date().toISOString(),
    mode: 'wave0_exit_static_validation',
    result: failed.length ? 'FAIL' : 'PASS',
    passed: checks.length - failed.length,
    total: checks.length,
    failed: failed.map((item) => item.id),
    workflows,
    permanentWorkflows,
    checks,
  };

  await fs.mkdir(path.dirname(REPORT), { recursive: true });
  await fs.writeFile(REPORT, JSON.stringify(report, null, 2) + '\n', 'utf8');

  console.log('=== Wave 0 Exit Validation ===');
  console.log(`Result: ${report.result}`);
  console.log(`Checks: ${report.passed}/${report.total} passed`);
  console.log(`Permanent workflows: ${permanentWorkflows.join(', ')}`);
  console.log(`Temporary workflows present during validation: ${workflows.filter((name) => name.startsWith('one-off-')).join(', ') || 'none'}`);
  if (failed.length) {
    console.log('Failed checks:');
    failed.forEach((item) => console.log(`- ${item.id}: ${item.evidence}`));
    process.exitCode = 1;
  } else {
    console.log('Wave 0 architecture gate is internally consistent.');
    console.log('Wave 1 entry decision: GO at EXPAND.');
  }
}

main().catch((error) => {
  console.error('Wave 0 exit validation failed:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
