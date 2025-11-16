import React, { useState } from 'react';
import { Card } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Badge } from '@components/ui/badge';
import { Bell } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@components/ui/dropdown-menu';

interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

interface NotificationsPanelProps {
  teacherId?: string;
}

export const NotificationsPanel: React.FC<NotificationsPanelProps> = ({ teacherId }) => {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      title: 'New session scheduled',
      message: 'You have a new session scheduled for tomorrow.',
      timestamp: new Date(),
      read: false,
    },
    {
      id: '2',
      title: 'Parent message',
      message: 'A parent has sent you a message.',
      timestamp: new Date(Date.now() - 3600000),
      read: false,
    },
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Notifications</h3>
        <div className="space-y-4">
          {notifications.map(notification => (
            <div
              key={notification.id}
              className={`p-4 border rounded ${notification.read ? 'bg-gray-50' : 'bg-blue-50'}`}
            >
              <div className="flex justify-between">
                <h4 className="font-medium">{notification.title}</h4>
                {!notification.read && (
                  <Badge variant="destructive">New</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{notification.message}</p>
              <p className="text-xs text-muted-foreground">
                {notification.timestamp.toLocaleString()}
              </p>
              {!notification.read && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => markAsRead(notification.id)}
                  className="mt-2"
                >
                  Mark as Read
                </Button>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

// For header bell icon
export const NotificationBell: React.FC<{ count: number }> = ({ count }) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {count > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
              {count}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80">
        <div className="space-y-2">
          <h4 className="font-medium">Notifications</h4>
          <div className="text-sm text-muted-foreground">
            You have {count} unread notifications.
          </div>
          <Button variant="outline" size="sm">
            View All
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};