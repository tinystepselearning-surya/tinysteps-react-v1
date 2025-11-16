import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

const EarningsSummary: React.FC = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Earnings Summary</h1>
      <Card>
        <CardHeader>
          <CardTitle>Monthly Earnings</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Earnings data will be displayed here.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default EarningsSummary;