// CourseManagement.tsx
import { useState } from 'react';
import { Card } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@components/ui/dialog';
import { Input } from '@components/ui/input';
import { Label } from '@components/ui/label';

import CourseList from './CourseList';

export default function CourseManagement() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');

  function handleCreate() {
    // TODO: call your createCourse mutation here
    // await createCourse({ title });
    setTitle('');
    setOpen(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Course Management</h2>

        <Button onClick={() => setOpen(true)}>Create New Course</Button>
      </div>

      <Card className="p-6">
        <CourseList />
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create a course</DialogTitle>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="courseTitle">Course title</Label>
            <Input
              id="courseTitle"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Phonics Foundations"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={!title.trim()}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
