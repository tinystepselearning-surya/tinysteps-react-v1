import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@components/ui/dialog';
import { Button } from '@components/ui/button';
import { Label } from '@components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select';
import { Textarea } from '@components/ui/textarea';
import { TeacherSession, AttendanceStatus } from '../../../../types/Teacher';

interface AttendanceFormProps {
  open: boolean;
  session: TeacherSession | null;
  onClose: () => void;
  onSubmit: (attendance: Record<string, { status: AttendanceStatus; notes?: string }>) => Promise<void>;
}

const STATUS_OPTIONS: AttendanceStatus[] = ['present', 'absent', 'late'];

export const AttendanceForm: React.FC<AttendanceFormProps> = ({ open, session, onClose, onSubmit }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formState, setFormState] = useState<Record<string, { status: AttendanceStatus; notes?: string }>>({});

  useEffect(() => {
    if (session) {
      const defaults: Record<string, { status: AttendanceStatus; notes?: string }> = {};
      session.kidIds.forEach((kidId) => {
        defaults[kidId] = {
          status: session.attendance?.[kidId] || 'present',
          notes: '',
        };
      });
      setFormState(defaults);
    }
  }, [session]);

  const handleChange = (kidId: string, status: AttendanceStatus) => {
    setFormState((prev) => ({
      ...prev,
      [kidId]: {
        ...prev[kidId],
        status,
      },
    }));
  };

  const handleNotesChange = (kidId: string, value: string) => {
    setFormState((prev) => ({
      ...prev,
      [kidId]: {
        ...prev[kidId],
        notes: value,
      },
    }));
  };

  const handleSubmit = async () => {
    if (!session) return;
    setIsSubmitting(true);
    try {
      await onSubmit(formState);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const kids = useMemo(() => session?.kidIds || [], [session]);

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Mark Attendance</DialogTitle>
        </DialogHeader>
        {!session ? (
          <p className="text-sm text-muted-foreground">Select a session to mark attendance.</p>
        ) : (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            <div>
              <p className="text-sm text-muted-foreground">
                {session.courseName} · {session.startTime} - {session.endTime}
              </p>
            </div>
            {kids.length === 0 ? (
              <p className="text-sm text-muted-foreground">No students assigned to this session.</p>
            ) : (
              kids.map((kidId) => (
                <div key={kidId} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between gap-4">
                    <Label className="font-medium">{kidId}</Label>
                    <Select
                      value={formState[kidId]?.status || 'present'}
                      onValueChange={(v) => handleChange(kidId, v as AttendanceStatus)}
                    >
                      <SelectTrigger className="w-[150px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Textarea
                    placeholder="Notes (optional)"
                    value={formState[kidId]?.notes || ''}
                    onChange={(event) => handleNotesChange(kidId, event.target.value)}
                  />
                </div>
              ))
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting || kids.length === 0}>
                {isSubmitting ? 'Saving...' : 'Save Attendance'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
