import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

const ScheduleView: React.FC = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Schedule</h1>
      <Card>
        <CardHeader>
          <CardTitle>Calendar View</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Calendar and scheduling tools will be displayed here.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ScheduleView;