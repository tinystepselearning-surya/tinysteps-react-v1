import React from 'react';
import { Card } from '@components/ui/card';
import { Button } from '@components/ui/button';

export default function CourseManagement() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Course Management</h2>
        <Button>Create New Course</Button>
      </div>

      <Card className="p-6">
        <div className="text-center text-gray-500">
          <p>Course list will be displayed here</p>
          <p className="text-sm mt-2">View courses, manage topics, and track assignments</p>
        </div>
      </Card>
    </div>
  );
}