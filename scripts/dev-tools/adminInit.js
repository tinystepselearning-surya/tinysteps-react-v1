import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import admin from 'firebase-admin';

const PROJECT_ID = 'tinysteps-react-v1';
const thisDir = path.dirname(fileURLToPath(import.meta.url));

function isFile(filePath) {
  try {
    return fs.statSync(filePath).isFile();
  } catch {
    return false;
  }
}

function findFirebaseAdminSdkFile(dir) {
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const match = entries.find(
      (entry) =>
        entry.isFile() &&
        /firebase-adminsdk.*\.json$/i.test(entry.name),
    );
    return match ? path.resolve(dir, match.name) : null;
  } catch {
    return null;
  }
}

export function resolveServiceAccountPath() {
  const envPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (typeof envPath === 'string' && envPath.trim()) {
    const absolutePath = path.resolve(envPath.trim());
    if (isFile(absolutePath)) return absolutePath;
  }

  const candidates = [
    path.resolve(process.cwd(), 'serviceAccount.json'),
    path.resolve(process.cwd(), 'firebase-service-account.json'),
    path.resolve(process.cwd(), 'tinysteps-react-v1-serviceAccount.json'),
    path.resolve(thisDir, 'serviceAccount.json'),
  ];

  for (const candidate of candidates) {
    if (isFile(candidate)) return candidate;
  }

  return findFirebaseAdminSdkFile(process.cwd()) || findFirebaseAdminSdkFile(thisDir);
}

function loadServiceAccountJson(serviceAccountPath) {
  try {
    const raw = fs.readFileSync(serviceAccountPath, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    throw new Error(
      `Failed to read service account JSON at ${serviceAccountPath}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

export function initializeAdminApp({
  projectId = PROJECT_ID,
  requireServiceAccount = false,
} = {}) {
  if (admin.apps.length) return admin.app();

  const serviceAccountPath = resolveServiceAccountPath();
  if (serviceAccountPath) {
    const serviceAccount = loadServiceAccountJson(serviceAccountPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId,
    });
    return admin.app();
  }

  if (requireServiceAccount) {
    throw new Error(
      'Service account JSON not found. Set GOOGLE_APPLICATION_CREDENTIALS or place serviceAccount.json in the repo root.',
    );
  }

  admin.initializeApp({ projectId });
  return admin.app();
}

export function credentialModeLabel() {
  const serviceAccountPath = resolveServiceAccountPath();
  return serviceAccountPath
    ? `service account file (${serviceAccountPath})`
    : 'application default credentials (ADC)';
}
