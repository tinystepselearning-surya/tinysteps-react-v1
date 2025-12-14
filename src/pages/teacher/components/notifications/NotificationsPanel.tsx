// src/pages/teacher/components/notifications/NotificationsPanel.tsx
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

export interface NotificationsPanelProps {
  teacherId?: string | null;
  onClose?: () => void;
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
export const NotificationsPanel: React.FC<NotificationsPanelProps> = ({
  teacherId,
  onClose,
}) => {
  const [items, setItems] = useState<TeacherNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!teacherId) {
      setError('Teacher ID not available. Please log in again.');
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Notifications targeted to this teacher OR broadcast to all
    const q = query(
      collection(db, 'notifications'),
      where('teacherId', 'in', [teacherId, 'all']),
      orderBy('createdAt', 'desc'),
      limit(30),
    );

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const list: TeacherNotification[] = snap.docs.map((docSnap) => {
          const data = docSnap.data() as any;
          return {
            id: docSnap.id,
            teacherId: data.teacherId ?? null,
            title: data.title,
            body: data.body,
            type: data.type,
            priority: data.priority,
            read: data.read,
            createdAt: data.createdAt ?? null,
            childName: data.childName,
            parentName: data.parentName,
          };
        });

        setItems(list);
        setLoading(false);
      },
      (err) => {
        console.error('[NotificationsPanel] onSnapshot error', err);
        setError('Failed to load notifications. Please try again.');
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [teacherId]);

  const unreadCount = useMemo(
    () => items.filter((n) => !n.read).length,
    [items],
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

  const typeLabelAndVariant = (type?: string) => {
    switch (type) {
      case 'session':
        return { label: 'Session', variant: 'secondary' as const };
      case 'payment':
        return { label: 'Payment', variant: 'outline' as const };
      case 'parent_message':
        return { label: 'Parent Message', variant: 'outline' as const };
      case 'system':
        return { label: 'System', variant: 'default' as const };
      default:
        return { label: 'Notification', variant: 'outline' as const };
    }
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-sm text-slate-500">
            See important updates about sessions, payments, and parents.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <Badge variant="destructive">
              {unreadCount} unread
            </Badge>
          )}
          <Button
            size="sm"
            variant="outline"
            type="button"
            onClick={() => {
              // Placeholder for future "Mark all as read" logic
              alert(
                'Mark-as-read API will be added later. For now, this is a view-only list.',
              );
            }}
          >
            Mark all as read
          </Button>
          {onClose && (
            <Button
              size="sm"
              variant="outline"
              type="button"
              onClick={onClose}
            >
              Close
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader className="flex items-center justify-between space-y-0">
          <CardTitle className="text-lg">Recent Notifications</CardTitle>
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
              Loading notifications…
            </p>
          )}

          {!loading && error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          {!loading && !error && items.length === 0 && (
            <p className="text-sm text-slate-500">
              No notifications yet. As Tiny Steps automations go live,
              new alerts will appear here.
            </p>
          )}

          {!loading && !error && items.length > 0 && (
            <div className="space-y-2">
              {items.map((n) => {
                const { label, variant } = typeLabelAndVariant(n.type);

                return (
                  <div
                    key={n.id}
                    className={`rounded-lg border px-3 py-2 text-sm ${
                      !n.read
                        ? 'border-amber-300 bg-amber-50'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={variant}>{label}</Badge>
                        {n.childName && (
                          <span className="text-[11px] text-slate-600">
                            Child: {n.childName}
                          </span>
                        )}
                        {n.parentName && (
                          <span className="text-[11px] text-slate-500">
                            | Parent: {n.parentName}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {formatTimestamp(n.createdAt)}
                      </span>
                    </div>

                    {n.title && (
                      <p className="mt-1 text-sm font-semibold text-slate-800">
                        {n.title}
                      </p>
                    )}

                    {n.body && (
                      <p className="mt-0.5 text-xs text-slate-700 whitespace-pre-line">
                        {n.body.length > 160
                          ? n.body.slice(0, 160) + '…'
                          : n.body}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Optional default export if you ever import without the named symbol
export default NotificationsPanel;
