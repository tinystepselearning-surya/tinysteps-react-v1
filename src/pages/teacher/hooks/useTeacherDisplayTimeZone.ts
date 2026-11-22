import { useQuery } from '@tanstack/react-query';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebaseConfig';
import { getViewerTimeZone } from '../../../lib/sessionTime';

/**
 * The saved teacher profile wins over a different device setting. Never use a
 * fixed PST offset: IANA time zones adjust automatically for daylight saving.
 * Invalid/empty profile values fall back to the browser's resolved time zone.
 */
export const resolveTeacherDisplayTimeZone = (
  configured: unknown,
  fallback = getViewerTimeZone(),
): string => {
  const text = typeof configured === 'string' ? configured.trim() : '';
  if (text) {
    try {
      return new Intl.DateTimeFormat('en-US', { timeZone: text }).resolvedOptions().timeZone;
    } catch {
      // Older profiles may contain a description rather than an IANA zone.
    }
  }
  return fallback;
};

/** One cached users/{uid} lookup per teacher, reused across all calendar tabs. */
export const useTeacherDisplayTimeZone = (teacherId?: string): string => {
  const browserTimeZone = getViewerTimeZone();
  const { data: profileTimeZone } = useQuery({
    queryKey: ['teacherProfileTimeZone', teacherId],
    enabled: Boolean(teacherId),
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    retry: 0,
    queryFn: async () => {
      if (!teacherId) return '';
      const snapshot = await getDoc(doc(db, 'users', teacherId));
      const timezone = snapshot.data()?.timezone;
      return typeof timezone === 'string' ? timezone : '';
    },
  });
  return resolveTeacherDisplayTimeZone(profileTimeZone, browserTimeZone);
};
