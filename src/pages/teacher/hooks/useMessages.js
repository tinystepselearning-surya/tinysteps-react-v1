var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../../lib/firebaseConfig';
export const useMessages = (teacherId) => {
    const [conversations, setConversations] = useState([]);
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(!!teacherId);
    const [error, setError] = useState(null);
    useEffect(() => {
        if (!teacherId) {
            setIsLoading(false);
            return;
        }
        const q = query(collection(db, 'messages'), where('participants', 'array-contains', teacherId), orderBy('timestamp', 'desc'));
        const unsub = onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map(d => (Object.assign({ id: d.id }, d.data())));
            setMessages(msgs);
            // Group into conversations
            const convMap = {};
            msgs.forEach(msg => {
                const otherId = msg.fromId === teacherId ? msg.toId : msg.fromId;
                if (!convMap[otherId])
                    convMap[otherId] = [];
                convMap[otherId].push(msg);
            });
            const convs = Object.entries(convMap).map(([participantId, msgs]) => {
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
        }, (err) => {
            console.error('useMessages error', err);
            setError(err);
            setIsLoading(false);
        });
        return () => unsub();
    }, [teacherId]);
    const sendMessage = (toId, content, attachments) => __awaiter(void 0, void 0, void 0, function* () {
        // Implement send message logic
        // This would add to messages collection
    });
    const markAsRead = (messageId) => __awaiter(void 0, void 0, void 0, function* () {
        // Implement mark as read
    });
    return { conversations, messages, isLoading, error, sendMessage, markAsRead };
};
