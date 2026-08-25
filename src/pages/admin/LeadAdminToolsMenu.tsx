import React, { useMemo, useState } from 'react';
import {
  ClipboardCopy,
  History,
  MessageCircle,
  MessageSquareText,
  MoreHorizontal,
  Pencil,
  RotateCcw,
  Trash2,
  Undo2,
  UserRoundCog,
  XCircle,
} from 'lucide-react';
import { Badge } from '@components/ui/badge';
import { Button } from '@components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@components/ui/dropdown-menu';
import { Label } from '@components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@components/ui/select';
import { Textarea } from '@components/ui/textarea';
import { useToast } from '@components/hooks/use-toast';
import type { DemoSession } from '../../types/models';
import {
  cancelDemoSession,
  releaseDemoSession,
  reopenDemoSession,
} from '../../services/demoSessionsService';
import {
  addLeadCommunication,
  fetchLeadCommunications,
  type LeadCommunicationChannel,
  type LeadCommunicationRecord,
  type LeadCommunicationType,
} from '../../services/leadCommunicationsService';
import { adminCorrectDemoCompletion } from '../../services/leadRecoveryService';
import {
  buildLeadAdminSummary,
  buildLeadFollowUpMessage,
  buildLeadTimeline,
  buildLeadWhatsAppHelperMessage,
  resolveLeadRecoveryActions,
  type LeadAdminToolRowLike,
} from './leadAdminTools';

interface AdminToolsRow extends LeadAdminToolRowLike {
  id: string;
  bucket: string;
  lead: ({ id: string; createdAt?: unknown; updatedAt?: unknown } & Record<string, unknown>) | null;
  demo: DemoSession | null;
}

interface LeadAdminToolsMenuProps {
  row: AdminToolsRow;
  deleting: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onReassign: () => void;
  onOutcome: () => void;
  onWorkflowChanged?: () => void;
}

const CORRECTION_REASONS = [
  'Teacher assigned herself by mistake',
  'Admin assigned the wrong teacher',
  'Wrong student / duplicate demo',
  'Demo marked completed by mistake',
  'Other',
] as const;

const communicationTypeLabels: Record<LeadCommunicationType, string> = {
  message: 'Message',
  call: 'Call',
  follow_up: 'Follow-up',
  note: 'Internal note',
};

const formatActionTime = (ms: number): string => {
  if (!ms) return 'Legacy record';
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(ms));
};

const copyText = async (value: string): Promise<void> => {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }
  const element = document.createElement('textarea');
  element.value = value;
  element.style.position = 'fixed';
  element.style.opacity = '0';
  document.body.appendChild(element);
  element.focus();
  element.select();
  document.execCommand('copy');
  document.body.removeChild(element);
};

const phoneDigits = (value: string): string => value.replace(/[^\d]/g, '');

export default function LeadAdminToolsMenu({
  row,
  deleting,
  onEdit,
  onDelete,
  onReassign,
  onOutcome,
  onWorkflowChanged,
}: LeadAdminToolsMenuProps) {
  const { toast } = useToast();
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [communicationsOpen, setCommunicationsOpen] = useState(false);
  const [communicationsLoading, setCommunicationsLoading] = useState(false);
  const [communications, setCommunications] = useState<LeadCommunicationRecord[]>([]);
  const [communicationType, setCommunicationType] = useState<LeadCommunicationType>('note');
  const [communicationChannel, setCommunicationChannel] = useState<LeadCommunicationChannel>('internal');
  const [communicationSummary, setCommunicationSummary] = useState('');
  const [communicationSaving, setCommunicationSaving] = useState(false);
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [whatsAppOpen, setWhatsAppOpen] = useState(false);
  const [correctionOpen, setCorrectionOpen] = useState(false);
  const [correctionReason, setCorrectionReason] = useState('');
  const [correctionDetail, setCorrectionDetail] = useState('');

  const actions = useMemo(() => resolveLeadRecoveryActions(row.demo), [row.demo]);
  const timeline = useMemo(() => buildLeadTimeline(row), [row]);
  const summaryText = useMemo(() => buildLeadAdminSummary(row), [row]);
  const whatsappText = useMemo(() => buildLeadWhatsAppHelperMessage(row), [row]);
  const followUpText = useMemo(() => buildLeadFollowUpMessage(row), [row]);
  const leadId = String(row.lead?.id || row.demo?.leadId || '').trim();
  const hasPhone = row.parentPhone !== '—' && phoneDigits(row.parentPhone).length >= 7;
  const normalizedDemoStatus = String(row.demo?.status || '').trim().toLowerCase();
  const canOpenOutcome = Boolean(row.demo) && (
    normalizedDemoStatus === 'completed' ||
    normalizedDemoStatus === 'cancelled' ||
    Boolean(row.demo?.conversionStatus)
  );

  const copyWithToast = async (value: string, label: string) => {
    try {
      await copyText(value);
      toast({ title: `${label} copied` });
    } catch (error: any) {
      toast({
        title: `Could not copy ${label.toLowerCase()}`,
        description: error?.message || 'Clipboard access failed.',
        variant: 'destructive',
      });
    }
  };

  const runRecoveryAction = async (
    actionKey: string,
    action: () => Promise<unknown>,
    successTitle: string,
    successDescription: string,
  ) => {
    if (busyAction) return;
    setBusyAction(actionKey);
    try {
      await action();
      onWorkflowChanged?.();
      toast({ title: successTitle, description: successDescription });
    } catch (error: any) {
      toast({
        title: 'Correction could not be completed',
        description: error?.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setBusyAction(null);
    }
  };

  const handleRelease = async () => {
    if (!row.demo || !window.confirm(`Release ${row.childName}'s demo from ${row.teacherName} and return it to Open?`)) return;
    await runRecoveryAction(
      'release',
      () => releaseDemoSession({ demoId: row.demo!.id }),
      'Demo returned to Open',
      'Teacher assignment was removed. No demo earning was created or changed.',
    );
  };

  const handleCancel = async () => {
    if (!row.demo || !window.confirm(`Cancel this ${row.childName} demo attempt? The lead will remain actionable for admin review.`)) return;
    await runRecoveryAction(
      'cancel',
      () => cancelDemoSession({ demoId: row.demo!.id }),
      'Demo attempt cancelled',
      'The cancelled attempt remains in the audit history.',
    );
  };

  const handleReopenCancelled = async () => {
    if (!row.demo || !window.confirm(`Reopen ${row.childName}'s cancelled demo and return it to Open?`)) return;
    await runRecoveryAction(
      'reopen',
      () => reopenDemoSession({ demoId: row.demo!.id }),
      'Cancelled demo reopened',
      'The demo is back in Open and ready for assignment.',
    );
  };

  const openCommunications = async () => {
    if (!leadId) {
      toast({ title: 'Communication history is unavailable for this legacy-only demo.', variant: 'destructive' });
      return;
    }
    setCommunicationsOpen(true);
    setCommunicationsLoading(true);
    try {
      setCommunications(await fetchLeadCommunications(leadId, 50));
    } catch (error: any) {
      toast({
        title: 'Could not load communications',
        description: error?.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setCommunicationsLoading(false);
    }
  };

  const saveCommunication = async () => {
    if (!leadId || !communicationSummary.trim() || communicationSaving) return;
    setCommunicationSaving(true);
    try {
      const created = await addLeadCommunication({
        leadId,
        type: communicationType,
        channel: communicationChannel,
        summary: communicationSummary,
      });
      setCommunications((current) => [created, ...current].slice(0, 50));
      setCommunicationSummary('');
      toast({ title: 'Communication logged', description: 'Saved with one communication write; no lead mirror write was added.' });
    } catch (error: any) {
      toast({
        title: 'Could not save communication',
        description: error?.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setCommunicationSaving(false);
    }
  };

  const openWhatsApp = () => {
    if (!hasPhone) return;
    window.open(`https://wa.me/${phoneDigits(row.parentPhone)}`, '_blank', 'noopener,noreferrer');
  };

  const submitCompletionCorrection = async () => {
    if (!row.demo || busyAction) return;
    if (actions.enrollmentGuard) {
      toast({
        title: 'Enrollment correction required first',
        description: 'This demo is marked enrolled, so the demo completion cannot be reopened independently.',
        variant: 'destructive',
      });
      return;
    }
    const reason = correctionReason === 'Other'
      ? correctionDetail.trim()
      : [correctionReason, correctionDetail.trim()].filter(Boolean).join(': ');
    if (!reason) {
      toast({ title: 'Correction reason is required', variant: 'destructive' });
      return;
    }

    setBusyAction('undo-completion');
    try {
      const result = await adminCorrectDemoCompletion({ demoId: row.demo.id, reason });
      setCorrectionOpen(false);
      setCorrectionReason('');
      setCorrectionDetail('');
      onWorkflowChanged?.();
      const financialNote = result.paidAdjustmentCount > 0
        ? ` Exact paid-payout adjustments: ${result.paidAdjustmentCount} (₹${Math.round(result.paidAdjustmentAmount).toLocaleString('en-IN')}).`
        : '';
      toast({
        title: 'Demo completion undone safely',
        description: `Returned to Open. Voided ${result.reversedEarningsCount} linked demo earning record(s).${financialNote}`,
      });
    } catch (error: any) {
      toast({
        title: 'Demo completion was not changed',
        description: error?.message || 'The server blocked the correction to protect audit or payment integrity.',
        variant: 'destructive',
      });
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            aria-label={`More actions for ${row.parentName}`}
            disabled={deleting || Boolean(busyAction)}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          {leadId && (
            <DropdownMenuItem onClick={() => void openCommunications()}>
              <MessageSquareText className="mr-2 h-4 w-4" /> Communications
            </DropdownMenuItem>
          )}
          {hasPhone && (
            <DropdownMenuItem onClick={() => setWhatsAppOpen(true)}>
              <MessageCircle className="mr-2 h-4 w-4" /> WhatsApp helper
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => setTimelineOpen(true)}>
            <History className="mr-2 h-4 w-4" /> View timeline
          </DropdownMenuItem>
          {canOpenOutcome && (
            <DropdownMenuItem onClick={onOutcome}>
              <RotateCcw className="mr-2 h-4 w-4" /> Follow-up / conversion
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onEdit}>
            <Pencil className="mr-2 h-4 w-4" /> Edit details
          </DropdownMenuItem>
          {actions.canReassign && (
            <DropdownMenuItem onClick={onReassign}>
              <UserRoundCog className="mr-2 h-4 w-4" /> Reassign teacher
            </DropdownMenuItem>
          )}
          {actions.canRelease && (
            <DropdownMenuItem onClick={() => void handleRelease()}>
              <Undo2 className="mr-2 h-4 w-4" /> Release teacher → Open
            </DropdownMenuItem>
          )}
          {actions.canCancel && (
            <DropdownMenuItem onClick={() => void handleCancel()}>
              <XCircle className="mr-2 h-4 w-4" /> Cancel demo attempt
            </DropdownMenuItem>
          )}
          {actions.canUndoCompletion && (
            <DropdownMenuItem
              className="text-amber-700 focus:text-amber-700"
              onClick={() => setCorrectionOpen(true)}
            >
              <Undo2 className="mr-2 h-4 w-4" /> Undo completion → Open
            </DropdownMenuItem>
          )}
          {actions.canReopenCancelled && (
            <DropdownMenuItem onClick={() => void handleReopenCancelled()}>
              <RotateCcw className="mr-2 h-4 w-4" /> Reopen cancelled demo
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />
          {hasPhone && (
            <DropdownMenuItem onClick={() => void copyWithToast(row.parentPhone, 'Phone')}>
              <ClipboardCopy className="mr-2 h-4 w-4" /> Copy phone
            </DropdownMenuItem>
          )}
          {hasPhone && (
            <DropdownMenuItem onClick={openWhatsApp}>
              <MessageCircle className="mr-2 h-4 w-4" /> Open WhatsApp
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => void copyWithToast(summaryText, 'Summary')}>
            <ClipboardCopy className="mr-2 h-4 w-4" /> Copy summary
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => void copyWithToast(followUpText, 'Follow-up')}>
            <ClipboardCopy className="mr-2 h-4 w-4" /> Copy follow-up
          </DropdownMenuItem>

          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-red-600 focus:text-red-600"
            onClick={onDelete}
          >
            <Trash2 className="mr-2 h-4 w-4" /> Delete lead
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={communicationsOpen} onOpenChange={setCommunicationsOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Communications · {row.parentName}</DialogTitle>
            <DialogDescription>
              Recent 50 entries are loaded only when this window is opened. There is no background communication listener.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 rounded-xl border p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Type</Label>
                <Select value={communicationType} onValueChange={(value) => setCommunicationType(value as LeadCommunicationType)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="note">Internal note</SelectItem>
                    <SelectItem value="message">Message</SelectItem>
                    <SelectItem value="call">Call</SelectItem>
                    <SelectItem value="follow_up">Follow-up</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Channel</Label>
                <Select value={communicationChannel} onValueChange={(value) => setCommunicationChannel(value as LeadCommunicationChannel)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="internal">Internal</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="phone">Phone</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Summary</Label>
              <Textarea
                className="mt-1"
                value={communicationSummary}
                onChange={(event) => setCommunicationSummary(event.target.value)}
                placeholder="What happened with the parent?"
              />
            </div>
            <div className="flex justify-end">
              <Button
                type="button"
                onClick={() => void saveCommunication()}
                disabled={!communicationSummary.trim() || communicationSaving}
              >
                {communicationSaving ? 'Saving…' : 'Log communication'}
              </Button>
            </div>
            <p className="text-xs text-slate-500">
              Follow-up dates remain managed through Admin Review so this log stays a single Firestore write.
            </p>
          </div>

          <div className="space-y-2">
            {communicationsLoading ? (
              <div className="p-6 text-center text-sm text-slate-500">Loading recent communications…</div>
            ) : communications.length === 0 ? (
              <div className="rounded-xl border border-dashed p-6 text-center text-sm text-slate-500">No communication history found.</div>
            ) : communications.map((item) => (
              <div key={item.id} className="rounded-xl border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{communicationTypeLabels[item.type]}</Badge>
                    <span className="text-xs text-slate-500">{item.channel}</span>
                  </div>
                  <span className="text-xs text-slate-500">{formatActionTime(item.createdAtMs)}</span>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm text-slate-800">{item.summary}</p>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={timelineOpen} onOpenChange={setTimelineOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Timeline · {row.childName}</DialogTitle>
            <DialogDescription>
              Built from the lead and demo data already loaded on this page; opening this timeline performs no additional Firestore read.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {timeline.length === 0 ? (
              <div className="rounded-xl border border-dashed p-6 text-center text-sm text-slate-500">No timeline entries available.</div>
            ) : timeline.map((item) => (
              <div key={item.key} className="rounded-xl border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="font-medium text-slate-900">{item.title}</div>
                  <div className="text-xs text-slate-500">{formatActionTime(item.atMs)}</div>
                </div>
                <p className="mt-1 text-sm text-slate-700">{item.detail}</p>
                <p className="mt-1 text-xs text-slate-500">{item.actor}</p>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={whatsAppOpen} onOpenChange={setWhatsAppOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>WhatsApp helper · {row.parentName}</DialogTitle>
            <DialogDescription>Messages are generated from the data already loaded in the row. Nothing is sent automatically.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <div className="mb-1 flex items-center justify-between gap-2">
                <Label>Scheduling / confirmation</Label>
                <Button size="sm" variant="outline" onClick={() => void copyWithToast(whatsappText, 'Message')}>Copy</Button>
              </div>
              <Textarea value={whatsappText} readOnly rows={6} />
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between gap-2">
                <Label>Follow-up</Label>
                <Button size="sm" variant="outline" onClick={() => void copyWithToast(followUpText, 'Follow-up')}>Copy</Button>
              </div>
              <Textarea value={followUpText} readOnly rows={6} />
            </div>
            {hasPhone && (
              <div className="flex justify-end"><Button onClick={openWhatsApp}>Open WhatsApp</Button></div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={correctionOpen} onOpenChange={setCorrectionOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Undo demo completion & return to Open</DialogTitle>
            <DialogDescription>
              Use only when this demo was completed by mistake. The server checks and reverses only earnings linked to this exact demo.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
            Teacher assignment and submitted demo outcome will be cleared. Unpaid demo earnings will be voided. Any paid amount is corrected through an exact demo-linked adjustment record; existing payout history is preserved.
          </div>

          {actions.enrollmentGuard && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              This demo is marked Enrolled. Correct the enrollment first; the demo completion cannot be independently reopened.
            </div>
          )}

          <div>
            <Label>Reason *</Label>
            <Select value={correctionReason} onValueChange={setCorrectionReason}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select correction reason" /></SelectTrigger>
              <SelectContent>
                {CORRECTION_REASONS.map((reason) => <SelectItem key={reason} value={reason}>{reason}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>{correctionReason === 'Other' ? 'Correction details *' : 'Additional note'}</Label>
            <Textarea
              className="mt-1"
              value={correctionDetail}
              onChange={(event) => setCorrectionDetail(event.target.value)}
              placeholder="Add enough detail for the audit timeline"
            />
          </div>

          <p className="text-xs text-slate-500">
            Financial checks run only when you submit this correction, avoiding a separate preview query and duplicate reads.
          </p>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setCorrectionOpen(false)}>Cancel</Button>
            <Button
              type="button"
              onClick={() => void submitCompletionCorrection()}
              disabled={
                actions.enrollmentGuard ||
                !correctionReason ||
                (correctionReason === 'Other' && !correctionDetail.trim()) ||
                busyAction === 'undo-completion'
              }
            >
              {busyAction === 'undo-completion' ? 'Correcting…' : 'Undo completion'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
