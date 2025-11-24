import React from 'react';
import { Timestamp } from 'firebase/firestore';
export interface NotificationsPanelProps {
    teacherId?: string | null;
}
export interface TeacherNotification {
    id: string;
    teacherId?: string | null;
    title?: string;
    body?: string;
    type?: 'session' | 'payment' | 'system' | 'parent_message' | string;
    priority?: 'low' | 'normal' | 'high';
    read?: boolean;
    createdAt?: Timestamp | null;
    childName?: string;
    parentName?: string;
}
/**
 * Expected Firestore shape:
 *
 * Collection: notifications
 *   {
 *     teacherId: string | null,   // null or "all" for broadcast
 *     title: string,
 *     body: string,
 *     type: "session" | "payment" | "system" | "parent_message",
 *     priority: "low" | "normal" | "high",
 *     read: boolean,
 *     childName?: string,
 *     parentName?: string,
 *     createdAt: serverTimestamp()
 *   }
 */
export declare const NotificationsPanel: React.FC<NotificationsPanelProps>;
export default NotificationsPanel;
