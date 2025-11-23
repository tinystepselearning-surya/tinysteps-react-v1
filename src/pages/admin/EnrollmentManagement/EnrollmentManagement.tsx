// src/pages/admin/EnrollmentManagement/EnrollmentManagement.tsx
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@components/ui/card';
import CreateEnrollmentForm from './CreateEnrollmentForm';
import EnrollmentsList from './EnrollmentsList';

export default function EnrollmentManagement() {
  // when this changes, EnrollmentsList will refetch
  const [reloadKey, setReloadKey] = useState(0);

  const handleEnrollmentCreated = () => {
    setReloadKey((prev) => prev + 1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Enrollment Management</h2>
        <p className="text-sm text-gray-500">
          Create new enrollments, assign teachers & learning partners, and track
          progress.
        </p>
      </div>

      {/* Create Enrollment */}
      <Card>
        <CardHeader>
          <CardTitle>Create New Enrollment</CardTitle>
        </CardHeader>
        <CardContent>
          <CreateEnrollmentForm onCreated={handleEnrollmentCreated} />
        </CardContent>
      </Card>

      {/* Enrollment List */}
      <Card>
        <CardHeader>
          <CardTitle>Existing Enrollments</CardTitle>
        </CardHeader>
        <CardContent>
          <EnrollmentsList reloadKey={reloadKey} />
        </CardContent>
      </Card>
    </div>
  );
}
