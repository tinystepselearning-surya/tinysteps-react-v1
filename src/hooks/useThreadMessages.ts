import { useEffect, useState } from 'react';
import { collection, limit, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../lib/firebaseConfig';

type RawMessageData = {
  senderId?: unknown;
  text?: unknown;
  createdAt?: unknown;
  sentAt?: unknown;
  updatedAt?: unknown;
  clientMessageId?: unknown;
};

export interface ThreadMessage {
  id: string;
  senderId: string;
  text: string;
  clientMessageId: string | null;
  createdAtMs: number | null;
}

const asString = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

const asTimestampMs = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    if (value <= 0) return null;
    return value < 1_000_000_000_000 ? value * 1000 : value;
  }

  if (typeof value === 'string') {
    const numeric = Number(value);
    if (Number.isFinite(numeric) && numeric > 0) {
      return numeric < 1_000_000_000_000 ? numeric * 1000 : numeric;
    }

    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  if (value instanceof Date) {
    const ms = value.getTime();
    return Number.isFinite(ms) ? ms : null;
  }

  if (value && typeof value === 'object' && typeof (value as { toMillis?: unknown }).toMillis === 'function') {
    try {
      return (value as { toMillis: () => number }).toMillis();
    } catch {
      return null;
    }
  }

  if (value && typeof value === 'object' && typeof (value as { toDate?: unknown }).toDate === 'function') {
    try {
      const dateValue = (value as { toDate: () => Date }).toDate();
      const ms = dateValue instanceof Date ? dateValue.getTime() : NaN;
      return Number.isFinite(ms) ? ms : null;
    } catch {
      return null;
    }
  }

  if (value && typeof value === 'object') {
    const asObj = value as Record<string, unknown>;
    const secondsRaw = asObj.seconds ?? asObj._seconds;
    const nanosRaw = asObj.nanoseconds ?? asObj._nanoseconds;
    const seconds = Number(secondsRaw);
    const nanos = Number(nanosRaw);
    if (Number.isFinite(seconds)) {
      const msFromSeconds = seconds * 1000;
      const msFromNanos = Number.isFinite(nanos) ? Math.floor(nanos / 1_000_000) : 0;
      return msFromSeconds + msFromNanos;
    }
  }

  return null;
};

export function useThreadMessages(threadId: string | null) {
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [isLoading, setIsLoading] = useState(Boolean(threadId));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!threadId) {
      setMessages([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    const messagesRef = collection(db, 'messageThreads', threadId, 'messages');
    const messagesQuery = query(messagesRef, orderBy('createdAt', 'desc'), limit(50));

    const unsubscribe = onSnapshot(
      messagesQuery,
      (snapshot) => {
        const nextMessages = snapshot.docs
          .map((docSnap) => {
            const raw = (docSnap.data() || {}) as RawMessageData;
            return {
              id: docSnap.id,
              senderId: asString(raw.senderId),
              text: asString(raw.text),
              clientMessageId: asString(raw.clientMessageId) || null,
              createdAtMs:
                asTimestampMs(raw.createdAt) ??
                asTimestampMs(raw.sentAt) ??
                asTimestampMs(raw.updatedAt),
            } as ThreadMessage;
          })
          .reverse();

        setMessages(nextMessages);
        setIsLoading(false);
      },
      (nextError) => {
        setError(nextError.message || 'Failed to load messages');
        setIsLoading(false);
      },
    );

    return () => unsubscribe();
  }, [threadId]);

  return { messages, isLoading, error };
}

export default useThreadMessages;
