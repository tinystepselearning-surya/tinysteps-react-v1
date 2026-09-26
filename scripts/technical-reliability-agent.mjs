import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const ROOT = process.cwd();
const ORIGIN = (process.env.TRA_ORIGIN || 'https://tinystepslearning.com').replace(/\/$/, '');
const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'tinysteps-react-v1';
const REGION = process.env.FIREBASE_REGION || 'asia-south1';
const REPORT_DIR = path.join(ROOT, 'artifacts', 'technical-reliability-agent');
const findings = [];

function addFinding({ area, check, severity = 'info', status, summary, evidence = [] }) {
  findings.push({
    area,
    check,
    severity,
    status,
    summary,
    evidence: Array.isArray(evidence) ? evidence : [String(evidence)],
  });
}

function readText(relativePath) {
  const absolute = path.join(ROOT, relativePath);
  if (!existsSync(absolute)) return null;
  return readFileSync(absolute, 'utf8');
}

function run(command, args, options = {}) {
  return spawnSync(command, args, {
    cwd: options.cwd || ROOT,
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
    env: process.env,
    ...options,
  });
}

async function fetchWithTimeout(url, options = {}) {
  return fetch(url, {
    ...options,
    headers: {
      'user-agent': 'TinySteps-Technical-Reliability-Agent/1.0',
      ...(options.headers || {}),
    },
    signal: AbortSignal.timeout(12_000),
  });
}

function auditRepositorySecrets() {
  const listed = run('git', ['ls-files']);
  if (listed.status !== 0) {
    addFinding({
      area: 'security',
      check: 'tracked-secret-filenames',
      severity: 'warning',
      status: 'warn',
      summary: 'Could not enumerate tracked files for secret filename checks.',
      evidence: listed.stderr?.trim() || 'git ls-files failed',
    });
    return;
  }

  const files = listed.stdout.split(/\r?\n/).filter(Boolean);
  const suspicious = files.filter((file) =>
    /(?:service[-_]?account|firebase-adminsdk|credentials)[^/]*\.json$|\.(?:pem|p12|pfx|key)$/i.test(file),
  );

  if (suspicious.length) {
    addFinding({
      area: 'security',
      check: 'tracked-secret-filenames',
      severity: 'critical',
      status: 'fail',
      summary: 'Potential credential/key files are tracked in Git.',
      evidence: suspicious.slice(0, 20),
    });
  } else {
    addFinding({
      area: 'security',
      check: 'tracked-secret-filenames',
      severity: 'critical',
      status: 'pass',
      summary: 'No tracked credential/key filenames matched the high-risk patterns.',
    });
  }

  const grep = run('git', [
    'grep',
    '-n',
    '-I',
    '-E',
    '(-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----|"private_key"[[:space:]]*:[[:space:]]*"-----BEGIN PRIVATE KEY-----")',
    '--',
    '.',
  ]);

  if (grep.status === 0 && grep.stdout.trim()) {
    addFinding({
      area: 'security',
      check: 'tracked-private-key-material',
      severity: 'critical',
      status: 'fail',
      summary: 'Private-key material appears to be tracked in the repository.',
      evidence: grep.stdout.trim().split(/\r?\n/).slice(0, 10),
    });
  } else {
    addFinding({
      area: 'security',
      check: 'tracked-private-key-material',
      severity: 'critical',
      status: 'pass',
      summary: 'No tracked PEM/private-key payload matched the high-risk signatures.',
    });
  }
}

function auditFirebaseRules() {
  for (const rulesPath of ['firestore.rules', 'storage.rules']) {
    const text = readText(rulesPath);
    if (!text) {
      addFinding({
        area: 'firebase',
        check: `${rulesPath}-present`,
        severity: 'critical',
        status: 'fail',
        summary: `${rulesPath} is missing.`,
      });
      continue;
    }

    const broadWrite = /allow\s+(?:read\s*,\s*write|write\s*,\s*read|write)\s*:\s*if\s+true\s*;/gi;
    const matches = [...text.matchAll(broadWrite)].map((match) => match[0]);
    if (matches.length) {
      addFinding({
        area: 'firebase',
        check: `${rulesPath}-no-public-write`,
        severity: 'critical',
        status: 'fail',
        summary: `${rulesPath} contains an unconditional public write rule.`,
        evidence: matches,
      });
    } else {
      addFinding({
        area: 'firebase',
        check: `${rulesPath}-no-public-write`,
        severity: 'critical',
        status: 'pass',
        summary: `${rulesPath} has no unconditional public write rule.`,
      });
    }
  }
}

function auditCiCdContract() {
  const workflow = readText('.github/workflows/deploy.yml');
  if (!workflow) {
    addFinding({
      area: 'ci-cd',
      check: 'deploy-workflow-present',
      severity: 'critical',
      status: 'fail',
      summary: 'Production deploy workflow is missing.',
    });
    return;
  }

  const required = [
    ['Cloud Functions unit tests', 'Run Cloud Functions unit tests', 'warning'],
    ['Firestore rules tests', 'Run Firestore rules tests', 'critical'],
    ['lint gate', 'Run linter', 'warning'],
    ['TypeScript gate', 'Run type check', 'warning'],
    ['unit-test coverage gate', 'npm run test:unit -- --coverage', 'warning'],
    ['deployment concurrency lock', 'concurrency:', 'critical'],
    ['stale production deploy refusal', 'Refuse stale production deployment', 'critical'],
    ['Firestore rules deployment', 'Deploy Firestore Security Rules', 'critical'],
    ['live deployment verification', 'Verify live deployment integrity and build identity', 'critical'],
  ];

  for (const [label, marker, severity] of required) {
    const present = workflow.includes(marker);
    addFinding({
      area: 'ci-cd',
      check: label,
      severity,
      status: present ? 'pass' : 'fail',
      summary: present ? `${label} is enforced in deploy.yml.` : `${label} is not enforced in deploy.yml.`,
    });
  }

  if (/google-github-actions\/auth@v2[\s\S]*credentials_json:/m.test(workflow)) {
    addFinding({
      area: 'security',
      check: 'github-google-cloud-auth-method',
      severity: 'warning',
      status: 'warn',
      summary: 'GitHub Actions uses a stored Google service-account JSON credential. Workload Identity Federation would reduce long-lived credential exposure.',
    });
  } else {
    addFinding({
      area: 'security',
      check: 'github-google-cloud-auth-method',
      severity: 'warning',
      status: 'pass',
      summary: 'Deploy workflow does not appear to use a stored service-account JSON credential.',
    });
  }
}

function auditTeamsSourceContract() {
  const sourcePath = 'functions/src/attendanceValidation/runAv2TeamsEvidenceProof.ts';
  const source = readText(sourcePath);
  if (!source) {
    addFinding({
      area: 'teams',
      check: 'teams-proof-source',
      severity: 'critical',
      status: 'fail',
      summary: 'Teams evidence proof source is missing.',
    });
    return;
  }

  const requiredMarkers = [
    "defineSecret('MICROSOFT_TENANT_ID')",
    "defineSecret('MICROSOFT_CLIENT_ID')",
    "defineSecret('MICROSOFT_CLIENT_SECRET')",
    "invoker: 'private'",
    'cors: false',
    'maxInstances: 1',
    'operationalMutationAllowed',
  ];

  const missing = requiredMarkers.filter((marker) => !source.includes(marker));
  addFinding({
    area: 'teams',
    check: 'teams-proof-security-contract',
    severity: 'critical',
    status: missing.length ? 'fail' : 'pass',
    summary: missing.length
      ? 'Teams proof endpoint is missing one or more required private/security controls.'
      : 'Teams proof endpoint preserves the expected private Secret Manager contract.',
    evidence: missing.map((marker) => `Missing: ${marker}`),
  });

  const literalSecret = /clientSecret\s*:\s*['"][^'"\n]{8,}['"]/m.test(source);
  addFinding({
    area: 'teams',
    check: 'teams-no-literal-client-secret',
    severity: 'critical',
    status: literalSecret ? 'fail' : 'pass',
    summary: literalSecret
      ? 'A literal Microsoft client secret appears in Teams integration source.'
      : 'No literal Microsoft client secret is embedded in the Teams integration source.',
  });
}

function auditTeamsDeployment() {
  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    addFinding({
      area: 'teams',
      check: 'teams-deployed-function',
      severity: 'warning',
      status: 'info',
      summary: 'Google Cloud credentials are unavailable; deployed Teams function metadata was not inspected.',
    });
    return;
  }

  const describe = run('gcloud', [
    'functions',
    'describe',
    'runAv2TeamsEvidenceProof',
    '--gen2',
    `--project=${FIREBASE_PROJECT_ID}`,
    `--region=${REGION}`,
    '--format=json',
  ]);

  if (describe.status !== 0) {
    addFinding({
      area: 'teams',
      check: 'teams-deployed-function',
      severity: 'critical',
      status: 'fail',
      summary: 'Could not verify the deployed runAv2TeamsEvidenceProof function.',
      evidence: describe.stderr?.trim() || describe.stdout?.trim() || 'gcloud describe failed',
    });
    return;
  }

  let metadata;
  try {
    metadata = JSON.parse(describe.stdout);
  } catch (error) {
    addFinding({
      area: 'teams',
      check: 'teams-deployed-function',
      severity: 'critical',
      status: 'fail',
      summary: 'Teams function metadata was not valid JSON.',
      evidence: error instanceof Error ? error.message : String(error),
    });
    return;
  }

  const active = metadata.state === 'ACTIVE';
  addFinding({
    area: 'teams',
    check: 'teams-deployed-function',
    severity: 'critical',
    status: active ? 'pass' : 'fail',
    summary: active
      ? 'runAv2TeamsEvidenceProof is deployed and ACTIVE.'
      : `runAv2TeamsEvidenceProof state is ${metadata.state || 'unknown'}.`,
  });

  const secretKeys = new Set(
    (metadata.serviceConfig?.secretEnvironmentVariables || []).map((entry) => entry.key).filter(Boolean),
  );
  const requiredSecrets = ['MICROSOFT_TENANT_ID', 'MICROSOFT_CLIENT_ID', 'MICROSOFT_CLIENT_SECRET'];
  const missingSecrets = requiredSecrets.filter((key) => !secretKeys.has(key));
  addFinding({
    area: 'teams',
    check: 'teams-deployed-secret-bindings',
    severity: 'critical',
    status: missingSecrets.length ? 'fail' : 'pass',
    summary: missingSecrets.length
      ? 'The deployed Teams proof function is missing required Secret Manager bindings.'
      : 'The deployed Teams proof function has all required Microsoft Secret Manager bindings.',
    evidence: missingSecrets.map((key) => `Missing binding: ${key}`),
  });

  const serviceResource = metadata.serviceConfig?.service;
  const serviceName = typeof serviceResource === 'string' ? serviceResource.split('/').pop() : null;
  if (!serviceName) {
    addFinding({
      area: 'teams',
      check: 'teams-private-invoker-iam',
      severity: 'critical',
      status: 'fail',
      summary: 'Could not resolve the underlying Cloud Run service for Teams proof IAM verification.',
    });
    return;
  }

  const iam = run('gcloud', [
    'run',
    'services',
    'get-iam-policy',
    serviceName,
    `--project=${FIREBASE_PROJECT_ID}`,
    `--region=${REGION}`,
    '--format=json',
  ]);

  if (iam.status !== 0) {
    addFinding({
      area: 'teams',
      check: 'teams-private-invoker-iam',
      severity: 'critical',
      status: 'fail',
      summary: 'Could not verify Teams proof Cloud Run IAM.',
      evidence: iam.stderr?.trim() || iam.stdout?.trim() || 'gcloud IAM read failed',
    });
    return;
  }

  const policy = JSON.parse(iam.stdout || '{}');
  const publicInvoker = (policy.bindings || []).some(
    (binding) =>
      binding.role === 'roles/run.invoker' &&
      (binding.members || []).some((member) => member === 'allUsers' || member === 'allAuthenticatedUsers'),
  );

  addFinding({
    area: 'teams',
    check: 'teams-private-invoker-iam',
    severity: 'critical',
    status: publicInvoker ? 'fail' : 'pass',
    summary: publicInvoker
      ? 'Teams proof Cloud Run service is publicly invokable.'
      : 'Teams proof Cloud Run service has no public invoker binding.',
  });
}

async function auditLiveSite() {
  try {
    const response = await fetchWithTimeout(ORIGIN, { redirect: 'follow' });
    addFinding({
      area: 'production',
      check: 'homepage-availability',
      severity: 'critical',
      status: response.ok ? 'pass' : 'fail',
      summary: response.ok ? `Homepage returned HTTP ${response.status}.` : `Homepage returned HTTP ${response.status}.`,
    });

    const headerChecks = [
      ['strict-transport-security', 'HSTS', 'warning'],
      ['content-security-policy', 'Content-Security-Policy', 'warning'],
      ['x-content-type-options', 'X-Content-Type-Options', 'warning'],
      ['referrer-policy', 'Referrer-Policy', 'warning'],
      ['permissions-policy', 'Permissions-Policy', 'info'],
    ];

    for (const [header, label, severity] of headerChecks) {
      const value = response.headers.get(header);
      addFinding({
        area: 'security',
        check: `live-header-${header}`,
        severity,
        status: value ? 'pass' : severity === 'info' ? 'info' : 'warn',
        summary: value ? `${label} is present on the live homepage.` : `${label} is missing on the live homepage.`,
        evidence: value ? [value] : [],
      });
    }
  } catch (error) {
    addFinding({
      area: 'production',
      check: 'homepage-availability',
      severity: 'critical',
      status: 'fail',
      summary: 'Homepage health request failed.',
      evidence: error instanceof Error ? error.message : String(error),
    });
  }

  try {
    const httpUrl = ORIGIN.replace(/^https:/, 'http:');
    const response = await fetchWithTimeout(httpUrl, { redirect: 'manual' });
    const location = response.headers.get('location') || '';
    const secureRedirect = [301, 302, 307, 308].includes(response.status) && location.startsWith('https://');
    addFinding({
      area: 'security',
      check: 'http-to-https-redirect',
      severity: 'critical',
      status: secureRedirect ? 'pass' : 'fail',
      summary: secureRedirect
        ? 'Plain HTTP redirects to HTTPS.'
        : `Plain HTTP did not produce a secure redirect (HTTP ${response.status}, location=${location || 'none'}).`,
    });
  } catch (error) {
    addFinding({
      area: 'security',
      check: 'http-to-https-redirect',
      severity: 'critical',
      status: 'fail',
      summary: 'Could not verify the HTTP-to-HTTPS redirect.',
      evidence: error instanceof Error ? error.message : String(error),
    });
  }

  const importantRoutes = ['/', '/phonics', '/book-demo', '/login'];
  for (const route of importantRoutes) {
    try {
      const response = await fetchWithTimeout(`${ORIGIN}${route}`, { redirect: 'follow' });
      const healthy = response.status >= 200 && response.status < 400;
      addFinding({
        area: 'production',
        check: `route-${route}`,
        severity: 'critical',
        status: healthy ? 'pass' : 'fail',
        summary: `${route} returned HTTP ${response.status}.`,
      });
    } catch (error) {
      addFinding({
        area: 'production',
        check: `route-${route}`,
        severity: 'critical',
        status: 'fail',
        summary: `${route} could not be reached.`,
        evidence: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const privateRoutes = ['/parent', '/teacher', '/kids', '/school'];
  for (const route of privateRoutes) {
    try {
      const response = await fetchWithTimeout(`${ORIGIN}${route}`, { redirect: 'manual' });
      const robots = (response.headers.get('x-robots-tag') || '').toLowerCase();
      const protectedFromIndex = robots.includes('noindex');
      addFinding({
        area: 'security',
        check: `private-route-noindex-${route}`,
        severity: 'warning',
        status: protectedFromIndex ? 'pass' : 'warn',
        summary: protectedFromIndex
          ? `${route} sends X-Robots-Tag noindex.`
          : `${route} does not send X-Robots-Tag noindex.`,
        evidence: robots ? [robots] : [],
      });
    } catch (error) {
      addFinding({
        area: 'security',
        check: `private-route-noindex-${route}`,
        severity: 'warning',
        status: 'warn',
        summary: `Could not inspect indexing headers for ${route}.`,
        evidence: error instanceof Error ? error.message : String(error),
      });
    }
  }
}

async function auditLatestDeploy() {
  const token = process.env.GITHUB_TOKEN;
  const repository = process.env.GITHUB_REPOSITORY;
  if (!token || !repository) {
    addFinding({
      area: 'github',
      check: 'latest-main-deployment',
      severity: 'warning',
      status: 'info',
      summary: 'GitHub runtime token/repository is unavailable; recent deploy health was not queried.',
    });
    return;
  }

  try {
    const response = await fetchWithTimeout(
      `https://api.github.com/repos/${repository}/actions/workflows/deploy.yml/runs?branch=main&per_page=10&status=completed`,
      {
        headers: {
          authorization: `Bearer ${token}`,
          accept: 'application/vnd.github+json',
          'x-github-api-version': '2022-11-28',
        },
      },
    );

    if (!response.ok) throw new Error(`GitHub Actions API returned HTTP ${response.status}`);
    const body = await response.json();
    const run = (body.workflow_runs || []).find((item) => item.event === 'push') || body.workflow_runs?.[0];
    if (!run) {
      addFinding({
        area: 'github',
        check: 'latest-main-deployment',
        severity: 'warning',
        status: 'warn',
        summary: 'No completed main deploy workflow run was found.',
      });
      return;
    }

    const success = run.conclusion === 'success';
    addFinding({
      area: 'github',
      check: 'latest-main-deployment',
      severity: 'critical',
      status: success ? 'pass' : 'fail',
      summary: success
        ? `Latest completed main deploy succeeded (run #${run.run_number}).`
        : `Latest completed main deploy concluded ${run.conclusion || 'unknown'} (run #${run.run_number}).`,
      evidence: [run.html_url].filter(Boolean),
    });
  } catch (error) {
    addFinding({
      area: 'github',
      check: 'latest-main-deployment',
      severity: 'warning',
      status: 'warn',
      summary: 'Could not query recent GitHub deployment health.',
      evidence: error instanceof Error ? error.message : String(error),
    });
  }
}

function auditDependencies() {
  const targets = [
    ['web-app', ROOT],
    ['functions', path.join(ROOT, 'functions')],
  ];

  for (const [label, cwd] of targets) {
    const lockfile = path.join(cwd, 'package-lock.json');
    if (!existsSync(lockfile)) {
      addFinding({
        area: 'dependencies',
        check: `${label}-npm-audit`,
        severity: 'warning',
        status: 'warn',
        summary: `${label} package-lock.json is missing; dependency audit skipped.`,
      });
      continue;
    }

    const result = run('npm', ['audit', '--omit=dev', '--json'], { cwd });
    const raw = result.stdout?.trim();
    if (!raw) {
      addFinding({
        area: 'dependencies',
        check: `${label}-npm-audit`,
        severity: 'warning',
        status: 'warn',
        summary: `${label} npm audit did not return JSON.`,
        evidence: result.stderr?.trim() || 'npm audit returned no output',
      });
      continue;
    }

    try {
      const report = JSON.parse(raw);
      const vulnerabilities = report.metadata?.vulnerabilities || {};
      const critical = Number(vulnerabilities.critical || 0);
      const high = Number(vulnerabilities.high || 0);
      const moderate = Number(vulnerabilities.moderate || 0);
      const total = Number(vulnerabilities.total || 0);

      if (critical > 0) {
        addFinding({
          area: 'dependencies',
          check: `${label}-npm-audit`,
          severity: 'critical',
          status: 'fail',
          summary: `${label} has ${critical} critical production dependency vulnerability/vulnerabilities.`,
          evidence: [`high=${high}`, `moderate=${moderate}`, `total=${total}`],
        });
      } else if (high > 0) {
        addFinding({
          area: 'dependencies',
          check: `${label}-npm-audit`,
          severity: 'warning',
          status: 'warn',
          summary: `${label} has ${high} high-severity production dependency vulnerability/vulnerabilities.`,
          evidence: [`moderate=${moderate}`, `total=${total}`],
        });
      } else if (moderate > 0) {
        addFinding({
          area: 'dependencies',
          check: `${label}-npm-audit`,
          severity: 'warning',
          status: 'warn',
          summary: `${label} has ${moderate} moderate production dependency vulnerability/vulnerabilities.`,
          evidence: [`total=${total}`],
        });
      } else {
        addFinding({
          area: 'dependencies',
          check: `${label}-npm-audit`,
          severity: 'warning',
          status: 'pass',
          summary: `${label} has no moderate/high/critical production dependency vulnerabilities reported by npm audit.`,
          evidence: [`total=${total}`],
        });
      }
    } catch (error) {
      addFinding({
        area: 'dependencies',
        check: `${label}-npm-audit`,
        severity: 'warning',
        status: 'warn',
        summary: `${label} npm audit output could not be parsed.`,
        evidence: error instanceof Error ? error.message : String(error),
      });
    }
  }
}

function writeReports() {
  const criticalFailures = findings.filter(
    (finding) => finding.severity === 'critical' && finding.status === 'fail',
  ).length;
  const warningFindings = findings.filter(
    (finding) => finding.status === 'warn' || (finding.severity === 'warning' && finding.status === 'fail'),
  ).length;
  const passed = findings.filter((finding) => finding.status === 'pass').length;
  const overall = criticalFailures > 0 ? 'CRITICAL' : warningFindings > 0 ? 'WARNING' : 'HEALTHY';

  const report = {
    agent: 'Tiny Steps Technical Reliability Agent',
    version: 1,
    generatedAt: new Date().toISOString(),
    origin: ORIGIN,
    commitSha: process.env.GITHUB_SHA || null,
    summary: {
      overall,
      criticalFailures,
      warningFindings,
      passed,
      totalChecks: findings.length,
    },
    findings,
  };

  mkdirSync(REPORT_DIR, { recursive: true });
  writeFileSync(path.join(REPORT_DIR, 'report.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');

  const lines = [
    '# Tiny Steps Technical Reliability Agent',
    '',
    `**Overall:** ${overall}`,
    '',
    `Generated: ${report.generatedAt}`,
    '',
    `Critical failures: **${criticalFailures}**  `,
    `Warnings: **${warningFindings}**  `,
    `Passed checks: **${passed}**  `,
    `Total checks: **${findings.length}**`,
    '',
    '| Area | Severity | Status | Check | Finding |',
    '|---|---|---|---|---|',
    ...findings.map((finding) =>
      `| ${finding.area} | ${finding.severity} | ${finding.status} | ${finding.check} | ${finding.summary.replace(/\|/g, '\\|')} |`,
    ),
    '',
    '## Evidence for non-passing checks',
    '',
  ];

  for (const finding of findings.filter((item) => item.status !== 'pass' && item.evidence.length)) {
    lines.push(`### ${finding.area} / ${finding.check}`);
    lines.push('');
    for (const evidence of finding.evidence) lines.push(`- ${String(evidence).replace(/\n/g, ' ')}`);
    lines.push('');
  }

  writeFileSync(path.join(REPORT_DIR, 'report.md'), `${lines.join('\n')}\n`, 'utf8');
  console.log(JSON.stringify(report.summary));
}

async function main() {
  auditRepositorySecrets();
  auditFirebaseRules();
  auditCiCdContract();
  auditTeamsSourceContract();
  auditTeamsDeployment();
  auditDependencies();
  await auditLiveSite();
  await auditLatestDeploy();
  writeReports();
}

await main();
