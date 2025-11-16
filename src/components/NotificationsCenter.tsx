import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Badge } from '@components/ui/badge';
import { Label } from '@components/ui/label';

const NotificationsCenter: React.FC = () => {
  const [emailNotifs, setEmailNotifs] = React.useState(true);
  const [smsNotifs, setSmsNotifs] = React.useState(false);
  const [inAppNotifs, setInAppNotifs] = React.useState(true);

  // No demo notifications shipped with the build
  const notifications: { id: number; type: string; message: string; time?: string; read?: boolean }[] = [];

  const handleMarkRead = (id: number) => {
    console.log('Marking notification as read:', id);
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Notifications Center</h1>

      {/* Settings */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Notification Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <input type="checkbox" checked={emailNotifs} onChange={(e) => setEmailNotifs(e.target.checked)} />
              <Label>Email Notifications</Label>
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" checked={smsNotifs} onChange={(e) => setSmsNotifs(e.target.checked)} />
              <Label>SMS Notifications</Label>
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" checked={inAppNotifs} onChange={(e) => setInAppNotifs(e.target.checked)} />
              <Label>In-App Notifications</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 && <p className="text-sm text-gray-500">No notifications yet.</p>}
          {notifications.map(notification => (
            <div key={notification.id} className={`p-4 border-b ${notification.read ? 'bg-gray-50' : 'bg-white'}`}>
              <div className="flex justify-between items-start">
                <div>
                  <Badge variant="outline">{notification.type}</Badge>
                  <p className="mt-1">{notification.message}</p>
                  <p className="text-sm text-gray-500">{notification.time}</p>
                </div>
                {!notification.read && (
                  <Button size="sm" onClick={() => handleMarkRead(notification.id)}>Mark Read</Button>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationsCenter;