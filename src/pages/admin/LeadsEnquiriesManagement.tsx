import React, { useEffect, useMemo, useState } from 'react';
import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  doc,
} from 'firebase/firestore';
import { Card } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { Label } from '@components/ui/label';
import { Textarea } from '@components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@components/ui/select';
import { Badge } from '@components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@components/ui/table';
import { httpsCallable } from 'firebase/functions';
import { useToast } from '@components/hooks/use-toast';
import { db, functions } from '../../lib/firebaseConfig';
import { useAuthStore } from '../../store/useAuthStore';
import { createDemoSession } from '../../services/demoSessionsService';

type LeadStatus =
  | 'new'
  | 'attempted_contact'
  | 'contacted'
  | 'qualified'
  | 'demo_pending_schedule'
  | 'demo_booked'
  | 'demo_completed'
  | 'admission_follow_up'
  | 'admitted_confirmed'
  | 'not_interested'
  | 'wrong_fit'
  | 'no_response'
  | 'lost';

type InterestTrack = 'phonics' | 'grammar' | 'public_speaking';
type LeadSource = 'website' | 'whatsapp' | 'instagram' | 'referral' | 'manual';

interface LeadRecord {
  id: string;
  parentName: string;
  primaryPhone: string;
  phoneNormalized: string;
  parentEmail?: string | null;
  childName?: string | null;
  childAge?: number | null;
  childGrade?: string | null;
  interestTrack: InterestTrack;
  source: LeadSource;
  sourceDetail?: string | null;
  country?: string | null;
  timezone?: string | null;
  preferredTimingText?: string | null;
  initialMessageSnippet?: string | null;
  status: LeadStatus;
  ownerUserId?: string | null;
  ownerRole?: string | null;
  priority?: string | null;
  nextFollowUpAt?: Timestamp | null;
  lastContactAt?: Timestamp | null;
  lastInboundAt?: Timestamp | null;
  lastOutboundAt?: Timestamp | null;
  tags?: string[] | null;
  notes?: string | null;
  demoSessionId?: string | null;
  enrollmentId?: string | null;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
  createdBy?: string | null;
  updatedBy?: string | null;
}

interface LeadFormState {
  parentName: string;
  primaryPhone: string;
  parentEmail: string;
  childName: string;
  childAge: string;
  childGrade: string;
  interestTrack: InterestTrack;
  source: LeadSource;
  sourceDetail: string;
  country: string;
  timezone: string;
  preferredTimingText: string;
  initialMessageSnippet: string;
  status: LeadStatus;
  priority: string;
  nextFollowUpDate: string;
  notes: string;
  tagsText: string;
}

const LEAD_STATUSES: LeadStatus[] = [
  'new',
  'attempted_contact',
  'contacted',
  'qualified',
  'demo_pending_schedule',
  'demo_booked',
  'demo_completed',
  'admission_follow_up',
  'admitted_confirmed',
  'not_interested',
  'wrong_fit',
  'no_response',
  'lost',
];

interface DemoCreateFormState {
  parentName: string;
  parentPhone: string;
  childName: string;
  childAge: string;
  childGrade: string;
  courseInterested: string;
  source: string;
  preferredDateTimeText: string;
  requestReceivedDate: string;
  timezone: string;
  adminNotes: string;
}

type CommunicationType = 'message' | 'call' | 'follow_up' | 'note';
type CommunicationDirection = 'inbound' | 'outbound' | 'internal';
type CommunicationChannel = 'whatsapp' | 'phone' | 'instagram' | 'website' | 'manual' | 'other';
type CommunicationStatus = 'logged' | 'pending_follow_up' | 'completed';
type DeliveryStatus = 'queued' | 'sent' | 'delivered' | 'read' | 'failed';
type CommunicationHistoryFilter = 'all' | 'whatsapp' | 'failed';

interface LeadCommunication {
  id: string;
  type: CommunicationType;
  direction: CommunicationDirection;
  channel: CommunicationChannel;
  summary: string;
  followUpNeeded: boolean;
  followUpDate?: Timestamp | null;
  templateTag?: string | null;
  templateName?: string | null;
  templateLanguage?: string | null;
  status: CommunicationStatus;
  provider?: string | null;
  externalMessageId?: string | null;
  deliveryStatus?: DeliveryStatus | null;
  errorCode?: string | null;
  errorMessage?: string | null;
  createdAt?: Timestamp | null;
  createdBy?: string | null;
  updatedAt?: Timestamp | null;
  updatedBy?: string | null;
}

type UnmatchedInboundStatus = 'unmatched' | 'resolved' | 'ignored';

interface UnmatchedInboundRecord {
  id: string;
  phoneNormalized?: string | null;
  rawFrom?: string | null;
  messageSummary?: string | null;
  externalMessageId?: string | null;
  provider?: string | null;
  status: UnmatchedInboundStatus;
  receivedAt?: Timestamp | null;
  resolvedLeadId?: string | null;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

interface CommunicationFormState {
  type: CommunicationType;
  direction: CommunicationDirection;
  channel: CommunicationChannel;
  summary: string;
  followUpNeeded: 'yes' | 'no';
  followUpDate: string;
  templateTag: string;
  status: CommunicationStatus;
}

type CommunicationPresetKey =
  | 'whatsapp_follow_up'
  | 'call_done'
  | 'parent_replied'
  | 'demo_reminder'
  | 'admission_follow_up';

type WhatsAppTemplateKey =
  | 'first_response'
  | 'follow_up_no_response'
  | 'demo_scheduling'
  | 'demo_reminder'
  | 'demo_completed_followup'
  | 'admission_followup';

type OperationalViewKey =
  | 'all'
  | 'due_today'
  | 'overdue'
  | 'no_demo'
  | 'demo_linked'
  | 'no_response'
  | 'admission_follow_up';

const WHATSAPP_TEMPLATE_OPTIONS: WhatsAppTemplateKey[] = [
  'first_response',
  'follow_up_no_response',
  'demo_scheduling',
  'demo_reminder',
  'demo_completed_followup',
  'admission_followup',
];
const WHATSAPP_API_TEMPLATE_KEYS = new Set<WhatsAppTemplateKey>(WHATSAPP_TEMPLATE_OPTIONS);

const TRACK_OPTIONS: InterestTrack[] = ['phonics', 'grammar', 'public_speaking'];
const SOURCE_OPTIONS: LeadSource[] = ['website', 'whatsapp', 'instagram', 'referral', 'manual'];
const PRIORITY_OPTIONS = ['low', 'normal', 'high'];
const COMMUNICATION_TYPE_OPTIONS: CommunicationType[] = ['message', 'call', 'follow_up', 'note'];
const COMMUNICATION_DIRECTION_OPTIONS: CommunicationDirection[] = ['inbound', 'outbound', 'internal'];
const COMMUNICATION_CHANNEL_OPTIONS: CommunicationChannel[] = [
  'whatsapp',
  'phone',
  'instagram',
  'website',
  'manual',
  'other',
];
const COMMUNICATION_STATUS_OPTIONS: CommunicationStatus[] = ['logged', 'pending_follow_up', 'completed'];
const DEMO_TERMINAL_BLOCK_STATUSES = new Set<LeadStatus>([
  'admitted_confirmed',
  'lost',
  'not_interested',
  'wrong_fit',
]);
const FOLLOW_UP_TERMINAL_STATUSES = new Set<LeadStatus>([
  'admitted_confirmed',
  'not_interested',
  'wrong_fit',
  'lost',
]);

const statusBadgeVariant = (status: LeadStatus): 'default' | 'secondary' | 'outline' => {
  if (status === 'admitted_confirmed') return 'default';
  if (status === 'not_interested' || status === 'wrong_fit' || status === 'lost') return 'secondary';
  return 'outline';
};

const deliveryBadgeVariant = (status?: DeliveryStatus | null): 'default' | 'secondary' | 'outline' => {
  if (!status) return 'outline';
  if (status === 'failed') return 'secondary';
  if (status === 'read') return 'default';
  return 'outline';
};

const getCommunicationOriginLabel = (item: LeadCommunication): string | null => {
  if (item.channel !== 'whatsapp') return null;
  if (item.direction === 'inbound') return 'Inbound WhatsApp';
  if (item.provider === 'meta_whatsapp_cloud') return 'API Template';
  if (item.direction === 'outbound') return 'Manual WhatsApp';
  return 'WhatsApp';
};

const formatLabel = (value: string) =>
  value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const normalizePhone = (value: string) => value.replace(/[^\d]/g, '');

const asDate = (value: unknown): Date | null => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'object' && value !== null) {
    const maybe = value as { toDate?: () => Date; seconds?: number };
    if (typeof maybe.toDate === 'function') return maybe.toDate();
    if (typeof maybe.seconds === 'number') return new Date(maybe.seconds * 1000);
  }
  return null;
};

const formatTs = (value: unknown): string => {
  const date = asDate(value);
  if (!date) return '—';
  return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
};

const toDateInput = (value: unknown): string => {
  const date = asDate(value);
  if (!date) return '';
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
};

const dateInputToTimestamp = (value: string): Timestamp | null => {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = new Date(`${trimmed}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  return Timestamp.fromDate(parsed);
};

const buildInitialForm = (): LeadFormState => ({
  parentName: '',
  primaryPhone: '',
  parentEmail: '',
  childName: '',
  childAge: '',
  childGrade: '',
  interestTrack: 'phonics',
  source: 'manual',
  sourceDetail: '',
  country: '',
  timezone: '',
  preferredTimingText: '',
  initialMessageSnippet: '',
  status: 'new',
  priority: 'normal',
  nextFollowUpDate: '',
  notes: '',
  tagsText: '',
});

const LEADS_COLLECTION = 'leads';
const DEMO_SESSIONS_COLLECTION = 'demoSessions';
const LEAD_COMMUNICATIONS_COLLECTION = 'communications';
const WHATSAPP_UNMATCHED_COLLECTION = 'whatsappInboundUnmatched';

const buildInitialCommunicationForm = (): CommunicationFormState => ({
  type: 'message',
  direction: 'outbound',
  channel: 'whatsapp',
  summary: '',
  followUpNeeded: 'no',
  followUpDate: '',
  templateTag: '',
  status: 'logged',
});

const COMMUNICATION_PRESETS: Record<
  CommunicationPresetKey,
  { label: string; form: CommunicationFormState }
> = {
  whatsapp_follow_up: {
    label: 'WhatsApp Follow-up',
    form: {
      type: 'message',
      direction: 'outbound',
      channel: 'whatsapp',
      summary: 'Followed up with parent on WhatsApp regarding Tiny Steps enquiry.',
      followUpNeeded: 'yes',
      followUpDate: '',
      templateTag: '',
      status: 'pending_follow_up',
    },
  },
  call_done: {
    label: 'Call Done',
    form: {
      type: 'call',
      direction: 'outbound',
      channel: 'phone',
      summary: 'Spoke with parent over phone regarding enquiry.',
      followUpNeeded: 'no',
      followUpDate: '',
      templateTag: '',
      status: 'completed',
    },
  },
  parent_replied: {
    label: 'Parent Replied',
    form: {
      type: 'message',
      direction: 'inbound',
      channel: 'whatsapp',
      summary: 'Parent replied on WhatsApp.',
      followUpNeeded: 'no',
      followUpDate: '',
      templateTag: '',
      status: 'logged',
    },
  },
  demo_reminder: {
    label: 'Demo Reminder',
    form: {
      type: 'follow_up',
      direction: 'outbound',
      channel: 'whatsapp',
      summary: 'Sent demo reminder to parent.',
      followUpNeeded: 'yes',
      followUpDate: '',
      templateTag: 'demo_reminder',
      status: 'pending_follow_up',
    },
  },
  admission_follow_up: {
    label: 'Admission Follow-up',
    form: {
      type: 'follow_up',
      direction: 'outbound',
      channel: 'whatsapp',
      summary: 'Followed up with parent regarding admission confirmation.',
      followUpNeeded: 'yes',
      followUpDate: '',
      templateTag: 'admission_followup',
      status: 'pending_follow_up',
    },
  },
};

const buildCommunicationFormFromPreset = (preset: CommunicationPresetKey): CommunicationFormState => ({
  ...COMMUNICATION_PRESETS[preset].form,
});

const getLeadFollowUpFlags = (
  lead: LeadRecord,
  startOfToday: Date,
  endOfToday: Date,
): { isOverdue: boolean; isDueToday: boolean } => {
  const status = lead.status || 'new';
  if (FOLLOW_UP_TERMINAL_STATUSES.has(status)) {
    return { isOverdue: false, isDueToday: false };
  }

  const followUpDate = asDate(lead.nextFollowUpAt);
  if (!followUpDate) {
    return { isOverdue: false, isDueToday: false };
  }

  if (followUpDate < startOfToday) {
    return { isOverdue: true, isDueToday: false };
  }

  if (followUpDate >= startOfToday && followUpDate < endOfToday) {
    return { isOverdue: false, isDueToday: true };
  }

  return { isOverdue: false, isDueToday: false };
};

const trackToCourseName = (track?: InterestTrack | null): string => {
  if (track === 'phonics') return 'Phonics';
  if (track === 'grammar') return 'Grammar';
  if (track === 'public_speaking') return 'Public Speaking';
  return 'Phonics';
};

const sourceToDemoSource = (source?: LeadSource | null): string => {
  if (source === 'whatsapp') return 'WhatsApp';
  if (source === 'website') return 'Website';
  if (source === 'instagram') return 'Instagram';
  if (source === 'referral') return 'Referral';
  return 'Manual';
};

const getWhatsAppPhone = (lead: LeadRecord): string => {
  const normalized = (lead.phoneNormalized || '').trim();
  if (normalized) return normalizePhone(normalized);
  return normalizePhone(lead.primaryPhone || '');
};

const buildWhatsAppTemplateMessage = (lead: LeadRecord, template: WhatsAppTemplateKey): string => {
  const parentName = lead.parentName || 'Parent';
  const childName = lead.childName || 'your child';
  const track = formatLabel(lead.interestTrack || 'phonics').toLowerCase();
  const preferredTime = lead.preferredTimingText || 'a suitable time';

  if (template === 'first_response') {
    return `Hi ${parentName}, thank you for reaching out to Tiny Steps. We would be happy to support ${childName} with ${track}. Please share your preferred time to continue.`;
  }

  if (template === 'follow_up_no_response') {
    return `Hi ${parentName}, just following up from Tiny Steps regarding ${childName}'s learning plan. Please let us know if you would like us to continue with the next step.`;
  }

  if (template === 'demo_scheduling') {
    return `Hi ${parentName}, we can schedule a free assessment demo for ${childName}. We have noted your preferred timing as ${preferredTime}. Please confirm what works best.`;
  }

  if (template === 'demo_reminder') {
    return `Hi ${parentName}, this is a gentle reminder from Tiny Steps about ${childName}'s assessment demo. Please confirm your availability for the planned slot.`;
  }

  if (template === 'demo_completed_followup') {
    return `Hi ${parentName}, thank you for joining the demo today. It was lovely working with ${childName}. We can now share the best next-step plan for ${track}.`;
  }

  return `Hi ${parentName}, sharing a quick follow-up from Tiny Steps for ${childName}. We are ready to help you continue with admissions and next steps whenever you are ready.`;
};

const buildWhatsAppUrl = (phone: string, message: string): string =>
  `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

const canCreateDemoFromLead = (lead: LeadRecord): boolean => {
  if (lead.demoSessionId) return false;
  if (DEMO_TERMINAL_BLOCK_STATUSES.has(lead.status)) return false;
  return true;
};

const mapLeadStatusAfterDemoCreated = (status: LeadStatus): LeadStatus => {
  if (DEMO_TERMINAL_BLOCK_STATUSES.has(status)) return status;
  return 'demo_booked';
};

const toDateInputToday = (): string => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
};

const buildDemoFormFromLead = (lead: LeadRecord): DemoCreateFormState => ({
  parentName: lead.parentName || '',
  parentPhone: lead.primaryPhone || '',
  childName: lead.childName || '',
  childAge: typeof lead.childAge === 'number' ? String(lead.childAge) : '',
  childGrade: lead.childGrade || '',
  courseInterested: trackToCourseName(lead.interestTrack),
  source: sourceToDemoSource(lead.source),
  preferredDateTimeText: lead.preferredTimingText || '',
  requestReceivedDate: toDateInputToday(),
  timezone: lead.timezone || '',
  adminNotes: [lead.notes || '', lead.initialMessageSnippet || '']
    .filter(Boolean)
    .join('\n')
    .trim(),
});

export default function LeadsEnquiriesManagement() {
  const { user } = useAuthStore();
  const { toast } = useToast();

  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [trackFilter, setTrackFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [operationalView, setOperationalView] = useState<OperationalViewKey>('all');

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<LeadRecord | null>(null);
  const [form, setForm] = useState<LeadFormState>(buildInitialForm());
  const [saving, setSaving] = useState(false);

  const [demoDialogOpen, setDemoDialogOpen] = useState(false);
  const [demoTarget, setDemoTarget] = useState<LeadRecord | null>(null);
  const [demoForm, setDemoForm] = useState<DemoCreateFormState>(buildDemoFormFromLead({
    id: '',
    parentName: '',
    primaryPhone: '',
    phoneNormalized: '',
    interestTrack: 'phonics',
    source: 'manual',
    status: 'new',
  }));
  const [creatingDemo, setCreatingDemo] = useState(false);

  const [communicationsOpen, setCommunicationsOpen] = useState(false);
  const [communicationsTarget, setCommunicationsTarget] = useState<LeadRecord | null>(null);
  const [communications, setCommunications] = useState<LeadCommunication[]>([]);
  const [communicationsHistoryFilter, setCommunicationsHistoryFilter] =
    useState<CommunicationHistoryFilter>('all');
  const [communicationForm, setCommunicationForm] = useState<CommunicationFormState>(
    buildInitialCommunicationForm(),
  );
  const [communicationEditTarget, setCommunicationEditTarget] =
    useState<LeadCommunication | null>(null);
  const [savingCommunication, setSavingCommunication] = useState(false);

  const [whatsAppOpen, setWhatsAppOpen] = useState(false);
  const [whatsAppTarget, setWhatsAppTarget] = useState<LeadRecord | null>(null);
  const [whatsAppTemplate, setWhatsAppTemplate] = useState<WhatsAppTemplateKey>('first_response');
  const [whatsAppMessage, setWhatsAppMessage] = useState('');
  const [loggingWhatsApp, setLoggingWhatsApp] = useState(false);
  const [sendingWhatsAppApi, setSendingWhatsAppApi] = useState(false);

  const [unmatchedItems, setUnmatchedItems] = useState<UnmatchedInboundRecord[]>([]);
  const [unmatchedStatusFilter, setUnmatchedStatusFilter] = useState<'all' | UnmatchedInboundStatus>(
    'unmatched',
  );
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkTarget, setLinkTarget] = useState<UnmatchedInboundRecord | null>(null);
  const [linkLeadSearch, setLinkLeadSearch] = useState('');
  const [linkLeadId, setLinkLeadId] = useState('');
  const [processingUnmatchedId, setProcessingUnmatchedId] = useState<string | null>(null);

  useEffect(() => {
    const leadsQuery = query(collection(db, LEADS_COLLECTION), orderBy('updatedAt', 'desc'));
    const unsubscribe = onSnapshot(
      leadsQuery,
      (snap) => {
        const next = snap.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as Omit<LeadRecord, 'id'>),
        }));
        setLeads(next);
      },
      (error) => {
        toast({
          title: 'Failed to load leads',
          description: error.message,
          variant: 'destructive',
        });
      },
    );

    return () => unsubscribe();
  }, [toast]);

  useEffect(() => {
    const unmatchedQuery = query(
      collection(db, WHATSAPP_UNMATCHED_COLLECTION),
      orderBy('receivedAt', 'desc'),
    );

    const unsubscribe = onSnapshot(
      unmatchedQuery,
      (snap) => {
        const next = snap.docs.map((docSnap) => {
          const data = docSnap.data() as Omit<UnmatchedInboundRecord, 'id' | 'status'> & {
            status?: UnmatchedInboundStatus;
          };
          return {
            id: docSnap.id,
            ...data,
            status: data.status || 'unmatched',
          };
        });
        setUnmatchedItems(next);
      },
      (error) => {
        toast({
          title: 'Failed to load unmatched WhatsApp inbox',
          description: error.message,
          variant: 'destructive',
        });
      },
    );

    return () => unsubscribe();
  }, [toast]);

  useEffect(() => {
    if (!communicationsOpen || !communicationsTarget?.id) {
      setCommunications([]);
      return;
    }

    const communicationsQuery = query(
      collection(db, LEADS_COLLECTION, communicationsTarget.id, LEAD_COMMUNICATIONS_COLLECTION),
      orderBy('createdAt', 'desc'),
    );

    const unsubscribe = onSnapshot(
      communicationsQuery,
      (snap) => {
        const next = snap.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as Omit<LeadCommunication, 'id'>),
        }));
        setCommunications(next);
      },
      (error) => {
        toast({
          title: 'Failed to load communications',
          description: error.message,
          variant: 'destructive',
        });
      },
    );

    return () => unsubscribe();
  }, [communicationsOpen, communicationsTarget?.id, toast]);

  const dashboardMetrics = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    const sourceCounts: Record<LeadSource, number> = {
      website: 0,
      whatsapp: 0,
      instagram: 0,
      referral: 0,
      manual: 0,
    };
    const statusCounts = LEAD_STATUSES.reduce<Record<LeadStatus, number>>((acc, status) => {
      acc[status] = 0;
      return acc;
    }, {} as Record<LeadStatus, number>);

    let dueToday = 0;
    let overdue = 0;

    leads.forEach((lead) => {
      const source = lead.source || 'manual';
      sourceCounts[source] += 1;

      const status = lead.status || 'new';
      statusCounts[status] += 1;

      if (FOLLOW_UP_TERMINAL_STATUSES.has(status)) return;
      const followUpDate = asDate(lead.nextFollowUpAt);
      if (!followUpDate) return;

      if (followUpDate >= startOfToday && followUpDate < endOfToday) {
        dueToday += 1;
      } else if (followUpDate < startOfToday) {
        overdue += 1;
      }
    });

    return {
      total: leads.length,
      newCount: statusCounts.new,
      dueToday,
      overdue,
      demoBooked: statusCounts.demo_booked,
      admittedConfirmed: statusCounts.admitted_confirmed,
      sourceCounts,
      statusCounts,
    };
  }, [leads]);

  const filteredLeads = useMemo(() => {
    const queryText = searchQuery.trim().toLowerCase();
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    return leads.filter((lead) => {
      if (statusFilter !== 'all' && lead.status !== statusFilter) return false;
      if (trackFilter !== 'all' && lead.interestTrack !== trackFilter) return false;
      if (sourceFilter !== 'all' && lead.source !== sourceFilter) return false;

      if (!queryText) return true;

      const haystack = [
        lead.parentName,
        lead.childName,
        lead.primaryPhone,
        lead.phoneNormalized,
        lead.parentEmail,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      if (queryText && !haystack.includes(queryText)) return false;

      const followUpDate = asDate(lead.nextFollowUpAt);
      const status = lead.status || 'new';

      if (operationalView === 'due_today') {
        if (!followUpDate || FOLLOW_UP_TERMINAL_STATUSES.has(status)) return false;
        if (!(followUpDate >= startOfToday && followUpDate < endOfToday)) return false;
      }

      if (operationalView === 'overdue') {
        if (!followUpDate || FOLLOW_UP_TERMINAL_STATUSES.has(status)) return false;
        if (!(followUpDate < startOfToday)) return false;
      }

      if (operationalView === 'no_demo' && !!lead.demoSessionId) return false;
      if (operationalView === 'demo_linked' && !lead.demoSessionId) return false;
      if (operationalView === 'no_response' && status !== 'no_response') return false;
      if (operationalView === 'admission_follow_up' && status !== 'admission_follow_up') {
        return false;
      }

      return true;
    });
  }, [leads, searchQuery, statusFilter, trackFilter, sourceFilter, operationalView]);

  const filteredUnmatchedItems = useMemo(() => {
    if (unmatchedStatusFilter === 'all') return unmatchedItems;
    return unmatchedItems.filter((item) => item.status === unmatchedStatusFilter);
  }, [unmatchedItems, unmatchedStatusFilter]);

  const filteredCommunicationsHistory = useMemo(() => {
    if (communicationsHistoryFilter === 'all') return communications;
    if (communicationsHistoryFilter === 'whatsapp') {
      return communications.filter((item) => item.channel === 'whatsapp');
    }
    return communications.filter((item) => item.deliveryStatus === 'failed');
  }, [communications, communicationsHistoryFilter]);

  const unmatchedOpenCount = useMemo(
    () => unmatchedItems.filter((item) => item.status === 'unmatched').length,
    [unmatchedItems],
  );

  const linkLeadOptions = useMemo(() => {
    const queryText = linkLeadSearch.trim().toLowerCase();
    if (!queryText) return leads.slice(0, 50);

    return leads
      .filter((lead) => {
        const haystack = [lead.parentName, lead.primaryPhone, lead.phoneNormalized, lead.childName]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return haystack.includes(queryText);
      })
      .slice(0, 50);
  }, [leads, linkLeadSearch]);

  const openCreateDialog = () => {
    setForm(buildInitialForm());
    setEditTarget(null);
    setCreateOpen(true);
  };

  const openEditDialog = (lead: LeadRecord) => {
    setEditTarget(lead);
    setForm({
      parentName: lead.parentName || '',
      primaryPhone: lead.primaryPhone || '',
      parentEmail: lead.parentEmail || '',
      childName: lead.childName || '',
      childAge: typeof lead.childAge === 'number' ? String(lead.childAge) : '',
      childGrade: lead.childGrade || '',
      interestTrack: lead.interestTrack || 'phonics',
      source: lead.source || 'manual',
      sourceDetail: lead.sourceDetail || '',
      country: lead.country || '',
      timezone: lead.timezone || '',
      preferredTimingText: lead.preferredTimingText || '',
      initialMessageSnippet: lead.initialMessageSnippet || '',
      status: lead.status || 'new',
      priority: lead.priority || 'normal',
      nextFollowUpDate: toDateInput(lead.nextFollowUpAt),
      notes: lead.notes || '',
      tagsText: Array.isArray(lead.tags) ? lead.tags.join(', ') : '',
    });
    setCreateOpen(true);
  };

  const setField = <K extends keyof LeadFormState>(field: K, value: LeadFormState[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const buildPayload = () => {
    const parsedChildAge = form.childAge.trim() ? Number(form.childAge.trim()) : null;
    if (form.childAge.trim() && Number.isNaN(parsedChildAge)) {
      throw new Error('Child age must be a valid number');
    }

    const tags = form.tagsText
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    return {
      parentName: form.parentName.trim(),
      primaryPhone: form.primaryPhone.trim(),
      phoneNormalized: normalizePhone(form.primaryPhone),
      parentEmail: form.parentEmail.trim() || null,
      childName: form.childName.trim() || null,
      childAge: parsedChildAge,
      childGrade: form.childGrade.trim() || null,
      interestTrack: form.interestTrack,
      source: form.source,
      sourceDetail: form.sourceDetail.trim() || null,
      country: form.country.trim() || null,
      timezone: form.timezone.trim() || null,
      preferredTimingText: form.preferredTimingText.trim() || null,
      initialMessageSnippet: form.initialMessageSnippet.trim() || null,
      status: form.status,
      ownerUserId: user?.uid || null,
      ownerRole: user?.role || 'admin',
      priority: form.priority.trim() || 'normal',
      nextFollowUpAt: dateInputToTimestamp(form.nextFollowUpDate),
      lastContactAt: null,
      lastInboundAt: null,
      lastOutboundAt: null,
      tags: tags.length ? tags : [],
      notes: form.notes.trim() || null,
      demoSessionId: editTarget?.demoSessionId || null,
      enrollmentId: editTarget?.enrollmentId || null,
      updatedAt: serverTimestamp(),
      updatedBy: user?.uid || null,
    };
  };

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!user?.uid) {
      toast({ title: 'Admin session required', variant: 'destructive' });
      return;
    }

    if (!form.parentName.trim() || !form.primaryPhone.trim()) {
      toast({
        title: 'Missing required fields',
        description: 'Parent name and primary phone are required.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const payload = buildPayload();

      if (editTarget) {
        await updateDoc(doc(db, LEADS_COLLECTION, editTarget.id), payload);
        toast({ title: 'Lead updated' });
      } else {
        await addDoc(collection(db, LEADS_COLLECTION), {
          ...payload,
          createdAt: serverTimestamp(),
          createdBy: user.uid,
        });
        toast({ title: 'Lead created' });
      }

      setCreateOpen(false);
      setEditTarget(null);
      setForm(buildInitialForm());
    } catch (error: any) {
      toast({
        title: 'Unable to save lead',
        description: error?.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleQuickStatusUpdate = async (lead: LeadRecord, nextStatus: LeadStatus) => {
    if (!user?.uid) return;
    try {
      await updateDoc(doc(db, LEADS_COLLECTION, lead.id), {
        status: nextStatus,
        updatedAt: serverTimestamp(),
        updatedBy: user.uid,
      });
      toast({ title: 'Status updated' });
    } catch (error: any) {
      toast({
        title: 'Failed to update status',
        description: error?.message || 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  const openCreateDemoDialog = (lead: LeadRecord) => {
    if (!canCreateDemoFromLead(lead)) {
      toast({
        title: 'Demo creation blocked',
        description: lead.demoSessionId
          ? 'This lead is already linked to a demo.'
          : 'This lead status is not eligible for demo creation.',
        variant: 'destructive',
      });
      return;
    }

    setDemoTarget(lead);
    setDemoForm(buildDemoFormFromLead(lead));
    setDemoDialogOpen(true);
  };

  const setDemoField = <K extends keyof DemoCreateFormState>(
    field: K,
    value: DemoCreateFormState[K],
  ) => {
    setDemoForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateDemoFromLead = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!user?.uid || !demoTarget) {
      toast({ title: 'Admin session required', variant: 'destructive' });
      return;
    }

    if (demoTarget.demoSessionId) {
      toast({
        title: 'Demo already linked',
        description: 'This lead already has a demo linked.',
        variant: 'destructive',
      });
      return;
    }

    if (
      !demoForm.parentName.trim() ||
      !demoForm.parentPhone.trim() ||
      !demoForm.childName.trim() ||
      !demoForm.childGrade.trim() ||
      !demoForm.courseInterested.trim() ||
      !demoForm.preferredDateTimeText.trim()
    ) {
      toast({
        title: 'Missing required demo fields',
        description: 'Parent, child, course, and preferred scheduling are required.',
        variant: 'destructive',
      });
      return;
    }

    const parsedChildAge = demoForm.childAge.trim() ? Number(demoForm.childAge.trim()) : null;
    if (demoForm.childAge.trim() && Number.isNaN(parsedChildAge)) {
      toast({
        title: 'Invalid child age',
        description: 'Child age must be a valid number.',
        variant: 'destructive',
      });
      return;
    }

    setCreatingDemo(true);
    try {
      const demoId = await createDemoSession(
        {
          parentName: demoForm.parentName.trim(),
          parentPhone: demoForm.parentPhone.trim(),
          childName: demoForm.childName.trim(),
          childGrade: demoForm.childGrade.trim(),
          childAge: parsedChildAge,
          courseInterested: demoForm.courseInterested.trim(),
          source: demoForm.source.trim() || null,
          preferredDateTimeText: demoForm.preferredDateTimeText.trim(),
          requestReceivedDate: demoForm.requestReceivedDate.trim() || null,
          timezone: demoForm.timezone.trim() || null,
          adminNotes: demoForm.adminNotes.trim() || null,
        },
        user.uid,
      );

      await updateDoc(doc(db, LEADS_COLLECTION, demoTarget.id), {
        demoSessionId: demoId,
        status: mapLeadStatusAfterDemoCreated(demoTarget.status),
        updatedAt: serverTimestamp(),
        updatedBy: user.uid,
      });

      await updateDoc(doc(db, DEMO_SESSIONS_COLLECTION, demoId), {
        leadId: demoTarget.id,
        lastUpdatedAt: serverTimestamp(),
        lastUpdatedBy: user.uid,
      });

      setDemoDialogOpen(false);
      setDemoTarget(null);
      toast({
        title: 'Demo created and linked',
        description: `Lead linked to demo ${demoId}.`,
      });
    } catch (error: any) {
      toast({
        title: 'Failed to create demo',
        description: error?.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setCreatingDemo(false);
    }
  };

  const openCommunicationsDialog = (lead: LeadRecord, preset?: CommunicationPresetKey) => {
    setCommunicationsTarget(lead);
    setCommunicationsOpen(true);
    setCommunicationsHistoryFilter('all');
    setCommunicationEditTarget(null);
    setCommunicationForm(
      preset ? buildCommunicationFormFromPreset(preset) : buildInitialCommunicationForm(),
    );
  };

  const applyCommunicationPreset = (preset: CommunicationPresetKey) => {
    setCommunicationEditTarget(null);
    setCommunicationForm(buildCommunicationFormFromPreset(preset));
  };

  const setCommunicationField = <K extends keyof CommunicationFormState>(
    field: K,
    value: CommunicationFormState[K],
  ) => {
    setCommunicationForm((prev) => ({ ...prev, [field]: value }));
  };

  const openEditCommunication = (item: LeadCommunication) => {
    setCommunicationEditTarget(item);
    setCommunicationForm({
      type: item.type,
      direction: item.direction,
      channel: item.channel,
      summary: item.summary || '',
      followUpNeeded: item.followUpNeeded ? 'yes' : 'no',
      followUpDate: toDateInput(item.followUpDate),
      templateTag: item.templateTag || '',
      status: item.status,
    });
  };

  const handleSaveCommunication = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!user?.uid || !communicationsTarget?.id) {
      toast({ title: 'Admin session required', variant: 'destructive' });
      return;
    }

    if (!communicationForm.summary.trim()) {
      toast({
        title: 'Summary is required',
        description: 'Add a short communication summary before saving.',
        variant: 'destructive',
      });
      return;
    }

    const followUpNeeded = communicationForm.followUpNeeded === 'yes';
    const followUpDate =
      followUpNeeded && communicationForm.followUpDate
        ? dateInputToTimestamp(communicationForm.followUpDate)
        : null;

    setSavingCommunication(true);
    try {
      const basePayload = {
        type: communicationForm.type,
        direction: communicationForm.direction,
        channel: communicationForm.channel,
        summary: communicationForm.summary.trim(),
        followUpNeeded,
        followUpDate,
        templateTag: communicationForm.templateTag.trim() || null,
        status: communicationForm.status,
        updatedAt: serverTimestamp(),
        updatedBy: user.uid,
      };

      if (communicationEditTarget) {
        await updateDoc(
          doc(
            db,
            LEADS_COLLECTION,
            communicationsTarget.id,
            LEAD_COMMUNICATIONS_COLLECTION,
            communicationEditTarget.id,
          ),
          basePayload,
        );
      } else {
        await addDoc(
          collection(db, LEADS_COLLECTION, communicationsTarget.id, LEAD_COMMUNICATIONS_COLLECTION),
          {
            ...basePayload,
            createdAt: serverTimestamp(),
            createdBy: user.uid,
          },
        );
      }

      const leadUpdatePayload: Record<string, unknown> = {
        lastContactAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        updatedBy: user.uid,
      };
      if (communicationForm.direction === 'inbound') {
        leadUpdatePayload.lastInboundAt = serverTimestamp();
      }
      if (communicationForm.direction === 'outbound') {
        leadUpdatePayload.lastOutboundAt = serverTimestamp();
      }
      if (followUpDate) {
        leadUpdatePayload.nextFollowUpAt = followUpDate;
      }

      await updateDoc(doc(db, LEADS_COLLECTION, communicationsTarget.id), leadUpdatePayload);

      setCommunicationEditTarget(null);
      setCommunicationForm(buildInitialCommunicationForm());
      toast({ title: communicationEditTarget ? 'Communication updated' : 'Communication logged' });
    } catch (error: any) {
      toast({
        title: 'Failed to save communication',
        description: error?.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSavingCommunication(false);
    }
  };

  const openWhatsAppHelper = (lead: LeadRecord, template: WhatsAppTemplateKey = 'first_response') => {
    setWhatsAppTarget(lead);
    setWhatsAppTemplate(template);
    setWhatsAppMessage(buildWhatsAppTemplateMessage(lead, template));
    setSendingWhatsAppApi(false);
    setWhatsAppOpen(true);
  };

  const handleWhatsAppTemplateChange = (template: WhatsAppTemplateKey) => {
    setWhatsAppTemplate(template);
    if (!whatsAppTarget) return;
    setWhatsAppMessage(buildWhatsAppTemplateMessage(whatsAppTarget, template));
  };

  const copyWhatsAppMessage = async () => {
    const message = whatsAppMessage.trim();
    if (!message) {
      toast({
        title: 'Message is empty',
        description: 'Generate or type a message first.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await navigator.clipboard.writeText(message);
      toast({ title: 'Message copied' });
    } catch (error: any) {
      toast({
        title: 'Copy failed',
        description: error?.message || 'Please copy manually.',
        variant: 'destructive',
      });
    }
  };

  const openWhatsAppChat = (phone: string, message: string) => {
    const url = buildWhatsAppUrl(phone, message);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleOpenWhatsAppOnly = () => {
    if (!whatsAppTarget) return;

    const phone = getWhatsAppPhone(whatsAppTarget);
    const message = whatsAppMessage.trim();
    if (!phone) {
      toast({
        title: 'Phone number unavailable',
        description: 'Add a valid phone number for this lead first.',
        variant: 'destructive',
      });
      return;
    }
    if (!message) {
      toast({
        title: 'Message is empty',
        description: 'Generate or type a message first.',
        variant: 'destructive',
      });
      return;
    }

    openWhatsAppChat(phone, message);
  };

  const handleOpenWhatsAppAndLog = async () => {
    if (!user?.uid || !whatsAppTarget) {
      toast({ title: 'Admin session required', variant: 'destructive' });
      return;
    }

    const phone = getWhatsAppPhone(whatsAppTarget);
    const message = whatsAppMessage.trim();
    if (!phone) {
      toast({
        title: 'Phone number unavailable',
        description: 'Add a valid phone number for this lead first.',
        variant: 'destructive',
      });
      return;
    }
    if (!message) {
      toast({
        title: 'Message is empty',
        description: 'Generate or type a message first.',
        variant: 'destructive',
      });
      return;
    }

    setLoggingWhatsApp(true);
    try {
      await addDoc(
        collection(db, LEADS_COLLECTION, whatsAppTarget.id, LEAD_COMMUNICATIONS_COLLECTION),
        {
          type: 'message',
          direction: 'outbound',
          channel: 'whatsapp',
          summary: message,
          followUpNeeded: false,
          followUpDate: null,
          templateTag: whatsAppTemplate,
          status: 'logged',
          createdAt: serverTimestamp(),
          createdBy: user.uid,
          updatedAt: serverTimestamp(),
          updatedBy: user.uid,
        },
      );

      await updateDoc(doc(db, LEADS_COLLECTION, whatsAppTarget.id), {
        lastContactAt: serverTimestamp(),
        lastOutboundAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        updatedBy: user.uid,
      });

      openWhatsAppChat(phone, message);
      toast({ title: 'WhatsApp log saved' });
    } catch (error: any) {
      toast({
        title: 'Failed to log WhatsApp message',
        description: error?.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoggingWhatsApp(false);
    }
  };

  const handleSendViaWhatsAppApi = async () => {
    if (!whatsAppTarget?.id) {
      toast({
        title: 'Lead is required',
        description: 'Open the helper from a valid lead row and try again.',
        variant: 'destructive',
      });
      return;
    }

    if (!WHATSAPP_API_TEMPLATE_KEYS.has(whatsAppTemplate)) {
      toast({
        title: 'Unsupported template for API send',
        description: 'Please choose one of the approved WhatsApp templates.',
        variant: 'destructive',
      });
      return;
    }

    setSendingWhatsAppApi(true);
    try {
      const sendTemplate = httpsCallable<
        { leadId: string; templateKey: WhatsAppTemplateKey },
        { ok?: boolean; deliveryStatus?: string }
      >(functions, 'sendWhatsAppTemplateMessage');

      await sendTemplate({
        leadId: whatsAppTarget.id,
        templateKey: whatsAppTemplate,
      });

      toast({ title: 'WhatsApp template sent via API' });
    } catch (error: any) {
      const message = String(error?.message || '').toLowerCase();
      const isConfigError =
        message.includes('not configured') ||
        message.includes('failed-precondition') ||
        message.includes('secret');

      if (isConfigError) {
        toast({
          title: 'WhatsApp API not configured',
          description:
            'WhatsApp API is not configured yet. You can still use the manual WhatsApp options.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Failed to send WhatsApp template',
          description: error?.message || 'Please try again. Manual WhatsApp options are still available.',
          variant: 'destructive',
        });
      }
    } finally {
      setSendingWhatsAppApi(false);
    }
  };

  const openLinkLeadDialog = (item: UnmatchedInboundRecord) => {
    setLinkTarget(item);
    setLinkLeadSearch('');
    setLinkLeadId('');
    setLinkDialogOpen(true);
  };

  const buildInboundCommunicationPayload = (item: UnmatchedInboundRecord) => ({
    type: 'message',
    direction: 'inbound',
    channel: 'whatsapp',
    summary: (item.messageSummary || '').trim() || 'Inbound WhatsApp message',
    followUpNeeded: false,
    followUpDate: null,
    templateTag: null,
    status: 'logged',
    provider: item.provider || 'meta_whatsapp_cloud',
    externalMessageId: item.externalMessageId || null,
    deliveryStatus: 'sent',
    errorCode: null,
    errorMessage: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: user?.uid || null,
    updatedBy: user?.uid || null,
  });

  const markUnmatchedRecord = async (item: UnmatchedInboundRecord, status: UnmatchedInboundStatus) => {
    if (!user?.uid) {
      toast({ title: 'Admin session required', variant: 'destructive' });
      return;
    }

    setProcessingUnmatchedId(item.id);
    try {
      await updateDoc(doc(db, WHATSAPP_UNMATCHED_COLLECTION, item.id), {
        status,
        updatedAt: serverTimestamp(),
        updatedBy: user.uid,
        resolvedAt: status === 'resolved' ? serverTimestamp() : null,
        resolvedBy: status === 'resolved' ? user.uid : null,
      });

      toast({ title: status === 'ignored' ? 'Marked ignored' : 'Status updated' });
    } catch (error: any) {
      toast({
        title: 'Failed to update inbox record',
        description: error?.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setProcessingUnmatchedId(null);
    }
  };

  const handleResolveByLinkingLead = async () => {
    if (!user?.uid || !linkTarget?.id || !linkLeadId) {
      toast({
        title: 'Lead selection required',
        description: 'Choose a lead before resolving this message.',
        variant: 'destructive',
      });
      return;
    }

    setProcessingUnmatchedId(linkTarget.id);
    try {
      await addDoc(collection(db, LEADS_COLLECTION, linkLeadId, LEAD_COMMUNICATIONS_COLLECTION), {
        ...buildInboundCommunicationPayload(linkTarget),
      });

      await updateDoc(doc(db, LEADS_COLLECTION, linkLeadId), {
        lastInboundAt: serverTimestamp(),
        lastContactAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        updatedBy: user.uid,
      });

      await updateDoc(doc(db, WHATSAPP_UNMATCHED_COLLECTION, linkTarget.id), {
        status: 'resolved',
        resolvedLeadId: linkLeadId,
        resolvedAt: serverTimestamp(),
        resolvedBy: user.uid,
        updatedAt: serverTimestamp(),
        updatedBy: user.uid,
      });

      setLinkDialogOpen(false);
      setLinkTarget(null);
      setLinkLeadId('');
      toast({ title: 'Unmatched message linked to lead' });
    } catch (error: any) {
      toast({
        title: 'Failed to link message to lead',
        description: error?.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setProcessingUnmatchedId(null);
    }
  };

  const handleCreateLeadFromUnmatched = async (item: UnmatchedInboundRecord) => {
    if (!user?.uid) {
      toast({ title: 'Admin session required', variant: 'destructive' });
      return;
    }

    const normalizedPhone = normalizePhone(item.phoneNormalized || item.rawFrom || '');
    if (!normalizedPhone) {
      toast({
        title: 'Phone unavailable',
        description: 'This unmatched message has no usable phone number.',
        variant: 'destructive',
      });
      return;
    }

    setProcessingUnmatchedId(item.id);
    try {
      const leadRef = await addDoc(collection(db, LEADS_COLLECTION), {
        parentName: '',
        primaryPhone: (item.rawFrom || '').trim() || normalizedPhone,
        phoneNormalized: normalizedPhone,
        parentEmail: null,
        childName: '',
        childAge: null,
        childGrade: null,
        interestTrack: 'phonics',
        source: 'whatsapp',
        sourceDetail: null,
        country: null,
        timezone: null,
        preferredTimingText: null,
        initialMessageSnippet: (item.messageSummary || '').trim() || null,
        status: 'new',
        ownerUserId: user.uid,
        ownerRole: 'admin',
        priority: 'normal',
        nextFollowUpAt: null,
        lastContactAt: serverTimestamp(),
        lastInboundAt: serverTimestamp(),
        lastOutboundAt: null,
        tags: null,
        notes: null,
        demoSessionId: null,
        enrollmentId: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: user.uid,
        updatedBy: user.uid,
      });

      await addDoc(collection(db, LEADS_COLLECTION, leadRef.id, LEAD_COMMUNICATIONS_COLLECTION), {
        ...buildInboundCommunicationPayload(item),
      });

      await updateDoc(doc(db, WHATSAPP_UNMATCHED_COLLECTION, item.id), {
        status: 'resolved',
        resolvedLeadId: leadRef.id,
        resolvedAt: serverTimestamp(),
        resolvedBy: user.uid,
        updatedAt: serverTimestamp(),
        updatedBy: user.uid,
      });

      toast({ title: 'New lead created from unmatched message' });
    } catch (error: any) {
      toast({
        title: 'Failed to create lead',
        description: error?.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setProcessingUnmatchedId(null);
    }
  };

  const openResolvedLead = (leadId: string) => {
    const lead = leads.find((item) => item.id === leadId);
    if (!lead) {
      toast({
        title: 'Lead not found in current list',
        description: `Lead ID: ${leadId}`,
        variant: 'destructive',
      });
      return;
    }
    openEditDialog(lead);
  };

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold">Leads &amp; Enquiries</h3>
            <p className="text-sm text-muted-foreground">
              Canonical enquiry inbox before demo scheduling.
            </p>
          </div>
          <Button type="button" onClick={openCreateDialog}>
            Add Lead
          </Button>
        </div>
      </Card>

      <Card className="p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <div className="rounded-md border p-3">
            <div className="text-xs text-muted-foreground">Total Leads</div>
            <div className="text-xl font-semibold">{dashboardMetrics.total}</div>
          </div>
          <div className="rounded-md border p-3">
            <div className="text-xs text-muted-foreground">New</div>
            <div className="text-xl font-semibold">{dashboardMetrics.newCount}</div>
          </div>
          <div className="rounded-md border p-3">
            <div className="text-xs text-muted-foreground">Due Today</div>
            <div className="text-xl font-semibold">{dashboardMetrics.dueToday}</div>
          </div>
          <div className="rounded-md border p-3">
            <div className="text-xs text-muted-foreground">Overdue</div>
            <div className="text-xl font-semibold text-destructive">{dashboardMetrics.overdue}</div>
          </div>
          <div className="rounded-md border p-3">
            <div className="text-xs text-muted-foreground">Demo Booked</div>
            <div className="text-xl font-semibold">{dashboardMetrics.demoBooked}</div>
          </div>
          <div className="rounded-md border p-3">
            <div className="text-xs text-muted-foreground">Admitted</div>
            <div className="text-xl font-semibold">{dashboardMetrics.admittedConfirmed}</div>
          </div>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          <div>
            <div className="mb-2 text-xs font-medium uppercase text-muted-foreground">By Source</div>
            <div className="flex flex-wrap gap-2">
              {SOURCE_OPTIONS.map((source) => (
                <Badge key={source} variant="outline">
                  {formatLabel(source)}: {dashboardMetrics.sourceCounts[source]}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-2 text-xs font-medium uppercase text-muted-foreground">By Status</div>
            <div className="flex flex-wrap gap-2">
              {LEAD_STATUSES.map((status) => (
                <Badge key={status} variant={statusBadgeVariant(status)}>
                  {formatLabel(status)}: {dashboardMetrics.statusCounts[status]}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="grid gap-3 md:grid-cols-4">
          <div className="md:col-span-2">
            <Label htmlFor="lead-search">Search</Label>
            <Input
              id="lead-search"
              placeholder="Parent, child, phone, email"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </div>

          <div>
            <Label>Status</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {LEAD_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {formatLabel(status)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-1">
            <div>
              <Label>Track</Label>
              <Select value={trackFilter} onValueChange={setTrackFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All tracks" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All tracks</SelectItem>
                  {TRACK_OPTIONS.map((track) => (
                    <SelectItem key={track} value={track}>
                      {formatLabel(track)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Source</Label>
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All sources" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All sources</SelectItem>
                  {SOURCE_OPTIONS.map((source) => (
                    <SelectItem key={source} value={source}>
                      {formatLabel(source)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant={operationalView === 'all' ? 'default' : 'outline'}
            onClick={() => setOperationalView('all')}
          >
            All
          </Button>
          <Button
            type="button"
            size="sm"
            variant={operationalView === 'due_today' ? 'default' : 'outline'}
            onClick={() => setOperationalView('due_today')}
          >
            Due Today
          </Button>
          <Button
            type="button"
            size="sm"
            variant={operationalView === 'overdue' ? 'default' : 'outline'}
            onClick={() => setOperationalView('overdue')}
          >
            Overdue
          </Button>
          <Button
            type="button"
            size="sm"
            variant={operationalView === 'no_demo' ? 'default' : 'outline'}
            onClick={() => setOperationalView('no_demo')}
          >
            No Demo
          </Button>
          <Button
            type="button"
            size="sm"
            variant={operationalView === 'demo_linked' ? 'default' : 'outline'}
            onClick={() => setOperationalView('demo_linked')}
          >
            Demo Linked
          </Button>
          <Button
            type="button"
            size="sm"
            variant={operationalView === 'no_response' ? 'default' : 'outline'}
            onClick={() => setOperationalView('no_response')}
          >
            No Response
          </Button>
          <Button
            type="button"
            size="sm"
            variant={operationalView === 'admission_follow_up' ? 'default' : 'outline'}
            onClick={() => setOperationalView('admission_follow_up')}
          >
            Admission Follow-up
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('all');
              setTrackFilter('all');
              setSourceFilter('all');
              setOperationalView('all');
            }}
          >
            Clear filters
          </Button>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-base font-semibold">Unmatched WhatsApp Messages</h4>
              <Badge variant="outline">Open: {unmatchedOpenCount}</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Inbound WhatsApp messages that could not be auto-matched to an existing lead.
            </p>
          </div>

          <div className="w-[220px]">
            <Select
              value={unmatchedStatusFilter}
              onValueChange={(value) => setUnmatchedStatusFilter(value as 'all' | UnmatchedInboundStatus)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="unmatched">Unmatched</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="ignored">Ignored</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {filteredUnmatchedItems.length === 0 ? (
          <div className="mt-4 rounded-md border border-dashed p-4 text-sm text-muted-foreground">
            No inbox records for the selected filter.
          </div>
        ) : (
          <div className="mt-4 space-y-2">
            {filteredUnmatchedItems.map((item) => (
              <div key={item.id} className="rounded-md border p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{formatLabel(item.status || 'unmatched')}</Badge>
                  <Badge variant="outline">{item.provider || 'meta_whatsapp_cloud'}</Badge>
                  <span className="text-xs text-muted-foreground">Received: {formatTs(item.receivedAt)}</span>
                </div>

                <div className="mt-2 grid gap-2 text-sm md:grid-cols-2">
                  <div>
                    <div className="text-xs text-muted-foreground">Phone</div>
                    <div className="font-medium">{item.phoneNormalized || item.rawFrom || '—'}</div>
                    {item.rawFrom && item.rawFrom !== item.phoneNormalized ? (
                      <div className="text-xs text-muted-foreground">Raw: {item.rawFrom}</div>
                    ) : null}
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Message</div>
                    <div>{item.messageSummary || '—'}</div>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => openLinkLeadDialog(item)}
                    disabled={item.status !== 'unmatched' || processingUnmatchedId === item.id}
                  >
                    Link to Lead
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => handleCreateLeadFromUnmatched(item)}
                    disabled={item.status !== 'unmatched' || processingUnmatchedId === item.id}
                  >
                    {processingUnmatchedId === item.id ? 'Processing...' : 'Create Lead'}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => markUnmatchedRecord(item, item.status === 'ignored' ? 'unmatched' : 'ignored')}
                    disabled={processingUnmatchedId === item.id}
                  >
                    {item.status === 'ignored' ? 'Mark Unmatched' : 'Mark Ignored'}
                  </Button>
                  {item.status !== 'resolved' ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => markUnmatchedRecord(item, 'resolved')}
                      disabled={processingUnmatchedId === item.id}
                    >
                      Mark Resolved
                    </Button>
                  ) : null}
                  {item.resolvedLeadId ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => openResolvedLead(item.resolvedLeadId as string)}
                    >
                      Open Resolved Lead
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="overflow-hidden">
        {filteredLeads.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No leads found. Add a lead manually to start tracking enquiries.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Parent</TableHead>
                  <TableHead>Child</TableHead>
                  <TableHead>Track</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Next Follow-up</TableHead>
                  <TableHead>Demo</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.map((lead) => {
                  const { isOverdue, isDueToday } = getLeadFollowUpFlags(
                    lead,
                    startOfToday,
                    endOfToday,
                  );

                  return (
                  <TableRow
                    key={lead.id}
                    className={isOverdue ? 'bg-amber-50/50 dark:bg-amber-950/15' : undefined}
                  >
                    <TableCell>
                      <div className="font-medium">{lead.parentName}</div>
                      <div className="text-xs text-muted-foreground">{lead.primaryPhone}</div>
                    </TableCell>
                    <TableCell>
                      <div>{lead.childName || '—'}</div>
                      <div className="text-xs text-muted-foreground">{lead.childGrade || '—'}</div>
                    </TableCell>
                    <TableCell>{formatLabel(lead.interestTrack || 'phonics')}</TableCell>
                    <TableCell>{formatLabel(lead.source || 'manual')}</TableCell>
                    <TableCell>
                      <Badge variant={statusBadgeVariant(lead.status || 'new')}>
                        {formatLabel(lead.status || 'new')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>{formatTs(lead.nextFollowUpAt)}</div>
                      {isOverdue ? (
                        <Badge variant="outline" className="mt-1 border-amber-300/80 text-[10px] text-amber-700 dark:text-amber-300">
                          Overdue
                        </Badge>
                      ) : null}
                      {!isOverdue && isDueToday ? (
                        <Badge variant="outline" className="mt-1 text-[10px]">
                          Due Today
                        </Badge>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      {lead.demoSessionId ? (
                        <Badge variant="default">Linked</Badge>
                      ) : (
                        <Badge variant="outline">Not linked</Badge>
                      )}
                    </TableCell>
                    <TableCell>{formatTs(lead.updatedAt || lead.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap justify-end gap-2">
                        <Select
                          value={lead.status}
                          onValueChange={(value) =>
                            handleQuickStatusUpdate(lead, value as LeadStatus)
                          }
                        >
                          <SelectTrigger className="h-8 w-[160px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {LEAD_STATUSES.map((status) => (
                              <SelectItem key={status} value={status}>
                                {formatLabel(status)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Button size="sm" variant="outline" onClick={() => openEditDialog(lead)}>
                          Edit
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openCommunicationsDialog(lead)}
                        >
                          Communications
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openCommunicationsDialog(lead, 'whatsapp_follow_up')}
                        >
                          Quick Follow-up
                        </Button>

                        <Button size="sm" variant="outline" onClick={() => openWhatsAppHelper(lead)}>
                          WhatsApp
                        </Button>

                        {lead.demoSessionId ? (
                          <Button size="sm" variant="outline" disabled>
                            Demo Created
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openCreateDemoDialog(lead)}
                            disabled={!canCreateDemoFromLead(lead)}
                          >
                            Create Demo
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editTarget ? 'Edit Lead' : 'Add Lead'}</DialogTitle>
          </DialogHeader>

          <form className="space-y-5" onSubmit={handleSave}>
            <div className="space-y-3">
              <h4 className="text-sm font-semibold">Parent details</h4>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>Parent Name *</Label>
                  <Input
                    value={form.parentName}
                    onChange={(event) => setField('parentName', event.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label>Primary Phone *</Label>
                  <Input
                    value={form.primaryPhone}
                    onChange={(event) => setField('primaryPhone', event.target.value)}
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label>Parent Email</Label>
                  <Input
                    type="email"
                    value={form.parentEmail}
                    onChange={(event) => setField('parentEmail', event.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-semibold">Child details</h4>
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <Label>Child Name</Label>
                  <Input
                    value={form.childName}
                    onChange={(event) => setField('childName', event.target.value)}
                  />
                </div>
                <div>
                  <Label>Child Age</Label>
                  <Input
                    value={form.childAge}
                    onChange={(event) => setField('childAge', event.target.value)}
                    inputMode="numeric"
                  />
                </div>
                <div>
                  <Label>Child Grade</Label>
                  <Input
                    value={form.childGrade}
                    onChange={(event) => setField('childGrade', event.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-semibold">Enquiry details</h4>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>Interest Track</Label>
                  <Select
                    value={form.interestTrack}
                    onValueChange={(value) => setField('interestTrack', value as InterestTrack)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TRACK_OPTIONS.map((track) => (
                        <SelectItem key={track} value={track}>
                          {formatLabel(track)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Source</Label>
                  <Select
                    value={form.source}
                    onValueChange={(value) => setField('source', value as LeadSource)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SOURCE_OPTIONS.map((source) => (
                        <SelectItem key={source} value={source}>
                          {formatLabel(source)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Source Detail</Label>
                  <Input
                    value={form.sourceDetail}
                    onChange={(event) => setField('sourceDetail', event.target.value)}
                  />
                </div>
                <div>
                  <Label>Status</Label>
                  <Select
                    value={form.status}
                    onValueChange={(value) => setField('status', value as LeadStatus)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LEAD_STATUSES.map((status) => (
                        <SelectItem key={status} value={status}>
                          {formatLabel(status)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Country</Label>
                  <Input
                    value={form.country}
                    onChange={(event) => setField('country', event.target.value)}
                  />
                </div>
                <div>
                  <Label>Timezone</Label>
                  <Input
                    value={form.timezone}
                    onChange={(event) => setField('timezone', event.target.value)}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label>Preferred Timing</Label>
                  <Input
                    value={form.preferredTimingText}
                    onChange={(event) => setField('preferredTimingText', event.target.value)}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label>Initial Message Snippet</Label>
                  <Textarea
                    rows={3}
                    value={form.initialMessageSnippet}
                    onChange={(event) => setField('initialMessageSnippet', event.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-semibold">Operations</h4>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>Priority</Label>
                  <Select value={form.priority} onValueChange={(value) => setField('priority', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITY_OPTIONS.map((priority) => (
                        <SelectItem key={priority} value={priority}>
                          {formatLabel(priority)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Next Follow-up Date</Label>
                  <Input
                    type="date"
                    value={form.nextFollowUpDate}
                    onChange={(event) => setField('nextFollowUpDate', event.target.value)}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label>Tags (comma separated)</Label>
                  <Input
                    value={form.tagsText}
                    onChange={(event) => setField('tagsText', event.target.value)}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label>Notes</Label>
                  <Textarea
                    rows={4}
                    value={form.notes}
                    onChange={(event) => setField('notes', event.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving...' : editTarget ? 'Save Changes' : 'Create Lead'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Link Unmatched Message to Existing Lead</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div className="rounded-md border p-3 text-sm">
              <div className="text-xs text-muted-foreground">Inbound message</div>
              <div className="mt-1">{linkTarget?.messageSummary || '—'}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                Phone: {linkTarget?.phoneNormalized || linkTarget?.rawFrom || '—'}
              </div>
            </div>

            <div>
              <Label>Search Lead</Label>
              <Input
                placeholder="Parent, child, phone"
                value={linkLeadSearch}
                onChange={(event) => setLinkLeadSearch(event.target.value)}
              />
            </div>

            <div>
              <Label>Select Lead</Label>
              <Select value={linkLeadId} onValueChange={setLinkLeadId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose lead" />
                </SelectTrigger>
                <SelectContent>
                  {linkLeadOptions.map((lead) => (
                    <SelectItem key={lead.id} value={lead.id}>
                      {(lead.parentName || 'Unnamed Lead').trim() || 'Unnamed Lead'} • {lead.primaryPhone || '—'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setLinkDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleResolveByLinkingLead}
                disabled={!linkLeadId || !!processingUnmatchedId}
              >
                {processingUnmatchedId ? 'Linking...' : 'Link and Resolve'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={demoDialogOpen} onOpenChange={setDemoDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Demo from Lead</DialogTitle>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleCreateDemoFromLead}>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Parent Name *</Label>
                <Input
                  value={demoForm.parentName}
                  onChange={(event) => setDemoField('parentName', event.target.value)}
                  required
                />
              </div>
              <div>
                <Label>Parent Phone *</Label>
                <Input
                  value={demoForm.parentPhone}
                  onChange={(event) => setDemoField('parentPhone', event.target.value)}
                  required
                />
              </div>
              <div>
                <Label>Child Name *</Label>
                <Input
                  value={demoForm.childName}
                  onChange={(event) => setDemoField('childName', event.target.value)}
                  required
                />
              </div>
              <div>
                <Label>Child Grade *</Label>
                <Input
                  value={demoForm.childGrade}
                  onChange={(event) => setDemoField('childGrade', event.target.value)}
                  required
                />
              </div>
              <div>
                <Label>Child Age</Label>
                <Input
                  value={demoForm.childAge}
                  onChange={(event) => setDemoField('childAge', event.target.value)}
                  inputMode="numeric"
                />
              </div>
              <div>
                <Label>Course Interested *</Label>
                <Input
                  value={demoForm.courseInterested}
                  onChange={(event) => setDemoField('courseInterested', event.target.value)}
                  required
                />
              </div>
              <div>
                <Label>Source</Label>
                <Input
                  value={demoForm.source}
                  onChange={(event) => setDemoField('source', event.target.value)}
                />
              </div>
              <div>
                <Label>Request Received Date</Label>
                <Input
                  type="date"
                  value={demoForm.requestReceivedDate}
                  onChange={(event) => setDemoField('requestReceivedDate', event.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <Label>Preferred Date/Time Text *</Label>
                <Input
                  value={demoForm.preferredDateTimeText}
                  onChange={(event) => setDemoField('preferredDateTimeText', event.target.value)}
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <Label>Timezone</Label>
                <Input
                  value={demoForm.timezone}
                  onChange={(event) => setDemoField('timezone', event.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <Label>Admin Notes</Label>
                <Textarea
                  rows={4}
                  value={demoForm.adminNotes}
                  onChange={(event) => setDemoField('adminNotes', event.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setDemoDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={creatingDemo}>
                {creatingDemo ? 'Creating...' : 'Create Demo'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={whatsAppOpen} onOpenChange={setWhatsAppOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              WhatsApp Helper{whatsAppTarget?.parentName ? ` - ${whatsAppTarget.parentName}` : ''}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Template</Label>
                <Select
                  value={whatsAppTemplate}
                  onValueChange={(value) => handleWhatsAppTemplateChange(value as WhatsAppTemplateKey)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {WHATSAPP_TEMPLATE_OPTIONS.map((template) => (
                      <SelectItem key={template} value={template}>
                        {formatLabel(template)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Recipient Phone</Label>
                <Input
                  value={whatsAppTarget ? getWhatsAppPhone(whatsAppTarget) : ''}
                  readOnly
                  placeholder="No phone available"
                />
              </div>
            </div>

            <div>
              <Label>Message Draft</Label>
              <Textarea
                rows={8}
                value={whatsAppMessage}
                onChange={(event) => setWhatsAppMessage(event.target.value)}
              />
              <div className="mt-1 text-xs text-muted-foreground">
                {whatsAppMessage.trim().length} characters
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                Manual WhatsApp uses custom edited text. API send uses approved WhatsApp templates only.
              </div>
            </div>

            <div className="flex flex-wrap justify-end gap-2">
              <Button type="button" variant="outline" onClick={copyWhatsAppMessage}>
                Copy Message
              </Button>
              <Button type="button" variant="outline" onClick={handleOpenWhatsAppOnly}>
                Open WhatsApp
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleSendViaWhatsAppApi}
                disabled={sendingWhatsAppApi || !WHATSAPP_API_TEMPLATE_KEYS.has(whatsAppTemplate)}
              >
                {sendingWhatsAppApi ? 'Sending...' : 'Send via WhatsApp API'}
              </Button>
              <Button type="button" onClick={handleOpenWhatsAppAndLog} disabled={loggingWhatsApp}>
                {loggingWhatsApp ? 'Opening...' : 'Open WhatsApp + Log Communication'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={communicationsOpen} onOpenChange={setCommunicationsOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              Communications{communicationsTarget?.parentName ? ` - ${communicationsTarget.parentName}` : ''}
            </DialogTitle>
          </DialogHeader>

          {communicationsTarget ? (
            <div className="flex justify-end">
              <Button size="sm" variant="outline" onClick={() => openWhatsAppHelper(communicationsTarget)}>
                WhatsApp Helper
              </Button>
            </div>
          ) : null}

          <div className="space-y-4">
            <Card className="p-3">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm font-semibold">History</div>
                <div className="w-[170px]">
                  <Select
                    value={communicationsHistoryFilter}
                    onValueChange={(value) =>
                      setCommunicationsHistoryFilter(value as CommunicationHistoryFilter)
                    }
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp only</SelectItem>
                      <SelectItem value="failed">Failed only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {filteredCommunicationsHistory.length === 0 ? (
                <div className="text-sm text-muted-foreground">No communication logs yet.</div>
              ) : (
                <div className="space-y-2">
                  {filteredCommunicationsHistory.map((item) => (
                    <div key={item.id} className="rounded-md border p-3">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <Badge variant="outline">{formatLabel(item.type)}</Badge>
                        <Badge variant="outline">{formatLabel(item.channel)}</Badge>
                        <Badge variant="outline">{formatLabel(item.direction)}</Badge>
                        <Badge variant="secondary">{formatLabel(item.status)}</Badge>
                        {getCommunicationOriginLabel(item) ? (
                          <Badge variant="outline">{getCommunicationOriginLabel(item) as string}</Badge>
                        ) : null}
                        {item.provider ? <Badge variant="outline">{formatLabel(item.provider)}</Badge> : null}
                        {item.templateName || item.templateTag ? (
                          <Badge variant="outline">
                            Template: {item.templateName || item.templateTag}
                          </Badge>
                        ) : null}
                        {item.deliveryStatus ? (
                          <Badge variant={deliveryBadgeVariant(item.deliveryStatus)}>
                            {formatLabel(item.deliveryStatus)}
                          </Badge>
                        ) : null}
                      </div>
                      <div className="text-sm">{item.summary}</div>
                      {item.externalMessageId ? (
                        <div className="mt-1 text-xs text-muted-foreground">
                          Message ID: {item.externalMessageId.slice(0, 28)}
                          {item.externalMessageId.length > 28 ? '…' : ''}
                        </div>
                      ) : null}
                      {item.deliveryStatus === 'failed' && (item.errorMessage || item.errorCode) ? (
                        <div className="mt-1 text-xs text-muted-foreground">
                          Failed: {item.errorMessage || item.errorCode}
                        </div>
                      ) : null}
                      <div className="mt-1 text-xs text-muted-foreground">
                        Follow-up: {formatTs(item.followUpDate)}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        Created: {formatTs(item.createdAt)} • By: {item.createdBy || '—'}
                      </div>
                      <div className="mt-2">
                        <Button size="sm" variant="outline" onClick={() => openEditCommunication(item)}>
                          Edit
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card className="p-3">
              <div className="mb-2 text-sm font-semibold">
                {communicationEditTarget ? 'Edit communication' : 'Add communication'}
              </div>
              {!communicationEditTarget ? (
                <div className="mb-3 flex flex-wrap gap-2">
                  {(Object.keys(COMMUNICATION_PRESETS) as CommunicationPresetKey[]).map((preset) => (
                    <Button
                      key={preset}
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => applyCommunicationPreset(preset)}
                    >
                      {COMMUNICATION_PRESETS[preset].label}
                    </Button>
                  ))}
                </div>
              ) : null}
              <form className="space-y-3" onSubmit={handleSaveCommunication}>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label>Type</Label>
                    <Select
                      value={communicationForm.type}
                      onValueChange={(value) =>
                        setCommunicationField('type', value as CommunicationType)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {COMMUNICATION_TYPE_OPTIONS.map((option) => (
                          <SelectItem key={option} value={option}>
                            {formatLabel(option)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Direction</Label>
                    <Select
                      value={communicationForm.direction}
                      onValueChange={(value) =>
                        setCommunicationField('direction', value as CommunicationDirection)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {COMMUNICATION_DIRECTION_OPTIONS.map((option) => (
                          <SelectItem key={option} value={option}>
                            {formatLabel(option)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Channel</Label>
                    <Select
                      value={communicationForm.channel}
                      onValueChange={(value) =>
                        setCommunicationField('channel', value as CommunicationChannel)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {COMMUNICATION_CHANNEL_OPTIONS.map((option) => (
                          <SelectItem key={option} value={option}>
                            {formatLabel(option)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Status</Label>
                    <Select
                      value={communicationForm.status}
                      onValueChange={(value) =>
                        setCommunicationField('status', value as CommunicationStatus)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {COMMUNICATION_STATUS_OPTIONS.map((option) => (
                          <SelectItem key={option} value={option}>
                            {formatLabel(option)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Follow-up Needed</Label>
                    <Select
                      value={communicationForm.followUpNeeded}
                      onValueChange={(value) => setCommunicationField('followUpNeeded', value as 'yes' | 'no')}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Follow-up Date</Label>
                    <Input
                      type="date"
                      value={communicationForm.followUpDate}
                      onChange={(event) => setCommunicationField('followUpDate', event.target.value)}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <Label>Template Tag</Label>
                    <Input
                      value={communicationForm.templateTag}
                      onChange={(event) => setCommunicationField('templateTag', event.target.value)}
                      placeholder="Optional"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <Label>Summary *</Label>
                    <Textarea
                      rows={3}
                      value={communicationForm.summary}
                      onChange={(event) => setCommunicationField('summary', event.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  {communicationEditTarget ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setCommunicationEditTarget(null);
                        setCommunicationForm(buildInitialCommunicationForm());
                      }}
                    >
                      Cancel Edit
                    </Button>
                  ) : null}
                  <Button type="submit" disabled={savingCommunication}>
                    {savingCommunication
                      ? 'Saving...'
                      : communicationEditTarget
                      ? 'Save Communication'
                      : 'Add Communication'}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
