import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import {
  normalizeIsoCountryCode,
  resolveCountryFromParentDoc,
  resolveCountryName,
} from '../helpers/parentCountryCoverage';

if (!admin.apps.length) {
  admin.initializeApp();
}

const REGION = 'asia-south1';
const OUTPUT_PATH = 'public-stats/global-learners.json';
const CACHE_CONTROL = 'public, max-age=86400, s-maxage=86400';

const PARENT_ROLE = 'parent';
// Archived parents are intentionally included: this map represents countries
// Tiny Steps has served historically, not only currently active families.
const EXCLUDED_PARENT_STATUSES = new Set(['deleted', 'disabled']);
const INFERRED_COUNTRY_SOURCE = 'phone-inferred';

type CountryRow = {
  countryCode: string;
  countryName: string;
  familyCount: number;
  // Backward-compatible alias for the existing public payload. This value is a
  // family count, not a student count, and should not be used for new UI copy.
  activeStudents: number;
};

type CountryBackfill = {
  ref: admin.firestore.DocumentReference;
  countryCode: string;
};

function normalizeStatus(value: unknown): string {
  return String(value || '').trim().toLowerCase();
}

function normalizeRole(value: unknown): string {
  return String(value || '').trim().toLowerCase();
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

async function persistCountryBackfills(
  db: admin.firestore.Firestore,
  backfills: CountryBackfill[],
): Promise<number> {
  if (!backfills.length) return 0;

  let written = 0;
  for (let start = 0; start < backfills.length; start += 400) {
    const batch = db.batch();
    const slice = backfills.slice(start, start + 400);
    for (const item of slice) {
      batch.set(item.ref, {
        countryCode: item.countryCode,
        countryCodeSource: INFERRED_COUNTRY_SOURCE,
        countryCodeUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
    }
    await batch.commit();
    written += slice.length;
  }
  return written;
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
        'countryCodeSource',
        'phoneCountryCode',
        'phoneLocal',
        'phone',
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
    const countryBackfills: CountryBackfill[] = [];
    let totalParentUsersScanned = 0;
    let totalEligibleFamiliesScanned = 0;
    let archivedFamiliesIncluded = 0;
    let countedFromCanonicalCountryCode = 0;
    let countedFromPhoneCountryCode = 0;
    let countedFromFullPhone = 0;
    let skippedMissingCountryCode = 0;
    let skippedUnmappedPhoneCountryCode = 0;

    for (const docSnap of parentUsersSnap.docs) {
      const data = (docSnap.data() || {}) as Record<string, unknown>;
      if (normalizeRole(data.role) !== PARENT_ROLE) continue;
      totalParentUsersScanned += 1;

      if (isExcludedParentRecord(data)) continue;
      totalEligibleFamiliesScanned += 1;
      if (normalizeStatus(data.status) === 'archived') {
        archivedFamiliesIncluded += 1;
      }

      // A manually/canonically supplied ISO code always wins. A code previously
      // inferred from phone data is re-resolved so later phone corrections can
      // repair the stored country without manual backfill work.
      const existingCountryCode = normalizeIsoCountryCode(data.countryCode);
      const isPhoneInferredCountry = data.countryCodeSource === INFERRED_COUNTRY_SOURCE;
      const resolutionInput = isPhoneInferredCountry
        ? { ...data, countryCode: undefined }
        : data;
      const resolved = resolveCountryFromParentDoc(resolutionInput);

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
        countedFromCanonicalCountryCode += 1;
      } else if (resolved.source === 'phone-country-code') {
        countedFromPhoneCountryCode += 1;
      } else if (resolved.source === 'full-phone') {
        countedFromFullPhone += 1;
      }

      if (
        resolved.source !== 'iso' &&
        (existingCountryCode !== resolved.countryCode || !isPhoneInferredCountry)
      ) {
        countryBackfills.push({ ref: docSnap.ref, countryCode: resolved.countryCode });
      }

      counts.set(resolved.countryCode, (counts.get(resolved.countryCode) || 0) + 1);
    }

    const persistedCountryBackfills = await persistCountryBackfills(db, countryBackfills);

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

    const updatedAt = new Date().toISOString();
    const payload = {
      // Canonical historical-coverage semantics.
      totalCountriesServed: countries.length,
      totalFamiliesWithCountry,
      countries,
      updatedAt,
      source: 'daily_parent_country_coverage_rollup',
      coverageDefinition: 'active_archived_and_completed_parent_families_excluding_deleted_test_and_system_records',
      schedule: 'daily_02_30_Asia_Kolkata',

      // Backward-compatible aliases consumed by older clients.
      totalActiveCountries: countries.length,
      totalActiveStudentsWithCountry: totalFamiliesWithCountry,
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
      updatedAt,
      totalParentUsersScanned,
      totalEligibleFamiliesScanned,
      archivedFamiliesIncluded,
      countedFromCanonicalCountryCode,
      countedFromPhoneCountryCode,
      countedFromFullPhone,
      persistedCountryBackfills,
      skippedMissingCountryCode,
      skippedUnmappedPhoneCountryCode,
      unmappedPhoneCountryCodeSummary,
      finalCountries: countries.map((row) => row.countryCode),
      familiesByCountryCode,
      totalFamiliesWithCountry,
      totalCountriesServed: payload.totalCountriesServed,
    });
  },
);
