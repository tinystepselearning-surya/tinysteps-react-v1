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
export const PAYMENT_USER_SEARCH_QUERY_LIMIT = 10;
export const PAYMENT_USER_SEARCH_RESULT_LIMIT = 10;
export const PAYMENT_USER_SEARCH_DEBOUNCE_MS = 300;

const buildPrefixEnd = (value: string) => `${value}\uf8ff`;

const normalizePhoneSearchTerm = (value: string): string =>
  value.replace(/[^\d+]/g, '').trim();

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

const buildPrefixValues = (searchTerm: string, opts?: { email?: boolean; name?: boolean; phone?: boolean }) => {
  const trimmed = searchTerm.trim();
  const normalizedPhone = normalizePhoneSearchTerm(trimmed);

  return {
    email: opts?.email
      ? buildUniqueValues(trimmed.toLowerCase(), trimmed)
      : [],
    name: opts?.name
      ? buildUniqueValues(trimmed, trimmed.toLowerCase(), toTitleCase(trimmed))
      : [],
    phone: opts?.phone
      ? buildUniqueValues(normalizedPhone, trimmed)
      : [],
  };
};

type SearchQueryDefinition = {
  key: string;
  constraints: QueryConstraint[];
};

const buildQueryDefinitions = (searchTerm: string): SearchQueryDefinition[] => {
  const trimmed = searchTerm.trim();
  const normalizedPhone = normalizePhoneSearchTerm(trimmed);
  const prefixes = buildPrefixValues(trimmed, { email: true, name: true, phone: true });
  const definitions: SearchQueryDefinition[] = [
    {
      key: `exact:email:${trimmed}`,
      constraints: [where('email', '==', trimmed), limit(PAYMENT_USER_SEARCH_QUERY_LIMIT)],
    },
    {
      key: `exact:phone:${trimmed}`,
      constraints: [where('phone', '==', trimmed), limit(PAYMENT_USER_SEARCH_QUERY_LIMIT)],
    },
    {
      key: `exact:phoneLocal:${trimmed}`,
      constraints: [where('phoneLocal', '==', trimmed), limit(PAYMENT_USER_SEARCH_QUERY_LIMIT)],
    },
    {
      key: `exact:phoneNormalized:${normalizedPhone || trimmed}`,
      constraints: [
        where('phoneNormalized', '==', normalizedPhone || trimmed),
        limit(PAYMENT_USER_SEARCH_QUERY_LIMIT),
      ],
    },
    {
      key: `exact:displayName:${trimmed}`,
      constraints: [where('displayName', '==', trimmed), limit(PAYMENT_USER_SEARCH_QUERY_LIMIT)],
    },
    {
      key: `exact:name:${trimmed}`,
      constraints: [where('name', '==', trimmed), limit(PAYMENT_USER_SEARCH_QUERY_LIMIT)],
    },
  ];

  prefixes.email.forEach((value) => {
    definitions.push({
      key: `prefix:email:${value}`,
      constraints: [
        orderBy('email'),
        startAt(value),
        endAt(buildPrefixEnd(value)),
        limit(PAYMENT_USER_SEARCH_QUERY_LIMIT),
      ],
    });
  });

  prefixes.name.forEach((value) => {
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
      constraints: [
        orderBy('name'),
        startAt(value),
        endAt(buildPrefixEnd(value)),
        limit(PAYMENT_USER_SEARCH_QUERY_LIMIT),
      ],
    });
  });

  prefixes.phone.forEach((value) => {
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

  const seen = new Set<string>();
  return definitions.filter((definition) => {
    if (seen.has(definition.key)) return false;
    seen.add(definition.key);
    return true;
  });
};

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
  const definitions = buildQueryDefinitions(trimmed);

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

  const snapshots = await Promise.all(
    definitions.map((definition) =>
      getDocs(query(collection(db, 'users'), ...definition.constraints)).catch(() => null)
    )
  );
  snapshots.forEach((snapshot) => {
    if (snapshot) appendDocs(snapshot.docs as Array<{ id: string; data: () => unknown }>);
  });

  const directIdSnapshot = await getDoc(doc(db, 'users', trimmed)).catch(() => null);
  if (directIdSnapshot?.exists()) {
    appendDocs([{ id: directIdSnapshot.id, data: () => directIdSnapshot.data() }]);
  }

  return Array.from(byId.values()).slice(0, PAYMENT_USER_SEARCH_RESULT_LIMIT);
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
