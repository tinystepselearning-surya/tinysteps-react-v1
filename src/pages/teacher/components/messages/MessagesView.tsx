// src/pages/teacher/components/messages/MessagesView.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';

import { db } from '../../../../lib/firebaseConfig';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import { Badge } from '@components/ui/badge';
import { Button } from '@components/ui/button';

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

export const MessagesView: React.FC<MessagesViewProps> = ({ teacherId }) => {
  const [messages, setMessages] = useState<TeacherMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!teacherId) {
      setError('Teacher ID not available. Please log in again.');
      setMessages([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const q = query(
      collection(db, 'messages'),
      where('teacherId', '==', teacherId),
      orderBy('createdAt', 'desc'),
      limit(50),
    );

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const list: TeacherMessage[] = snap.docs.map((docSnap) => {
          const data = docSnap.data() as any;
          return {
            id: docSnap.id,
            teacherId: data.teacherId,
            parentId: data.parentId,
            childId: data.childId,
            childName: data.childName,
            parentName: data.parentName,
            subject: data.subject,
            body: data.body,
            senderRole: data.senderRole,
            direction: data.direction,
            unread: data.unread,
            createdAt: data.createdAt ?? null,
          };
        });

        setMessages(list);
        setLoading(false);
      },
      (err) => {
        console.error('[MessagesView] onSnapshot error', err);
        setError('Failed to load messages. Please try again.');
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [teacherId]);

  const unreadCount = useMemo(
    () => messages.filter((m) => m.unread).length,
    [messages],
  );

  const formatTimestamp = (ts?: Timestamp | null): string => {
    if (!ts) return '';
    const d = ts.toDate ? ts.toDate() : new Date();
    return d.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Messages</h1>
          <p className="text-sm text-slate-500">
            View recent messages with parents and Tiny Steps team.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <Badge variant="destructive">
              {unreadCount} unread
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            type="button"
            onClick={() => {
              // Placeholder UI
              alert(
                'Compose message UI will be added later. For now, use WhatsApp/phone as usual.',
              );
            }}
          >
            New Message
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-lg">Inbox</CardTitle>
          {teacherId && (
            <p className="text-xs text-slate-500">
              Teacher ID:{' '}
              <span className="font-mono">{teacherId}</span>
            </p>
          )}
        </CardHeader>

        <CardContent className="space-y-3">
          {loading && (
            <p className="text-sm text-slate-500">
              Loading messages…
            </p>
          )}

          {!loading && error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          {!loading && !error && messages.length === 0 && (
            <p className="text-sm text-slate-500">
              No messages yet. Once parents or the Tiny Steps team
              start messaging through the app, they will appear here.
            </p>
          )}

          {!loading && !error && messages.length > 0 && (
            <div className="space-y-2">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`rounded-lg border px-3 py-2 text-sm ${
                    msg.unread
                      ? 'border-violet-300 bg-violet-50'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {msg.direction === 'inbound' ? (
                        <Badge variant="secondary">From Parent</Badge>
                      ) : msg.direction === 'outbound' ? (
                        <Badge variant="outline">You → Parent</Badge>
                      ) : (
                        <Badge variant="outline">
                          {msg.senderRole || 'message'}
                        </Badge>
                      )}
                      {msg.childName && (
                        <span className="text-xs text-slate-600">
                          Child: {msg.childName}
                        </span>
                      )}
                      {msg.parentName && (
                        <span className="text-xs text-slate-500">
                          | Parent: {msg.parentName}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {formatTimestamp(msg.createdAt)}
                    </span>
                  </div>

                  {msg.subject && (
                    <p className="mt-1 text-sm font-semibold text-slate-800">
                      {msg.subject}
                    </p>
                  )}

                  {msg.body && (
                    <p className="mt-0.5 text-xs text-slate-700 whitespace-pre-line">
                      {msg.body.length > 160
                        ? msg.body.slice(0, 160) + '…'
                        : msg.body}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
