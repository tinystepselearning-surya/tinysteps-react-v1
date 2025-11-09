import React from 'react';
import { Card } from '@components/ui/card';

export default function Analytics() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Analytics Dashboard</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="p-6">
          <h3 className="font-semibold mb-2">Total Users</h3>
          <div className="text-3xl font-bold text-blue-600">0</div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold mb-2">Active Sessions</h3>
          <div className="text-3xl font-bold text-green-600">0</div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold mb-2">Revenue</h3>
          <div className="text-3xl font-bold text-purple-600">$0</div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="text-center text-gray-500">
          <p>Charts and detailed analytics will be displayed here</p>
          <p className="text-sm mt-2">User growth, session attendance, course popularity</p>
        </div>
      </Card>
    </div>
  );
}