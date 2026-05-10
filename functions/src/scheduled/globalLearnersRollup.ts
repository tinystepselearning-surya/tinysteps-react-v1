import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';
import { onSchedule } from 'firebase-functions/v2/scheduler';

if (!admin.apps.length) {
  admin.initializeApp();
}

const REGION = 'asia-south1';
const OUTPUT_PATH = 'public-stats/global-learners.json';
const CACHE_CONTROL = 'public, max-age=86400, s-maxage=86400';

const PARENT_ROLE = 'parent';
const EXCLUDED_PARENT_STATUSES = new Set(['archived', 'deleted', 'disabled']);
const COUNTRY_CODE_REGEX = /^[A-Z]{2}$/;
const DIGITS_ONLY_REGEX = /^\d+$/;

const PHONE_COUNTRY_TO_ISO: Record<string, string> = {
  '91': 'IN',
  '971': 'AE',
  '92': 'PK',
  '385': 'HR',
  '968': 'OM',
  '353': 'IE',
  '44': 'GB',
  '1': 'US',
  '65': 'SG',
  '61': 'AU',
};

const COUNTRY_NAMES: Record<string, string> = {
  IN: 'India',
  AE: 'United Arab Emirates',
  PK: 'Pakistan',
  HR: 'Croatia',
  OM: 'Oman',
  IE: 'Ireland',
  GB: 'United Kingdom',
  US: 'United States',
  SG: 'Singapore',
  AU: 'Australia',
};

type CountryRow = {
  countryCode: string;
  countryName: string;
  familyCount: number;
  activeStudents: number; // backward-compatible key for existing frontend payload shape
};

type ParentCountryNormalizationResult = {
  countryCode: string | null;
  hasValue: boolean;
  unmappedPhoneCountryCode: string | null;
};

type ParentCountryResolutionResult = {
  countryCode: string | null;
  source: 'iso' | 'phone' | null;
  unmappedPhoneCountryCode: string | null;
};

function normalizeStatus(value: unknown): string {
  return String(value || '').trim().toLowerCase();
}

function normalizeRole(value: unknown): string {
  return String(value || '').trim().toLowerCase();
}

function normalizeIsoCountryCode(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toUpperCase();
  if (!COUNTRY_CODE_REGEX.test(normalized)) return null;
  return normalized;
}

function resolveCountryName(countryCode: string): string {
  return COUNTRY_NAMES[countryCode] || countryCode;
}

function normalizePhoneCountryCode(value: unknown): ParentCountryNormalizationResult {
  if (typeof value !== 'string') {
    return { countryCode: null, hasValue: false, unmappedPhoneCountryCode: null };
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return { countryCode: null, hasValue: false, unmappedPhoneCountryCode: null };
  }

  const compact = trimmed.replace(/[\s\-()]/g, '');
  if (!compact) {
    return { countryCode: null, hasValue: false, unmappedPhoneCountryCode: null };
  }

  const isoCandidate = compact.toUpperCase();
  if (COUNTRY_CODE_REGEX.test(isoCandidate)) {
    return { countryCode: isoCandidate, hasValue: true, unmappedPhoneCountryCode: null };
  }

  let digitsCandidate = compact;
  if (digitsCandidate.startsWith('+')) {
    digitsCandidate = digitsCandidate.slice(1);
  }
  while (digitsCandidate.startsWith('00')) {
    digitsCandidate = digitsCandidate.slice(2);
  }

  if (!digitsCandidate || !DIGITS_ONLY_REGEX.test(digitsCandidate)) {
    return {
      countryCode: null,
      hasValue: true,
      unmappedPhoneCountryCode: '__INVALID_FORMAT__',
    };
  }

  const mapped = PHONE_COUNTRY_TO_ISO[digitsCandidate];
  if (mapped) {
    return { countryCode: mapped, hasValue: true, unmappedPhoneCountryCode: null };
  }

  if (digitsCandidate.length > 4) {
    return {
      countryCode: null,
      hasValue: true,
      unmappedPhoneCountryCode: '__NON_CODE_NUMERIC__',
    };
  }

  return {
    countryCode: null,
    hasValue: true,
    unmappedPhoneCountryCode: `+${digitsCandidate}`,
  };
}

function isExcludedParentRecord(data: Record<string, unknown>): boolean {
  const status = normalizeStatus(data.status);
  if (EXCLUDED_PARENT_STATUSES.has(status)) return true;

  if (data.deleted === true || data.isDeleted === true) return true;
  if (data.deletedAt != null) return true;
  if (data.isTest === true || data.test === true) return true;
  if (data.isSystem === true || data.system === true) return true;

  return false;
}

function resolveCountryFromParentDoc(data: Record<string, unknown>): ParentCountryResolutionResult {
  const isoCountryCode = normalizeIsoCountryCode(data.countryCode);
  if (isoCountryCode) {
    return { countryCode: isoCountryCode, source: 'iso', unmappedPhoneCountryCode: null };
  }

  const phoneCountry = normalizePhoneCountryCode(data.phoneCountryCode);
  if (phoneCountry.countryCode) {
    return { countryCode: phoneCountry.countryCode, source: 'phone', unmappedPhoneCountryCode: null };
  }

  return {
    countryCode: null,
    source: null,
    unmappedPhoneCountryCode: phoneCountry.unmappedPhoneCountryCode,
  };
}

export const globalLearnersRollup = onSchedule(
  {
    schedule: '30 2 * * *', // Daily 02:30 IST
    timeZone: 'Asia/Kolkata',
    region: REGION,
    memory: '256MiB',
    timeoutSeconds: 300,
  },
  async () => {
    const db = admin.firestore();
    const bucket = admin.storage().bucket();

    const parentUsersSnap = await db
      .collection('users')
      .where('role', '==', PARENT_ROLE)
      .select(
        'role',
        'status',
        'countryCode',
        'phoneCountryCode',
        'deleted',
        'isDeleted',
        'deletedAt',
        'isTest',
        'test',
        'isSystem',
        'system',
      )
      .get();

    const counts = new Map<string, number>();
    const unmappedPhoneCountryCodeCounts = new Map<string, number>();
    let totalParentUsersScanned = 0;
    let countedFromParentCountryCode = 0;
    let countedFromParentIsoCountryCode = 0;
    let skippedMissingCountryCode = 0;
    let skippedUnmappedPhoneCountryCode = 0;

    for (const docSnap of parentUsersSnap.docs) {
      const data = (docSnap.data() || {}) as Record<string, unknown>;
      if (normalizeRole(data.role) !== PARENT_ROLE) continue;
      totalParentUsersScanned += 1;

      if (isExcludedParentRecord(data)) continue;

      const resolved = resolveCountryFromParentDoc(data);
      if (!resolved.countryCode) {
        skippedMissingCountryCode += 1;
        if (resolved.unmappedPhoneCountryCode) {
          skippedUnmappedPhoneCountryCode += 1;
          unmappedPhoneCountryCodeCounts.set(
            resolved.unmappedPhoneCountryCode,
            (unmappedPhoneCountryCodeCounts.get(resolved.unmappedPhoneCountryCode) || 0) + 1,
          );
        }
        continue;
      }

      if (resolved.source === 'iso') {
        countedFromParentIsoCountryCode += 1;
      } else if (resolved.source === 'phone') {
        countedFromParentCountryCode += 1;
      }

      counts.set(resolved.countryCode, (counts.get(resolved.countryCode) || 0) + 1);
    }

    const countries: CountryRow[] = Array.from(counts.entries())
      .map(([countryCode, familyCount]) => ({
        countryCode,
        countryName: resolveCountryName(countryCode),
        familyCount,
        activeStudents: familyCount,
      }))
      .sort((a, b) => {
        if (b.familyCount !== a.familyCount) return b.familyCount - a.familyCount;
        return a.countryName.localeCompare(b.countryName);
      });

    const totalFamiliesWithCountry = countries.reduce(
      (sum, row) => sum + row.familyCount,
      0,
    );

    const unmappedPhoneCountryCodeSummary = Array.from(unmappedPhoneCountryCodeCounts.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .reduce<Record<string, number>>((acc, [code, count]) => {
        acc[code] = count;
        return acc;
      }, {});

    const familiesByCountryCode = countries.reduce<Record<string, number>>((acc, row) => {
      acc[row.countryCode] = row.familyCount;
      return acc;
    }, {});

    const payload = {
      totalActiveCountries: countries.length,
      totalActiveStudentsWithCountry: totalFamiliesWithCountry,
      totalFamiliesWithCountry,
      countries,
      updatedAt: new Date().toISOString(),
      source: 'daily_parent_country_rollup',
    };

    const file = bucket.file(OUTPUT_PATH);
    await file.save(JSON.stringify(payload, null, 2), {
      resumable: false,
      contentType: 'application/json; charset=utf-8',
      metadata: {
        cacheControl: CACHE_CONTROL,
      },
    });

    logger.info('globalLearnersRollup: completed', {
      totalParentUsersScanned,
      countedFromParentCountryCode,
      countedFromParentIsoCountryCode,
      skippedMissingCountryCode,
      skippedUnmappedPhoneCountryCode,
      unmappedPhoneCountryCodeSummary,
      finalCountries: countries.map((row) => row.countryCode),
      familiesByCountryCode,
      totalFamiliesWithCountry,
      totalActiveCountries: payload.totalActiveCountries,
    });
  },
);
