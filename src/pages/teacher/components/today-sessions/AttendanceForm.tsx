import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@components/ui/dialog';
import { Button } from '@components/ui/button';
import { Label } from '@components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select';
import { Textarea } from '@components/ui/textarea';
import { Input } from '@components/ui/input';
import { TeacherSession, AttendanceStatus } from '../../../../types/Teacher';

interface AttendanceFormProps {
  open: boolean;
  session: TeacherSession | null;
  onClose: () => void;
  onSubmit: (data: { attendance: Record<string, { status: AttendanceStatus; notes?: string; mastery?: number; topics?: string[] }>; sessionNotes: string }) => Promise<void>;
}

const STATUS_OPTIONS: AttendanceStatus[] = ['present', 'absent', 'late'];

export const AttendanceForm: React.FC<AttendanceFormProps> = ({ open, session, onClose, onSubmit }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formState, setFormState] = useState<Record<string, { status: AttendanceStatus; notes?: string; mastery?: number; topics?: string[] }>>({});
  const [sessionNotes, setSessionNotes] = useState('');

  useEffect(() => {
    if (session) {
      const defaults: Record<string, { status: AttendanceStatus; notes?: string; mastery?: number; topics?: string[] }> = {};
      session.kidIds.forEach((kidId) => {
        defaults[kidId] = {
          status: session.attendance?.[kidId] || 'present',
          notes: '',
          mastery: 50,
          topics: [],
        };
      });
      setFormState(defaults);
      setSessionNotes(session.notes || '');
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

  const handleMasteryChange = (kidId: string, value: number[]) => {
    setFormState((prev) => ({
      ...prev,
      [kidId]: {
        ...prev[kidId],
        mastery: value[0],
      },
    }));
  };

  const handleTopicChange = (kidId: string, topic: string, checked: boolean) => {
    setFormState((prev) => ({
      ...prev,
      [kidId]: {
        ...prev[kidId],
        topics: checked
          ? [...(prev[kidId].topics || []), topic]
          : (prev[kidId].topics || []).filter(t => t !== topic),
      },
    }));
  };

  const handleSubmit = async () => {
    if (!session) return;
    setIsSubmitting(true);
    try {
      await onSubmit({ attendance: formState, sessionNotes });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const kids = useMemo(() => session?.kidIds || [], [session]);

  // Mock topics
  const topics = ['Letter A', 'Phoneme Sounds', 'Word Building'];

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Mark Attendance</DialogTitle>
          <DialogDescription>Mark attendance for the selected session. Only the assigned teacher or an LP can update attendance.</DialogDescription>
        </DialogHeader>
        {!session ? (
          <p className="text-sm text-muted-foreground">Select a session to mark attendance.</p>
        ) : (
          <div className="space-y-4">
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
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                      <Label className="font-medium">{kidId}</Label>
                    </div>
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
                  <div>
                    <Label>Mastery (0-100%)</Label>
                    <Input
                      type="range"
                      min="0"
                      max="100"
                      value={formState[kidId]?.mastery || 50}
                      onChange={(e) => handleMasteryChange(kidId, [parseInt(e.target.value)])}
                      className="mt-2"
                    />
                    <span className="text-sm">{formState[kidId]?.mastery || 50}%</span>
                  </div>
                  <div>
                    <Label>Topics Covered</Label>
                    <div className="flex gap-2 mt-1">
                      {topics.map((topic) => (
                        <label key={topic} className="flex items-center gap-1">
                          <input
                            type="checkbox"
                            checked={(formState[kidId]?.topics || []).includes(topic)}
                            onChange={(e) => handleTopicChange(kidId, topic, e.target.checked)}
                          />
                          {topic}
                        </label>
                      ))}
                    </div>
                  </div>
                  <Textarea
                    placeholder="Notes (optional)"
                    value={formState[kidId]?.notes || ''}
                    onChange={(event) => handleNotesChange(kidId, event.target.value)}
                  />
                </div>
              ))
            )}
            <div>
              <Label>Session Notes</Label>
              <Textarea
                placeholder="How was the session? Any issues?"
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex justify-between">
              <div className="flex gap-2">
                <Button variant="outline">Mark All Present</Button>
                <Button variant="outline">Clear All</Button>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={isSubmitting || kids.length === 0}>
                  {isSubmitting ? 'Saving...' : 'Save & Close'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
