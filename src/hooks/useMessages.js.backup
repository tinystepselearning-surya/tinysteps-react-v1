var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebaseConfig';
export const useMessages = (teacherId) => {
    const [conversations, setConversations] = useState([]);
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        if (!teacherId) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        setError(null);
        // Query messages where teacher is participant
        const messagesQuery = query(collection(db, 'messages'), where('participants', 'array-contains', teacherId), orderBy('timestamp', 'desc'));
        const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
            const msgs = [];
            const convMap = new Map();
            snapshot.forEach((doc) => {
                const msg = Object.assign({ id: doc.id }, doc.data());
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
                }
                else {
                    const conv = convMap.get(convId);
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
        }, (err) => {
            setError(err);
            setIsLoading(false);
        });
        return unsubscribe;
    }, [teacherId]);
    const sendMessage = (conversationId, content) => __awaiter(void 0, void 0, void 0, function* () {
        if (!teacherId)
            return;
        const participants = conversationId.split('-');
        const toId = participants.find(p => p !== teacherId);
        yield addDoc(collection(db, 'messages'), {
            fromId: teacherId,
            toId,
            content,
            timestamp: Timestamp.now(),
            read: false,
            participants: [teacherId, toId].sort(),
        });
    });
    return { conversations, messages, isLoading, error, sendMessage };
};
