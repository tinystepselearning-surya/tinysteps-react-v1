import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

const MessagesView: React.FC = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Messages</h1>
      <Card>
        <CardHeader>
          <CardTitle>Inbox</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Messages will be displayed here.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default MessagesView;