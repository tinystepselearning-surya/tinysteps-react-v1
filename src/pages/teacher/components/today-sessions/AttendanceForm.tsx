import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@components/ui/dialog';
import { Button } from '@components/ui/button';
import { Label } from '@components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select';
import { Textarea } from '@components/ui/textarea';
import { Input } from '@components/ui/input';
import { TeacherSession, AttendanceStatus } from '../../../../types/Teacher';
import { useProgressPicklists } from '../../../../hooks/useProgressPicklists';
import { useTeacherFilteredStudents } from '@/hooks/useTeacherFilteredData';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../../lib/firebaseConfig';

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
  const [kidNameById, setKidNameById] = useState<Record<string, string>>({});

  const { config, loading: picklistsLoading } = useProgressPicklists();
  const { students } = useTeacherFilteredStudents();

  // Build name lookup map from hook (priority source)
  const kidNameFromHookById = useMemo(() => {
    const map = new Map<string, string>();
    students.forEach((student) => {
      // Robust name resolution: try multiple fields
      const name = student.fullName || 
                   (student as any).studentName || 
                   (student as any).name || 
                   (student as any).displayName || 
                   (student as any).email || 
                   '';
      if (name && student.uid) {
        map.set(student.uid, name);
      }
      // Also map by alternative ID fields if present
      if (name && (student as any).id) map.set((student as any).id, name);
      if (name && (student as any).userId) map.set((student as any).userId, name);
    });
    return map;
  }, [students]);

  // Extract kidIds from session
  const kidIds = useMemo(
    () => (session?.kidIds?.length ? session.kidIds : []),
    [session]
  );

  // Fallback fetch: read missing kid names from Firestore
  useEffect(() => {
    if (!session || kidIds.length === 0) return;

    let cancelled = false;

    const fetchMissingNames = async () => {
      const missingKidIds = kidIds.filter(id => !kidNameFromHookById.has(id) && !kidNameById[id]);
      
      if (missingKidIds.length === 0) return;

      const fetchedNames: Record<string, string> = {};
      
      await Promise.all(
        missingKidIds.map(async (kidId) => {
          try {
            const kidDocRef = doc(db, 'kids', kidId);
            const kidDocSnap = await getDoc(kidDocRef);
            
            if (kidDocSnap.exists() && !cancelled) {
              const data = kidDocSnap.data();
              const name = data.fullName || 
                          data.studentName || 
                          data.name || 
                          data.displayName || 
                          'Student';
              fetchedNames[kidId] = name;
            }
          } catch (err) {
            console.warn(`Failed to fetch name for kid ${kidId}:`, err);
          }
        })
      );

      if (!cancelled && Object.keys(fetchedNames).length > 0) {
        setKidNameById(prev => ({ ...prev, ...fetchedNames }));
      }
    };

    fetchMissingNames();

    return () => {
      cancelled = true;
    };
  }, [session, kidIds, kidNameFromHookById, kidNameById]);

  useEffect(() => {
    if (session) {
      const defaults: Record<string, { status: AttendanceStatus; notes?: string; mastery?: number; topics?: string[] }> = {};
      kidIds.forEach((kidId) => {
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
  }, [session, kidIds]);

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

  const handleTopicChange = (kidId: string, topicId: string, checked: boolean) => {
    setFormState((prev) => ({
      ...prev,
      [kidId]: {
        ...prev[kidId],
        topics: checked
          ? [...(prev[kidId].topics || []), topicId]
          : (prev[kidId].topics || []).filter(t => t !== topicId),
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

  const topics = useMemo(() => config?.topics ?? [], [config?.topics]);

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
              <p className="text-sm font-medium">
                {session.courseName || session.courseId || 'Course'}
              </p>
              <p className="text-xs text-muted-foreground">
                {session.startTime} - {session.endTime}
              </p>
            </div>
            {kidIds.length === 0 ? (
              <p className="text-sm text-muted-foreground">No students assigned to this session.</p>
            ) : (
              kidIds.map((kidId) => {
                // Resolve kid name: try hook first, then fallback fetch, then truncated ID
                const displayName = kidNameFromHookById.get(kidId) || 
                                   kidNameById[kidId] || 
                                   `Student (${kidId.slice(0, 6)}…)`;
                
                return (
                  <div key={kidId} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                        <Label className="font-medium">
                          {displayName}
                        </Label>
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
                    {picklistsLoading ? (
                      <p className="text-sm text-gray-500">Loading topics...</p>
                    ) : (
                      <div className="flex gap-2 mt-1">
                        {topics.map((topic) => {
                          const savedTopics = formState[kidId]?.topics || [];
                          const isChecked = savedTopics.includes(topic.id) || savedTopics.includes(topic.label);
                          return (
                            <label key={topic.id} className="flex items-center gap-1">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => handleTopicChange(kidId, topic.id, e.target.checked)}
                              />
                              {topic.label}
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <Textarea
                    placeholder="Notes (optional)"
                    value={formState[kidId]?.notes || ''}
                    onChange={(event) => handleNotesChange(kidId, event.target.value)}
                  />
                </div>
                );
              })
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
                <Button onClick={handleSubmit} disabled={isSubmitting || kidIds.length === 0}>
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
