import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

const TodaySessionsView: React.FC = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Today's Sessions</h1>
      <Card>
        <CardHeader>
          <CardTitle>Today's Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Today's sessions will be displayed here.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default TodaySessionsView;