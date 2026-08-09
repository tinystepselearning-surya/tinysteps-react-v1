import React, { useEffect, useState } from 'react';
import { Button } from '@components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@components/ui/dialog';
import { Label } from '@components/ui/label';
import { Textarea } from '@components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@components/ui/select';
import { useToast } from '@components/hooks/use-toast';
import type { DemoSession } from '../../../../types/models';
import {
  teacherCancelAssignedDemo,
  type TeacherDemoCancellationReason,
} from '../../../../services/leadLifecycleService';

interface TeacherCancelAssignedDemoDialogProps {
  demo: DemoSession | null;
  open: boolean;
  onClose: () => void;
  onCancelled?: () => void;
}

const REASONS: Array<{ value: TeacherDemoCancellationReason; label: string }> = [
  { value: 'parent_unavailable', label: 'Parent / child unavailable' },
  { value: 'teacher_unavailable', label: 'Teacher unable to conduct' },
  { value: 'technical_issue', label: 'Technical / network issue' },
  { value: 'reschedule_requested', label: 'Reschedule requested' },
  { value: 'other', label: 'Other' },
];

export default function TeacherCancelAssignedDemoDialog({
  demo,
  open,
  onClose,
  onCancelled,
}: TeacherCancelAssignedDemoDialogProps) {
  const { toast } = useToast();
  const [reason, setReason] = useState<TeacherDemoCancellationReason>('parent_unavailable');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setReason('parent_unavailable');
    setNote('');
  }, [open, demo?.id]);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!demo) return;
    if (reason === 'other' && !note.trim()) {
      toast({ title: 'Add a cancellation note', description: 'Please briefly explain why the demo could not be completed.', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      await teacherCancelAssignedDemo({ demoId: demo.id, reason, note });
      toast({
        title: 'Demo cancelled',
        description: 'The demo attempt is closed and the lead remains available for admin follow-up or rescheduling.',
      });
      onCancelled?.();
      onClose();
    } catch (error: any) {
      toast({
        title: 'Unable to cancel demo',
        description: error?.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => (!nextOpen && !saving ? onClose() : undefined)}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Cancel Assigned Demo</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={submit}>
          <div className="rounded-lg border bg-slate-50 p-3 text-sm text-slate-700">
            <div className="font-medium text-slate-900">{demo?.childName || 'Student'}</div>
            <div className="mt-1 text-xs text-slate-500">
              Cancelling the demo does not mark the lead as lost and does not create a teacher completion earning.
            </div>
          </div>
          <div className="space-y-2">
            <Label>Reason *</Label>
            <Select value={reason} onValueChange={(value) => setReason(value as TeacherDemoCancellationReason)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {REASONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="teacher-demo-cancel-note">Note</Label>
            <Textarea
              id="teacher-demo-cancel-note"
              rows={4}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Add useful context for the admin team, especially if a new slot is needed."
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>Keep Demo</Button>
            <Button type="submit" variant="destructive" disabled={saving}>
              {saving ? 'Cancelling...' : 'Cancel Demo'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
