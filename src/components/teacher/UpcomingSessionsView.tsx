import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

const UpcomingSessionsView: React.FC = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Upcoming Sessions</h1>
      <Card>
        <CardHeader>
          <CardTitle>Next 7 Days</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Upcoming sessions will be displayed here.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default UpcomingSessionsView;