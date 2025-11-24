import { useState, useEffect } from 'react';
import { Conversation, Message } from '../types/Teacher';
import { Conversation, Message } from '../types/Teacher';

export const useMessages = (teacherId?: string) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!teacherId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    // Query messages where teacher is participant
    const unsubscribe = (async () => {
      const [{ collection, query, where, orderBy, onSnapshot }, { db }] = await Promise.all([
        import('firebase/firestore'),
        import('../lib/firebaseConfig'),
      ] as any);
      const messagesQuery = query(
        collection(db, 'messages'),
        where('participants', 'array-contains', teacherId),
        orderBy('timestamp', 'desc')
      );

      return onSnapshot(
        messagesQuery,
        (snapshot: any) => {
        const msgs: Message[] = [];
        const convMap = new Map<string, Conversation>();

        snapshot.forEach((doc) => {
          const msg = { id: doc.id, ...doc.data() } as Message;
          msgs.push(msg);

          // Build conversations
          const convId = msg.participants.sort().join('-');
          if (!convMap.has(convId)) {
            convMap.set(convId, {
              id: convId,
              participants: msg.participants,
              lastMessage: msg,
              unreadCount: msg.read ? 0 : 1,
            });
          } else {
            const conv = convMap.get(convId)!;
            if (msg.timestamp > conv.lastMessage.timestamp) {
              conv.lastMessage = msg;
            }
            if (!msg.read) {
              conv.unreadCount += 1;
            }
          }
        });

        setMessages(msgs);
        setConversations(Array.from(convMap.values()));
        setIsLoading(false);
        },
        (err: any) => {
          setError(err);
          setIsLoading(false);
        }
      );
    })();

    // unsubscribe may be a Promise resolving to the unsubscribe function
    // we return a cleanup that resolves and calls it if present
    return () => {
      Promise.resolve(unsubscribe).then((u) => {
        if (typeof u === 'function') u();
      }).catch(() => {});
    };
  }, [teacherId]);

  const sendMessage = async (conversationId: string, content: string) => {
    if (!teacherId) return;

    const participants = conversationId.split('-');
    const toId = participants.find(p => p !== teacherId)!;

    const [{ collection, addDoc, Timestamp }, { db }] = await Promise.all([
      import('firebase/firestore'),
      import('../lib/firebaseConfig'),
    ] as any);
    await addDoc(collection(db, 'messages'), {
      fromId: teacherId,
      toId,
      content,
      timestamp: Timestamp.now(),
      read: false,
      participants: [teacherId, toId].sort(),
    });
  };

  return { conversations, messages, isLoading, error, sendMessage };
};
