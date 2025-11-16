import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

const StudentsView: React.FC = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Students</h1>
      <Card>
        <CardHeader>
          <CardTitle>All Students</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Student list will be displayed here.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentsView;