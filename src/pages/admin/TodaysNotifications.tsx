import React, { useEffect, useMemo, useState } from 'react';
import {
  collection,
  doc,
  documentId,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import { Card } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { Textarea } from '@components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@components/ui/table';
import { useToast } from '@components/hooks/use-toast';
import { db } from '../../lib/firebaseConfig';
import { doesSessionMatchEnrollmentSchedule } from '../../lib/sessionScheduleIntegrity';
import { useAuthStore } from '../../store/useAuthStore';

interface ClassSessionDoc {
  id: string;
  enrollmentId?: string;
  joinUrl?: string;
  meetingLink?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  startAt?: unknown;
  endAt?: unknown;
  status?: string;
  kidId?: string;
  kidIds?: string[];
  kidName?: string;
  childName?: string;
  kidNames?: Record<string, string> | string[];
  parentId?: string;
  parentIds?: string[];
  parentName?: string;
  parentPhone?: string;
  teacherId?: string;
  teacherName?: string;
  teacherPhone?: string;
  courseId?: string;
  courseName?: string;
  subject?: string;
  parentNotified?: boolean;
  teacherNotified?: boolean;
  source?: string;
  isMakeup?: boolean;
  makeupCreditId?: string;
  makeupForSessionId?: string;
  replacementSessionId?: string;
  rescheduledFromSessionId?: string;
  sessionType?: string;
  createdByFlow?: string;
}

interface EnrollmentDoc {
  id: string;
  status?: string;
  joinUrl?: string;
  meetingLink?: string;
  courseId?: string;
  courseName?: string;
  subject?: string;
  teacherId?: string;
  teacherIds?: string[];
  parentId?: string;
  parentIds?: string[];
  kidId?: string;
  kidIds?: string[];
  studentId?: string;
  childId?: string;
  schedule?: {
    weeklySlots?: Array<{
      weekday?: number;
      time?: string;
      durationMinutes?: number;
      durationMins?: number;
    }>;
    weekdays?: number[];
    timeHHmm?: string;
    durationMins?: number;
  };
}

type UserDoc = Record<string, any>;
type KidDoc = Record<string, any>;
type CourseDoc = Record<string, any>;
type UserPhoneField = 'phone' | 'mobile' | 'contactNumber' | 'whatsappPhone';
type MessageRecipient = 'parent' | 'teacher';
type NotificationMode = 'today' | 'upcoming' | 'overall-admissions';
type UpcomingFilterMode = 'range' | 'specific-date';

interface ResolvedUserDoc {
  docId: string;
  uid: string;
  data: UserDoc;
}

const TIMEZONE = 'Asia/Kolkata';
const USER_PHONE_FIELDS: UserPhoneField[] = ['phone', 'mobile', 'contactNumber', 'whatsappPhone'];
const COUNTRY_OPTIONS = [
  { id: 'IN', code: '+91', label: 'India (+91)' },
  { id: 'US', code: '+1', label: 'United States (+1)' },
  { id: 'CA', code: '+1', label: 'Canada (+1)' },
  { id: 'GB', code: '+44', label: 'United Kingdom (+44)' },
  { id: 'DE', code: '+49', label: 'Germany (+49)' },
  { id: 'AU', code: '+61', label: 'Australia (+61)' },
  { id: 'AE', code: '+971', label: 'United Arab Emirates (+971)' },
  { id: 'SG', code: '+65', label: 'Singapore (+65)' },
  { id: 'ZA', code: '+27', label: 'South Africa (+27)' },
  { id: 'NZ', code: '+64', label: 'New Zealand (+64)' },
  { id: 'SA', code: '+966', label: 'Saudi Arabia (+966)' },
  { id: 'QA', code: '+974', label: 'Qatar (+974)' },
  { id: 'KW', code: '+965', label: 'Kuwait (+965)' },
  { id: 'OM', code: '+968', label: 'Oman (+968)' },
  { id: 'BH', code: '+973', label: 'Bahrain (+973)' },
  { id: 'IE', code: '+353', label: 'Ireland (+353)' },
  { id: 'FR', code: '+33', label: 'France (+33)' },
  { id: 'NL', code: '+31', label: 'Netherlands (+31)' },
  { id: 'CH', code: '+41', label: 'Switzerland (+41)' },
  { id: 'MY', code: '+60', label: 'Malaysia (+60)' },
  { id: 'ES', code: '+34', label: 'Spain (+34)' },
  { id: 'IT', code: '+39', label: 'Italy (+39)' },
  { id: 'JP', code: '+81', label: 'Japan (+81)' },
  { id: 'SE', code: '+46', label: 'Sweden (+46)' },
  { id: 'NO', code: '+47', label: 'Norway (+47)' },
] as const;
const CUSTOM_COUNTRY_ID = 'CUSTOM';
const DEFAULT_PARENT_TEMPLATE = `Hello! 😊

Quick reminder: [Child Name] has Tiny Steps class today at [Time].

Please join on time for a fun and focused session.

Kindly inform us in advance for any changes/cancellations. Repeated no-shows may be penalised.

– Tiny Steps`;
const DEFAULT_TEACHER_TEMPLATE =
  "Hello [Teacher Name], this is a reminder for Tiny Steps class with [Child Name] at [Time]. Please be ready and join on time.";
const UPCOMING_RANGE_OPTIONS = [3, 7, 14, 30] as const;
const ALL_TEACHERS_FILTER = 'ALL_TEACHERS';
const ALL_STATUSES_FILTER = 'ALL_STATUSES';
const IST_OFFSET_MINUTES = 5.5 * 60;
const COUNTRY_CODE_TIMEZONE_DEFAULTS: Record<string, string> = {
  '+1': 'America/Los_Angeles',
  '+27': 'Africa/Johannesburg',
  '+31': 'Europe/Amsterdam',
  '+33': 'Europe/Paris',
  '+34': 'Europe/Madrid',
  '+39': 'Europe/Rome',
  '+41': 'Europe/Zurich',
  '+44': 'Europe/London',
  '+47': 'Europe/Oslo',
  '+49': 'Europe/Berlin',
  '+60': 'Asia/Kuala_Lumpur',
  '+61': 'Australia/Sydney',
  '+64': 'Pacific/Auckland',
  '+65': 'Asia/Singapore',
  '+81': 'Asia/Tokyo',
  '+91': TIMEZONE,
  '+353': 'Europe/Dublin',
  '+966': 'Asia/Riyadh',
  '+968': 'Asia/Muscat',
  '+971': 'Asia/Dubai',
  '+973': 'Asia/Bahrain',
  '+974': 'Asia/Qatar',
  '+965': 'Asia/Kuwait',
};
const getMessageDraftKey = (sessionId: string, recipient: MessageRecipient): string =>
  `${sessionId}:${recipient}:message`;

const countryCodeFromOptionId = (optionId: string): string => {
  const selected = COUNTRY_OPTIONS.find((option) => option.id === optionId);
  return selected ? selected.code : '';
};

const optionIdFromCountryCode = (countryCode: string): string => {
  const normalized = normalizeCountryCode(countryCode);
  const selected = COUNTRY_OPTIONS.find((option) => option.code === normalized);
  return selected ? selected.id : CUSTOM_COUNTRY_ID;
};

const chunkIds = (ids: string[], size = 10): string[][] => {
  const chunks: string[][] = [];
  for (let i = 0; i < ids.length; i += size) {
    chunks.push(ids.slice(i, i + size));
  }
  return chunks;
};

const normalizeLookupId = (value: unknown): string => {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (raw.includes('/')) {
    const parts = raw.split('/').map((part) => part.trim()).filter(Boolean);
    return parts[parts.length - 1] || raw;
  }
  return raw;
};

const toDateMaybe = (value: unknown): Date | null => {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === 'object' && value !== null) {
    const v = value as { toDate?: () => Date; seconds?: number };
    if (typeof v.toDate === 'function') {
      const dt = v.toDate();
      if (dt instanceof Date && !Number.isNaN(dt.getTime())) return dt;
    }
    if (typeof v.seconds === 'number') {
      const dt = new Date(v.seconds * 1000);
      if (!Number.isNaN(dt.getTime())) return dt;
    }
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const dt = new Date(value);
    if (!Number.isNaN(dt.getTime())) return dt;
  }
  return null;
};

const getKolkataDateKey = (date: Date = new Date()): string => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const year = parts.find((part) => part.type === 'year')?.value || '0000';
  const month = parts.find((part) => part.type === 'month')?.value || '01';
  const day = parts.find((part) => part.type === 'day')?.value || '01';
  return `${year}-${month}-${day}`;
};

const shiftDateKeyByDays = (dateKey: string, dayDelta: number): string => {
  const [year, month, day] = String(dateKey)
    .split('-')
    .map((part) => Number(part));
  if (!year || !month || !day) return dateKey;
  const utcDate = new Date(Date.UTC(year, month - 1, day));
  utcDate.setUTCDate(utcDate.getUTCDate() + dayDelta);
  const nextYear = String(utcDate.getUTCFullYear());
  const nextMonth = String(utcDate.getUTCMonth() + 1).padStart(2, '0');
  const nextDay = String(utcDate.getUTCDate()).padStart(2, '0');
  return `${nextYear}-${nextMonth}-${nextDay}`;
};

const isYmdDateKey = (value: string): boolean => /^\d{4}-\d{2}-\d{2}$/.test(String(value || '').trim());
const dateFromYmdKey = (value: string): Date | null => {
  const dateKey = String(value || '').trim();
  if (!isYmdDateKey(dateKey)) return null;
  const [year, month, day] = dateKey.split('-').map((part) => Number(part));
  if (!year || !month || !day) return null;
  return new Date(Date.UTC(year, month - 1, day));
};
const formatKolkataWeekdayFromDateKey = (value: string): string => {
  const date = dateFromYmdKey(value);
  if (!date) return '-';
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: TIMEZONE,
    weekday: 'long',
  }).format(date);
};
const formatKolkataShortDateFromDateKey = (value: string): string => {
  const date = dateFromYmdKey(value);
  if (!date) return '-';
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: TIMEZONE,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
};
const parseTimeToMinutes = (value: string): number | null => {
  const raw = String(value || '').trim();
  if (!raw) return null;
  const firstChunk = raw.split('-')[0].trim();
  const match = firstChunk.match(/^(\d{1,2})(?::(\d{2}))?(?::\d{2})?\s*([AaPp][Mm])?$/);
  if (!match) return null;
  let hours = Number(match[1]);
  const minutes = Number(match[2] || '0');
  const meridiem = String(match[3] || '').toUpperCase();
  if (!Number.isFinite(hours) || !Number.isFinite(minutes) || minutes < 0 || minutes > 59) {
    return null;
  }
  if (meridiem) {
    if (hours < 1 || hours > 12) return null;
    if (hours === 12) hours = 0;
    if (meridiem === 'PM') hours += 12;
  }
  if (hours < 0 || hours > 23) return null;
  return hours * 60 + minutes;
};
const formatMinutesAs12Hour = (minutes: number): string => {
  const normalized = Number(minutes);
  if (!Number.isFinite(normalized) || normalized < 0) return '';
  const hours24 = Math.floor(normalized / 60) % 24;
  const mins = normalized % 60;
  const period = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = hours24 % 12 || 12;
  return `${hours12}:${String(mins).padStart(2, '0')} ${period}`;
};
const formatTimeForDisplay = (value: string): string => {
  const raw = String(value || '').trim();
  if (!raw) return '';
  const asMinutes = parseTimeToMinutes(raw);
  if (asMinutes === null) return raw;
  return formatMinutesAs12Hour(asMinutes);
};
const LEGACY_ID_TOKEN_RE = /^[A-Za-z0-9_-]+$/;
const INACTIVE_ENTITY_STATUSES = new Set([
  'inactive',
  'suspended',
  'archived',
  'deleted',
  'disabled',
  'cancelled',
  'canceled',
  'expired',
  'completed',
  'discontinued',
]);
const PAST_ENROLLMENT_STATUSES = new Set([
  'completed',
  'discontinued',
  'expired',
  'cancelled',
  'archived',
  'inactive',
]);

const normalizeStatusLike = (value: unknown): string => {
  return String(value || '').trim().toLowerCase();
};

const normalizeEnrollmentStatusForOperations = (value: unknown): string => {
  const raw = normalizeStatusLike(value);
  if (!raw) return 'active';
  if (raw === 'pending_teacher') return 'trial';
  if (raw === 'pending_payment' || raw === 'pending_lp' || raw === 'pending_lp_assignment') {
    return 'active';
  }
  if (raw === 'enrolled' || raw === 'current' || raw === 'ongoing') return 'active';
  if (raw === 'canceled') return 'cancelled';
  return raw;
};

const looksLikeLegacyIdToken = (value: string): boolean => {
  const trimmed = String(value || '').trim();
  if (!trimmed || !LEGACY_ID_TOKEN_RE.test(trimmed)) return false;
  if (/^[0-9a-f]{24}$/i.test(trimmed)) return true;
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(trimmed)) {
    return true;
  }
  if (/^\d{8,}$/.test(trimmed)) return true;
  return trimmed.length >= 12 && /[0-9_-]/.test(trimmed);
};

const isEntityOperationallyActive = (entityLike: Record<string, any> | undefined): boolean => {
  if (!entityLike) return false;
  const status = normalizeStatusLike(entityLike.status);
  if (!status) return true;
  return !INACTIVE_ENTITY_STATUSES.has(status);
};

const isTeacherUser = (userLike: Record<string, any> | undefined): boolean => {
  if (!userLike) return false;
  const role = normalizeStatusLike(userLike.role);
  const roles = Array.isArray(userLike.roles)
    ? userLike.roles.map((item: unknown) => normalizeStatusLike(item))
    : [];
  return role === 'teacher' || roles.includes('teacher');
};

const isEnrollmentOperationallyActive = (enrollmentLike: Record<string, any> | undefined): boolean => {
  if (!enrollmentLike) return false;
  if (enrollmentLike.archivedAt || enrollmentLike.archived === true || enrollmentLike.isArchived === true) {
    return false;
  }
  const normalized = normalizeEnrollmentStatusForOperations(enrollmentLike.status);
  return !PAST_ENROLLMENT_STATUSES.has(normalized);
};

const getEnrollmentKidIds = (enrollmentLike: Record<string, any> | undefined): string[] => {
  if (!enrollmentLike) return [];
  const fromKidIds = Array.isArray(enrollmentLike.kidIds) ? enrollmentLike.kidIds : [];
  const fromSingles = [
    enrollmentLike.kidId,
    enrollmentLike.studentId,
    enrollmentLike.childId,
  ];
  return Array.from(
    new Set(
      [...fromKidIds, ...fromSingles]
        .map((id) => normalizeLookupId(id))
        .filter(Boolean),
    ),
  );
};

const getEnrollmentParentRefs = (enrollmentLike: Record<string, any> | undefined): string[] => {
  if (!enrollmentLike) return [];
  const fromIds = Array.isArray(enrollmentLike.parentIds) ? enrollmentLike.parentIds : [];
  const fromSingles = [enrollmentLike.parentId, enrollmentLike.userId];
  return Array.from(
    new Set(
      [...fromIds, ...fromSingles]
        .map((id) => normalizeLookupId(id))
        .filter(Boolean),
    ),
  );
};

const getEnrollmentTeacherRefs = (enrollmentLike: Record<string, any> | undefined): string[] => {
  if (!enrollmentLike) return [];
  const fromIds = Array.isArray(enrollmentLike.teacherIds) ? enrollmentLike.teacherIds : [];
  const fromSingles = [enrollmentLike.teacherId];
  return Array.from(
    new Set(
      [...fromIds, ...fromSingles]
        .map((id) => normalizeLookupId(id))
        .filter(Boolean),
    ),
  );
};

const sanitizePhoneForWhatsApp = (phone: string): string => {
  return String(phone || '').replace(/\D/g, '');
};

const getDisplayName = (userLike: Record<string, any> | undefined, fallback: string): string => {
  const value =
    userLike?.name ||
    userLike?.displayName ||
    userLike?.fullName ||
    userLike?.studentName ||
    '';
  return String(value || '').trim() || fallback;
};

const normalizePhoneForSave = (value: string): string => {
  return String(value || '').trim().replace(/\s+/g, ' ');
};

const normalizeCountryCode = (value: string): string => {
  const digits = String(value || '').replace(/\D/g, '');
  if (!digits) return '';
  return `+${digits}`;
};

const isCountryCodeInputValid = (value: string): boolean => {
  const trimmed = String(value || '').trim();
  if (!trimmed) return false;
  return /^\+?\d+$/.test(trimmed);
};

const digitsOnly = (value: string): string => {
  return String(value || '').replace(/\D/g, '');
};

const looksLikeInternationalWithPlus = (value: string): boolean => {
  const trimmed = String(value || '').trim();
  if (!trimmed.startsWith('+')) return false;
  const digits = digitsOnly(trimmed);
  return digits.length >= 8;
};

const inferCountryCodeFromInternationalDigits = (value: string): string => {
  const digits = digitsOnly(value);
  if (!digits) return '';
  const candidates = Array.from(
    new Set(COUNTRY_OPTIONS.map((option) => option.code)),
  ).sort((a, b) => digitsOnly(b).length - digitsOnly(a).length);
  const found = candidates.find((code) => digits.startsWith(digitsOnly(code)));
  return found || '';
};

const stripCountryCodePrefix = (internationalDigits: string, countryCode: string): string => {
  const allDigits = digitsOnly(internationalDigits);
  const codeDigits = digitsOnly(countryCode);
  if (!allDigits || !codeDigits) return allDigits;
  if (allDigits.startsWith(codeDigits)) {
    return allDigits.slice(codeDigits.length);
  }
  return allDigits;
};

type PhoneResolutionStatus = 'ok' | 'needs_country_code' | 'missing';

interface ResolvedPhoneInfo {
  status: PhoneResolutionStatus;
  display: string;
  whatsappDigits: string;
  editCountryCode: string;
  editPhone: string;
}

const applyTemplatePlaceholders = (
  template: string,
  context: {
    parentName: string;
    teacherName: string;
    childName: string;
    time: string;
    course: string;
  },
): string => {
  const safeTemplate = String(template || '');
  const replaceToken = (source: string, token: string, value: string) =>
    source.split(token).join(value);

  return [
    ['[Parent Name]', context.parentName || 'Parent'],
    ['[Teacher Name]', context.teacherName || 'Teacher'],
    ['[Child Name]', context.childName || 'your child'],
    ['[Time]', context.time || 'Time TBD'],
    ['[Course]', context.course || 'Tiny Steps class'],
  ].reduce(
    (message, [token, value]) => replaceToken(message, token, value),
    safeTemplate,
  );
};

const resolvePhoneInfo = (userLike: UserDoc | undefined): ResolvedPhoneInfo => {
  const countryCode = normalizeCountryCode(String(userLike?.phoneCountryCode || ''));
  const phoneRaw = normalizePhoneForSave(String(userLike?.phone || ''));
  const phoneDigits = digitsOnly(phoneRaw);
  const whatsappE164Digits = digitsOnly(String(userLike?.whatsappE164 || ''));
  const hasStructured = Boolean(countryCode && phoneDigits);

  if (hasStructured) {
    const builtDigits = `${digitsOnly(countryCode)}${phoneDigits}`;
    const whatsappDigits = whatsappE164Digits || builtDigits;
    return {
      status: whatsappDigits.length >= 8 ? 'ok' : 'missing',
      display: `${countryCode} ${phoneRaw}`,
      whatsappDigits: whatsappDigits.length >= 8 ? whatsappDigits : '',
      editCountryCode: countryCode,
      editPhone: phoneRaw,
    };
  }

  if (whatsappE164Digits.length >= 8) {
    const inferredCode = inferCountryCodeFromInternationalDigits(whatsappE164Digits);
    return {
      status: 'ok',
      display: `+${whatsappE164Digits}`,
      whatsappDigits: whatsappE164Digits,
      editCountryCode: inferredCode,
      editPhone: inferredCode
        ? stripCountryCodePrefix(whatsappE164Digits, inferredCode)
        : whatsappE164Digits,
    };
  }

  let firstAmbiguousLegacy = '';
  for (const field of USER_PHONE_FIELDS) {
    const legacyValue = normalizePhoneForSave(String(userLike?.[field] || ''));
    if (!legacyValue) continue;
    if (looksLikeInternationalWithPlus(legacyValue)) {
      const legacyDigits = digitsOnly(legacyValue);
      const inferredCode = inferCountryCodeFromInternationalDigits(legacyDigits);
      return {
        status: 'ok',
        display: `+${legacyDigits}`,
        whatsappDigits: legacyDigits,
        editCountryCode: inferredCode,
        editPhone: inferredCode
          ? stripCountryCodePrefix(legacyDigits, inferredCode)
          : legacyDigits,
      };
    }
    if (!firstAmbiguousLegacy) firstAmbiguousLegacy = legacyValue;
  }

  if (firstAmbiguousLegacy) {
    return {
      status: 'needs_country_code',
      display: '',
      whatsappDigits: '',
      editCountryCode: '',
      editPhone: firstAmbiguousLegacy,
    };
  }

  return {
    status: 'missing',
    display: '',
    whatsappDigits: '',
    editCountryCode: '',
    editPhone: '',
  };
};

const formatKolkataTime = (date: Date | null): string => {
  if (!date) return '';
  return new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONE,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
};

const resolveUserTimeZone = (userLike: UserDoc | undefined): string => {
  const candidates = [
    userLike?.timezone,
    userLike?.timeZone,
    userLike?.timezoneId,
  ];
  for (const candidate of candidates) {
    const value = String(candidate || '').trim();
    if (!value) continue;
    try {
      new Intl.DateTimeFormat('en-US', { timeZone: value }).format(new Date());
      return value;
    } catch {
      // Ignore invalid timezone values saved on user records.
    }
  }
  return '';
};

const resolveCountryCodeFromUser = (userLike: UserDoc | undefined): string => {
  const structuredCountryCode = normalizeCountryCode(String(userLike?.phoneCountryCode || ''));
  if (structuredCountryCode) return structuredCountryCode;

  const whatsappE164Digits = digitsOnly(String(userLike?.whatsappE164 || ''));
  if (whatsappE164Digits.length >= 8) {
    const inferred = inferCountryCodeFromInternationalDigits(whatsappE164Digits);
    if (inferred) return inferred;
  }

  for (const field of USER_PHONE_FIELDS) {
    const raw = normalizePhoneForSave(String(userLike?.[field] || ''));
    if (!looksLikeInternationalWithPlus(raw)) continue;
    const inferred = inferCountryCodeFromInternationalDigits(raw);
    if (inferred) return inferred;
  }

  return '';
};

const resolveParentTimeZone = (userLike: UserDoc | undefined): string => {
  const explicitTimeZone = resolveUserTimeZone(userLike);
  if (explicitTimeZone) return explicitTimeZone;
  const countryCode = resolveCountryCodeFromUser(userLike);
  if (!countryCode) return '';
  return COUNTRY_CODE_TIMEZONE_DEFAULTS[countryCode] || '';
};

const parseIstDateTimeToUtcDate = (dateKey: string, timeValue: string): Date | null => {
  const minutesSinceMidnight = parseTimeToMinutes(timeValue);
  if (!isYmdDateKey(dateKey) || minutesSinceMidnight === null) return null;
  const [year, month, day] = dateKey.split('-').map((part) => Number(part));
  if (!year || !month || !day) return null;
  const utcMs =
    Date.UTC(year, month - 1, day, 0, 0, 0, 0) -
    IST_OFFSET_MINUTES * 60 * 1000 +
    minutesSinceMidnight * 60 * 1000;
  return new Date(utcMs);
};

const resolveSessionTimeBounds = (session: ClassSessionDoc): { startAt: Date | null; endAt: Date | null } => {
  const startAtFromTimestamp = toDateMaybe(session.startAt);
  const endAtFromTimestamp = toDateMaybe(session.endAt);
  if (startAtFromTimestamp) {
    return { startAt: startAtFromTimestamp, endAt: endAtFromTimestamp };
  }

  const dateKey = String(session.date || '').trim();
  const startAtFromFields = parseIstDateTimeToUtcDate(dateKey, String(session.startTime || '').trim());
  if (!startAtFromFields) {
    return { startAt: null, endAt: endAtFromTimestamp };
  }

  const endMinutes = parseTimeToMinutes(String(session.endTime || '').trim());
  if (endMinutes === null) {
    return { startAt: startAtFromFields, endAt: endAtFromTimestamp };
  }
  const startMinutes = parseTimeToMinutes(String(session.startTime || '').trim());
  if (startMinutes === null) {
    return { startAt: startAtFromFields, endAt: endAtFromTimestamp };
  }

  let duration = endMinutes - startMinutes;
  if (duration <= 0) duration += 24 * 60;
  const endAtFromFields = new Date(startAtFromFields.getTime() + duration * 60 * 1000);
  return { startAt: startAtFromFields, endAt: endAtFromFields };
};

const getTimeZoneShortLabel = (date: Date, timeZone: string): string => {
  if (timeZone === TIMEZONE) return 'IST';
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    timeZoneName: 'short',
  }).formatToParts(date);
  return parts.find((part) => part.type === 'timeZoneName')?.value || '';
};

const formatSessionTimeInTimeZone = (
  startAt: Date | null,
  endAt: Date | null,
  timeZone: string,
): string => {
  if (!startAt) return '';
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  const startLabel = formatter.format(startAt);
  const endLabel = endAt ? formatter.format(endAt) : '';
  const zoneLabel = getTimeZoneShortLabel(startAt, timeZone);
  if (startLabel && endLabel) {
    return `${startLabel} - ${endLabel}${zoneLabel ? ` ${zoneLabel}` : ''}`;
  }
  return `${startLabel}${zoneLabel ? ` ${zoneLabel}` : ''}`;
};

async function fetchDocsByIds(
  collectionName: string,
  ids: string[],
): Promise<Record<string, Record<string, any>>> {
  const out: Record<string, Record<string, any>> = {};
  const unique = Array.from(new Set(ids.map((id) => String(id || '').trim()).filter(Boolean)));
  if (!unique.length) return out;

  for (const idChunk of chunkIds(unique, 10)) {
    const q = query(collection(db, collectionName), where(documentId(), 'in', idChunk));
    const snap = await getDocs(q);
    snap.docs.forEach((docSnap) => {
      out[docSnap.id] = { id: docSnap.id, ...(docSnap.data() as Record<string, any>) };
    });
  }
  return out;
}

const addResolvedUserToMap = (
  map: Record<string, ResolvedUserDoc>,
  docId: string,
  rawData: UserDoc,
) => {
  const uid = String(rawData?.uid || '').trim();
  const resolved: ResolvedUserDoc = {
    docId,
    uid,
    data: rawData,
  };
  map[docId] = resolved;
  if (uid) map[uid] = resolved;
};

async function fetchUsersByRefs(userRefs: string[]): Promise<Record<string, ResolvedUserDoc>> {
  const map: Record<string, ResolvedUserDoc> = {};
  const normalized = Array.from(
    new Set(userRefs.map((value) => normalizeLookupId(value)).filter(Boolean)),
  );
  if (!normalized.length) return map;

  for (const idChunk of chunkIds(normalized, 10)) {
    const byDocIdQuery = query(collection(db, 'users'), where(documentId(), 'in', idChunk));
    const byDocIdSnap = await getDocs(byDocIdQuery);
    byDocIdSnap.docs.forEach((docSnap) => {
      addResolvedUserToMap(map, docSnap.id, docSnap.data() as UserDoc);
    });
  }

  const unresolved = normalized.filter((value) => !map[value]);
  if (!unresolved.length) return map;

  for (const idChunk of chunkIds(unresolved, 10)) {
    const byUidQuery = query(collection(db, 'users'), where('uid', 'in', idChunk));
    const byUidSnap = await getDocs(byUidQuery);
    byUidSnap.docs.forEach((docSnap) => {
      addResolvedUserToMap(map, docSnap.id, docSnap.data() as UserDoc);
    });
  }

  return map;
}

const getSessionKidIds = (session: ClassSessionDoc): string[] => {
  const fromKidIds = Array.isArray(session.kidIds) ? session.kidIds : [];
  const fromKidId = session.kidId ? [session.kidId] : [];
  return Array.from(
    new Set(
      [...fromKidIds, ...fromKidId]
        .map((id) => normalizeLookupId(id))
        .filter(Boolean),
    ),
  );
};

const getPrimaryParentId = (session: ClassSessionDoc): string => {
  if (session.parentId) return normalizeLookupId(session.parentId);
  if (Array.isArray(session.parentIds) && session.parentIds.length > 0) {
    return normalizeLookupId(session.parentIds[0]);
  }
  return '';
};

const formatSessionTime = (session: ClassSessionDoc): string => {
  const startRaw = String(session.startTime || '').trim() || formatKolkataTime(toDateMaybe(session.startAt));
  const endRaw = String(session.endTime || '').trim() || formatKolkataTime(toDateMaybe(session.endAt));
  const start = formatTimeForDisplay(startRaw);
  const end = formatTimeForDisplay(endRaw);
  if (start && end) return `${start} - ${end}`;
  if (start) return start;
  return 'Time TBD';
};

type EnrollmentWeeklySlot = {
  weekday: number;
  time: string;
  durationMinutes: number;
};

const WEEKDAY_LABELS_SHORT = new Map<number, string>([
  [0, 'Sun'],
  [1, 'Mon'],
  [2, 'Tue'],
  [3, 'Wed'],
  [4, 'Thu'],
  [5, 'Fri'],
  [6, 'Sat'],
]);

const TIME_HHMM_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

const isValidWeekday = (value: unknown): value is number => {
  return Number.isInteger(value) && Number(value) >= 0 && Number(value) <= 6;
};

const isValidTimeHHmm = (value: unknown): value is string => {
  return typeof value === 'string' && TIME_HHMM_RE.test(value.trim());
};

const clampDurationMinutes = (value: unknown, fallback = 35): number => {
  const parsed = Number(value);
  const safe = Number.isFinite(parsed) ? parsed : fallback;
  return Math.max(10, Math.min(180, Math.floor(safe)));
};

const sortEnrollmentWeeklySlots = (slots: EnrollmentWeeklySlot[]): EnrollmentWeeklySlot[] => {
  return [...slots].sort((a, b) => {
    if (a.weekday !== b.weekday) return a.weekday - b.weekday;
    return a.time.localeCompare(b.time, undefined, { numeric: true });
  });
};

const normalizeEnrollmentScheduleSlots = (
  schedule: EnrollmentDoc['schedule'],
  fallbackDuration = 35,
): EnrollmentWeeklySlot[] => {
  if (!schedule) return [];

  const slotsFromNewShape = Array.isArray(schedule.weeklySlots)
    ? schedule.weeklySlots
      .map((slot) => {
        const weekday = Number(slot?.weekday);
        const time = String(slot?.time || '').trim();
        const durationMinutes = clampDurationMinutes(
          slot?.durationMinutes ?? slot?.durationMins,
          fallbackDuration,
        );
        if (!isValidWeekday(weekday) || !isValidTimeHHmm(time)) return null;
        return { weekday, time, durationMinutes };
      })
      .filter((slot): slot is EnrollmentWeeklySlot => Boolean(slot))
    : [];

  if (slotsFromNewShape.length > 0) {
    return sortEnrollmentWeeklySlots(slotsFromNewShape);
  }

  const legacyWeekdays = Array.isArray(schedule.weekdays)
    ? schedule.weekdays.filter((day): day is number => isValidWeekday(day))
    : [];
  const legacyTime = String(schedule.timeHHmm || '').trim();
  const legacyDuration = clampDurationMinutes(schedule.durationMins, fallbackDuration);
  if (legacyWeekdays.length > 0 && isValidTimeHHmm(legacyTime)) {
    return sortEnrollmentWeeklySlots(
      legacyWeekdays.map((weekday) => ({
        weekday,
        time: legacyTime,
        durationMinutes: legacyDuration,
      })),
    );
  }

  return [];
};

const formatEnrollmentScheduleSummary = (slots: EnrollmentWeeklySlot[]): string => {
  if (!slots.length) return 'Not assigned';
  const sortedSlots = sortEnrollmentWeeklySlots(slots);
  const deduped = sortedSlots.filter((slot, index, all) => {
    return all.findIndex((candidate) => candidate.weekday === slot.weekday && candidate.time === slot.time) === index;
  });
  const uniqueTimes = Array.from(new Set(deduped.map((slot) => slot.time)));

  if (uniqueTimes.length === 1) {
    const days = deduped
      .map((slot) => WEEKDAY_LABELS_SHORT.get(slot.weekday) || String(slot.weekday))
      .join(', ');
    return `${days} • ${formatTimeForDisplay(uniqueTimes[0])}`;
  }

  return deduped
    .map((slot) => {
      const label = WEEKDAY_LABELS_SHORT.get(slot.weekday) || String(slot.weekday);
      return `${label} ${formatTimeForDisplay(slot.time)}`;
    })
    .join(' • ');
};

const toReadableStatus = (status: string): string => {
  const value = String(status || '').trim().replace(/[_-]+/g, ' ');
  if (!value) return 'Active';
  return value.charAt(0).toUpperCase() + value.slice(1);
};

type SessionTypeLabel = 'Regular' | 'Makeup' | 'Rescheduled' | 'Replacement' | 'Manual';
interface SessionTypeResolution {
  label: SessionTypeLabel;
  reason: string;
}

const toSessionTypeStyle = (type: SessionTypeLabel): string => {
  if (type === 'Regular') return 'bg-slate-100 text-slate-700';
  if (type === 'Makeup') return 'bg-amber-100 text-amber-800';
  if (type === 'Rescheduled') return 'bg-rose-100 text-rose-700';
  if (type === 'Replacement') return 'bg-emerald-100 text-emerald-700';
  return 'bg-indigo-100 text-indigo-700';
};

const resolveSessionTypeLabel = (session: ClassSessionDoc): SessionTypeResolution => {
  const source = normalizeStatusLike(session.source);
  const status = normalizeStatusLike(session.status);
  const sessionType = normalizeStatusLike(session.sessionType);
  const createdByFlow = normalizeStatusLike(session.createdByFlow);
  const makeupCreditId = normalizeLookupId(session.makeupCreditId);
  const makeupForSessionId = normalizeLookupId(session.makeupForSessionId);
  const rescheduledFromSessionId = normalizeLookupId(session.rescheduledFromSessionId);
  const replacementSessionId = normalizeLookupId(session.replacementSessionId);
  const containsAny = (value: string, tokens: string[]): boolean =>
    tokens.some((token) => value.includes(token));
  const sourceOrType = `${source} ${sessionType}`.trim();
  const allTypeSignals = `${source} ${sessionType} ${createdByFlow}`.trim();

  const isMakeupSource = containsAny(sourceOrType, ['makeup']);
  const hasRescheduleMetadata = containsAny(allTypeSignals, [
    'reschedule_requested',
    'rescheduled',
    'reschedule',
    'reschedule_request',
  ]);
  const isManualSource = containsAny(allTypeSignals, [
    'manual',
    'one_off',
    'one-off',
    'ad_hoc',
    'ad-hoc',
    'adhoc',
    'admin_created',
    'admin-created',
  ]);

  if (session.isMakeup === true) return { label: 'Makeup', reason: 'isMakeup is true' };
  if (makeupCreditId) return { label: 'Makeup', reason: 'makeupCreditId exists' };
  if (makeupForSessionId) return { label: 'Makeup', reason: 'makeupForSessionId exists' };
  if (isMakeupSource) return { label: 'Makeup', reason: 'source/sessionType contains makeup' };

  if (replacementSessionId) return { label: 'Replacement', reason: 'replacementSessionId exists' };
  if (rescheduledFromSessionId) return { label: 'Replacement', reason: 'rescheduledFromSessionId exists' };

  if (status === 'reschedule_requested') return { label: 'Rescheduled', reason: 'status is reschedule_requested' };
  if (status === 'rescheduled') return { label: 'Rescheduled', reason: 'status is rescheduled' };
  if (hasRescheduleMetadata) return { label: 'Rescheduled', reason: 'reschedule metadata signal found' };

  if (isManualSource) return { label: 'Manual', reason: 'source/sessionType/createdByFlow indicates manual one-off ad-hoc admin-created' };

  return { label: 'Regular', reason: 'fallback: no special markers' };
};

const getKidNames = (session: ClassSessionDoc, kidMap: Record<string, KidDoc>): string[] => {
  const names = new Set<string>();
  const sessionKidNames = session.kidNames;
  const kidIds = getSessionKidIds(session);

  if (typeof session.kidName === 'string' && session.kidName.trim()) names.add(session.kidName.trim());
  if (typeof session.childName === 'string' && session.childName.trim()) names.add(session.childName.trim());

  if (Array.isArray(sessionKidNames)) {
    sessionKidNames.forEach((name) => {
      const trimmed = String(name || '').trim();
      if (trimmed) names.add(trimmed);
    });
  } else if (sessionKidNames && typeof sessionKidNames === 'object') {
    Object.values(sessionKidNames).forEach((name) => {
      const trimmed = String(name || '').trim();
      if (trimmed) names.add(trimmed);
    });
  }

  kidIds.forEach((kidId) => {
    const kid = kidMap[kidId];
    const name = String(
      kid?.fullName || kid?.name || kid?.displayName || kid?.studentName || '',
    ).trim();
    if (name) names.add(name);
  });

  return Array.from(names);
};

export default function TodaysNotifications() {
  const { toast } = useToast();
  const { user } = useAuthStore();
  const [sessions, setSessions] = useState<ClassSessionDoc[]>([]);
  const [enrollments, setEnrollments] = useState<EnrollmentDoc[]>([]);
  const [usersMap, setUsersMap] = useState<Record<string, ResolvedUserDoc>>({});
  const [kidMap, setKidMap] = useState<Record<string, KidDoc>>({});
  const [enrollmentMap, setEnrollmentMap] = useState<Record<string, Record<string, any>>>({});
  const [courseMap, setCourseMap] = useState<Record<string, CourseDoc>>({});
  const [defaultParentTemplate] = useState(DEFAULT_PARENT_TEMPLATE);
  const [defaultTeacherTemplate] = useState(DEFAULT_TEACHER_TEMPLATE);
  const [messageDrafts, setMessageDrafts] = useState<Record<string, string>>({});
  const [messageEditor, setMessageEditor] = useState<{
    sessionId: string;
    recipient: MessageRecipient;
    value: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [savingFlags, setSavingFlags] = useState<Record<string, boolean>>({});
  const [editingPhone, setEditingPhone] = useState<{
    key: string;
    userDocId: string;
    countryOptionId: string;
    countryCode: string;
    phone: string;
  } | null>(null);
  const [savingPhoneKey, setSavingPhoneKey] = useState<string | null>(null);
  const [joiningSessionId, setJoiningSessionId] = useState<string | null>(null);
  const [mode, setMode] = useState<NotificationMode>('today');
  const [upcomingDays, setUpcomingDays] = useState<number>(7);
  const [upcomingFilterMode, setUpcomingFilterMode] = useState<UpcomingFilterMode>('range');
  const [upcomingSpecificDate, setUpcomingSpecificDate] = useState<string>('');
  const [teacherFilter, setTeacherFilter] = useState<string>(ALL_TEACHERS_FILTER);
  const [statusFilter, setStatusFilter] = useState<string>(ALL_STATUSES_FILTER);
  const isNotificationActionsEnabled = mode !== 'overall-admissions';

  const todayDateKey = useMemo(() => getKolkataDateKey(), []);
  const upcomingStartDateKey = useMemo(() => shiftDateKeyByDays(todayDateKey, 1), [todayDateKey]);
  const upcomingEndDateKey = useMemo(
    () => shiftDateKeyByDays(todayDateKey, upcomingDays),
    [todayDateKey, upcomingDays],
  );
  const todayLabel = useMemo(
    () =>
      new Intl.DateTimeFormat('en-IN', {
        timeZone: TIMEZONE,
        dateStyle: 'full',
      }).format(new Date()),
    [],
  );

  useEffect(() => {
    if (mode !== 'upcoming') return;
    if (upcomingFilterMode !== 'specific-date') return;
    if (upcomingSpecificDate) return;
    setUpcomingSpecificDate(upcomingStartDateKey);
  }, [mode, upcomingFilterMode, upcomingSpecificDate, upcomingStartDateKey]);

  useEffect(() => {
    if (isNotificationActionsEnabled) return;
    setEditingPhone(null);
    setMessageEditor(null);
  }, [isNotificationActionsEnabled]);

  useEffect(() => {
    let active = true;
    if (mode === 'overall-admissions') {
      setSessions([]);
      return () => {
        active = false;
      };
    }

    setIsLoading(true);
    let q = query(collection(db, 'classSessions'), where('date', '==', todayDateKey));
    if (mode === 'today') {
      q = query(collection(db, 'classSessions'), where('date', '==', todayDateKey));
    } else if (upcomingFilterMode === 'specific-date') {
      if (!upcomingSpecificDate) {
        setSessions([]);
        setUsersMap({});
        setKidMap({});
        setEnrollmentMap({});
        setCourseMap({});
        setIsLoading(false);
        return () => {
          active = false;
        };
      }
      q = query(collection(db, 'classSessions'), where('date', '==', upcomingSpecificDate));
    } else {
      q = query(
        collection(db, 'classSessions'),
        where('date', '>', todayDateKey),
        where('date', '<=', upcomingEndDateKey),
      );
    }

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        try {
          const nextSessions = snapshot.docs
            .map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as any) }))
            .sort((a: ClassSessionDoc, b: ClassSessionDoc) => {
              const startA = String(a.startTime || '');
              const startB = String(b.startTime || '');
              if (startA !== startB) {
                return startA.localeCompare(startB, undefined, { numeric: true });
              }
              const msA = toDateMaybe(a.startAt)?.getTime() || 0;
              const msB = toDateMaybe(b.startAt)?.getTime() || 0;
              return msA - msB;
            });

          if (!active) return;
          setSessions(nextSessions);

          const parentIds = new Set<string>();
          const teacherIds = new Set<string>();
          const kidIds = new Set<string>();
          const enrollmentIds = new Set<string>();
          const courseIds = new Set<string>();

          nextSessions.forEach((session) => {
            const parentId = getPrimaryParentId(session);
            if (parentId) parentIds.add(parentId);

            const teacherId = normalizeLookupId(session.teacherId);
            if (teacherId) teacherIds.add(teacherId);

            getSessionKidIds(session).forEach((kidId) => kidIds.add(kidId));

            const enrollmentId = normalizeLookupId(session.enrollmentId);
            if (enrollmentId) enrollmentIds.add(enrollmentId);

            const courseId = String(session.courseId || '').trim();
            if (courseId) courseIds.add(courseId);
          });

          const userIds = Array.from(new Set([...parentIds, ...teacherIds]));
          const [nextUsersMap, nextKidMap, nextEnrollmentMap, nextCourseMap] = await Promise.all([
            fetchUsersByRefs(userIds),
            fetchDocsByIds('kids', Array.from(kidIds)),
            fetchDocsByIds('enrollments', Array.from(enrollmentIds)),
            fetchDocsByIds('courses', Array.from(courseIds)),
          ]);

          const missingKidIds = Array.from(kidIds).filter((kidId) => !nextKidMap[kidId]);
          if (missingKidIds.length) {
            const studentsFallback = await fetchDocsByIds('students', missingKidIds);
            Object.keys(studentsFallback).forEach((kidId) => {
              nextKidMap[kidId] = studentsFallback[kidId];
            });
          }

          const parentRefsFromKids = Array.from(
            new Set(
              Object.values(nextKidMap)
                .map((kidDoc) => normalizeLookupId(kidDoc?.parentId))
                .filter(Boolean),
            ),
          );
          const unresolvedParentRefsFromKids = parentRefsFromKids.filter((parentRef) => !nextUsersMap[parentRef]);
          if (unresolvedParentRefsFromKids.length) {
            const usersFromKidParents = await fetchUsersByRefs(unresolvedParentRefsFromKids);
            Object.assign(nextUsersMap, usersFromKidParents);
          }

          if (!active) return;
          setUsersMap(nextUsersMap);
          setKidMap(nextKidMap);
          setEnrollmentMap(nextEnrollmentMap);
          setCourseMap(nextCourseMap);
          setIsLoading(false);
        } catch (error: any) {
          console.error('[TodaysNotifications] Failed to build session rows', error);
          if (!active) return;
          setIsLoading(false);
          toast({
            title: 'Unable to load sessions',
            description: error?.message || 'Please try again.',
            variant: 'destructive',
          });
        }
      },
      (error) => {
        console.error('[TodaysNotifications] Snapshot error', error);
        if (!active) return;
        setIsLoading(false);
        toast({
          title: 'Unable to load sessions',
          description: error?.message || 'Please try again.',
          variant: 'destructive',
        });
      },
    );

    return () => {
      active = false;
      unsubscribe();
    };
  }, [mode, todayDateKey, upcomingEndDateKey, upcomingFilterMode, upcomingSpecificDate, toast]);

  useEffect(() => {
    if (mode !== 'overall-admissions') return;
    let active = true;
    setIsLoading(true);
    setSessions([]);

    const admissionsQuery = query(collection(db, 'enrollments'));
    const unsubscribe = onSnapshot(
      admissionsQuery,
      async (snapshot) => {
        try {
          const nextEnrollments = snapshot.docs
            .map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as any) }))
            .sort((a: EnrollmentDoc, b: EnrollmentDoc) =>
              String(a.id || '').localeCompare(String(b.id || ''), undefined, { sensitivity: 'base' }),
            );

          if (!active) return;
          setEnrollments(nextEnrollments);

          const nextEnrollmentMap: Record<string, Record<string, any>> = {};
          const kidIds = new Set<string>();
          const parentRefs = new Set<string>();
          const teacherRefs = new Set<string>();
          const courseIds = new Set<string>();

          nextEnrollments.forEach((enrollment) => {
            if (enrollment.id) nextEnrollmentMap[enrollment.id] = enrollment as Record<string, any>;

            getEnrollmentKidIds(enrollment).forEach((kidId) => kidIds.add(kidId));
            getEnrollmentParentRefs(enrollment).forEach((parentRef) => parentRefs.add(parentRef));
            getEnrollmentTeacherRefs(enrollment).forEach((teacherRef) => teacherRefs.add(teacherRef));

            const courseId = normalizeLookupId(enrollment.courseId);
            if (courseId) courseIds.add(courseId);
          });

          const userRefs = Array.from(new Set([...parentRefs, ...teacherRefs]));
          const [nextUsersMap, nextKidMap, nextCourseMap] = await Promise.all([
            fetchUsersByRefs(userRefs),
            fetchDocsByIds('kids', Array.from(kidIds)),
            fetchDocsByIds('courses', Array.from(courseIds)),
          ]);

          const missingKidIds = Array.from(kidIds).filter((kidId) => !nextKidMap[kidId]);
          if (missingKidIds.length) {
            const studentsFallback = await fetchDocsByIds('students', missingKidIds);
            Object.keys(studentsFallback).forEach((kidId) => {
              nextKidMap[kidId] = studentsFallback[kidId];
            });
          }

          if (!active) return;
          setUsersMap(nextUsersMap);
          setKidMap(nextKidMap);
          setCourseMap(nextCourseMap);
          setEnrollmentMap(nextEnrollmentMap);
          setIsLoading(false);
        } catch (error: any) {
          console.error('[TodaysNotifications] Failed to load admissions', error);
          if (!active) return;
          setIsLoading(false);
          toast({
            title: 'Unable to load admissions',
            description: error?.message || 'Please try again.',
            variant: 'destructive',
          });
        }
      },
      (error) => {
        console.error('[TodaysNotifications] Admissions snapshot error', error);
        if (!active) return;
        setIsLoading(false);
        toast({
          title: 'Unable to load admissions',
          description: error?.message || 'Please try again.',
          variant: 'destructive',
        });
      },
    );

    return () => {
      active = false;
      unsubscribe();
    };
  }, [mode, toast]);

  const rows = useMemo(() => {
    return sessions
      .map((session) => {
        const sessionDateKey = String(session.date || '').trim();
        const classTime = formatSessionTime(session);
        const statusLabel = String(session.status || '').trim();
        const enrollmentRef = normalizeLookupId(session.enrollmentId);
        const enrollment = enrollmentRef ? enrollmentMap[enrollmentRef] : undefined;
        const parentRef = getPrimaryParentId(session);
        const teacherRef = normalizeLookupId(session.teacherId);
        const parentUserResolved = parentRef ? usersMap[parentRef] : undefined;
        const teacherUserResolved = teacherRef ? usersMap[teacherRef] : undefined;
        const parentUser = parentUserResolved?.data;
        const teacherUser = teacherUserResolved?.data;
        const kidIds = getSessionKidIds(session);
        const enrollmentKidIds = getEnrollmentKidIds(enrollment);
        const enrollmentParentRefs = getEnrollmentParentRefs(enrollment);
        const enrollmentTeacherRefs = getEnrollmentTeacherRefs(enrollment);
        const linkedKidIds = kidIds.filter((kidId) => enrollmentKidIds.includes(kidId));

        const resolvedParentName =
          getDisplayName(parentUser, '') || String(session.parentName || '').trim();
        const resolvedTeacherName =
          getDisplayName(teacherUser, '') || String(session.teacherName || '').trim();
        const parentTimeZone = resolveParentTimeZone(parentUser);
        const sessionTimeBounds = resolveSessionTimeBounds(session);
        const hasValidDate = isYmdDateKey(sessionDateKey);
        const hasValidTime = classTime !== 'Time TBD';
        const hasStatus = Boolean(statusLabel);
        const normalizedSessionStatus = normalizeStatusLike(statusLabel);
        const hasTeacherIdentity = Boolean(teacherRef && teacherUserResolved && resolvedTeacherName);
        const hasParentIdentity = Boolean(parentRef && parentUserResolved && resolvedParentName);

        if (!hasValidDate || !hasValidTime || !hasStatus) {
          return null;
        }
        if (normalizedSessionStatus === 'paused') {
          return null;
        }
        if (!enrollmentRef || !isEnrollmentOperationallyActive(enrollment)) {
          return null;
        }
        if (!doesSessionMatchEnrollmentSchedule(session as unknown as Record<string, unknown>, enrollment)) {
          return null;
        }
        if (!linkedKidIds.length || !enrollmentKidIds.length) {
          return null;
        }
        if (!hasParentIdentity || !enrollmentParentRefs.length) {
          return null;
        }
        if (!hasTeacherIdentity || !enrollmentTeacherRefs.length) {
          return null;
        }
        if (!isEntityOperationallyActive(parentUser)) return null;
        if (!isEntityOperationallyActive(teacherUser) || !isTeacherUser(teacherUser)) return null;

        const parentRefCandidates = new Set(
          [parentRef, parentUserResolved?.docId, parentUserResolved?.uid]
            .map((ref) => normalizeLookupId(ref))
            .filter(Boolean),
        );
        if (!enrollmentParentRefs.some((ref) => parentRefCandidates.has(ref))) {
          return null;
        }
        const teacherRefCandidates = new Set(
          [teacherRef, teacherUserResolved?.docId, teacherUserResolved?.uid]
            .map((ref) => normalizeLookupId(ref))
            .filter(Boolean),
        );
        if (!enrollmentTeacherRefs.some((ref) => teacherRefCandidates.has(ref))) {
          return null;
        }
        if (
          looksLikeLegacyIdToken(resolvedParentName) ||
          looksLikeLegacyIdToken(resolvedTeacherName) ||
          resolvedParentName === parentRef ||
          resolvedTeacherName === teacherRef
        ) {
          return null;
        }

        const activeKidNames = linkedKidIds
          .map((kidId) => {
            const kid = kidMap[kidId];
            if (!isEntityOperationallyActive(kid)) return '';
            const kidName = String(
              kid?.fullName || kid?.name || kid?.displayName || kid?.studentName || '',
            ).trim();
            if (!kidName || looksLikeLegacyIdToken(kidName) || kidName === kidId) return '';
            return kidName;
          })
          .filter(Boolean);
        if (!activeKidNames.length) {
          return null;
        }

        const parentPhoneInfo = resolvePhoneInfo(parentUser);
        const teacherPhoneInfo = resolvePhoneInfo(teacherUser);

        const courseId = String(session.courseId || '').trim();
        const courseDoc = courseId ? courseMap[courseId] : undefined;
        const courseLabel =
          String(session.courseName || '').trim() ||
          String(session.subject || '').trim() ||
          String(courseDoc?.title || courseDoc?.name || '') ||
          courseId ||
          '-';

        const studentLabel = activeKidNames.join(', ');
        const childName = activeKidNames[0] || '';
        const classTimeIst =
          formatSessionTimeInTimeZone(sessionTimeBounds.startAt, sessionTimeBounds.endAt, TIMEZONE) ||
          (classTime === 'Time TBD' ? classTime : `${classTime} IST`);
        const classTimeParent =
          parentTimeZone && parentTimeZone !== TIMEZONE
            ? formatSessionTimeInTimeZone(
                sessionTimeBounds.startAt,
                sessionTimeBounds.endAt,
                parentTimeZone,
              )
            : '';
        const parentMessageTime = classTimeParent
          ? `${classTimeParent} (${parentTimeZone}) / ${classTimeIst}`
          : classTimeIst;

        const sessionTypeResolution = resolveSessionTypeLabel(session);

        return {
          ...session,
          sessionDateKey,
          classTime,
          classTimeIst,
          classTimeParent,
          parentTimeZone,
          parentMessageTime,
          studentLabel,
          childName,
          parentName: resolvedParentName,
          parentPhoneDisplay: parentPhoneInfo.display,
          parentWhatsappDigits: parentPhoneInfo.whatsappDigits,
          parentPhoneStatus: parentPhoneInfo.status,
          parentEditCountryCode: parentPhoneInfo.editCountryCode,
          parentEditPhone: parentPhoneInfo.editPhone,
          parentRef,
          parentUserDocId: parentUserResolved?.docId || '',
          parentUserMissing: Boolean(parentRef && !parentUserResolved),
          teacherName: resolvedTeacherName,
          teacherPhoneDisplay: teacherPhoneInfo.display,
          teacherWhatsappDigits: teacherPhoneInfo.whatsappDigits,
          teacherPhoneStatus: teacherPhoneInfo.status,
          teacherEditCountryCode: teacherPhoneInfo.editCountryCode,
          teacherEditPhone: teacherPhoneInfo.editPhone,
          teacherRef,
          teacherUserDocId: teacherUserResolved?.docId || '',
          teacherUserMissing: Boolean(teacherRef && !teacherUserResolved),
          courseLabel,
          statusLabel,
          sessionTypeLabel: sessionTypeResolution.label,
          sessionTypeReason: sessionTypeResolution.reason,
        };
      })
      .filter((row): row is any => Boolean(row));
  }, [courseMap, enrollmentMap, kidMap, sessions, usersMap]);

  const admissionsRows = useMemo(() => {
    return enrollments
      .map((enrollment) => {
        if (!isEnrollmentOperationallyActive(enrollment)) return null;

        const enrollmentKidIds = getEnrollmentKidIds(enrollment);
        if (!enrollmentKidIds.length) return null;

        const activeKidNames = enrollmentKidIds
          .map((kidId) => {
            const kid = kidMap[kidId];
            if (!isEntityOperationallyActive(kid)) return '';
            const kidName = String(
              kid?.fullName || kid?.name || kid?.displayName || kid?.studentName || '',
            ).trim();
            if (!kidName || looksLikeLegacyIdToken(kidName) || kidName === kidId) return '';
            return kidName;
          })
          .filter(Boolean);
        if (!activeKidNames.length) return null;

        const studentLabel = activeKidNames.join(', ');
        if (!studentLabel || looksLikeLegacyIdToken(studentLabel)) return null;

        const kidParentRefs = enrollmentKidIds
          .map((kidId) => normalizeLookupId(kidMap[kidId]?.parentId))
          .filter(Boolean);
        const parentRefs = Array.from(
          new Set([...getEnrollmentParentRefs(enrollment), ...kidParentRefs]),
        );
        if (!parentRefs.length) return null;

        let resolvedParentRef = '';
        let resolvedParentDocId = '';
        let resolvedParentName = '';
        for (const parentRef of parentRefs) {
          const parentResolved = usersMap[parentRef];
          const parentUser = parentResolved?.data;
          if (!parentResolved || !isEntityOperationallyActive(parentUser)) continue;
          const parentName = getDisplayName(parentUser, '').trim();
          if (
            !parentName ||
            looksLikeLegacyIdToken(parentName) ||
            parentName === parentRef
          ) {
            continue;
          }
          resolvedParentRef = parentRef;
          resolvedParentDocId = parentResolved.docId;
          resolvedParentName = parentName;
          break;
        }
        if (!resolvedParentName || !resolvedParentDocId || !resolvedParentRef) return null;

        const teacherRefs = getEnrollmentTeacherRefs(enrollment);
        let resolvedTeacherName = '';
        for (const teacherRef of teacherRefs) {
          const teacherResolved = usersMap[teacherRef];
          const teacherUser = teacherResolved?.data;
          if (
            !teacherResolved ||
            !isEntityOperationallyActive(teacherUser) ||
            !isTeacherUser(teacherUser)
          ) {
            continue;
          }
          const teacherName = getDisplayName(teacherUser, '').trim();
          if (
            !teacherName ||
            looksLikeLegacyIdToken(teacherName) ||
            teacherName === teacherRef
          ) {
            continue;
          }
          resolvedTeacherName = teacherName;
          break;
        }

        const teacherLabel = resolvedTeacherName || 'Unassigned';

        const courseRef = normalizeLookupId(enrollment.courseId);
        const courseDoc = courseRef ? courseMap[courseRef] : undefined;
        const courseLabel =
          String(enrollment.courseName || '').trim() ||
          String(enrollment.subject || '').trim() ||
          String(courseDoc?.title || courseDoc?.name || '').trim() ||
          '-';

        const weeklySlots = normalizeEnrollmentScheduleSlots(enrollment.schedule, 35);
        const scheduleSummary = weeklySlots.length > 0
          ? formatEnrollmentScheduleSummary(weeklySlots)
          : 'Not assigned';

        const admissionStatusKey = normalizeEnrollmentStatusForOperations(enrollment.status);
        const admissionStatusLabel = toReadableStatus(admissionStatusKey);

        return {
          id: enrollment.id,
          studentLabel,
          parentName: resolvedParentName,
          teacherName: teacherLabel,
          courseLabel,
          scheduleSummary,
          admissionStatusKey,
          admissionStatusLabel,
        };
      })
      .filter((row): row is any => Boolean(row));
  }, [courseMap, enrollments, kidMap, usersMap]);

  const baseRowsForTeacherOptions = useMemo(
    () => (mode === 'overall-admissions' ? admissionsRows : rows),
    [admissionsRows, mode, rows],
  );

  const teacherOptions = useMemo(() => {
    const names = Array.from(
      new Set(
        baseRowsForTeacherOptions
          .map((row) => String(row.teacherName || '').trim())
          .filter((name) => Boolean(name) && name !== 'Unassigned'),
      ),
    ).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
    return [
      { value: ALL_TEACHERS_FILTER, label: 'All Teachers' },
      ...names.map((name) => ({ value: name, label: name })),
    ];
  }, [baseRowsForTeacherOptions]);

  const statusOptions = useMemo(() => {
    const statuses = Array.from(
      new Set(
        rows
          .map((row) => String(row.statusLabel || '').trim())
          .filter(Boolean),
      ),
    ).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
    return [
      { value: ALL_STATUSES_FILTER, label: 'All Statuses' },
      ...statuses.map((status) => ({
        value: status,
        label: status.replace(/[_-]+/g, ' '),
      })),
    ];
  }, [rows]);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const matchesTeacher =
        teacherFilter === ALL_TEACHERS_FILTER ||
        String(row.teacherName || '').trim() === teacherFilter;
      const matchesStatus =
        statusFilter === ALL_STATUSES_FILTER ||
        String(row.statusLabel || '').trim() === statusFilter;
      return matchesTeacher && matchesStatus;
    });
  }, [rows, teacherFilter, statusFilter]);

  const filteredAdmissionsRows = useMemo(() => {
    return admissionsRows.filter((row) => {
      if (teacherFilter === ALL_TEACHERS_FILTER) return true;
      return String(row.teacherName || '').trim() === teacherFilter;
    });
  }, [admissionsRows, teacherFilter]);

  const sortedRows = useMemo(() => {
    const getRowDateKey = (row: any): string => {
      const dateKey = String(row.sessionDateKey || row.date || '').trim();
      return isYmdDateKey(dateKey) ? dateKey : '9999-12-31';
    };
    const getRowStartMinutes = (row: any): number => {
      const fromStartTime = parseTimeToMinutes(String(row.startTime || ''));
      if (fromStartTime !== null) return fromStartTime;
      const fromClassTime = parseTimeToMinutes(String(row.classTime || ''));
      if (fromClassTime !== null) return fromClassTime;
      const fromStartAt = toDateMaybe(row.startAt);
      if (fromStartAt) {
        const fromKolkataClock = parseTimeToMinutes(formatKolkataTime(fromStartAt));
        if (fromKolkataClock !== null) return fromKolkataClock;
      }
      return Number.MAX_SAFE_INTEGER;
    };

    return [...filteredRows].sort((a, b) => {
      if (mode === 'upcoming') {
        const dateDiff = getRowDateKey(a).localeCompare(getRowDateKey(b));
        if (dateDiff !== 0) return dateDiff;
      }
      const timeDiff = getRowStartMinutes(a) - getRowStartMinutes(b);
      if (timeDiff !== 0) return timeDiff;
      return String(a.studentLabel || '').localeCompare(String(b.studentLabel || ''), undefined, {
        sensitivity: 'base',
      });
    });
  }, [filteredRows, mode]);

  const sortedAdmissionsRows = useMemo(() => {
    return [...filteredAdmissionsRows].sort((a, b) =>
      String(a.studentLabel || '').localeCompare(String(b.studentLabel || ''), undefined, {
        sensitivity: 'base',
      }),
    );
  }, [filteredAdmissionsRows]);

  useEffect(() => {
    if (teacherFilter === ALL_TEACHERS_FILTER) return;
    if (teacherOptions.some((option) => option.value === teacherFilter)) return;
    setTeacherFilter(ALL_TEACHERS_FILTER);
  }, [teacherFilter, teacherOptions]);

  useEffect(() => {
    if (statusFilter === ALL_STATUSES_FILTER) return;
    if (statusOptions.some((option) => option.value === statusFilter)) return;
    setStatusFilter(ALL_STATUSES_FILTER);
  }, [statusFilter, statusOptions]);

  const openWhatsApp = (phone: string, message: string) => {
    const sanitizedPhone = sanitizePhoneForWhatsApp(phone);
    if (!sanitizedPhone) {
      toast({
        title: 'No phone number',
        description: 'Add a valid phone number to use WhatsApp reminder.',
        variant: 'destructive',
      });
      return;
    }
    const url = `https://wa.me/${sanitizedPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const openMeetingLink = (url: string) => {
    const trimmed = String(url || '').trim();
    if (!trimmed) return;
    const isTeamsUrl = /^https?:\/\/([a-z0-9-]+\.)?teams\.microsoft\.com/i.test(trimmed);

    if (isTeamsUrl) {
      const teamsDeepLink = `msteams:${trimmed.replace(/^https?:/, '')}`;
      window.location.assign(teamsDeepLink);
      window.setTimeout(() => {
        window.open(trimmed, '_blank', 'noopener,noreferrer');
      }, 900);
      return;
    }

    window.open(trimmed, '_blank', 'noopener,noreferrer');
  };

  const handleJoinClass = async (row: any) => {
    if (joiningSessionId === row.id) return;

    setJoiningSessionId(row.id);
    try {
      const directJoinUrl =
        (typeof row.joinUrl === 'string' && row.joinUrl.trim()) ||
        (typeof row.meetingLink === 'string' && row.meetingLink.trim()) ||
        '';
      if (directJoinUrl) {
        openMeetingLink(directJoinUrl);
        return;
      }

      const enrollmentId =
        (typeof row.enrollmentId === 'string' && row.enrollmentId.trim()) ||
        (typeof row.id === 'string' && row.id.includes('_') ? row.id.split('_')[0].trim() : '');
      if (!enrollmentId) {
        toast({
          title: 'Meeting link unavailable',
          description: 'No enrollment is linked to this session.',
          variant: 'destructive',
        });
        return;
      }

      const cachedEnrollment = enrollmentMap[enrollmentId];
      const cachedJoinUrl =
        (typeof cachedEnrollment?.joinUrl === 'string' && cachedEnrollment.joinUrl.trim()) ||
        (typeof cachedEnrollment?.meetingLink === 'string' && cachedEnrollment.meetingLink.trim()) ||
        '';
      if (cachedJoinUrl) {
        openMeetingLink(cachedJoinUrl);
        return;
      }

      const enrollmentSnap = await getDoc(doc(db, 'enrollments', enrollmentId));
      const enrollmentData = enrollmentSnap.data() as EnrollmentDoc | undefined;
      const fallbackJoinUrl =
        (typeof enrollmentData?.joinUrl === 'string' && enrollmentData.joinUrl.trim()) ||
        (typeof enrollmentData?.meetingLink === 'string' && enrollmentData.meetingLink.trim()) ||
        '';

      if (!fallbackJoinUrl) {
        toast({
          title: 'Meeting link unavailable',
          description: 'No meeting link is configured for this class yet.',
          variant: 'destructive',
        });
        return;
      }

      openMeetingLink(fallbackJoinUrl);
    } catch (error: any) {
      console.error('[TodaysNotifications] Failed to open class link', error);
      toast({
        title: 'Could not open class link',
        description: error?.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setJoiningSessionId((current) => (current === row.id ? null : current));
    }
  };

  const handleNotifiedToggle = async (
    sessionId: string,
    target: 'parent' | 'teacher',
    checked: boolean,
  ) => {
    const key = `${sessionId}:${target}`;
    setSavingFlags((prev) => ({ ...prev, [key]: true }));
    try {
      const notifiedField = target === 'parent' ? 'parentNotified' : 'teacherNotified';
      const notifiedAtField = target === 'parent' ? 'parentNotifiedAt' : 'teacherNotifiedAt';
      await setDoc(
        doc(db, 'classSessions', sessionId),
        {
          [notifiedField]: checked,
          [notifiedAtField]: checked ? serverTimestamp() : null,
          updatedAt: serverTimestamp(),
          updatedBy: user?.uid || null,
        },
        { merge: true },
      );
    } catch (error: any) {
      toast({
        title: 'Unable to update notification flag',
        description: error?.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSavingFlags((prev) => ({ ...prev, [key]: false }));
    }
  };

  const getRowMessageTemplate = (sessionId: string, type: MessageRecipient): string => {
    const key = getMessageDraftKey(sessionId, type);
    if (typeof messageDrafts[key] === 'string') return messageDrafts[key];
    return type === 'parent' ? defaultParentTemplate : defaultTeacherTemplate;
  };

  const buildResolvedRowMessage = (row: any, type: MessageRecipient): string => {
    const template = getRowMessageTemplate(row.id, type);
    const resolvedTime =
      type === 'parent'
        ? row.parentMessageTime || row.classTimeIst || row.classTime || 'Time TBD'
        : row.classTimeIst || row.classTime || 'Time TBD';
    const context = {
      parentName: row.parentName || 'Parent',
      teacherName: row.teacherName || 'Teacher',
      childName: row.childName || 'your child',
      time: resolvedTime,
      course:
        row.courseLabel && row.courseLabel !== '-'
          ? row.courseLabel
          : 'Tiny Steps class',
    };
    return applyTemplatePlaceholders(template, context);
  };

  const openMessageEditor = (sessionId: string, recipient: MessageRecipient) => {
    setMessageEditor({
      sessionId,
      recipient,
      value: getRowMessageTemplate(sessionId, recipient),
    });
  };

  const closeMessageEditor = () => {
    setMessageEditor(null);
  };

  const saveMessageEditor = () => {
    if (!messageEditor) return;
    const key = getMessageDraftKey(messageEditor.sessionId, messageEditor.recipient);
    setMessageDrafts((prev) => ({ ...prev, [key]: messageEditor.value }));
    setMessageEditor(null);
  };

  const activeMessageRow = useMemo(
    () => (messageEditor ? rows.find((row) => row.id === messageEditor.sessionId) || null : null),
    [messageEditor, rows],
  );

  const handleStartPhoneEdit = (
    key: string,
    userDocId: string,
    countryCode: string,
    currentPhone: string,
  ) => {
    if (!userDocId) return;
    setEditingPhone({
      key,
      userDocId,
      countryOptionId: optionIdFromCountryCode(countryCode),
      countryCode: normalizeCountryCode(countryCode),
      phone: normalizePhoneForSave(currentPhone),
    });
  };

  const handleSavePhoneEdit = async () => {
    if (!editingPhone) return;
    const countryCodeInput = String(editingPhone.countryCode || '').trim();
    if (!isCountryCodeInputValid(countryCodeInput)) return;
    const nextCountryCode = normalizeCountryCode(countryCodeInput);
    const nextPhone = normalizePhoneForSave(editingPhone.phone);
    const nextPhoneDigits = digitsOnly(nextPhone);
    const nextWhatsappE164 = nextCountryCode
      ? `${digitsOnly(nextCountryCode)}${nextPhoneDigits}`
      : '';
    if (!nextPhone || !nextCountryCode || !nextPhoneDigits) return;

    setSavingPhoneKey(editingPhone.key);
    try {
      await setDoc(
        doc(db, 'users', editingPhone.userDocId),
        {
          phoneCountryCode: nextCountryCode,
          phone: nextPhone,
          whatsappE164: nextWhatsappE164 || null,
          updatedAt: serverTimestamp(),
          updatedBy: user?.uid || null,
        },
        { merge: true },
      );

      setUsersMap((prev) => {
        const nextMap: Record<string, ResolvedUserDoc> = { ...prev };
        Object.keys(nextMap).forEach((lookupKey) => {
          const existing = nextMap[lookupKey];
          if (!existing || existing.docId !== editingPhone.userDocId) return;
          nextMap[lookupKey] = {
            ...existing,
            data: {
              ...existing.data,
              phoneCountryCode: nextCountryCode,
              phone: nextPhone,
              whatsappE164: nextWhatsappE164 || null,
            },
          };
        });
        return nextMap;
      });

      setEditingPhone(null);
      toast({
        title: 'Phone updated',
      });
    } catch (error: any) {
      toast({
        title: 'Unable to save phone number',
        description: error?.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSavingPhoneKey(null);
    }
  };

  const isOverallAdmissionsMode = mode === 'overall-admissions';
  const visibleRowsCount = isOverallAdmissionsMode ? sortedAdmissionsRows.length : sortedRows.length;
  const hasOperationalFilters =
    teacherFilter !== ALL_TEACHERS_FILTER ||
    (!isOverallAdmissionsMode && statusFilter !== ALL_STATUSES_FILTER);

  return (
    <div className="space-y-3">
      <div className="sticky top-0 z-10 -mx-1 border-b bg-slate-50/95 px-1 py-2 backdrop-blur">
        <h2 className="text-xl font-semibold">Sessions Management</h2>
        <p className="text-xs text-muted-foreground">
          {mode === 'today'
            ? `${todayLabel} (${TIMEZONE})`
            : mode === 'upcoming'
              ? upcomingFilterMode === 'specific-date'
                ? `Date: ${upcomingSpecificDate || 'Select date'} (${TIMEZONE})`
                : `Upcoming: ${upcomingStartDateKey} to ${upcomingEndDateKey} (${TIMEZONE})`
              : 'Active admissions with teacher/schedule readiness'}{' '}
          {isNotificationActionsEnabled
            ? '| Open WhatsApp, then manually tick notified.'
            : '| Admissions operations view.'}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center rounded-md border bg-white p-0.5">
            <Button
              size="sm"
              className="h-7 px-3 text-xs"
              variant={mode === 'today' ? 'default' : 'ghost'}
              onClick={() => setMode('today')}
            >
              Today
              {mode === 'today' && (
                <span className="ml-1.5 rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] font-semibold leading-none tabular-nums">
                  {sortedRows.length}
                </span>
              )}
            </Button>
            <Button
              size="sm"
              className="h-7 px-3 text-xs"
              variant={mode === 'upcoming' ? 'default' : 'ghost'}
              onClick={() => setMode('upcoming')}
            >
              Upcoming
              {mode === 'upcoming' && (
                <span className="ml-1.5 rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] font-semibold leading-none tabular-nums">
                  {sortedRows.length}
                </span>
              )}
            </Button>
            <Button
              size="sm"
              className="h-7 px-3 text-xs"
              variant={mode === 'overall-admissions' ? 'default' : 'ghost'}
              onClick={() => setMode('overall-admissions')}
            >
              Overall Admissions
              {mode === 'overall-admissions' && (
                <span className="ml-1.5 rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] font-semibold leading-none tabular-nums">
                  {sortedAdmissionsRows.length}
                </span>
              )}
            </Button>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground">Teacher</span>
            <Select value={teacherFilter} onValueChange={setTeacherFilter}>
              <SelectTrigger className="h-7 w-[180px] text-xs">
                <SelectValue placeholder="All Teachers" />
              </SelectTrigger>
              <SelectContent>
                {teacherOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {mode !== 'overall-admissions' ? (
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground">Status</span>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-7 w-[165px] text-xs">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}
          {mode === 'upcoming' ? (
            <>
              <div className="inline-flex items-center rounded-md border bg-white p-0.5">
                <Button
                  size="sm"
                  className="h-7 px-2 text-xs"
                  variant={upcomingFilterMode === 'range' ? 'default' : 'ghost'}
                  onClick={() => setUpcomingFilterMode('range')}
                >
                  Range
                </Button>
                <Button
                  size="sm"
                  className="h-7 px-2 text-xs"
                  variant={upcomingFilterMode === 'specific-date' ? 'default' : 'ghost'}
                  onClick={() => setUpcomingFilterMode('specific-date')}
                >
                  Specific Date
                </Button>
              </div>
              {upcomingFilterMode === 'range' ? (
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground">Range</span>
                  <Select
                    value={String(upcomingDays)}
                    onValueChange={(value) => setUpcomingDays(Number(value) || 7)}
                  >
                    <SelectTrigger className="h-7 w-[110px] text-xs">
                      <SelectValue placeholder="Days" />
                    </SelectTrigger>
                    <SelectContent>
                      {UPCOMING_RANGE_OPTIONS.map((days) => (
                        <SelectItem key={days} value={String(days)}>
                          {days} days
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground">Date</span>
                  <Input
                    type="date"
                    value={upcomingSpecificDate}
                    onChange={(event) => setUpcomingSpecificDate(event.target.value)}
                    className="h-7 w-[148px] text-xs"
                  />
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>

      {isLoading ? (
        <Card className="p-4 text-sm text-muted-foreground">
          {mode === 'today'
            ? "Loading today's scheduled sessions..."
            : mode === 'upcoming'
              ? upcomingFilterMode === 'specific-date'
                ? 'Loading sessions for selected date...'
                : 'Loading upcoming scheduled sessions...'
              : 'Loading active admissions...'}
        </Card>
      ) : visibleRowsCount === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-sm text-muted-foreground">
            {(() => {
              if (mode === 'overall-admissions') {
                return hasOperationalFilters
                  ? 'No admissions for selected filters.'
                  : 'No active admissions.';
              }
              if (mode === 'today') {
                return hasOperationalFilters
                  ? 'No sessions for selected filters.'
                  : 'No sessions today.';
              }
              if (upcomingFilterMode === 'specific-date') {
                return hasOperationalFilters
                  ? 'No sessions for selected filters.'
                  : 'No sessions on selected date.';
              }
              return hasOperationalFilters
                ? 'No sessions for selected filters.'
                : 'No upcoming sessions in the selected range.';
            })()}
          </p>
        </Card>
      ) : isOverallAdmissionsMode ? (
        <Card className="p-0">
          <div className="overflow-x-auto">
            <Table className="min-w-[860px] table-fixed text-[13px] [&_th]:h-9 [&_th]:px-1.5 [&_th]:py-1.5 [&_th]:text-xs [&_td]:px-1.5 [&_td]:py-1.5 [&_th:not(:last-child)]:border-r [&_th:not(:last-child)]:border-slate-200/80 [&_td:not(:last-child)]:border-r [&_td:not(:last-child)]:border-slate-100">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[165px] whitespace-nowrap">Student</TableHead>
                  <TableHead className="w-[165px] whitespace-nowrap">Parent</TableHead>
                  <TableHead className="w-[165px] whitespace-nowrap">Teacher</TableHead>
                  <TableHead className="w-[140px] whitespace-nowrap">Course</TableHead>
                  <TableHead className="w-[250px] whitespace-nowrap">Schedule Summary</TableHead>
                  <TableHead className="w-[130px] whitespace-nowrap">Admission Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="[&_tr:nth-child(even)]:bg-slate-50/35">
                {sortedAdmissionsRows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="align-top whitespace-nowrap font-medium">
                      <div className="max-w-[165px] truncate" title={row.studentLabel}>
                        {row.studentLabel}
                      </div>
                    </TableCell>
                    <TableCell className="align-top whitespace-nowrap">
                      <div className="max-w-[175px] truncate text-sm leading-5" title={row.parentName}>
                        {row.parentName}
                      </div>
                    </TableCell>
                    <TableCell className="align-top whitespace-nowrap">
                      <div className="max-w-[175px] truncate text-sm leading-5" title={row.teacherName}>
                        {row.teacherName}
                      </div>
                    </TableCell>
                    <TableCell className="align-top whitespace-nowrap">
                      <div className="max-w-[135px] truncate" title={row.courseLabel}>
                        {row.courseLabel}
                      </div>
                    </TableCell>
                    <TableCell className="align-top whitespace-nowrap">
                      <div className="max-w-[245px] truncate" title={row.scheduleSummary}>
                        {row.scheduleSummary}
                      </div>
                    </TableCell>
                    <TableCell className="align-top whitespace-nowrap" title={row.admissionStatusLabel}>
                      {row.admissionStatusLabel}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      ) : (
        <Card className="p-0">
          <div className="overflow-x-auto">
            <Table
              className={
                mode === 'today'
                  ? 'min-w-[1160px] table-fixed text-[13px] [&_th]:h-9 [&_th]:px-1.5 [&_th]:py-1.5 [&_th]:text-xs [&_td]:px-1.5 [&_td]:py-1.5 [&_th:not(:last-child)]:border-r [&_th:not(:last-child)]:border-slate-200/80 [&_td:not(:last-child)]:border-r [&_td:not(:last-child)]:border-slate-100'
                  : isNotificationActionsEnabled
                    ? 'min-w-[1160px] table-fixed text-[13px] [&_th]:h-9 [&_th]:px-1.5 [&_th]:py-1.5 [&_th]:text-xs [&_td]:px-1.5 [&_td]:py-1.5 [&_th:not(:last-child)]:border-r [&_th:not(:last-child)]:border-slate-200/80 [&_td:not(:last-child)]:border-r [&_td:not(:last-child)]:border-slate-100'
                    : 'min-w-[980px] table-fixed text-[13px] [&_th]:h-9 [&_th]:px-1.5 [&_th]:py-1.5 [&_th]:text-xs [&_td]:px-1.5 [&_td]:py-1.5 [&_th:not(:last-child)]:border-r [&_th:not(:last-child)]:border-slate-200/80 [&_td:not(:last-child)]:border-r [&_td:not(:last-child)]:border-slate-100'
              }
            >
              <TableHeader>
                <TableRow>
                  {mode === 'upcoming' ? (
                    <>
                      <TableHead className="w-[96px] whitespace-nowrap">Day</TableHead>
                      <TableHead className="w-[102px] whitespace-nowrap">Date</TableHead>
                    </>
                  ) : null}
                  <TableHead className="w-[188px] whitespace-nowrap">Class Time</TableHead>
                  <TableHead className="w-[150px] whitespace-nowrap">Student</TableHead>
                  <TableHead className="w-[178px] whitespace-nowrap">Parent</TableHead>
                  <TableHead className="w-[178px] whitespace-nowrap">Teacher</TableHead>
                  <TableHead className="w-[146px] whitespace-nowrap">Course / Subject</TableHead>
                  <TableHead className="w-[102px] whitespace-nowrap">Session Status</TableHead>
                  <TableHead className="w-[110px] whitespace-nowrap">Session Type</TableHead>
                  {isNotificationActionsEnabled ? (
                    <>
                      <TableHead className="w-[280px] whitespace-nowrap">Actions</TableHead>
                      <TableHead className="w-[88px] whitespace-nowrap">Notified</TableHead>
                    </>
                  ) : null}
                </TableRow>
              </TableHeader>
              <TableBody className="[&_tr:nth-child(even)]:bg-slate-50/35">
                {sortedRows.map((row) => {
                  const parentPhoneDigits = String(row.parentWhatsappDigits || '');
                  const teacherPhoneDigits = String(row.teacherWhatsappDigits || '');
                  const savingParent = Boolean(savingFlags[`${row.id}:parent`]);
                  const savingTeacher = Boolean(savingFlags[`${row.id}:teacher`]);
                  const parentPhoneEditKey = `${row.id}:parent-phone`;
                  const teacherPhoneEditKey = `${row.id}:teacher-phone`;
                  const isEditingParentPhone = editingPhone?.key === parentPhoneEditKey;
                  const isEditingTeacherPhone = editingPhone?.key === teacherPhoneEditKey;
                  const parentMessage = buildResolvedRowMessage(row, 'parent');
                  const teacherMessage = buildResolvedRowMessage(row, 'teacher');
                  const hasDirectJoinUrl =
                    (typeof row.joinUrl === 'string' && row.joinUrl.trim().length > 0) ||
                    (typeof row.meetingLink === 'string' && row.meetingLink.trim().length > 0);
                  const enrollmentJoinSource = row.enrollmentId
                    ? enrollmentMap[String(row.enrollmentId).trim()]
                    : undefined;
                  const hasEnrollmentJoinUrl =
                    (typeof enrollmentJoinSource?.joinUrl === 'string' &&
                      enrollmentJoinSource.joinUrl.trim().length > 0) ||
                    (typeof enrollmentJoinSource?.meetingLink === 'string' &&
                      enrollmentJoinSource.meetingLink.trim().length > 0);
                  const canJoinClass = hasDirectJoinUrl || hasEnrollmentJoinUrl || Boolean(row.enrollmentId);

                  return (
                    <TableRow key={row.id}>
                      {mode === 'upcoming' ? (
                        <>
                          <TableCell className="align-top whitespace-nowrap">
                            {formatKolkataWeekdayFromDateKey(String(row.sessionDateKey || row.date || ''))}
                          </TableCell>
                          <TableCell className="align-top whitespace-nowrap">
                            {formatKolkataShortDateFromDateKey(String(row.sessionDateKey || row.date || ''))}
                          </TableCell>
                        </>
                      ) : null}
                      <TableCell className="align-top whitespace-nowrap">
                        <div className="space-y-0.5">
                          <div>{row.classTimeIst || row.classTime}</div>
                          {row.classTimeParent ? (
                            <div
                              className="max-w-[178px] truncate text-[11px] leading-tight text-muted-foreground"
                              title={`${row.classTimeParent} (${row.parentTimeZone || 'Parent timezone'})`}
                            >
                              Parent: {row.classTimeParent}
                            </div>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="align-top whitespace-nowrap font-medium">
                        <div className="max-w-[145px] truncate" title={row.studentLabel}>
                          {row.studentLabel}
                        </div>
                      </TableCell>
                      <TableCell className="align-top whitespace-nowrap">
                        {isNotificationActionsEnabled ? (
                          <div className="space-y-1">
                            {isEditingParentPhone ? (
                              <div className="space-y-1 pt-1">
                                <div className="flex items-center gap-2">
                                  <Select
                                    value={editingPhone?.countryOptionId || ''}
                                    onValueChange={(nextValue) =>
                                      setEditingPhone((prev) =>
                                        prev
                                          ? {
                                              ...prev,
                                              countryOptionId: nextValue,
                                              countryCode:
                                                nextValue === CUSTOM_COUNTRY_ID
                                                  ? ''
                                                  : countryCodeFromOptionId(nextValue),
                                            }
                                          : prev,
                                      )
                                    }
                                  >
                                    <SelectTrigger className="h-8 w-[126px] text-xs">
                                      <SelectValue placeholder="Code" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {COUNTRY_OPTIONS.map((option) => (
                                        <SelectItem
                                          key={option.id}
                                          value={option.id}
                                        >
                                          {option.label}
                                        </SelectItem>
                                      ))}
                                      <SelectItem value={CUSTOM_COUNTRY_ID}>Other / Custom</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  {editingPhone?.countryOptionId === CUSTOM_COUNTRY_ID ? (
                                    <Input
                                      value={editingPhone?.countryCode || ''}
                                      onChange={(event) =>
                                        setEditingPhone((prev) =>
                                          prev ? { ...prev, countryCode: event.target.value } : prev,
                                        )
                                      }
                                      placeholder="+81"
                                      className="h-8 w-[86px] text-xs"
                                    />
                                  ) : null}
                                  <Input
                                    value={editingPhone?.phone || ''}
                                    onChange={(event) =>
                                      setEditingPhone((prev) =>
                                        prev ? { ...prev, phone: event.target.value } : prev,
                                      )
                                    }
                                    placeholder="Phone number"
                                    className="h-8 text-xs"
                                    autoFocus
                                  />
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button
                                    size="sm"
                                    className="h-7 px-2 text-xs"
                                    onClick={() => void handleSavePhoneEdit()}
                                    disabled={
                                      savingPhoneKey === parentPhoneEditKey ||
                                      !isCountryCodeInputValid(editingPhone?.countryCode || '') ||
                                      !normalizePhoneForSave(editingPhone?.phone || '')
                                    }
                                  >
                                    Save
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 px-2 text-xs"
                                    onClick={() => setEditingPhone(null)}
                                    disabled={savingPhoneKey === parentPhoneEditKey}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div
                                className="max-w-[170px] truncate text-sm leading-5"
                                title={row.parentName || 'Parent'}
                              >
                                {row.parentName || 'Parent'}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="max-w-[170px] truncate text-sm leading-5" title={row.parentName || 'Parent'}>
                            {row.parentName || 'Parent'}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="align-top whitespace-nowrap">
                        {isNotificationActionsEnabled ? (
                          <div className="space-y-1">
                            {isEditingTeacherPhone ? (
                              <div className="space-y-1 pt-1">
                                <div className="flex items-center gap-2">
                                  <Select
                                    value={editingPhone?.countryOptionId || ''}
                                    onValueChange={(nextValue) =>
                                      setEditingPhone((prev) =>
                                        prev
                                          ? {
                                              ...prev,
                                              countryOptionId: nextValue,
                                              countryCode:
                                                nextValue === CUSTOM_COUNTRY_ID
                                                  ? ''
                                                  : countryCodeFromOptionId(nextValue),
                                            }
                                          : prev,
                                      )
                                    }
                                  >
                                    <SelectTrigger className="h-8 w-[126px] text-xs">
                                      <SelectValue placeholder="Code" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {COUNTRY_OPTIONS.map((option) => (
                                        <SelectItem
                                          key={option.id}
                                          value={option.id}
                                        >
                                          {option.label}
                                        </SelectItem>
                                      ))}
                                      <SelectItem value={CUSTOM_COUNTRY_ID}>Other / Custom</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  {editingPhone?.countryOptionId === CUSTOM_COUNTRY_ID ? (
                                    <Input
                                      value={editingPhone?.countryCode || ''}
                                      onChange={(event) =>
                                        setEditingPhone((prev) =>
                                          prev ? { ...prev, countryCode: event.target.value } : prev,
                                        )
                                      }
                                      placeholder="+81"
                                      className="h-8 w-[86px] text-xs"
                                    />
                                  ) : null}
                                  <Input
                                    value={editingPhone?.phone || ''}
                                    onChange={(event) =>
                                      setEditingPhone((prev) =>
                                        prev ? { ...prev, phone: event.target.value } : prev,
                                      )
                                    }
                                    placeholder="Phone number"
                                    className="h-8 text-xs"
                                    autoFocus
                                  />
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button
                                    size="sm"
                                    className="h-7 px-2 text-xs"
                                    onClick={() => void handleSavePhoneEdit()}
                                    disabled={
                                      savingPhoneKey === teacherPhoneEditKey ||
                                      !isCountryCodeInputValid(editingPhone?.countryCode || '') ||
                                      !normalizePhoneForSave(editingPhone?.phone || '')
                                    }
                                  >
                                    Save
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 px-2 text-xs"
                                    onClick={() => setEditingPhone(null)}
                                    disabled={savingPhoneKey === teacherPhoneEditKey}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div
                                className="max-w-[170px] truncate text-sm leading-5"
                                title={row.teacherName || 'Teacher'}
                              >
                                {row.teacherName || 'Teacher'}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="max-w-[170px] truncate text-sm leading-5" title={row.teacherName || 'Teacher'}>
                            {row.teacherName || 'Teacher'}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="align-top whitespace-nowrap">
                        <div className="max-w-[140px] truncate" title={row.courseLabel}>
                          {row.courseLabel}
                        </div>
                      </TableCell>
                      <TableCell className="align-top whitespace-nowrap capitalize">{row.statusLabel}</TableCell>
                      <TableCell className="align-top whitespace-nowrap">
                        <span
                          title={row.sessionTypeReason || 'fallback: no special markers'}
                          className={`inline-flex items-center rounded px-2 py-0.5 text-[11px] font-medium ${toSessionTypeStyle(
                            row.sessionTypeLabel || 'Regular',
                          )}`}
                        >
                          {row.sessionTypeLabel || 'Regular'}
                        </span>
                      </TableCell>
                      {isNotificationActionsEnabled ? (
                        <>
                          <TableCell className="align-top whitespace-nowrap">
                            <div className="flex items-start gap-2">
                              <Button
                                size="sm"
                                variant="default"
                                className="h-8 px-3 text-xs"
                                onClick={() => void handleJoinClass(row)}
                                disabled={!canJoinClass || joiningSessionId === row.id}
                              >
                                {joiningSessionId === row.id ? 'Opening…' : 'Join Class'}
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button size="sm" variant="outline" className="h-8 px-2 text-xs">
                                    Actions
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56">
                                  <DropdownMenuItem
                                    onSelect={() => openWhatsApp(parentPhoneDigits, parentMessage)}
                                    disabled={!parentPhoneDigits}
                                  >
                                    Notify Parent
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onSelect={() => openMessageEditor(row.id, 'parent')}
                                  >
                                    Edit Parent Message
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onSelect={() =>
                                      handleStartPhoneEdit(
                                        parentPhoneEditKey,
                                        row.parentUserDocId,
                                        row.parentEditCountryCode || '',
                                        row.parentEditPhone || '',
                                      )
                                    }
                                    disabled={!row.parentUserDocId || row.parentUserMissing}
                                  >
                                    Add/Edit Parent Phone
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onSelect={() => openWhatsApp(teacherPhoneDigits, teacherMessage)}
                                    disabled={!teacherPhoneDigits}
                                  >
                                    Notify Teacher
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onSelect={() => openMessageEditor(row.id, 'teacher')}
                                  >
                                    Edit Teacher Message
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onSelect={() =>
                                      handleStartPhoneEdit(
                                        teacherPhoneEditKey,
                                        row.teacherUserDocId,
                                        row.teacherEditCountryCode || '',
                                        row.teacherEditPhone || '',
                                      )
                                    }
                                    disabled={!row.teacherUserDocId || row.teacherUserMissing}
                                  >
                                    Add/Edit Teacher Phone
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                          <TableCell className="align-top whitespace-nowrap">
                            <div className="flex items-center gap-3 text-xs">
                              <label className="inline-flex items-center gap-1">
                                <span className="font-medium text-muted-foreground">P</span>
                                <input
                                  type="checkbox"
                                  className="h-4 w-4 rounded border-slate-300 align-middle"
                                  checked={Boolean(row.parentNotified)}
                                  disabled={savingParent}
                                  onChange={(event) =>
                                    void handleNotifiedToggle(row.id, 'parent', event.target.checked)
                                  }
                                />
                              </label>
                              <label className="inline-flex items-center gap-1">
                                <span className="font-medium text-muted-foreground">T</span>
                                <input
                                  type="checkbox"
                                  className="h-4 w-4 rounded border-slate-300 align-middle"
                                  checked={Boolean(row.teacherNotified)}
                                  disabled={savingTeacher}
                                  onChange={(event) =>
                                    void handleNotifiedToggle(row.id, 'teacher', event.target.checked)
                                  }
                                />
                              </label>
                            </div>
                          </TableCell>
                        </>
                      ) : null}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      <Dialog open={Boolean(messageEditor)} onOpenChange={(open) => (!open ? closeMessageEditor() : undefined)}>
        <DialogContent className="w-[calc(100vw-1rem)] max-w-3xl border-slate-200">
          <DialogHeader>
            <DialogTitle>
              {messageEditor?.recipient === 'parent' ? 'Edit Parent Message' : 'Edit Teacher Message'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="text-xs text-muted-foreground">
              Session: {activeMessageRow?.studentLabel || 'your child'} at {activeMessageRow?.classTime || 'Time TBD'}
            </div>
            <Textarea
              value={messageEditor?.value || ''}
              onChange={(event) =>
                setMessageEditor((prev) =>
                  prev ? { ...prev, value: event.target.value } : prev,
                )
              }
              className="min-h-[260px] text-sm"
            />
            <div className="text-xs text-muted-foreground">
              Supported placeholders: [Parent Name], [Teacher Name], [Child Name], [Time], [Course]
            </div>
            <div className="flex items-center justify-end gap-2">
              <Button size="sm" variant="ghost" onClick={closeMessageEditor}>
                Cancel
              </Button>
              <Button size="sm" onClick={saveMessageEditor}>
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
