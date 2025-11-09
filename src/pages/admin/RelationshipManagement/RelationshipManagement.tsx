import React from 'react';
import { Card } from '@components/ui/card';
import { Button } from '@components/ui/button';

export default function RelationshipManagement() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Relationship Management</h2>
        <Button>Assign Relationships</Button>
      </div>

      <Card className="p-6">
        <div className="text-center text-gray-500">
          <p>Relationship matrix will be displayed here</p>
          <p className="text-sm mt-2">Parent-LP, Teacher-LP, Student-Teacher assignments</p>
        </div>
      </Card>
    </div>
  );
}