import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

const PerformanceAnalyticsView: React.FC = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Performance Analytics</h1>
      <Card>
        <CardHeader>
          <CardTitle>Analytics Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Analytics charts will be displayed here.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PerformanceAnalyticsView;