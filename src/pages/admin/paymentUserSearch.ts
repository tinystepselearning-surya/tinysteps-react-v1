import { useEffect, useState } from 'react';
import {
  collection,
  doc,
  endAt,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  startAt,
  where,
  type Firestore,
  type QueryConstraint,
} from 'firebase/firestore';

export type PaymentSearchUser = {
  id: string;
  displayName?: string;
  name?: string;
  email?: string;
  phone?: string;
  phoneLocal?: string;
  phoneNormalized?: string;
  role?: string;
  roles?: string[];
};

export const PAYMENT_USER_SEARCH_MIN_CHARS = 2;
export const PAYMENT_USER_SEARCH_QUERY_LIMIT = 8;
export const PAYMENT_USER_SEARCH_RESULT_LIMIT = 8;
export const PAYMENT_USER_SEARCH_DEBOUNCE_MS = 250;

const buildPrefixEnd = (value: string) => `${value}\uf8ff`;

const normalizePhoneSearchTerm = (value: string): string =>
  value.replace(/[^\d+]/g, '').trim();

const normalizeDigits = (value: unknown): string =>
  String(value || '').replace(/\D/g, '');

const normalizeText = (value: unknown): string =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');

const toTitleCase = (value: string): string =>
  value.replace(/\b\w/g, (char) => char.toUpperCase());

const buildUniqueValues = (...values: Array<string | undefined>): string[] => {
  const seen = new Set<string>();
  const result: string[] = [];

  values.forEach((value) => {
    const trimmed = String(value || '').trim();
    if (!trimmed || seen.has(trimmed)) return;
    seen.add(trimmed);
    result.push(trimmed);
  });

  return result;
};

type SearchQueryDefinition = {
  key: string;
  constraints: QueryConstraint[];
};

type SearchShape = {
  emailLike: boolean;
  phoneLike: boolean;
  normalizedPhone: string;
};

const resolveSearchShape = (searchTerm: string): SearchShape => {
  const trimmed = searchTerm.trim();
  const normalizedPhone = normalizePhoneSearchTerm(trimmed);
  const digits = normalizeDigits(trimmed);
  const phoneLike = digits.length >= 4 && /^[+\d\s().-]+$/.test(trimmed);
  return {
    emailLike: trimmed.includes('@'),
    phoneLike,
    normalizedPhone,
  };
};

const buildExactQueryDefinitions = (searchTerm: string): SearchQueryDefinition[] => {
  const trimmed = searchTerm.trim();
  const { emailLike, phoneLike, normalizedPhone } = resolveSearchShape(trimmed);
  const definitions: SearchQueryDefinition[] = [];

  if (emailLike) {
    buildUniqueValues(trimmed.toLowerCase(), trimmed).forEach((value) => {
      definitions.push({
        key: `exact:email:${value}`,
        constraints: [where('email', '==', value), limit(PAYMENT_USER_SEARCH_QUERY_LIMIT)],
      });
    });
    return definitions;
  }

  if (phoneLike) {
    buildUniqueValues(trimmed, normalizedPhone).forEach((value) => {
      definitions.push({
        key: `exact:phone:${value}`,
        constraints: [where('phone', '==', value), limit(PAYMENT_USER_SEARCH_QUERY_LIMIT)],
      });
      definitions.push({
        key: `exact:phoneLocal:${value}`,
        constraints: [where('phoneLocal', '==', value), limit(PAYMENT_USER_SEARCH_QUERY_LIMIT)],
      });
    });
    if (normalizedPhone) {
      definitions.push({
        key: `exact:phoneNormalized:${normalizedPhone}`,
        constraints: [where('phoneNormalized', '==', normalizedPhone), limit(PAYMENT_USER_SEARCH_QUERY_LIMIT)],
      });
    }
    return definitions;
  }

  buildUniqueValues(trimmed, trimmed.toLowerCase(), toTitleCase(trimmed)).forEach((value) => {
    definitions.push({
      key: `exact:displayName:${value}`,
      constraints: [where('displayName', '==', value), limit(PAYMENT_USER_SEARCH_QUERY_LIMIT)],
    });
    definitions.push({
      key: `exact:name:${value}`,
      constraints: [where('name', '==', value), limit(PAYMENT_USER_SEARCH_QUERY_LIMIT)],
    });
  });

  if (!trimmed.includes(' ')) {
    buildUniqueValues(trimmed.toLowerCase(), trimmed).forEach((value) => {
      definitions.push({
        key: `exact:email:${value}`,
        constraints: [where('email', '==', value), limit(PAYMENT_USER_SEARCH_QUERY_LIMIT)],
      });
    });
  }

  return definitions;
};

const buildPrefixQueryDefinitions = (searchTerm: string): SearchQueryDefinition[] => {
  const trimmed = searchTerm.trim();
  const { emailLike, phoneLike, normalizedPhone } = resolveSearchShape(trimmed);
  const definitions: SearchQueryDefinition[] = [];

  if (emailLike) {
    buildUniqueValues(trimmed.toLowerCase(), trimmed).forEach((value) => {
      definitions.push({
        key: `prefix:email:${value}`,
        constraints: [orderBy('email'), startAt(value), endAt(buildPrefixEnd(value)), limit(PAYMENT_USER_SEARCH_QUERY_LIMIT)],
      });
    });
    return definitions;
  }

  if (phoneLike) {
    buildUniqueValues(normalizedPhone, trimmed).forEach((value) => {
      definitions.push({
        key: `prefix:phoneNormalized:${value}`,
        constraints: [
          orderBy('phoneNormalized'),
          startAt(value),
          endAt(buildPrefixEnd(value)),
          limit(PAYMENT_USER_SEARCH_QUERY_LIMIT),
        ],
      });
    });
    return definitions;
  }

  buildUniqueValues(trimmed, trimmed.toLowerCase(), toTitleCase(trimmed)).forEach((value) => {
    definitions.push({
      key: `prefix:displayName:${value}`,
      constraints: [
        orderBy('displayName'),
        startAt(value),
        endAt(buildPrefixEnd(value)),
        limit(PAYMENT_USER_SEARCH_QUERY_LIMIT),
      ],
    });
    definitions.push({
      key: `prefix:name:${value}`,
      constraints: [orderBy('name'), startAt(value), endAt(buildPrefixEnd(value)), limit(PAYMENT_USER_SEARCH_QUERY_LIMIT)],
    });
  });

  if (!trimmed.includes(' ')) {
    buildUniqueValues(trimmed.toLowerCase(), trimmed).forEach((value) => {
      definitions.push({
        key: `prefix:email:${value}`,
        constraints: [orderBy('email'), startAt(value), endAt(buildPrefixEnd(value)), limit(PAYMENT_USER_SEARCH_QUERY_LIMIT)],
      });
    });
  }

  return definitions;
};

const dedupeDefinitions = (definitions: SearchQueryDefinition[]): SearchQueryDefinition[] => {
  const seen = new Set<string>();
  return definitions.filter((definition) => {
    if (seen.has(definition.key)) return false;
    seen.add(definition.key);
    return true;
  });
};

const userPrimaryName = (user: PaymentSearchUser): string =>
  String(user.displayName || user.name || user.email || user.id || '').trim();

const paymentUserMatchScore = (user: PaymentSearchUser, searchTerm: string): number | null => {
  const term = normalizeText(searchTerm);
  if (!term) return null;
  const digits = normalizeDigits(searchTerm);

  const id = normalizeText(user.id);
  const displayName = normalizeText(user.displayName);
  const name = normalizeText(user.name);
  const email = normalizeText(user.email);
  const phones = [user.phone, user.phoneLocal, user.phoneNormalized]
    .map(normalizeDigits)
    .filter(Boolean);

  if (id === term) return 0;
  if (email === term) return 1;
  if (digits && phones.some((phone) => phone === digits)) return 1;
  if (displayName === term || name === term) return 2;

  if (displayName.startsWith(term) || name.startsWith(term)) return 10;
  const nameTokens = `${displayName} ${name}`.split(/\s+/).filter(Boolean);
  if (nameTokens.some((token) => token.startsWith(term))) return 12;
  if (email.startsWith(term)) return 15;
  if (digits && phones.some((phone) => phone.startsWith(digits))) return 15;
  if (id.startsWith(term)) return 18;

  if (displayName.includes(term) || name.includes(term)) return 25;
  if (email.includes(term)) return 30;
  if (id.includes(term)) return 35;
  if (digits && phones.some((phone) => phone.includes(digits))) return 35;

  return null;
};

/**
 * Ranks only genuine matches. When a unique-identifier or exact-name tier is
 * present, weaker partial matches are suppressed so the picker does not show
 * distracting parents after an exact match has already been found.
 */
export function rankPaymentUsers<TUser extends PaymentSearchUser>(
  users: TUser[],
  searchTerm: string,
  resultLimit = PAYMENT_USER_SEARCH_RESULT_LIMIT,
): TUser[] {
  const scored = users
    .map((user) => ({ user, score: paymentUserMatchScore(user, searchTerm) }))
    .filter((item): item is { user: TUser; score: number } => item.score !== null)
    .sort((left, right) => {
      if (left.score !== right.score) return left.score - right.score;
      const nameDiff = userPrimaryName(left.user).localeCompare(userPrimaryName(right.user), undefined, {
        sensitivity: 'base',
      });
      return nameDiff !== 0 ? nameDiff : left.user.id.localeCompare(right.user.id);
    });

  if (!scored.length) return [];
  const bestScore = scored[0].score;
  const narrowed = bestScore <= 2 ? scored.filter((item) => item.score === bestScore) : scored;
  return narrowed.slice(0, Math.max(1, resultLimit)).map((item) => item.user);
}

export async function searchPaymentUsers<TUser extends PaymentSearchUser>({
  db,
  searchTerm,
  isValidUser,
}: {
  db: Firestore;
  searchTerm: string;
  isValidUser: (user: TUser) => boolean;
}): Promise<TUser[]> {
  const trimmed = searchTerm.trim();
  if (trimmed.length < PAYMENT_USER_SEARCH_MIN_CHARS) return [];

  const byId = new Map<string, TUser>();
  const appendDocs = (docs: Array<{ id: string; data: () => unknown }>) => {
    docs.forEach((docSnap) => {
      const rawData = docSnap.data();
      const user = {
        id: docSnap.id,
        ...((rawData && typeof rawData === 'object') ? (rawData as Record<string, unknown>) : {}),
      } as TUser;
      if (!isValidUser(user)) return;
      if (!byId.has(user.id)) byId.set(user.id, user);
    });
  };

  const runDefinitions = async (definitions: SearchQueryDefinition[]) => {
    const snapshots = await Promise.all(
      dedupeDefinitions(definitions).map((definition) =>
        getDocs(query(collection(db, 'users'), ...definition.constraints)).catch(() => null)
      )
    );
    snapshots.forEach((snapshot) => {
      if (snapshot) appendDocs(snapshot.docs as Array<{ id: string; data: () => unknown }>);
    });
  };

  const [directIdSnapshot] = await Promise.all([
    getDoc(doc(db, 'users', trimmed)).catch(() => null),
    runDefinitions(buildExactQueryDefinitions(trimmed)),
  ]);
  if (directIdSnapshot?.exists()) {
    appendDocs([{ id: directIdSnapshot.id, data: () => directIdSnapshot.data() }]);
  }

  const exactRanked = rankPaymentUsers(Array.from(byId.values()), trimmed);
  if (exactRanked.length) {
    const bestScore = paymentUserMatchScore(exactRanked[0], trimmed);
    if (bestScore != null && bestScore <= 2) return exactRanked;
  }

  await runDefinitions(buildPrefixQueryDefinitions(trimmed));
  return rankPaymentUsers(Array.from(byId.values()), trimmed);
}

export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeoutId = globalThis.setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => globalThis.clearTimeout(timeoutId);
  }, [delayMs, value]);

  return debouncedValue;
}
