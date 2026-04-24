import { useEffect, useState } from 'react';
import { collection, limit, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../lib/firebaseConfig';

type RawMessageData = {
  senderId?: unknown;
  text?: unknown;
  createdAt?: unknown;
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
  if (value && typeof value === 'object' && typeof (value as { toMillis?: unknown }).toMillis === 'function') {
    try {
      return (value as { toMillis: () => number }).toMillis();
    } catch {
      return null;
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
              createdAtMs: asTimestampMs(raw.createdAt),
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
