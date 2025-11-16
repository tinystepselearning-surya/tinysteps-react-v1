import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../../lib/firebaseConfig';
import { Message, Conversation } from '../../../types/Teacher';

interface UseMessagesResult {
  conversations: Conversation[];
  messages: Message[];
  isLoading: boolean;
  error: Error | null;
  sendMessage: (toId: string, content: string, attachments?: any[]) => Promise<void>;
  markAsRead: (messageId: string) => Promise<void>;
}

export const useMessages = (teacherId?: string): UseMessagesResult => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(!!teacherId);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!teacherId) {
      setIsLoading(false);
      return;
    }

    const q = query(
      collection(db, 'messages'),
      where('participants', 'array-contains', teacherId),
      orderBy('timestamp', 'desc')
    );

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const msgs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Message));
        setMessages(msgs);

        // Group into conversations
        const convMap: Record<string, Message[]> = {};
        msgs.forEach(msg => {
          const otherId = msg.fromId === teacherId ? msg.toId : msg.fromId;
          if (!convMap[otherId]) convMap[otherId] = [];
          convMap[otherId].push(msg);
        });

        const convs: Conversation[] = Object.entries(convMap).map(([participantId, msgs]) => {
          const sortedMsgs = msgs.sort((a, b) => b.timestamp.toMillis() - a.timestamp.toMillis());
          const unreadCount = sortedMsgs.filter(m => !m.read && m.toId === teacherId).length;
          return {
            id: participantId,
            participants: [teacherId, participantId],
            lastMessage: sortedMsgs[0],
            unreadCount,
          };
        });

        setConversations(convs);
        setIsLoading(false);
      },
      (err) => {
        console.error('useMessages error', err);
        setError(err as Error);
        setIsLoading(false);
      }
    );

    return () => unsub();
  }, [teacherId]);

  const sendMessage = async (toId: string, content: string, attachments?: any[]) => {
    // Implement send message logic
    // This would add to messages collection
  };

  const markAsRead = async (messageId: string) => {
    // Implement mark as read
  };

  return { conversations, messages, isLoading, error, sendMessage, markAsRead };
};