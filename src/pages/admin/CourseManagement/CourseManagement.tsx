// no React import needed in new JSX runtime
import { Card } from '@components/ui/card';
import { Button } from '@components/ui/button';
import CourseList from './CourseList';

export default function CourseManagement() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Course Management</h2>
        <Button>Create New Course</Button>
      </div>

      <Card className="p-6">
        <CourseList />
      </Card>
    </div>
  );
}