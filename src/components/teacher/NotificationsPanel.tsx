import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

const NotificationsPanel: React.FC = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Notifications</h1>
      <Card>
        <CardHeader>
          <CardTitle>Recent Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Notifications will be displayed here.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationsPanel;