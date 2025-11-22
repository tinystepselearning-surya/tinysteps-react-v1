// React default import removed
import { Card } from '@components/ui/card';
import { Button } from '@components/ui/button';
import StudentBulkUploader from './StudentBulkUploader';

export default function StudentManagement() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Student Management</h2>
        <div className="flex gap-2">
          <StudentBulkUploader />
          <Button>Create New Student</Button>
        </div>
      </div>

      <Card className="p-6">
        <div className="text-center text-gray-500">
          <p>Student list will be displayed here</p>
          <p className="text-sm mt-2">Assign courses, view relationships, and manage enrollments</p>
        </div>
      </Card>
    </div>
  );
}