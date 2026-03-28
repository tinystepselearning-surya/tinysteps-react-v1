export const normalizeLowerStatus = (value: unknown): string =>
  String(value || '').trim().toLowerCase();

export const normalizeEnrollmentStatus = (value: unknown): string => {
  const raw = normalizeLowerStatus(value);
  if (!raw) return 'active';
  if (raw === 'pending_teacher') return 'trial';
  if (raw === 'pending_payment' || raw === 'pending_lp') return 'active';
  if (raw === 'enrolled' || raw === 'current' || raw === 'ongoing') return 'active';
  if (raw === 'canceled') return 'cancelled';
  return raw;
};

export const normalizeDemoStatus = (value: unknown): string => {
  const raw = normalizeLowerStatus(value);
  if (!raw) return 'open';
  if (raw === 'canceled') return 'cancelled';
  if (raw === 'inprogress') return 'assigned';
  return raw;
};

export const normalizeFinanceStatus = (value: unknown): string => {
  const raw = normalizeLowerStatus(value);
  if (!raw) return '';
  if (raw === 'settled') return 'paid';
  if (raw === 'canceled') return 'cancelled';
  return raw;
};

export const formatStatusLabel = (value: unknown): string => {
  const normalized = normalizeLowerStatus(value);
  if (!normalized) return '—';
  return normalized
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};
