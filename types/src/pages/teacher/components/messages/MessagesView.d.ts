import React from 'react';
import { Timestamp } from 'firebase/firestore';
export interface MessagesViewProps {
    teacherId?: string | null;
}
export interface TeacherMessage {
    id: string;
    teacherId: string;
    parentId?: string;
    childId?: string;
    childName?: string;
    parentName?: string;
    subject?: string;
    body?: string;
    senderRole?: 'parent' | 'teacher' | 'rm' | 'system';
    direction?: 'inbound' | 'outbound';
    unread?: boolean;
    createdAt?: Timestamp | null;
}
/**
 * Expected Firestore shape:
 *
 * Collection: messages
 *   {
 *     teacherId: string,
 *     parentId?: string,
 *     childId?: string,
 *     childName?: string,
 *     parentName?: string,
 *     subject?: string,
 *     body: string,
 *     senderRole: 'parent' | 'teacher' | 'rm' | 'system',
 *     direction: 'inbound' | 'outbound',
 *     unread: boolean,
 *     createdAt: serverTimestamp()
 *   }
 */
export declare const MessagesView: React.FC<MessagesViewProps>;
