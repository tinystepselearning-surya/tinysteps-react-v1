import React, { useEffect, useMemo, useState } from 'react';
import {
  addDoc,
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  type QueryConstraint,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { Button } from '@components/ui/button';
import { Card } from '@components/ui/card';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@components/ui/table';
import { Badge } from '@components/ui/badge';
import { cn } from '@components/lib/utils';
import { MoreHorizontal } from 'lucide-react';
import { useToast } from '@components/hooks/use-toast';
import { db, functions } from '../../lib/firebaseConfig';
import {
  DEFAULT_PHONE_COUNTRY_CODE,
  buildPhoneFromParts,
  splitPhoneForForm,
} from '../../lib/phone';
import { normalizeDemoStatus } from '../../lib/statuses';
import { useAuthStore } from '../../store/useAuthStore';
import type {
  DemoClassType,
  DemoConversionStatus,
  DemoFollowUpCallStatus,
  DemoSession,
} from '../../types/models';
import {
  cancelDemoSession,
  checkDemoPhoneConflicts,
  createDemoSession,
  deleteDemoSession,
  listenAllDemoSessions,
  listenDemoSessionPrivatePhones,
  reassignDemoSession,
  releaseDemoSession,
  reopenDemoSession,
  updateDemoSessionAdminDetails,
  updateDemoConversion,
} from '../../services/demoSessionsService';
import DemoSessionsManagement from './DemoSessionsManagement';

export type LeadsWorkspaceView = 'leads' | 'demos';

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
type CommunicationType = 'message' | 'call' | 'follow_up' | 'note';
type CommunicationDirection = 'inbound' | 'outbound' | 'internal';
type CommunicationChannel = 'whatsapp' | 'phone' | 'instagram' | 'website' | 'manual' | 'other';
type CommunicationStatus = 'logged' | 'pending_follow_up' | 'completed';
type DeliveryStatus = 'queued' | 'sent' | 'delivered' | 'read' | 'failed';
type CommunicationHistoryFilter = 'all' | 'whatsapp' | 'failed';
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

interface LeadRecord {
  id: string;
  parentName?: string;
  primaryPhone?: string;
  phoneNormalized?: string;
  parentEmail?: string | null;
  childName?: string;
  childAge?: number | null;
  childGrade?: string | null;
  interestTrack?: InterestTrack | null;
  source?: LeadSource | null;
  sourceDetail?: string | null;
  country?: string | null;
  preferredTimingText?: string | null;
  initialMessageSnippet?: string | null;
  timezone?: string | null;
  status?: LeadStatus | null;
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
  updatedAt?: Timestamp | null;
  createdAt?: Timestamp | null;
  createdBy?: string | null;
  updatedBy?: string | null;
}

type LifecycleStage =
  | 'enquiry'
  | 'demo_active'
  | 'demo_completed'
  | 'admission_follow_up'
  | 'admitted'
  | 'lost';

type SummaryCardFilter = 'all' | 'enquiry' | 'demo_active' | 'admission_follow_up' | 'admitted' | 'lost';
type FocusFilter = 'all' | 'due_today' | 'overdue' | 'no_demo' | 'all_demos' | 'open' | 'assigned' | 'completed' | 'no_response';

interface UnifiedRow {
  id: string;
  lead: LeadRecord | null;
  demo: DemoSession | null;
  lifecycleStage: LifecycleStage;
  source: string;
  courseLabel: string;
  teacherName: string;
  nextFollowUpLabel: string;
  updatedAtMs: number;
  parentName: string;
  childName: string;
  parentPhone: string;
}

interface TeacherOption {
  id: string;
  name: string;
}

interface DemoEditFormState {
  parentName: string;
  parentPhone: string;
  childName: string;
  childGrade: string;
  childAge: string;
  courseInterested: string;
  source: string;
  demoMode: string;
  requestReceivedDate: string;
  preferredDateTimeText: string;
  timezone: string;
  adminNotes: string;
}

interface DemoRequestFormState {
  parentName: string;
  parentPhoneCountryCode: string;
  parentPhoneLocal: string;
  childName: string;
  childGrade: string;
  childAge: string;
  courseInterested: string;
  source: string;
  demoMode: string;
  requestReceivedDate: string;
  preferredDateTimeText: string;
  timezone: string;
  adminNotes: string;
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

interface LeadsInquiriesWorkspaceProps {
  view?: LeadsWorkspaceView;
  onViewChange?: (nextView: LeadsWorkspaceView) => void;
}

const LEADS_COLLECTION = 'leads';
const LEAD_COMMUNICATIONS_COLLECTION = 'communications';
const EMPTY_DEMO_EDIT_FORM: DemoEditFormState = {
  parentName: '',
  parentPhone: '',
  childName: '',
  childGrade: '',
  childAge: '',
  courseInterested: '',
  source: '',
  demoMode: '',
  requestReceivedDate: '',
  preferredDateTimeText: '',
  timezone: '',
  adminNotes: '',
};
const EMPTY_DEMO_REQUEST_FORM: DemoRequestFormState = {
  parentName: '',
  parentPhoneCountryCode: DEFAULT_PHONE_COUNTRY_CODE,
  parentPhoneLocal: '',
  childName: '',
  childGrade: '',
  childAge: '',
  courseInterested: '',
  source: '',
  demoMode: '',
  requestReceivedDate: '',
  preferredDateTimeText: '',
  timezone: '',
  adminNotes: '',
};
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
const LEAD_TRACK_OPTIONS: InterestTrack[] = ['phonics', 'grammar', 'public_speaking'];
const LEAD_SOURCE_OPTIONS: LeadSource[] = ['website', 'whatsapp', 'instagram', 'referral', 'manual'];
const PRIORITY_OPTIONS = ['low', 'normal', 'high'] as const;
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
const WHATSAPP_TEMPLATE_OPTIONS: WhatsAppTemplateKey[] = [
  'first_response',
  'follow_up_no_response',
  'demo_scheduling',
  'demo_reminder',
  'demo_completed_followup',
  'admission_followup',
];
const WHATSAPP_API_TEMPLATE_KEYS = new Set<WhatsAppTemplateKey>(WHATSAPP_TEMPLATE_OPTIONS);
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

const COURSE_OPTIONS = [
  'Phonics',
  'Grammar',
  'Public Speaking',
  'Reading',
  'Writing',
  'Combo',
  'Not Sure Yet',
] as const;

const SOURCE_OPTIONS = [
  'WhatsApp',
  'Website',
  'Referral',
  'Instagram',
  'Facebook',
  'Existing Parent',
  'Other',
] as const;

const DEMO_MODE_OPTIONS = [
  'Zoom',
  'Google Meet',
  'Microsoft Teams',
  'Phone Call',
  'WhatsApp Call',
] as const;

const TIMEZONE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'IST', label: 'IST (UTC+05:30) - India Standard Time' },
  { value: 'PST', label: 'PST (UTC-08:00) - Pacific Standard Time' },
  { value: 'CST', label: 'CST (UTC-06:00) - Central Standard Time' },
  { value: 'EST', label: 'EST (UTC-05:00) - Eastern Standard Time' },
  { value: 'UAE', label: 'UAE (UTC+04:00) - Gulf Standard Time' },
  { value: 'Asia/Kolkata', label: 'Asia/Kolkata (UTC+05:30)' },
  { value: 'Asia/Dubai', label: 'Asia/Dubai (UTC+04:00)' },
  { value: 'Asia/Singapore', label: 'Asia/Singapore (UTC+08:00)' },
  { value: 'Asia/Hong_Kong', label: 'Asia/Hong_Kong (UTC+08:00)' },
  { value: 'Asia/Tokyo', label: 'Asia/Tokyo (UTC+09:00)' },
  { value: 'Asia/Shanghai', label: 'Asia/Shanghai (UTC+08:00)' },
  { value: 'Europe/London', label: 'Europe/London (UTC+00:00)' },
  { value: 'Europe/Amsterdam', label: 'Europe/Amsterdam (UTC+01:00)' },
  { value: 'Europe/Paris', label: 'Europe/Paris (UTC+01:00)' },
  { value: 'Europe/Berlin', label: 'Europe/Berlin (UTC+01:00)' },
  { value: 'America/New_York', label: 'America/New_York (UTC-05:00)' },
  { value: 'America/Chicago', label: 'America/Chicago (UTC-06:00)' },
  { value: 'America/Los_Angeles', label: 'America/Los_Angeles (UTC-08:00)' },
  { value: 'America/Denver', label: 'America/Denver (UTC-07:00)' },
  { value: 'America/Toronto', label: 'America/Toronto (UTC-05:00)' },
  { value: 'America/Vancouver', label: 'America/Vancouver (UTC-08:00)' },
  { value: 'America/Sao_Paulo', label: 'America/Sao_Paulo (UTC-03:00)' },
  { value: 'Australia/Sydney', label: 'Australia/Sydney (UTC+10:00)' },
  { value: 'Africa/Johannesburg', label: 'Africa/Johannesburg (UTC+02:00)' },
  { value: 'Other', label: 'Other' },
];

const CONVERSION_OPTIONS: Array<{ value: DemoConversionStatus; label: string }> = [
  { value: 'interested', label: 'Interested' },
  { value: 'enrolled', label: 'Enrolled' },
  { value: 'not_interested', label: 'Not Interested' },
  { value: 'follow_up_later', label: 'Follow Up Later' },
  { value: 'wrong_fit', label: 'Wrong Fit' },
  { value: 'no_response', label: 'No Response' },
];
const TODAY_DATE_INPUT = (() => {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
})();
const DAY_MS = 24 * 60 * 60 * 1000;

const LOST_LEAD_STATUSES = new Set<LeadStatus>(['not_interested', 'wrong_fit', 'no_response', 'lost']);
const TERMINAL_DEMO_BLOCK_LEAD_STATUSES = new Set<LeadStatus>([
  'not_interested',
  'wrong_fit',
  'lost',
  'admitted_confirmed',
]);
const FOLLOW_UP_TERMINAL_STATUSES = new Set<LeadStatus>([
  'admitted_confirmed',
  'not_interested',
  'wrong_fit',
  'lost',
]);
const LEADS_PAGE_SIZE_OPTIONS = [5, 10, 25, 50, 100] as const;

const toMs = (value: unknown): number => {
  if (!value) return 0;
  if (value instanceof Date) return Number.isFinite(value.getTime()) ? value.getTime() : 0;
  if (typeof value === 'object' && value !== null) {
    const maybe = value as { toMillis?: () => number; seconds?: number };
    if (typeof maybe.toMillis === 'function') {
      const ms = maybe.toMillis();
      return Number.isFinite(ms) ? ms : 0;
    }
    if (typeof maybe.seconds === 'number') {
      return maybe.seconds * 1000;
    }
  }
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const d = new Date(value);
    return Number.isFinite(d.getTime()) ? d.getTime() : 0;
  }
  return 0;
};

const formatTs = (value: unknown): string => {
  const ms = toMs(value);
  if (!ms) return '—';
  const d = new Date(ms);
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(d);
};

const toDateInput = (value: unknown): string => {
  const ms = toMs(value);
  if (!ms) return '';
  const date = new Date(ms);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const dateInputToTimestamp = (value: string): Timestamp | null => {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = new Date(`${trimmed}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  return Timestamp.fromDate(parsed);
};

const normalizeText = (value: unknown): string => String(value || '').trim();
const normalizePhone = (value: string): string => value.replace(/[^\d]/g, '');

const formatLabel = (value: string): string => {
  if (!value) return '—';
  return value
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};

const interestTrackToCourse = (track: string): string => {
  const normalized = track.trim().toLowerCase();
  if (normalized === 'phonics') return 'Phonics';
  if (normalized === 'grammar') return 'Grammar';
  if (normalized === 'public_speaking') return 'Public Speaking';
  return formatLabel(normalized) || '—';
};

const leadSourceToDemoSource = (source: string): string => {
  const normalized = source.trim().toLowerCase();
  if (normalized === 'whatsapp') return 'WhatsApp';
  if (normalized === 'website') return 'Website';
  if (normalized === 'instagram') return 'Instagram';
  if (normalized === 'referral') return 'Referral';
  return formatLabel(normalized) || 'Manual';
};

const buildInitialLeadForm = (): LeadFormState => ({
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

const buildCommunicationFormFromPreset = (preset: CommunicationPresetKey): CommunicationFormState => ({
  ...COMMUNICATION_PRESETS[preset].form,
});

const buildInitialDemoRequestForm = (): DemoRequestFormState => ({
  ...EMPTY_DEMO_REQUEST_FORM,
  requestReceivedDate: TODAY_DATE_INPUT,
});

const buildDemoRequestFormFromLead = (lead: LeadRecord): DemoRequestFormState => {
  const phone = splitPhoneForForm(lead.primaryPhone || '');
  return {
    parentName: lead.parentName || '',
    parentPhoneCountryCode: phone.countryCode,
    parentPhoneLocal: phone.phoneLocal,
    childName: lead.childName || '',
    childGrade: lead.childGrade || '',
    childAge: typeof lead.childAge === 'number' ? String(lead.childAge) : '',
    courseInterested: interestTrackToCourse(lead.interestTrack || 'phonics'),
    source: leadSourceToDemoSource(lead.source || 'manual'),
    demoMode: '',
    requestReceivedDate: TODAY_DATE_INPUT,
    preferredDateTimeText: lead.preferredTimingText || '',
    timezone: lead.timezone || '',
    adminNotes: [lead.notes || '', lead.initialMessageSnippet || '']
      .filter(Boolean)
      .join('\n')
      .trim(),
  };
};

const canCreateDemoFromLead = (lead: LeadRecord): boolean => {
  if (lead.demoSessionId) return false;
  if (TERMINAL_DEMO_BLOCK_LEAD_STATUSES.has((lead.status || 'new') as LeadStatus)) return false;
  return true;
};

const buildWhatsAppUrl = (phone: string, message: string): string =>
  `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

const getWhatsAppPhone = (lead: LeadRecord): string => {
  const normalized = normalizeText(lead.phoneNormalized);
  if (normalized) return normalizePhone(normalized);
  return normalizePhone(lead.primaryPhone || '');
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

const buildTimelineRows = (session: DemoSession): string[] =>
  [
    `Created: ${formatTs(session.createdAt)}`,
    `Request Received Date: ${session.requestReceivedDate || '—'}`,
    `Assigned: ${formatTs(session.assignedAt)}`,
    `Confirmed For: ${`${session.teacherConfirmedDate || '—'} ${session.teacherConfirmedTime || ''}`.trim()}`,
    `Completed: ${formatTs(session.completedAt)}`,
    `Released: ${formatTs(session.releasedAt)}`,
    `Reopened: ${formatTs(session.reopenedAt)}`,
    session.rescheduledFromDemoId ? `Rescheduled From: ${session.rescheduledFromDemoId}` : null,
    session.rescheduledToDemoId ? `Rescheduled To: ${session.rescheduledToDemoId}` : null,
    `Last Updated: ${formatTs(session.lastUpdatedAt || session.createdAt)}`,
  ].filter((value): value is string => Boolean(value));

const formatHistoryAction = (action?: string): string => {
  if (!action) return 'Updated';
  if (action === 'created') return 'Created';
  if (action === 'claimed') return 'Claimed';
  if (action === 'assigned') return 'Assigned';
  if (action === 'schedule_updated') return 'Schedule Updated';
  if (action === 'completed') return 'Completed';
  if (action === 'reschedule_created') return 'Reschedule Follow-up Created';
  if (action === 'reassigned') return 'Reassigned';
  if (action === 'cancelled') return 'Cancelled';
  if (action === 'released') return 'Released';
  if (action === 'reopened') return 'Reopened';
  if (action === 'admin_details_updated') return 'Details Updated';
  if (action === 'follow_up_updated') return 'Follow-up Updated';
  return formatLabel(action);
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

const lifecycleLabel = (stage: LifecycleStage): string => {
  if (stage === 'enquiry') return 'Enquiry';
  if (stage === 'demo_active') return 'Demo In Progress';
  if (stage === 'demo_completed') return 'Demo Completed';
  if (stage === 'admission_follow_up') return 'Admission Follow-up';
  if (stage === 'admitted') return 'Admitted';
  return 'Lost';
};

const lifecycleVariant = (stage: LifecycleStage): 'default' | 'secondary' | 'outline' => {
  if (stage === 'admitted') return 'default';
  if (stage === 'lost') return 'secondary';
  return 'outline';
};

const dayRangeBounds = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { startMs: start.getTime(), endMs: end.getTime() };
};

const parseDateOnlyMs = (value: string): number => {
  const trimmed = value.trim();
  if (!trimmed) return 0;
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/;
  if (dateOnly.test(trimmed)) {
    const local = new Date(`${trimmed}T00:00:00`);
    const ms = local.getTime();
    return Number.isFinite(ms) ? ms : 0;
  }
  const parsed = new Date(trimmed);
  return Number.isFinite(parsed.getTime()) ? parsed.getTime() : 0;
};

const formatDateInputLabel = (value?: string | null): string => {
  const ms = parseDateOnlyMs(normalizeText(value));
  if (!ms) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(ms));
};

const getRowFollowUpMs = (row: UnifiedRow): number => {
  const demoFollowUp = parseDateOnlyMs(normalizeText(row.demo?.followUpDate));
  if (demoFollowUp) return demoFollowUp;
  return toMs(row.lead?.nextFollowUpAt);
};

const isTerminalLifecycleStage = (stage: LifecycleStage): boolean => stage === 'admitted' || stage === 'lost';

const resolveDemoWorkflowState = (demo: DemoSession | null): 'open' | 'assigned' | 'completed' | '' => {
  if (!demo) return '';
  const status = normalizeDemoStatus(demo.status);
  if (status === 'open') return 'open';
  if (status === 'assigned') return 'assigned';
  if (status === 'completed' || status === 'cancelled') return 'completed';
  return '';
};

function deriveLifecycleStage(lead: LeadRecord | null, demo: DemoSession | null): LifecycleStage {
  const leadStatus = normalizeText(lead?.status).toLowerCase() as LeadStatus;
  const conversionStatus = normalizeText(demo?.conversionStatus).toLowerCase() as DemoConversionStatus;
  const demoStatus = normalizeDemoStatus(demo?.status || '');

  if (leadStatus === 'admitted_confirmed' || conversionStatus === 'enrolled') return 'admitted';
  if (
    LOST_LEAD_STATUSES.has(leadStatus) ||
    conversionStatus === 'not_interested' ||
    conversionStatus === 'wrong_fit' ||
    conversionStatus === 'no_response'
  ) {
    return 'lost';
  }
  if (leadStatus === 'admission_follow_up' || conversionStatus === 'interested' || conversionStatus === 'follow_up_later') {
    return 'admission_follow_up';
  }
  if (demoStatus === 'open' || demoStatus === 'assigned') return 'demo_active';
  if (demoStatus === 'completed' || demoStatus === 'cancelled') return 'demo_completed';
  return 'enquiry';
}

function nextFollowUpLabel(lead: LeadRecord | null, demo: DemoSession | null): string {
  const demoFollowUp = normalizeText(demo?.followUpDate);
  if (demoFollowUp) return demoFollowUp;
  if (lead?.nextFollowUpAt) return formatTs(lead.nextFollowUpAt);
  return '—';
}

const formatConversionStatus = (status?: DemoConversionStatus | null): string => {
  if (!status) return '—';
  return status
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};

const formatFollowUpCallStatus = (status?: DemoFollowUpCallStatus | null): string => {
  if (!status) return '—';
  if (status === 'not_reachable') return 'Not Reachable';
  if (status === 'not_required') return 'Not Required';
  return status.charAt(0).toUpperCase() + status.slice(1);
};

const getTeacherResponseItems = (demo: DemoSession | null): Array<{ label: string; value: string }> => {
  if (!demo) return [];
  const items: Array<{ label: string; value: string }> = [];
  if (demo.outcome) items.push({ label: 'Outcome', value: formatLabel(demo.outcome) });
  if (normalizeText(demo.teacherRemarks)) {
    items.push({ label: 'Teacher Remarks', value: normalizeText(demo.teacherRemarks) });
  }
  if (normalizeText(demo.teacherRecommendation)) {
    items.push({ label: 'Teacher Recommendation', value: normalizeText(demo.teacherRecommendation) });
  }
  if (demo.recommendedNextStep) {
    items.push({ label: 'Recommended Next Step', value: formatLabel(demo.recommendedNextStep) });
  }
  return items;
};

const sanitizePhoneForWhatsApp = (value: string): string => value.replace(/[^\d]/g, '');

const copyText = async (value: string): Promise<void> => {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  if (typeof document !== 'undefined') {
    const input = document.createElement('textarea');
    input.value = value;
    input.style.position = 'fixed';
    input.style.opacity = '0';
    document.body.appendChild(input);
    input.focus();
    input.select();
    document.execCommand('copy');
    document.body.removeChild(input);
    return;
  }

  throw new Error('Clipboard is not available');
};

const buildDemoEditForm = (session: DemoSession, parentPhone: string): DemoEditFormState => ({
  parentName: session.parentName || '',
  parentPhone: parentPhone || '',
  childName: session.childName || '',
  childGrade: session.childGrade || '',
  childAge: typeof session.childAge === 'number' ? String(session.childAge) : '',
  courseInterested: session.courseInterested || '',
  source: session.source || '',
  demoMode: session.demoMode || '',
  requestReceivedDate: session.requestReceivedDate || TODAY_DATE_INPUT,
  preferredDateTimeText: session.preferredDateTimeText || '',
  timezone: session.timezone || '',
  adminNotes: session.adminNotes || '',
});

const buildDemoSummary = (session: DemoSession, parentPhone: string): string =>
  [
    `Parent: ${session.parentName}`,
    `Phone: ${parentPhone || '—'}`,
    `Child: ${session.childName} (Grade ${session.childGrade}${typeof session.childAge === 'number' ? `, Age ${session.childAge}` : ''})`,
    `Course: ${session.courseInterested}`,
    `Request received date: ${session.requestReceivedDate || '—'}`,
    `Preferred slot: ${session.preferredDateTimeText}`,
    `Timezone: ${session.timezone || '—'}`,
    `Status: ${formatLabel(normalizeDemoStatus(session.status) || session.status)}`,
    `Assigned teacher: ${session.assignedTeacherName || '—'}`,
  ].join('\n');

const buildWhatsappMessage = (session: DemoSession): string =>
  [
    `Hi ${session.parentName},`,
    `This is Tiny Steps regarding ${session.childName}'s ${session.courseInterested} demo.`,
    `We noted your preferred slot: ${session.preferredDateTimeText}${session.timezone ? ` (${session.timezone})` : ''}.`,
    'Please confirm if this works for you, or share a suitable time.',
    'Thank you.',
  ]
    .filter(Boolean)
    .join('\n');

const buildFollowUpMessage = (session: DemoSession): string =>
  [
    `Hi ${session.parentName},`,
    `Following up on ${session.childName}'s demo class.`,
    session.recommendedCourse ? `Recommended course: ${session.recommendedCourse}.` : '',
    session.recommendedClassType
      ? `Suggested format: ${session.recommendedClassType === 'one_to_one' ? '1:1' : 'Group'}.`
      : '',
    session.recommendedFrequency ? `Suggested frequency: ${session.recommendedFrequency}.` : '',
    session.followUpDate ? `Next follow-up date: ${session.followUpDate}.` : '',
    session.followUpCallStatus ? `Call status: ${formatFollowUpCallStatus(session.followUpCallStatus)}.` : '',
    session.admissionNotConfirmedReason
      ? `If not confirmed yet, reason noted: ${session.admissionNotConfirmedReason}.`
      : '',
    'Please let us know your preferred next step.',
    'Thank you.',
  ]
    .filter(Boolean)
    .join('\n');

const mapConversionToLeadStatus = (status: DemoConversionStatus | null): LeadStatus | null => {
  if (status === 'enrolled') return 'admitted_confirmed';
  if (status === 'interested' || status === 'follow_up_later') return 'admission_follow_up';
  if (status === 'not_interested') return 'not_interested';
  if (status === 'wrong_fit') return 'wrong_fit';
  if (status === 'no_response') return 'no_response';
  return null;
};

const getRowHighlightClass = (row: UnifiedRow): string => {
  if (isTerminalLifecycleStage(row.lifecycleStage)) {
    return row.lifecycleStage === 'admitted' ? 'bg-emerald-50/40' : 'bg-slate-50/70';
  }
  const { startMs, endMs } = dayRangeBounds();
  const followUpMs = getRowFollowUpMs(row);
  if (followUpMs && followUpMs < startMs) return 'bg-rose-50/40';
  if (followUpMs && followUpMs < endMs) return 'bg-amber-50/40';
  return '';
};

export default function LeadsInquiriesWorkspace({
  view = 'leads',
}: LeadsInquiriesWorkspaceProps) {
  const { toast } = useToast();
  const { user } = useAuthStore();
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [leadsPageSize, setLeadsPageSize] = useState<number>(5);
  const [isLeadsPageLoading, setIsLeadsPageLoading] = useState(false);
  const [demos, setDemos] = useState<DemoSession[]>([]);
  const [demoPhoneMap, setDemoPhoneMap] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [leadStatusFilter, setLeadStatusFilter] = useState<'all' | LeadStatus>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [courseFilter, setCourseFilter] = useState<string>('all');
  const [teacherFilter, setTeacherFilter] = useState<string>('all');
  const [updatedFromDate, setUpdatedFromDate] = useState<string>('');
  const [updatedToDate, setUpdatedToDate] = useState<string>('');
  const [appliedLeadStatusFilter, setAppliedLeadStatusFilter] = useState<'all' | LeadStatus>('all');
  const [appliedUpdatedFromDate, setAppliedUpdatedFromDate] = useState<string>('');
  const [appliedUpdatedToDate, setAppliedUpdatedToDate] = useState<string>('');
  const [summaryCardFilter, setSummaryCardFilter] = useState<SummaryCardFilter>('all');
  const [focusFilter, setFocusFilter] = useState<FocusFilter>(view === 'demos' ? 'all_demos' : 'all');
  const [savingConversionRowId, setSavingConversionRowId] = useState<string | null>(null);
  const [rowActionBusyKey, setRowActionBusyKey] = useState<string | null>(null);
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [leadDialogOpen, setLeadDialogOpen] = useState(false);
  const [leadEditTarget, setLeadEditTarget] = useState<LeadRecord | null>(null);
  const [leadForm, setLeadForm] = useState<LeadFormState>(buildInitialLeadForm());
  const [leadSaving, setLeadSaving] = useState(false);
  const [communicationsOpen, setCommunicationsOpen] = useState(false);
  const [communicationsTarget, setCommunicationsTarget] = useState<LeadRecord | null>(null);
  const [communications, setCommunications] = useState<LeadCommunication[]>([]);
  const [communicationsHistoryFilter, setCommunicationsHistoryFilter] =
    useState<CommunicationHistoryFilter>('all');
  const [communicationForm, setCommunicationForm] = useState<CommunicationFormState>(
    buildInitialCommunicationForm(),
  );
  const [communicationEditTarget, setCommunicationEditTarget] = useState<LeadCommunication | null>(null);
  const [savingCommunication, setSavingCommunication] = useState(false);
  const [whatsAppOpen, setWhatsAppOpen] = useState(false);
  const [whatsAppTarget, setWhatsAppTarget] = useState<LeadRecord | null>(null);
  const [whatsAppTemplate, setWhatsAppTemplate] = useState<WhatsAppTemplateKey>('first_response');
  const [whatsAppMessage, setWhatsAppMessage] = useState('');
  const [loggingWhatsApp, setLoggingWhatsApp] = useState(false);
  const [sendingWhatsAppApi, setSendingWhatsAppApi] = useState(false);
  const [demoRequestDialogOpen, setDemoRequestDialogOpen] = useState(false);
  const [demoRequestLeadId, setDemoRequestLeadId] = useState<string | null>(null);
  const [demoRequestForm, setDemoRequestForm] = useState<DemoRequestFormState>(buildInitialDemoRequestForm());
  const [creatingDemoRequest, setCreatingDemoRequest] = useState(false);
  const [editTarget, setEditTarget] = useState<UnifiedRow | null>(null);
  const [editForm, setEditForm] = useState<DemoEditFormState>(EMPTY_DEMO_EDIT_FORM);
  const [conversionTarget, setConversionTarget] = useState<UnifiedRow | null>(null);
  const [conversionStatus, setConversionStatus] = useState<string>('none');
  const [recommendedCourse, setRecommendedCourse] = useState('');
  const [recommendedClassType, setRecommendedClassType] = useState<string>('none');
  const [recommendedFrequency, setRecommendedFrequency] = useState('');
  const [feeDiscussed, setFeeDiscussed] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpCallStatus, setFollowUpCallStatus] = useState<string>('none');
  const [followUpCallCompletedAt, setFollowUpCallCompletedAt] = useState('');
  const [admissionNotConfirmedReason, setAdmissionNotConfirmedReason] = useState('');
  const [reassignTarget, setReassignTarget] = useState<UnifiedRow | null>(null);
  const [reassignTeacherId, setReassignTeacherId] = useState('');
  const [timelineViewTarget, setTimelineViewTarget] = useState<DemoSession | null>(null);
  const [dialogSavingAction, setDialogSavingAction] = useState<string | null>(null);

  useEffect(() => {
    setFocusFilter(view === 'demos' ? 'all_demos' : 'all');
  }, [view]);

  useEffect(() => {
    setIsLeadsPageLoading(true);
    const constraints: QueryConstraint[] = [];
    const updatedFromMs = parseDateOnlyMs(appliedUpdatedFromDate);
    const updatedToMs = parseDateOnlyMs(appliedUpdatedToDate);
    if (updatedFromMs) {
      constraints.push(where('createdAt', '>=', Timestamp.fromMillis(updatedFromMs)));
    }
    if (updatedToMs) {
      constraints.push(where('createdAt', '<', Timestamp.fromMillis(updatedToMs + DAY_MS)));
    }
    constraints.push(orderBy('createdAt', 'desc'));
    constraints.push(limit(leadsPageSize));
    const q = query(collection(db, LEADS_COLLECTION), ...constraints);
    const unsub = onSnapshot(
      q,
      (snap) => {
        const next = snap.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as Record<string, unknown>),
        })) as LeadRecord[];
        setLeads(next);
        setIsLeadsPageLoading(false);
      },
      (error) => {
        console.error('[LeadsInquiriesWorkspace] leads load failed', error);
        toast({
          title: 'Failed to load leads',
          description: error?.message || 'Please refresh.',
          variant: 'destructive',
        });
        setLeads([]);
        setIsLeadsPageLoading(false);
      },
    );
    return () => unsub();
  }, [
    appliedLeadStatusFilter,
    appliedUpdatedFromDate,
    appliedUpdatedToDate,
    leadsPageSize,
    toast,
  ]);

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
          description: error?.message || 'Please refresh.',
          variant: 'destructive',
        });
      },
    );
    return () => unsubscribe();
  }, [communicationsOpen, communicationsTarget?.id, toast]);

  useEffect(() => {
    const unsubDemos = listenAllDemoSessions(
      (rows) => setDemos(rows),
      (error) => {
        console.error('[LeadsInquiriesWorkspace] demos load failed', error);
        toast({
          title: 'Failed to load demo sessions',
          description: error?.message || 'Please refresh.',
          variant: 'destructive',
        });
      },
    );
    const unsubPhones = listenDemoSessionPrivatePhones(
      (map) => setDemoPhoneMap(map),
      (error) => {
        console.error('[LeadsInquiriesWorkspace] demo phones load failed', error);
      },
    );
    return () => {
      unsubDemos();
      unsubPhones();
    };
  }, [toast]);

  useEffect(() => {
    const teachersQuery = query(collection(db, 'users'), where('role', '==', 'teacher'));
    const unsubscribe = onSnapshot(
      teachersQuery,
      (teachersSnap) => {
        const options = teachersSnap.docs
          .map((docSnap) => {
            const data = docSnap.data() as {
              name?: string;
              displayName?: string;
              email?: string;
              status?: string;
              isDeleted?: boolean;
              archivedAt?: unknown;
              deletedAt?: unknown;
            };
            const status = normalizeText(data.status).toLowerCase();
            const isArchived = status === 'archived' || Boolean(data.archivedAt);
            const isDeleted = Boolean(data.isDeleted) || Boolean(data.deletedAt);
            if (isArchived || isDeleted) return null;
            const name = data.name || data.displayName || data.email || 'Teacher';
            return { id: docSnap.id, name };
          })
          .filter((option): option is TeacherOption => Boolean(option))
          .sort((a, b) => a.name.localeCompare(b.name));
        setTeachers(options);
      },
      (error: any) => {
        toast({
          title: 'Failed to load teachers',
          description: error?.message || 'Please refresh.',
          variant: 'destructive',
        });
      },
    );

    return unsubscribe;
  }, [toast]);

  const mergedRows = useMemo<UnifiedRow[]>(() => {
    const demoByLeadId = new Map<string, DemoSession>();
    const leadById = new Map<string, LeadRecord>();
    const rows: UnifiedRow[] = [];

    leads.forEach((lead) => {
      leadById.set(lead.id, lead);
    });

    demos.forEach((demo) => {
      const leadId = normalizeText((demo as any).leadId);
      if (!leadId) return;
      const existing = demoByLeadId.get(leadId);
      if (!existing || toMs(demo.lastUpdatedAt || demo.createdAt) > toMs(existing.lastUpdatedAt || existing.createdAt)) {
        demoByLeadId.set(leadId, demo);
      }
    });

    leads.forEach((lead) => {
      const linkedDemo =
        demoByLeadId.get(lead.id) ||
        (lead.demoSessionId ? demos.find((demo) => demo.id === lead.demoSessionId) || null : null);
      const parentName = normalizeText(linkedDemo?.parentName) || normalizeText(lead.parentName) || '—';
      const childName = normalizeText(linkedDemo?.childName) || normalizeText(lead.childName) || '—';
      const parentPhone =
        normalizeText(linkedDemo?.id ? demoPhoneMap[linkedDemo.id] : '') ||
        normalizeText(lead.primaryPhone) ||
        normalizeText(lead.phoneNormalized) ||
        '—';
      const source = normalizeText(linkedDemo?.source) || normalizeText(lead.source) || 'manual';
      const courseLabel =
        normalizeText(linkedDemo?.courseInterested) ||
        (normalizeText(lead.interestTrack)
          ? interestTrackToCourse(normalizeText(lead.interestTrack))
          : '—');
      const teacherName =
        normalizeText(linkedDemo?.assignedTeacherName) ||
        (normalizeText(linkedDemo?.assignedTeacherId) ? 'Assigned' : '—');
      const stage = deriveLifecycleStage(lead, linkedDemo || null);
      const updatedAtMs = Math.max(
        toMs(lead.updatedAt || lead.createdAt),
        toMs(linkedDemo?.lastUpdatedAt || linkedDemo?.createdAt),
      );
      rows.push({
        id: `lead_${lead.id}`,
        lead,
        demo: linkedDemo || null,
        lifecycleStage: stage,
        source,
        courseLabel,
        teacherName,
        nextFollowUpLabel: nextFollowUpLabel(lead, linkedDemo || null),
        updatedAtMs,
        parentName,
        childName,
        parentPhone,
      });
    });

    demos.forEach((demo) => {
      const leadId = normalizeText((demo as any).leadId);
      if (leadId && leadById.has(leadId)) return;
      const stage = deriveLifecycleStage(null, demo);
      rows.push({
        id: `demo_${demo.id}`,
        lead: null,
        demo,
        lifecycleStage: stage,
        source: normalizeText(demo.source) || 'manual',
        courseLabel: normalizeText(demo.courseInterested) || '—',
        teacherName:
          normalizeText(demo.assignedTeacherName) ||
          (normalizeText(demo.assignedTeacherId) ? 'Assigned' : '—'),
        nextFollowUpLabel: nextFollowUpLabel(null, demo),
        updatedAtMs: toMs(demo.lastUpdatedAt || demo.createdAt),
        parentName: normalizeText(demo.parentName) || '—',
        childName: normalizeText(demo.childName) || '—',
        parentPhone: normalizeText(demoPhoneMap[demo.id]) || '—',
      });
    });

    return rows.sort((a, b) => b.updatedAtMs - a.updatedAtMs);
  }, [demoPhoneMap, demos, leads]);

  const sourceOptions = useMemo(
    () =>
      Array.from(new Set(mergedRows.map((row) => normalizeText(row.source)).filter(Boolean)))
        .sort((a, b) => a.localeCompare(b)),
    [mergedRows],
  );

  const courseOptions = useMemo(
    () =>
      Array.from(new Set(mergedRows.map((row) => normalizeText(row.courseLabel)).filter(Boolean)))
        .sort((a, b) => a.localeCompare(b)),
    [mergedRows],
  );

  const teacherOptions = useMemo(
    () =>
      Array.from(
        new Set(
          mergedRows
            .map((row) => normalizeText(row.teacherName))
            .filter((name) => name && name !== '—' && name !== 'Assigned'),
        ),
      ).sort((a, b) => a.localeCompare(b)),
    [mergedRows],
  );

  const filteredCommunicationsHistory = useMemo(() => {
    if (communicationsHistoryFilter === 'all') return communications;
    if (communicationsHistoryFilter === 'whatsapp') {
      return communications.filter((item) => item.channel === 'whatsapp');
    }
    return communications.filter((item) => item.deliveryStatus === 'failed');
  }, [communications, communicationsHistoryFilter]);

  const filteredRows = useMemo(() => {
    const search = normalizeText(searchQuery).toLowerCase();
    const { startMs, endMs } = dayRangeBounds();
    const updatedFromMs = parseDateOnlyMs(appliedUpdatedFromDate);
    const updatedToMs = parseDateOnlyMs(appliedUpdatedToDate);
    return mergedRows.filter((row) => {
      const demoWorkflowState = resolveDemoWorkflowState(row.demo);
      if (summaryCardFilter !== 'all' && row.lifecycleStage !== summaryCardFilter) return false;
      if (stageFilter !== 'all' && row.lifecycleStage !== stageFilter) return false;
      if (appliedLeadStatusFilter !== 'all' && normalizeText(row.lead?.status) !== appliedLeadStatusFilter) {
        return false;
      }
      if (sourceFilter !== 'all' && normalizeText(row.source) !== sourceFilter) return false;
      if (courseFilter !== 'all' && normalizeText(row.courseLabel) !== courseFilter) return false;
      if (teacherFilter !== 'all' && normalizeText(row.teacherName) !== teacherFilter) return false;
      if (updatedFromMs && row.updatedAtMs < updatedFromMs) return false;
      if (updatedToMs && row.updatedAtMs >= updatedToMs + DAY_MS) return false;

      const followUpMs = getRowFollowUpMs(row);
      const hasFollowUp = followUpMs > 0;
      const isOverdue = hasFollowUp && followUpMs < startMs && !isTerminalLifecycleStage(row.lifecycleStage);
      const isDueToday = hasFollowUp && followUpMs >= startMs && followUpMs < endMs && !isTerminalLifecycleStage(row.lifecycleStage);
      const leadStatus = normalizeText(row.lead?.status).toLowerCase();
      const conversionStatus = normalizeText(row.demo?.conversionStatus).toLowerCase();

      if (focusFilter === 'due_today' && !isDueToday) return false;
      if (focusFilter === 'overdue' && !isOverdue) return false;
      if (focusFilter === 'no_demo' && Boolean(row.demo)) return false;
      if (focusFilter === 'all_demos' && !row.demo) return false;
      if (focusFilter === 'open' && demoWorkflowState !== 'open') return false;
      if (focusFilter === 'assigned' && demoWorkflowState !== 'assigned') return false;
      if (focusFilter === 'completed' && demoWorkflowState !== 'completed') return false;
      if (focusFilter === 'no_response' && leadStatus !== 'no_response' && conversionStatus !== 'no_response') return false;

      if (!search) return true;
      const haystack = [
        row.parentName,
        row.childName,
        row.parentPhone,
        row.source,
        row.courseLabel,
        row.teacherName,
        normalizeText(row.lead?.id),
        normalizeText(row.demo?.id),
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(search);
    });
  }, [
    appliedLeadStatusFilter,
    appliedUpdatedFromDate,
    appliedUpdatedToDate,
    courseFilter,
    focusFilter,
    mergedRows,
    searchQuery,
    sourceFilter,
    stageFilter,
    summaryCardFilter,
    teacherFilter,
  ]);

  const visibleRows = useMemo(() => filteredRows.slice(0, leadsPageSize), [filteredRows, leadsPageSize]);
  const conversionTeacherResponses = useMemo(
    () => getTeacherResponseItems(conversionTarget?.demo || null),
    [conversionTarget?.demo],
  );

  const summary = useMemo(() => {
    return mergedRows.reduce(
      (acc, row) => {
        acc.total += 1;
        if (row.lifecycleStage === 'enquiry') acc.enquiry += 1;
        if (row.lifecycleStage === 'demo_active') acc.demoActive += 1;
        if (row.lifecycleStage === 'admission_follow_up') acc.followUp += 1;
        if (row.lifecycleStage === 'admitted') acc.admitted += 1;
        if (row.lifecycleStage === 'lost') acc.lost += 1;
        return acc;
      },
      { total: 0, enquiry: 0, demoActive: 0, followUp: 0, admitted: 0, lost: 0 },
    );
  }, [mergedRows]);

  const demoSnapshot = useMemo(() => {
    const summary = { open: 0, assigned: 0, completed: 0 };
    const teacherCountMap = new Map<string, number>();
    demos.forEach((demo) => {
      const state = resolveDemoWorkflowState(demo);
      if (!state) return;
      if (state === 'open') summary.open += 1;
      if (state === 'assigned') summary.assigned += 1;
      if (state === 'completed') summary.completed += 1;

      if (state === 'assigned' || state === 'completed') {
        const teacherName = normalizeText((demo as any).assignedTeacherName) || normalizeText((demo as any).teacherName);
        if (teacherName) {
          teacherCountMap.set(teacherName, (teacherCountMap.get(teacherName) || 0) + 1);
        }
      }
    });
    const teacherWise = Array.from(teacherCountMap.entries()).sort((a, b) => b[1] - a[1]);
    return { ...summary, teacherWise };
  }, [demos]);

  const focusCounts = useMemo<Record<FocusFilter, number>>(() => {
    const counts: Record<FocusFilter, number> = {
      all: 0,
      due_today: 0,
      overdue: 0,
      no_demo: 0,
      all_demos: 0,
      open: 0,
      assigned: 0,
      completed: 0,
      no_response: 0,
    };
    const { startMs, endMs } = dayRangeBounds();
    mergedRows.forEach((row) => {
      counts.all += 1;
      const demoWorkflowState = resolveDemoWorkflowState(row.demo);
      const followUpMs = getRowFollowUpMs(row);
      const hasFollowUp = followUpMs > 0;
      const isOverdue = hasFollowUp && followUpMs < startMs && !isTerminalLifecycleStage(row.lifecycleStage);
      const isDueToday = hasFollowUp && followUpMs >= startMs && followUpMs < endMs && !isTerminalLifecycleStage(row.lifecycleStage);
      const leadStatus = normalizeText(row.lead?.status).toLowerCase();
      const conversionStatus = normalizeText(row.demo?.conversionStatus).toLowerCase();

      if (isDueToday) counts.due_today += 1;
      if (isOverdue) counts.overdue += 1;
      if (!row.demo) counts.no_demo += 1;
      if (row.demo) counts.all_demos += 1;
      if (demoWorkflowState === 'open') counts.open += 1;
      if (demoWorkflowState === 'assigned') counts.assigned += 1;
      if (demoWorkflowState === 'completed') counts.completed += 1;
      if (leadStatus === 'no_response' || conversionStatus === 'no_response') counts.no_response += 1;
    });
    return counts;
  }, [mergedRows]);

  const focusChips: Array<{ key: FocusFilter; label: string }> = [
    { key: 'all', label: 'All' },
    { key: 'due_today', label: 'Due Today' },
    { key: 'overdue', label: 'Overdue' },
    { key: 'no_demo', label: 'No Demo' },
    { key: 'all_demos', label: 'Demo Linked' },
    { key: 'open', label: 'Open' },
    { key: 'assigned', label: 'Assigned' },
    { key: 'completed', label: 'Completed' },
    { key: 'no_response', label: 'No Response' },
  ];

  const toggleSummaryCard = (next: SummaryCardFilter) => {
    setSummaryCardFilter((current) => (current === next || next === 'all' ? 'all' : next));
  };

  const handleLeadsPageSizeChange = (value: string) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return;
    setLeadsPageSize(parsed);
  };

  const handleCreateDemoRequest = () => {
    setDemoRequestLeadId(null);
    setDemoRequestForm(buildInitialDemoRequestForm());
    setDemoRequestDialogOpen(true);
  };

  const openLeadDialog = (lead?: LeadRecord | null) => {
    if (lead) {
      setLeadEditTarget(lead);
      setLeadForm({
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
    } else {
      setLeadEditTarget(null);
      setLeadForm(buildInitialLeadForm());
    }
    setLeadDialogOpen(true);
  };

  const setLeadField = <K extends keyof LeadFormState>(field: K, value: LeadFormState[K]) => {
    setLeadForm((prev) => ({ ...prev, [field]: value }));
  };

  const buildLeadPayload = () => {
    const parsedChildAge = leadForm.childAge.trim() ? Number(leadForm.childAge.trim()) : null;
    if (leadForm.childAge.trim() && Number.isNaN(parsedChildAge)) {
      throw new Error('Child age must be a valid number');
    }

    const tags = leadForm.tagsText
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    return {
      parentName: leadForm.parentName.trim(),
      primaryPhone: leadForm.primaryPhone.trim(),
      phoneNormalized: normalizePhone(leadForm.primaryPhone),
      parentEmail: leadForm.parentEmail.trim() || null,
      childName: leadForm.childName.trim() || null,
      childAge: parsedChildAge,
      childGrade: leadForm.childGrade.trim() || null,
      interestTrack: leadForm.interestTrack,
      source: leadForm.source,
      sourceDetail: leadForm.sourceDetail.trim() || null,
      country: leadForm.country.trim() || null,
      timezone: leadForm.timezone.trim() || null,
      preferredTimingText: leadForm.preferredTimingText.trim() || null,
      initialMessageSnippet: leadForm.initialMessageSnippet.trim() || null,
      status: leadForm.status,
      ownerUserId: user?.uid || null,
      ownerRole: user?.role || 'admin',
      priority: leadForm.priority.trim() || 'normal',
      nextFollowUpAt: dateInputToTimestamp(leadForm.nextFollowUpDate),
      notes: leadForm.notes.trim() || null,
      tags: tags.length ? tags : [],
      demoSessionId: leadEditTarget?.demoSessionId || null,
      enrollmentId: leadEditTarget?.enrollmentId || null,
      updatedAt: serverTimestamp(),
      updatedBy: user?.uid || null,
    };
  };

  const handleSaveLead = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user?.uid) {
      toast({ title: 'Admin session required', variant: 'destructive' });
      return;
    }
    if (!leadForm.parentName.trim() || !leadForm.primaryPhone.trim()) {
      toast({
        title: 'Missing required fields',
        description: 'Parent name and primary phone are required.',
        variant: 'destructive',
      });
      return;
    }

    setLeadSaving(true);
    try {
      const payload = buildLeadPayload();
      if (leadEditTarget) {
        await updateDoc(doc(db, LEADS_COLLECTION, leadEditTarget.id), payload);
        toast({ title: 'Lead updated' });
      } else {
        await addDoc(collection(db, LEADS_COLLECTION), {
          ...payload,
          createdAt: serverTimestamp(),
          createdBy: user.uid,
        });
        toast({ title: 'Lead created' });
      }
      setLeadDialogOpen(false);
      setLeadEditTarget(null);
      setLeadForm(buildInitialLeadForm());
    } catch (error: any) {
      toast({
        title: 'Unable to save lead',
        description: error?.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLeadSaving(false);
    }
  };

  const openCommunicationsDialog = (lead: LeadRecord, preset?: CommunicationPresetKey) => {
    setCommunicationsTarget(lead);
    setCommunicationsOpen(true);
    setCommunicationsHistoryFilter('all');
    setCommunicationEditTarget(null);
    setCommunicationForm(preset ? buildCommunicationFormFromPreset(preset) : buildInitialCommunicationForm());
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
        await addDoc(collection(db, LEADS_COLLECTION, communicationsTarget.id, LEAD_COMMUNICATIONS_COLLECTION), {
          ...basePayload,
          createdAt: serverTimestamp(),
          createdBy: user.uid,
        });
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

    window.open(buildWhatsAppUrl(phone, message), '_blank', 'noopener,noreferrer');
  };

  const handleOpenWhatsAppAndLog = async () => {
    if (!user?.uid || !whatsAppTarget) {
      toast({ title: 'Admin session required', variant: 'destructive' });
      return;
    }
    const phone = getWhatsAppPhone(whatsAppTarget);
    const message = whatsAppMessage.trim();
    if (!phone || !message) {
      toast({
        title: 'Message or phone missing',
        description: 'Make sure both phone and message are available.',
        variant: 'destructive',
      });
      return;
    }

    setLoggingWhatsApp(true);
    try {
      await addDoc(collection(db, LEADS_COLLECTION, whatsAppTarget.id, LEAD_COMMUNICATIONS_COLLECTION), {
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
      });

      await updateDoc(doc(db, LEADS_COLLECTION, whatsAppTarget.id), {
        lastContactAt: serverTimestamp(),
        lastOutboundAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        updatedBy: user.uid,
      });

      window.open(buildWhatsAppUrl(phone, message), '_blank', 'noopener,noreferrer');
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

      await sendTemplate({ leadId: whatsAppTarget.id, templateKey: whatsAppTemplate });
      toast({ title: 'WhatsApp template sent via API' });
    } catch (error: any) {
      const message = String(error?.message || '').toLowerCase();
      const isConfigError =
        message.includes('not configured') ||
        message.includes('failed-precondition') ||
        message.includes('secret');

      toast({
        title: isConfigError ? 'WhatsApp API not configured' : 'Failed to send WhatsApp template',
        description: isConfigError
          ? 'WhatsApp API is not configured yet. You can still use the manual WhatsApp options.'
          : error?.message || 'Please try again. Manual WhatsApp options are still available.',
        variant: 'destructive',
      });
    } finally {
      setSendingWhatsAppApi(false);
    }
  };

  const setDemoRequestField = <K extends keyof DemoRequestFormState>(
    field: K,
    value: DemoRequestFormState[K],
  ) => {
    setDemoRequestForm((prev) => ({ ...prev, [field]: value }));
  };

  const openCreateDemoFromLead = (lead: LeadRecord) => {
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
    setDemoRequestLeadId(lead.id);
    setDemoRequestForm(buildDemoRequestFormFromLead(lead));
    setDemoRequestDialogOpen(true);
  };

  const handleCreateDemoRequestSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user?.uid) {
      toast({ title: 'Admin session required', variant: 'destructive' });
      return;
    }

    const parsedChildAge = demoRequestForm.childAge.trim()
      ? Number(demoRequestForm.childAge.trim())
      : null;
    const parentPhone = buildPhoneFromParts(
      demoRequestForm.parentPhoneCountryCode,
      demoRequestForm.parentPhoneLocal,
    );

    if (demoRequestForm.childAge.trim() && Number.isNaN(parsedChildAge)) {
      toast({
        title: 'Invalid child age',
        description: 'Child age must be a valid number.',
        variant: 'destructive',
      });
      return;
    }
    if (
      !demoRequestForm.parentName.trim() ||
      !parentPhone ||
      !demoRequestForm.childName.trim() ||
      !demoRequestForm.childGrade.trim() ||
      !demoRequestForm.courseInterested.trim() ||
      !demoRequestForm.preferredDateTimeText.trim()
    ) {
      toast({
        title: 'Missing required fields',
        description: 'Please fill all required demo request fields.',
        variant: 'destructive',
      });
      return;
    }

    let forceCreate = false;
    try {
      const conflictResult = await checkDemoPhoneConflicts(parentPhone);
      if (conflictResult.hasConflicts) {
        const warningLines = [
          'This phone number already exists in the system.',
          '',
          `Demo requests: ${conflictResult.counts.demoRequests}`,
          `Leads/Inquiries: ${conflictResult.counts.leads}`,
          `Parent profiles: ${conflictResult.counts.parentProfiles}`,
          `Enrollments: ${conflictResult.counts.enrollments}`,
          '',
          'Please double-check before creating another demo request.',
          'Press OK to proceed, or Cancel to review existing records.',
        ];
        const proceed = window.confirm(warningLines.join('\n'));
        if (!proceed) return;
        forceCreate = true;
      }
    } catch (error: any) {
      toast({
        title: 'Unable to verify existing phone records',
        description: error?.message || 'Please try again before creating this demo request.',
        variant: 'destructive',
      });
      return;
    }

    setCreatingDemoRequest(true);
    try {
      const demoId = await createDemoSession(
        {
          parentName: demoRequestForm.parentName.trim(),
          parentPhone,
          forceCreate,
          childName: demoRequestForm.childName.trim(),
          childGrade: demoRequestForm.childGrade.trim(),
          childAge: parsedChildAge,
          courseInterested: demoRequestForm.courseInterested.trim(),
          source: demoRequestForm.source.trim() || null,
          demoMode: demoRequestForm.demoMode.trim() || null,
          preferredDateTimeText: demoRequestForm.preferredDateTimeText.trim(),
          requestReceivedDate: demoRequestForm.requestReceivedDate.trim() || null,
          timezone: demoRequestForm.timezone.trim() || null,
          adminNotes: demoRequestForm.adminNotes.trim() || null,
          leadId: demoRequestLeadId,
        },
        user.uid,
      );

      if (demoRequestLeadId) {
        const linkedLead = leads.find((lead) => lead.id === demoRequestLeadId);
        const linkedLeadStatus = normalizeText(linkedLead?.status).toLowerCase() as LeadStatus;
        const nextLeadStatus: LeadStatus = TERMINAL_DEMO_BLOCK_LEAD_STATUSES.has(linkedLeadStatus)
          ? linkedLeadStatus
          : 'demo_booked';
        await updateDoc(doc(db, LEADS_COLLECTION, demoRequestLeadId), {
          demoSessionId: demoId,
          status: nextLeadStatus,
          updatedAt: serverTimestamp(),
          updatedBy: user.uid,
        });
      }

      setDemoRequestDialogOpen(false);
      setDemoRequestLeadId(null);
      setDemoRequestForm(buildInitialDemoRequestForm());
      toast({ title: 'Demo request created' });
    } catch (error: any) {
      toast({
        title: 'Failed to create demo request',
        description: error?.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setCreatingDemoRequest(false);
    }
  };

  const resetFilters = () => {
    setSearchQuery('');
    setStageFilter('all');
    setLeadStatusFilter('all');
    setSourceFilter('all');
    setCourseFilter('all');
    setTeacherFilter('all');
    setUpdatedFromDate('');
    setUpdatedToDate('');
    setAppliedLeadStatusFilter('all');
    setAppliedUpdatedFromDate('');
    setAppliedUpdatedToDate('');
    setSummaryCardFilter('all');
    setFocusFilter(view === 'demos' ? 'all_demos' : 'all');
  };

  const applyServerFilters = () => {
    const fromMs = parseDateOnlyMs(updatedFromDate);
    const toMs = parseDateOnlyMs(updatedToDate);
    if (fromMs && toMs && fromMs > toMs) {
      toast({
        title: 'Invalid date range',
        description: 'Updated From cannot be after Updated To.',
        variant: 'destructive',
      });
      return;
    }
    setAppliedLeadStatusFilter(leadStatusFilter);
    setAppliedUpdatedFromDate(updatedFromDate);
    setAppliedUpdatedToDate(updatedToDate);
  };

  const openEditDialog = (row: UnifiedRow) => {
    if (!row.demo) return;
    setEditTarget(row);
    setEditForm(buildDemoEditForm(row.demo, row.parentPhone));
  };

  const openConversionDialog = (row: UnifiedRow) => {
    if (!row.demo) return;
    setConversionTarget(row);
    setConversionStatus(row.demo.conversionStatus || 'none');
    setRecommendedCourse(row.demo.recommendedCourse || '');
    setRecommendedClassType(row.demo.recommendedClassType || 'none');
    setRecommendedFrequency(row.demo.recommendedFrequency || '');
    setFeeDiscussed(row.demo.feeDiscussed || '');
    setFollowUpDate(row.demo.followUpDate || '');
    setFollowUpCallStatus(row.demo.followUpCallStatus || 'none');
    setFollowUpCallCompletedAt(row.demo.followUpCallCompletedAt || '');
    setAdmissionNotConfirmedReason(row.demo.admissionNotConfirmedReason || row.demo.teacherRemarks || '');
  };

  const openReassignDialog = (row: UnifiedRow) => {
    if (!row.demo) return;
    setReassignTarget(row);
    setReassignTeacherId(row.demo.assignedTeacherId || '');
  };

  const handleCopyPhone = async (row: UnifiedRow) => {
    const parentPhone = normalizeText(row.parentPhone);
    if (!parentPhone || parentPhone === '—') {
      toast({
        title: 'Phone not available',
        description: 'No parent phone is stored for this record.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await copyText(parentPhone);
      toast({ title: 'Phone copied' });
    } catch (error: any) {
      toast({
        title: 'Failed to copy phone',
        description: error?.message || 'Please copy manually.',
        variant: 'destructive',
      });
    }
  };

  const handleCopySummary = async (row: UnifiedRow) => {
    if (!row.demo) return;
    try {
      await copyText(buildDemoSummary(row.demo, row.parentPhone));
      toast({ title: 'Demo summary copied' });
    } catch (error: any) {
      toast({
        title: 'Failed to copy summary',
        description: error?.message || 'Please copy manually.',
        variant: 'destructive',
      });
    }
  };

  const handleCopyFollowUpMessage = async (row: UnifiedRow) => {
    if (!row.demo) return;
    try {
      await copyText(buildFollowUpMessage(row.demo));
      toast({ title: 'Follow-up message copied' });
    } catch (error: any) {
      toast({
        title: 'Failed to copy follow-up message',
        description: error?.message || 'Please copy manually.',
        variant: 'destructive',
      });
    }
  };

  const handleOpenWhatsApp = (row: UnifiedRow) => {
    const cleanedPhone = sanitizePhoneForWhatsApp(row.parentPhone);
    if (!cleanedPhone) {
      toast({
        title: 'Invalid phone number',
        description: 'Unable to open WhatsApp for this phone number.',
        variant: 'destructive',
      });
      return;
    }

    const url = row.demo
      ? `https://wa.me/${cleanedPhone}?text=${encodeURIComponent(buildWhatsappMessage(row.demo))}`
      : `https://wa.me/${cleanedPhone}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleCopyWhatsAppMessage = async () => {
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
      await copyText(message);
      toast({ title: 'Message copied' });
    } catch (error: any) {
      toast({
        title: 'Copy failed',
        description: error?.message || 'Please copy manually.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteDemo = async (row: UnifiedRow) => {
    if (!row.demo) return;
    const shouldDelete = window.confirm(
      `Delete demo for ${row.childName} (${row.parentName})? This permanently removes demo data and linked teacher demo earnings.`,
    );
    if (!shouldDelete) return;

    setRowActionBusyKey(`delete:${row.id}`);
    try {
      await deleteDemoSession({ demoId: row.demo.id });
      toast({ title: 'Demo deleted' });
    } catch (error: any) {
      toast({
        title: 'Failed to delete demo',
        description: error?.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setRowActionBusyKey(null);
    }
  };

  const isBusyFor = (row: UnifiedRow, action: string) => rowActionBusyKey === `${action}:${row.id}`;

  const handleQuickCreateDemo = (row: UnifiedRow) => {
    if (!row.lead || row.demo) return;
    openCreateDemoFromLead(row.lead);
  };

  const handleMarkEnrolled = async (row: UnifiedRow) => {
    if (!row.demo) return;
    const confirmed = window.confirm(`Mark this demo as Enrolled for ${row.childName}?`);
    if (!confirmed) return;

    setSavingConversionRowId(row.id);
    try {
      await updateDemoConversion({
        demoId: row.demo.id,
        conversionStatus: 'enrolled',
      });
      if (row.lead?.id && user?.uid) {
        await updateDoc(doc(db, LEADS_COLLECTION, row.lead.id), {
          status: 'admitted_confirmed',
          updatedAt: Timestamp.now(),
          updatedBy: user.uid,
        });
      }
      toast({ title: 'Marked as enrolled' });
    } catch (error: any) {
      toast({
        title: 'Failed to update conversion',
        description: error?.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSavingConversionRowId(null);
    }
  };

  const handleSetFollowUp = async (row: UnifiedRow) => {
    if (!row.demo) return;
    const confirmed = window.confirm(`Move ${row.childName} to Admission Follow-up?`);
    if (!confirmed) return;

    setRowActionBusyKey(`follow_up:${row.id}`);
    try {
      await updateDemoConversion({
        demoId: row.demo.id,
        conversionStatus: 'follow_up_later',
      });
      if (row.lead?.id && user?.uid) {
        await updateDoc(doc(db, LEADS_COLLECTION, row.lead.id), {
          status: 'admission_follow_up',
          updatedAt: Timestamp.now(),
          updatedBy: user.uid,
        });
      }
      toast({ title: 'Moved to admission follow-up' });
    } catch (error: any) {
      toast({
        title: 'Failed to update follow-up',
        description: error?.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setRowActionBusyKey(null);
    }
  };

  const handleMarkLost = async (row: UnifiedRow) => {
    if (!row.demo) return;
    const confirmed = window.confirm(`Mark ${row.childName} as Not Interested / Lost?`);
    if (!confirmed) return;

    setRowActionBusyKey(`lost:${row.id}`);
    try {
      await updateDemoConversion({
        demoId: row.demo.id,
        conversionStatus: 'not_interested',
      });
      if (row.lead?.id && user?.uid) {
        await updateDoc(doc(db, LEADS_COLLECTION, row.lead.id), {
          status: 'not_interested',
          updatedAt: Timestamp.now(),
          updatedBy: user.uid,
        });
      }
      toast({ title: 'Marked as lost' });
    } catch (error: any) {
      toast({
        title: 'Failed to mark as lost',
        description: error?.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setRowActionBusyKey(null);
    }
  };

  const handleCancelDemo = async (row: UnifiedRow) => {
    if (!row.demo) return;
    const confirmed = window.confirm(`Cancel demo for ${row.childName}?`);
    if (!confirmed) return;
    setRowActionBusyKey(`cancel:${row.id}`);
    try {
      await cancelDemoSession({ demoId: row.demo.id });
      toast({ title: 'Demo cancelled' });
    } catch (error: any) {
      toast({
        title: 'Failed to cancel demo',
        description: error?.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setRowActionBusyKey(null);
    }
  };

  const handleReleaseDemo = async (row: UnifiedRow) => {
    if (!row.demo) return;
    const confirmed = window.confirm(`Release demo for ${row.childName} back to open pool?`);
    if (!confirmed) return;
    setRowActionBusyKey(`release:${row.id}`);
    try {
      await releaseDemoSession({ demoId: row.demo.id });
      toast({ title: 'Demo released to open pool' });
    } catch (error: any) {
      toast({
        title: 'Failed to release demo',
        description: error?.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setRowActionBusyKey(null);
    }
  };

  const handleReopenDemo = async (row: UnifiedRow) => {
    if (!row.demo) return;
    const confirmed = window.confirm(`Reopen demo for ${row.childName} to Open state?`);
    if (!confirmed) return;
    setRowActionBusyKey(`reopen:${row.id}`);
    try {
      await reopenDemoSession({ demoId: row.demo.id });
      toast({ title: 'Demo reopened to open state' });
    } catch (error: any) {
      toast({
        title: 'Failed to reopen demo',
        description: error?.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setRowActionBusyKey(null);
    }
  };

  const handleSaveEdit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editTarget?.demo) return;

    const normalizedAge = editForm.childAge.trim();
    const parsedAge = normalizedAge ? Number(normalizedAge) : null;
    if (normalizedAge && Number.isNaN(parsedAge)) {
      toast({
        title: 'Invalid child age',
        description: 'Child age must be a number.',
        variant: 'destructive',
      });
      return;
    }

    if (
      !editForm.parentName.trim() ||
      !editForm.parentPhone.trim() ||
      !editForm.childName.trim() ||
      !editForm.childGrade.trim() ||
      !editForm.courseInterested.trim() ||
      !editForm.requestReceivedDate.trim() ||
      !editForm.preferredDateTimeText.trim()
    ) {
      toast({
        title: 'Missing required fields',
        description: 'Please fill all required fields before saving.',
        variant: 'destructive',
      });
      return;
    }

    setDialogSavingAction(`edit:${editTarget.demo.id}`);
    try {
      await updateDemoSessionAdminDetails({
        demoId: editTarget.demo.id,
        parentName: editForm.parentName.trim(),
        parentPhone: editForm.parentPhone.trim(),
        childName: editForm.childName.trim(),
        childGrade: editForm.childGrade.trim(),
        childAge: parsedAge,
        courseInterested: editForm.courseInterested.trim(),
        source: editForm.source.trim() || null,
        demoMode: editForm.demoMode.trim() || null,
        requestReceivedDate: editForm.requestReceivedDate.trim() || null,
        preferredDateTimeText: editForm.preferredDateTimeText.trim(),
        timezone: editForm.timezone.trim() || null,
        adminNotes: editForm.adminNotes.trim() || null,
      });
      setEditTarget(null);
      toast({ title: 'Demo details updated' });
    } catch (error: any) {
      const isDuplicate =
        error?.code === 'already-exists' || String(error?.message || '').includes('already exists');
      toast({
        title: isDuplicate ? 'Duplicate demo detected' : 'Failed to update demo details',
        description:
          error?.message ||
          (isDuplicate
            ? 'A demo with the same child name and parent phone already exists.'
            : 'Please try again.'),
        variant: 'destructive',
      });
    } finally {
      setDialogSavingAction(null);
    }
  };

  const handleSaveConversion = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!conversionTarget?.demo) return;

    const nextConversionStatus =
      conversionStatus === 'none' ? null : (conversionStatus as DemoConversionStatus);

    setDialogSavingAction(`conversion:${conversionTarget.demo.id}`);
    try {
      await updateDemoConversion({
        demoId: conversionTarget.demo.id,
        conversionStatus: nextConversionStatus,
        recommendedCourse: recommendedCourse.trim() || null,
        recommendedClassType:
          recommendedClassType === 'none' ? null : (recommendedClassType as DemoClassType),
        recommendedFrequency: recommendedFrequency.trim() || null,
        feeDiscussed: feeDiscussed.trim() || null,
        followUpDate: followUpDate || null,
        followUpCallStatus:
          followUpCallStatus === 'none' ? null : (followUpCallStatus as DemoFollowUpCallStatus),
        followUpCallCompletedAt: followUpCallCompletedAt || null,
        admissionNotConfirmedReason: admissionNotConfirmedReason.trim() || null,
      });

      const mappedLeadStatus = mapConversionToLeadStatus(nextConversionStatus);
      if (mappedLeadStatus && conversionTarget.lead?.id && user?.uid) {
        await updateDoc(doc(db, LEADS_COLLECTION, conversionTarget.lead.id), {
          status: mappedLeadStatus,
          updatedAt: Timestamp.now(),
          updatedBy: user.uid,
        });
      }

      setConversionTarget(null);
      toast({ title: 'Follow-up updated' });
    } catch (error: any) {
      toast({
        title: 'Failed to update follow-up',
        description: error?.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setDialogSavingAction(null);
    }
  };

  const handleReassign = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!reassignTarget?.demo || !reassignTeacherId) {
      toast({
        title: 'Select a teacher',
        description: 'Please choose a teacher for reassignment.',
        variant: 'destructive',
      });
      return;
    }

    const selectedTeacher = teachers.find((teacher) => teacher.id === reassignTeacherId);
    const isAssigningOpenDemo = normalizeDemoStatus(reassignTarget.demo.status) === 'open';
    setDialogSavingAction(`reassign:${reassignTarget.demo.id}`);
    try {
      await reassignDemoSession({
        demoId: reassignTarget.demo.id,
        assignedTeacherId: reassignTeacherId,
        assignedTeacherName: selectedTeacher?.name,
      });
      setReassignTarget(null);
      toast({ title: isAssigningOpenDemo ? 'Demo assigned' : 'Demo reassigned' });
    } catch (error: any) {
      toast({
        title: isAssigningOpenDemo ? 'Failed to assign demo' : 'Failed to reassign demo',
        description: error?.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setDialogSavingAction(null);
    }
  };

  return (
    <div className="space-y-2">
      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold">Leads &amp; Inquiries</h3>
            <p className="text-sm text-muted-foreground">
              Unified enquiry-to-admission operations console.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" size="sm" variant="outline" onClick={() => openLeadDialog()}>
              Add Lead
            </Button>
            <Button type="button" size="sm" onClick={handleCreateDemoRequest}>
              Create Demo Request
            </Button>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <button
            type="button"
            onClick={() => toggleSummaryCard('all')}
            className={`rounded-md border p-3 text-left transition-colors ${
              summaryCardFilter === 'all' ? 'border-primary bg-primary/5' : 'hover:bg-slate-50 dark:hover:bg-slate-900'
            }`}
          >
            <div className="text-xs text-muted-foreground">Total Records</div>
            <div className="text-xl font-semibold">{summary.total}</div>
          </button>
          <button
            type="button"
            onClick={() => toggleSummaryCard('enquiry')}
            className={`rounded-md border p-3 text-left transition-colors ${
              summaryCardFilter === 'enquiry' ? 'border-primary bg-primary/5' : 'hover:bg-slate-50 dark:hover:bg-slate-900'
            }`}
          >
            <div className="text-xs text-muted-foreground">Enquiries</div>
            <div className="text-xl font-semibold">{summary.enquiry}</div>
          </button>
          <button
            type="button"
            onClick={() => toggleSummaryCard('demo_active')}
            className={`rounded-md border p-3 text-left transition-colors ${
              summaryCardFilter === 'demo_active' ? 'border-primary bg-primary/5' : 'hover:bg-slate-50 dark:hover:bg-slate-900'
            }`}
          >
            <div className="text-xs text-muted-foreground">Demo In Progress</div>
            <div className="text-xl font-semibold">{summary.demoActive}</div>
          </button>
          <button
            type="button"
            onClick={() => toggleSummaryCard('admission_follow_up')}
            className={`rounded-md border p-3 text-left transition-colors ${
              summaryCardFilter === 'admission_follow_up'
                ? 'border-primary bg-primary/5'
                : 'hover:bg-slate-50 dark:hover:bg-slate-900'
            }`}
          >
            <div className="text-xs text-muted-foreground">Admission Follow-up</div>
            <div className="text-xl font-semibold">{summary.followUp}</div>
          </button>
          <button
            type="button"
            onClick={() => toggleSummaryCard('admitted')}
            className={`rounded-md border p-3 text-left transition-colors ${
              summaryCardFilter === 'admitted' ? 'border-primary bg-primary/5' : 'hover:bg-slate-50 dark:hover:bg-slate-900'
            }`}
          >
            <div className="text-xs text-muted-foreground">Admitted</div>
            <div className="text-xl font-semibold">{summary.admitted}</div>
          </button>
          <button
            type="button"
            onClick={() => toggleSummaryCard('lost')}
            className={`rounded-md border p-3 text-left transition-colors ${
              summaryCardFilter === 'lost' ? 'border-primary bg-primary/5' : 'hover:bg-slate-50 dark:hover:bg-slate-900'
            }`}
          >
            <div className="text-xs text-muted-foreground">Lost</div>
            <div className="text-xl font-semibold">{summary.lost}</div>
          </button>
        </div>
        <div className="mt-4">
          <div className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Operational Focus
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {focusChips.map((chip) => (
              <Button
                key={chip.key}
                type="button"
                size="sm"
                variant={focusFilter === chip.key ? 'default' : 'outline'}
                onClick={() => setFocusFilter(chip.key)}
              >
                {chip.label} {focusCounts[chip.key]}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      <Card className="p-4">
        {view === 'demos' ? (
          <div className="mb-4 rounded-md border bg-slate-50/60 p-3">
            <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Demo Ops Snapshot</div>
            <div className="text-xs text-muted-foreground">
              Teacher-wise demos (assigned + completed):
            </div>
            <div className="mt-1 flex flex-wrap gap-2">
              {demoSnapshot.teacherWise.length === 0 ? (
                <span className="text-xs text-muted-foreground">No assigned/completed demos yet.</span>
              ) : (
                demoSnapshot.teacherWise.map(([teacherName, count]) => (
                  <Badge key={teacherName} variant="outline">
                    {teacherName}: {count}
                  </Badge>
                ))
              )}
            </div>
          </div>
        ) : null}

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-9">
          <div className="xl:col-span-2">
            <Label htmlFor="workflow-search">Search</Label>
            <Input
              id="workflow-search"
              placeholder="Parent, child, phone, lead ID, demo ID"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </div>
          <div>
            <Label>Lifecycle Stage</Label>
            <Select value={stageFilter} onValueChange={setStageFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All stages" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All stages</SelectItem>
                <SelectItem value="enquiry">Enquiry</SelectItem>
                <SelectItem value="demo_active">Demo In Progress</SelectItem>
                <SelectItem value="demo_completed">Demo Completed</SelectItem>
                <SelectItem value="admission_follow_up">Admission Follow-up</SelectItem>
                <SelectItem value="admitted">Admitted</SelectItem>
                <SelectItem value="lost">Lost</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Lead Status</Label>
            <Select value={leadStatusFilter} onValueChange={(value) => setLeadStatusFilter(value as 'all' | LeadStatus)}>
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
          <div>
            <Label>Source</Label>
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All sources" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All sources</SelectItem>
                {sourceOptions.map((source) => (
                  <SelectItem key={source} value={source}>
                    {source}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Course / Track</Label>
            <Select value={courseFilter} onValueChange={setCourseFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All courses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All courses</SelectItem>
                {courseOptions.map((course) => (
                  <SelectItem key={course} value={course}>
                    {course}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Assigned Teacher</Label>
            <Select value={teacherFilter} onValueChange={setTeacherFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All teachers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All teachers</SelectItem>
                {teacherOptions.map((teacherName) => (
                  <SelectItem key={teacherName} value={teacherName}>
                    {teacherName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="workflow-updated-from">Updated From</Label>
            <Input
              id="workflow-updated-from"
              type="date"
              value={updatedFromDate}
              max={updatedToDate || undefined}
              onChange={(event) => setUpdatedFromDate(event.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="workflow-updated-to">Updated To</Label>
            <Input
              id="workflow-updated-to"
              type="date"
              value={updatedToDate}
              min={updatedFromDate || undefined}
              onChange={(event) => setUpdatedToDate(event.target.value)}
            />
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button type="button" size="sm" onClick={applyServerFilters}>
            Apply filters
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={resetFilters}>
            Clear filters
          </Button>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="border-b bg-slate-50/70 px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-sm font-semibold text-slate-900">Live workflow records</div>
              <div className="text-xs text-muted-foreground">
                {visibleRows.length} of {filteredRows.length} records visible with current filters.
                {` Top ${leadsPageSize} shown`}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              {view === 'demos' ? (
                <>
                  <Badge variant="outline">Open demos {demoSnapshot.open}</Badge>
                  <Badge variant="outline">Assigned {demoSnapshot.assigned}</Badge>
                  <Badge variant="outline">Completed {demoSnapshot.completed}</Badge>
                </>
              ) : null}
              <div className="ml-2 flex items-center gap-2">
                <Select value={String(leadsPageSize)} onValueChange={handleLeadsPageSizeChange}>
                  <SelectTrigger className="h-8 w-[92px]">
                    <SelectValue placeholder={`${leadsPageSize} / page`} />
                  </SelectTrigger>
                  <SelectContent>
                    {LEADS_PAGE_SIZE_OPTIONS.map((size) => (
                      <SelectItem key={size} value={String(size)}>
                        {size} / page
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
        {isLeadsPageLoading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Loading latest leads...
          </div>
        ) : visibleRows.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No workflow records found for current filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Parent</TableHead>
                  <TableHead>Child</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Course / Track</TableHead>
                  <TableHead>Lifecycle</TableHead>
                  <TableHead>Demo</TableHead>
                  <TableHead>Teacher</TableHead>
                  <TableHead>Next Follow-up</TableHead>
                  <TableHead>Received Date</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleRows.map((row) => {
                  const demoStatus = row.demo ? normalizeDemoStatus(row.demo.status) : '';
                  const demoWorkflowState = resolveDemoWorkflowState(row.demo);
                  const isCompletedDemo = demoStatus === 'completed';
                  const isCancelledDemo = demoStatus === 'cancelled';
                  return (
                    <TableRow key={row.id} className={cn('transition-colors hover:bg-slate-50/70', getRowHighlightClass(row))}>
                      <TableCell>
                        <div className="font-medium">{row.parentName}</div>
                        <div className="text-xs text-muted-foreground">{row.parentPhone}</div>
                      </TableCell>
                      <TableCell>{row.childName}</TableCell>
                      <TableCell>{row.source || '—'}</TableCell>
                      <TableCell>{row.courseLabel}</TableCell>
                      <TableCell>
                        <Badge variant={lifecycleVariant(row.lifecycleStage)}>
                          {lifecycleLabel(row.lifecycleStage)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {row.demo ? (
                          <div className="space-y-1">
                            <Badge variant="outline">{formatLabel(demoStatus || row.demo.status)}</Badge>
                            <div className="text-xs text-muted-foreground">
                              {formatConversionStatus(row.demo.conversionStatus)}
                            </div>
                          </div>
                        ) : (
                          <Badge variant="outline">Not Created</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div>{row.teacherName || '—'}</div>
                        {row.demo?.teacherConfirmedDate || row.demo?.teacherConfirmedTime ? (
                          <div className="text-xs text-muted-foreground">
                            {`${row.demo.teacherConfirmedDate || '—'} ${row.demo.teacherConfirmedTime || ''}`.trim()}
                          </div>
                        ) : null}
                        {row.demo?.teacherRemarks ? (
                          <div className="mt-1 max-w-[240px] text-xs text-muted-foreground">
                            Teacher: {row.demo.teacherRemarks}
                          </div>
                        ) : null}
                        {!row.demo?.teacherRemarks && row.demo?.teacherRecommendation ? (
                          <div className="mt-1 max-w-[240px] text-xs text-muted-foreground">
                            Recommendation: {row.demo.teacherRecommendation}
                          </div>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        <div>{row.nextFollowUpLabel}</div>
                        {row.demo?.followUpCallStatus || row.demo?.admissionNotConfirmedReason ? (
                          <div className="mt-1 space-y-1 text-xs text-muted-foreground">
                            {row.demo.followUpCallStatus ? (
                              <div>Call: {formatFollowUpCallStatus(row.demo.followUpCallStatus)}</div>
                            ) : null}
                            {row.demo.admissionNotConfirmedReason ? (
                              <div>Note: {row.demo.admissionNotConfirmedReason}</div>
                            ) : null}
                          </div>
                        ) : null}
                      </TableCell>
                      <TableCell>{formatDateInputLabel(row.demo?.requestReceivedDate)}</TableCell>
                      <TableCell>{formatTs(row.updatedAtMs)}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap justify-end gap-2">
                          {row.lead && !row.demo ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => void handleQuickCreateDemo(row)}
                            >
                              Create Demo
                            </Button>
                          ) : null}
                          {row.demo ? (
                            <Button
                              type="button"
                              size="sm"
                              variant={demoWorkflowState === 'completed' ? 'default' : 'outline'}
                              onClick={() =>
                                demoWorkflowState === 'completed'
                                  ? openConversionDialog(row)
                                  : demoWorkflowState === 'open'
                                    ? openReassignDialog(row)
                                    : openEditDialog(row)
                              }
                            >
                              {demoWorkflowState === 'completed'
                                ? 'Follow-up'
                                : demoWorkflowState === 'open'
                                  ? 'Assign Demo'
                                  : 'Edit Demo'}
                            </Button>
                          ) : null}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button type="button" size="icon" variant="ghost" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                              {row.lead ? (
                                <>
                                  <DropdownMenuItem onSelect={() => openLeadDialog(row.lead)}>
                                    Edit lead
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onSelect={() => openCommunicationsDialog(row.lead!)}>
                                    Communications
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onSelect={() => openWhatsAppHelper(row.lead!)}>
                                    WhatsApp helper
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                </>
                              ) : null}
                              {row.demo ? (
                                <>
                                  <DropdownMenuItem onSelect={() => openEditDialog(row)}>
                                    Edit details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onSelect={() => openConversionDialog(row)}>
                                    Follow-up / conversion
                                  </DropdownMenuItem>
                                  {demoWorkflowState === 'open' ? (
                                    <DropdownMenuItem onSelect={() => openReassignDialog(row)}>
                                      Assign demo
                                    </DropdownMenuItem>
                                  ) : null}
                                  {demoWorkflowState === 'assigned' ? (
                                    <DropdownMenuItem onSelect={() => openReassignDialog(row)}>
                                      Reassign demo
                                    </DropdownMenuItem>
                                  ) : null}
                                  {demoWorkflowState === 'assigned' ? (
                                    <DropdownMenuItem
                                      disabled={isBusyFor(row, 'release')}
                                      onSelect={() => void handleReleaseDemo(row)}
                                    >
                                      {isBusyFor(row, 'release') ? 'Saving…' : 'Release demo'}
                                    </DropdownMenuItem>
                                  ) : null}
                                  {!isCancelledDemo ? (
                                    <DropdownMenuItem
                                      disabled={isBusyFor(row, 'cancel')}
                                      onSelect={() => void handleCancelDemo(row)}
                                    >
                                      {isBusyFor(row, 'cancel') ? 'Saving…' : 'Cancel demo'}
                                    </DropdownMenuItem>
                                  ) : null}
                                  {(isCancelledDemo || isCompletedDemo) ? (
                                    <DropdownMenuItem
                                      disabled={isBusyFor(row, 'reopen')}
                                      onSelect={() => void handleReopenDemo(row)}
                                    >
                                      {isBusyFor(row, 'reopen') ? 'Saving…' : 'Reopen demo'}
                                    </DropdownMenuItem>
                                  ) : null}
                                  {isCompletedDemo ? (
                                    <>
                                      <DropdownMenuItem
                                        disabled={savingConversionRowId === row.id}
                                        onSelect={() => void handleMarkEnrolled(row)}
                                      >
                                        {savingConversionRowId === row.id ? 'Saving…' : 'Mark enrolled'}
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        disabled={isBusyFor(row, 'follow_up')}
                                        onSelect={() => void handleSetFollowUp(row)}
                                      >
                                        {isBusyFor(row, 'follow_up') ? 'Saving…' : 'Move to follow-up'}
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        disabled={isBusyFor(row, 'lost')}
                                        onSelect={() => void handleMarkLost(row)}
                                      >
                                        {isBusyFor(row, 'lost') ? 'Saving…' : 'Mark lost'}
                                      </DropdownMenuItem>
                                    </>
                                  ) : null}
                                  <DropdownMenuItem onSelect={() => setTimelineViewTarget(row.demo)}>
                                    View timeline
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    disabled={isBusyFor(row, 'delete')}
                                    onSelect={() => void handleDeleteDemo(row)}
                                    className="text-red-600 focus:text-red-600"
                                  >
                                    {isBusyFor(row, 'delete') ? 'Deleting…' : 'Delete demo'}
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onSelect={() => void handleCopyPhone(row)}>
                                    Copy phone
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onSelect={() => handleOpenWhatsApp(row)}>
                                    Open WhatsApp
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onSelect={() => void handleCopySummary(row)}>
                                    Copy summary
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onSelect={() => void handleCopyFollowUpMessage(row)}>
                                    Copy follow-up
                                  </DropdownMenuItem>
                                </>
                              ) : (
                                <>
                                  {row.lead ? (
                                    <DropdownMenuItem onSelect={() => void handleQuickCreateDemo(row)}>
                                      Create demo
                                    </DropdownMenuItem>
                                  ) : null}
                                  <DropdownMenuItem onSelect={() => void handleCopyPhone(row)}>
                                    Copy phone
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onSelect={() => handleOpenWhatsApp(row)}>
                                    Open WhatsApp
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
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

      <Dialog open={leadDialogOpen} onOpenChange={setLeadDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{leadEditTarget ? 'Edit Lead' : 'Add Lead'}</DialogTitle>
            <DialogDescription className="sr-only">
              Manage lead details, enquiry fields, and follow-up metadata.
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-5" onSubmit={handleSaveLead}>
            <div className="space-y-3">
              <h4 className="text-sm font-semibold">Parent details</h4>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>Parent Name *</Label>
                  <Input value={leadForm.parentName} onChange={(event) => setLeadField('parentName', event.target.value)} required />
                </div>
                <div>
                  <Label>Primary Phone *</Label>
                  <Input value={leadForm.primaryPhone} onChange={(event) => setLeadField('primaryPhone', event.target.value)} required />
                </div>
                <div className="sm:col-span-2">
                  <Label>Parent Email</Label>
                  <Input type="email" value={leadForm.parentEmail} onChange={(event) => setLeadField('parentEmail', event.target.value)} />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-semibold">Child details</h4>
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <Label>Child Name</Label>
                  <Input value={leadForm.childName} onChange={(event) => setLeadField('childName', event.target.value)} />
                </div>
                <div>
                  <Label>Child Age</Label>
                  <Input value={leadForm.childAge} onChange={(event) => setLeadField('childAge', event.target.value)} inputMode="numeric" />
                </div>
                <div>
                  <Label>Child Grade</Label>
                  <Input value={leadForm.childGrade} onChange={(event) => setLeadField('childGrade', event.target.value)} />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-semibold">Enquiry details</h4>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>Interest Track</Label>
                  <Select value={leadForm.interestTrack} onValueChange={(value) => setLeadField('interestTrack', value as InterestTrack)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {LEAD_TRACK_OPTIONS.map((track) => (
                        <SelectItem key={track} value={track}>{formatLabel(track)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Source</Label>
                  <Select value={leadForm.source} onValueChange={(value) => setLeadField('source', value as LeadSource)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {LEAD_SOURCE_OPTIONS.map((source) => (
                        <SelectItem key={source} value={source}>{formatLabel(source)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Source Detail</Label>
                  <Input value={leadForm.sourceDetail} onChange={(event) => setLeadField('sourceDetail', event.target.value)} />
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={leadForm.status} onValueChange={(value) => setLeadField('status', value as LeadStatus)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {LEAD_STATUSES.map((status) => (
                        <SelectItem key={status} value={status}>{formatLabel(status)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Country</Label>
                  <Input value={leadForm.country} onChange={(event) => setLeadField('country', event.target.value)} />
                </div>
                <div>
                  <Label>Timezone</Label>
                  <Input value={leadForm.timezone} onChange={(event) => setLeadField('timezone', event.target.value)} />
                </div>
                <div className="sm:col-span-2">
                  <Label>Preferred Timing</Label>
                  <Input value={leadForm.preferredTimingText} onChange={(event) => setLeadField('preferredTimingText', event.target.value)} />
                </div>
                <div className="sm:col-span-2">
                  <Label>Initial Message Snippet</Label>
                  <Textarea rows={3} value={leadForm.initialMessageSnippet} onChange={(event) => setLeadField('initialMessageSnippet', event.target.value)} />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-semibold">Operations</h4>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>Priority</Label>
                  <Select value={leadForm.priority} onValueChange={(value) => setLeadField('priority', value)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PRIORITY_OPTIONS.map((priority) => (
                        <SelectItem key={priority} value={priority}>{formatLabel(priority)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Next Follow-up Date</Label>
                  <Input type="date" value={leadForm.nextFollowUpDate} onChange={(event) => setLeadField('nextFollowUpDate', event.target.value)} />
                </div>
                <div className="sm:col-span-2">
                  <Label>Tags (comma separated)</Label>
                  <Input value={leadForm.tagsText} onChange={(event) => setLeadField('tagsText', event.target.value)} />
                </div>
                <div className="sm:col-span-2">
                  <Label>Notes</Label>
                  <Textarea rows={4} value={leadForm.notes} onChange={(event) => setLeadField('notes', event.target.value)} />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setLeadDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={leadSaving}>
                {leadSaving ? 'Saving...' : leadEditTarget ? 'Save Changes' : 'Create Lead'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={demoRequestDialogOpen} onOpenChange={setDemoRequestDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Create Demo Request</DialogTitle>
            <DialogDescription className="sr-only">
              Capture parent, child, and scheduling inputs to create a demo request.
            </DialogDescription>
          </DialogHeader>
          <form className="grid gap-4" onSubmit={handleCreateDemoRequestSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Parent Name *</Label>
                <Input value={demoRequestForm.parentName} onChange={(event) => setDemoRequestField('parentName', event.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Parent Phone *</Label>
                <div className="grid grid-cols-3 gap-2">
                  <div className="flex h-10 items-center rounded-md border bg-background">
                    <span className="px-3 text-sm text-muted-foreground">+</span>
                    <Input
                      className="border-0 shadow-none focus-visible:ring-0"
                      inputMode="numeric"
                      placeholder="Country"
                      value={demoRequestForm.parentPhoneCountryCode || DEFAULT_PHONE_COUNTRY_CODE}
                      onChange={(event) => setDemoRequestField('parentPhoneCountryCode', event.target.value.replace(/\D/g, ''))}
                    />
                  </div>
                  <Input
                    className="col-span-2"
                    inputMode="numeric"
                    placeholder="Phone number"
                    value={demoRequestForm.parentPhoneLocal}
                    onChange={(event) => setDemoRequestField('parentPhoneLocal', event.target.value.replace(/\D/g, ''))}
                    required
                  />
                </div>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Child Name *</Label>
                <Input value={demoRequestForm.childName} onChange={(event) => setDemoRequestField('childName', event.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Child Grade *</Label>
                <Input value={demoRequestForm.childGrade} onChange={(event) => setDemoRequestField('childGrade', event.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Child Age</Label>
                <Input type="number" min={0} value={demoRequestForm.childAge} onChange={(event) => setDemoRequestField('childAge', event.target.value)} />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Course Interested *</Label>
                <Select
                  value={demoRequestForm.courseInterested || 'not_set'}
                  onValueChange={(value) =>
                    setDemoRequestField('courseInterested', value === 'not_set' ? '' : value)
                  }
                >
                  <SelectTrigger><SelectValue placeholder="Select course" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_set">Not set</SelectItem>
                    {COURSE_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>{option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Timezone</Label>
                <Select
                  value={demoRequestForm.timezone || 'not_set'}
                  onValueChange={(value) => setDemoRequestField('timezone', value === 'not_set' ? '' : value)}
                >
                  <SelectTrigger><SelectValue placeholder="Select timezone" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_set">Not set</SelectItem>
                    {TIMEZONE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Source</Label>
                <Select value={demoRequestForm.source || 'not_set'} onValueChange={(value) => setDemoRequestField('source', value === 'not_set' ? '' : value)}>
                  <SelectTrigger><SelectValue placeholder="Select source" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_set">Not set</SelectItem>
                    {SOURCE_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>{option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Demo Mode</Label>
                <Select value={demoRequestForm.demoMode || 'not_set'} onValueChange={(value) => setDemoRequestField('demoMode', value === 'not_set' ? '' : value)}>
                  <SelectTrigger><SelectValue placeholder="Select demo mode" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_set">Not set</SelectItem>
                    {DEMO_MODE_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>{option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Request Received Date *</Label>
                <Input type="date" value={demoRequestForm.requestReceivedDate} onChange={(event) => setDemoRequestField('requestReceivedDate', event.target.value)} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Parent Preferred Date/Time *</Label>
              <Textarea rows={3} value={demoRequestForm.preferredDateTimeText} onChange={(event) => setDemoRequestField('preferredDateTimeText', event.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Notes for Teacher</Label>
              <Textarea rows={3} value={demoRequestForm.adminNotes} onChange={(event) => setDemoRequestField('adminNotes', event.target.value)} />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setDemoRequestDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={creatingDemoRequest}>
                {creatingDemoRequest ? 'Creating...' : 'Create Demo Request'}
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
            <DialogDescription className="sr-only">
              Draft and send WhatsApp follow-up messages for the selected lead.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Template</Label>
                <Select value={whatsAppTemplate} onValueChange={(value) => handleWhatsAppTemplateChange(value as WhatsAppTemplateKey)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {WHATSAPP_TEMPLATE_OPTIONS.map((template) => (
                      <SelectItem key={template} value={template}>{formatLabel(template)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Recipient Phone</Label>
                <Input value={whatsAppTarget ? getWhatsAppPhone(whatsAppTarget) : ''} readOnly placeholder="No phone available" />
              </div>
            </div>
            <div>
              <Label>Message Draft</Label>
              <Textarea rows={8} value={whatsAppMessage} onChange={(event) => setWhatsAppMessage(event.target.value)} />
              <div className="mt-1 text-xs text-muted-foreground">{whatsAppMessage.trim().length} characters</div>
              <div className="mt-1 text-xs text-muted-foreground">
                Manual WhatsApp uses custom edited text. API send uses approved WhatsApp templates only.
              </div>
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => void handleCopyWhatsAppMessage()}>
                Copy Message
              </Button>
              <Button type="button" variant="outline" onClick={handleOpenWhatsAppOnly}>
                Open WhatsApp
              </Button>
              <Button type="button" variant="outline" onClick={() => void handleSendViaWhatsAppApi()} disabled={sendingWhatsAppApi || !WHATSAPP_API_TEMPLATE_KEYS.has(whatsAppTemplate)}>
                {sendingWhatsAppApi ? 'Sending...' : 'Send via WhatsApp API'}
              </Button>
              <Button type="button" onClick={() => void handleOpenWhatsAppAndLog()} disabled={loggingWhatsApp}>
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
            <DialogDescription className="sr-only">
              Review communication history and add or edit communication entries.
            </DialogDescription>
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
                  <Select value={communicationsHistoryFilter} onValueChange={(value) => setCommunicationsHistoryFilter(value as CommunicationHistoryFilter)}>
                    <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
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
                          <Badge variant="outline">Template: {item.templateName || item.templateTag}</Badge>
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
                        <div className="mt-1 text-xs text-muted-foreground">Failed: {item.errorMessage || item.errorCode}</div>
                      ) : null}
                      <div className="mt-1 text-xs text-muted-foreground">Follow-up: {formatTs(item.followUpDate)}</div>
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
                    <Button key={preset} type="button" size="sm" variant="outline" onClick={() => applyCommunicationPreset(preset)}>
                      {COMMUNICATION_PRESETS[preset].label}
                    </Button>
                  ))}
                </div>
              ) : null}
              <form className="space-y-3" onSubmit={handleSaveCommunication}>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label>Type</Label>
                    <Select value={communicationForm.type} onValueChange={(value) => setCommunicationField('type', value as CommunicationType)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {COMMUNICATION_TYPE_OPTIONS.map((option) => (
                          <SelectItem key={option} value={option}>{formatLabel(option)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Direction</Label>
                    <Select value={communicationForm.direction} onValueChange={(value) => setCommunicationField('direction', value as CommunicationDirection)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {COMMUNICATION_DIRECTION_OPTIONS.map((option) => (
                          <SelectItem key={option} value={option}>{formatLabel(option)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Channel</Label>
                    <Select value={communicationForm.channel} onValueChange={(value) => setCommunicationField('channel', value as CommunicationChannel)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {COMMUNICATION_CHANNEL_OPTIONS.map((option) => (
                          <SelectItem key={option} value={option}>{formatLabel(option)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Select value={communicationForm.status} onValueChange={(value) => setCommunicationField('status', value as CommunicationStatus)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {COMMUNICATION_STATUS_OPTIONS.map((option) => (
                          <SelectItem key={option} value={option}>{formatLabel(option)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Follow-up Needed</Label>
                    <Select value={communicationForm.followUpNeeded} onValueChange={(value) => setCommunicationField('followUpNeeded', value as 'yes' | 'no')}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Follow-up Date</Label>
                    <Input type="date" value={communicationForm.followUpDate} onChange={(event) => setCommunicationField('followUpDate', event.target.value)} />
                  </div>
                  <div className="sm:col-span-2">
                    <Label>Template Tag</Label>
                    <Input value={communicationForm.templateTag} onChange={(event) => setCommunicationField('templateTag', event.target.value)} placeholder="Optional" />
                  </div>
                  <div className="sm:col-span-2">
                    <Label>Summary *</Label>
                    <Textarea rows={3} value={communicationForm.summary} onChange={(event) => setCommunicationField('summary', event.target.value)} required />
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
                    {savingCommunication ? 'Saving...' : communicationEditTarget ? 'Save Communication' : 'Add Communication'}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(timelineViewTarget)} onOpenChange={(open) => !open && setTimelineViewTarget(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Timeline Details</DialogTitle>
            <DialogDescription className="sr-only">
              View session timeline and recent activity history.
            </DialogDescription>
          </DialogHeader>
          {timelineViewTarget ? (
            <div className="space-y-4 text-sm">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="font-medium text-foreground">
                  {timelineViewTarget.childName} · {timelineViewTarget.parentName}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Status: {formatLabel(normalizeDemoStatus(timelineViewTarget.status))} · Course: {timelineViewTarget.courseInterested}
                </div>
              </div>
              <div className="space-y-1 rounded-lg border border-slate-200 bg-white p-3 text-xs text-muted-foreground">
                <div className="font-medium text-foreground">Timeline</div>
                {buildTimelineRows(timelineViewTarget).map((line, index) => (
                  <div key={`${timelineViewTarget.id}-timeline-${index}`}>{line}</div>
                ))}
              </div>
              <div className="space-y-1 rounded-lg border border-slate-200 bg-white p-3 text-xs text-muted-foreground">
                <div className="font-medium text-foreground">Recent Activity</div>
                {Array.isArray(timelineViewTarget.history) && timelineViewTarget.history.length > 0 ? (
                  [...timelineViewTarget.history].reverse().map((entry, index) => (
                    <div key={`${timelineViewTarget.id}-history-${entry.atMs}-${index}`}>
                      {formatHistoryAction(entry.action)}: {formatTs(new Date(entry.atMs))}
                      {entry.actorName ? ` by ${entry.actorName}` : ''}
                      {entry.note ? ` (${entry.note})` : ''}
                    </div>
                  ))
                ) : (
                  <div>—</div>
                )}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editTarget)} onOpenChange={(open) => !open && setEditTarget(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit Demo Details</DialogTitle>
            <DialogDescription className="sr-only">
              Update demo request and participant details for this session.
            </DialogDescription>
          </DialogHeader>

          <form className="grid gap-4" onSubmit={handleSaveEdit}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="workspace-edit-parent-name">Parent Name *</Label>
                <Input
                  id="workspace-edit-parent-name"
                  value={editForm.parentName}
                  onChange={(event) => setEditForm((prev) => ({ ...prev, parentName: event.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="workspace-edit-parent-phone">Parent Phone *</Label>
                <Input
                  id="workspace-edit-parent-phone"
                  value={editForm.parentPhone}
                  onChange={(event) => setEditForm((prev) => ({ ...prev, parentPhone: event.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="workspace-edit-child-name">Child Name *</Label>
                <Input
                  id="workspace-edit-child-name"
                  value={editForm.childName}
                  onChange={(event) => setEditForm((prev) => ({ ...prev, childName: event.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="workspace-edit-child-grade">Child Grade *</Label>
                <Input
                  id="workspace-edit-child-grade"
                  value={editForm.childGrade}
                  onChange={(event) => setEditForm((prev) => ({ ...prev, childGrade: event.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="workspace-edit-child-age">Child Age</Label>
                <Input
                  id="workspace-edit-child-age"
                  type="number"
                  min={0}
                  value={editForm.childAge}
                  onChange={(event) => setEditForm((prev) => ({ ...prev, childAge: event.target.value }))}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="workspace-edit-course">Course Interested *</Label>
                <Select
                  value={editForm.courseInterested || 'not_set'}
                  onValueChange={(value) =>
                    setEditForm((prev) => ({
                      ...prev,
                      courseInterested: value === 'not_set' ? '' : value,
                    }))
                  }
                >
                  <SelectTrigger id="workspace-edit-course">
                    <SelectValue placeholder="Select course" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_set">Not set</SelectItem>
                    {COURSE_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="workspace-edit-timezone">Timezone</Label>
                <Select
                  value={editForm.timezone || 'not_set'}
                  onValueChange={(value) =>
                    setEditForm((prev) => ({ ...prev, timezone: value === 'not_set' ? '' : value }))
                  }
                >
                  <SelectTrigger id="workspace-edit-timezone">
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_set">Not set</SelectItem>
                    {TIMEZONE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="workspace-edit-source">Source</Label>
                <Select
                  value={editForm.source || 'not_set'}
                  onValueChange={(value) =>
                    setEditForm((prev) => ({ ...prev, source: value === 'not_set' ? '' : value }))
                  }
                >
                  <SelectTrigger id="workspace-edit-source">
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_set">Not set</SelectItem>
                    {SOURCE_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="workspace-edit-demo-mode">Demo Mode</Label>
                <Select
                  value={editForm.demoMode || 'not_set'}
                  onValueChange={(value) =>
                    setEditForm((prev) => ({ ...prev, demoMode: value === 'not_set' ? '' : value }))
                  }
                >
                  <SelectTrigger id="workspace-edit-demo-mode">
                    <SelectValue placeholder="Select demo mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_set">Not set</SelectItem>
                    {DEMO_MODE_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="workspace-edit-request-date">Request Received Date *</Label>
                <Input
                  id="workspace-edit-request-date"
                  type="date"
                  value={editForm.requestReceivedDate}
                  onChange={(event) =>
                    setEditForm((prev) => ({ ...prev, requestReceivedDate: event.target.value }))
                  }
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="workspace-edit-preferred-slot">Parent Preferred Date/Time *</Label>
              <Textarea
                id="workspace-edit-preferred-slot"
                value={editForm.preferredDateTimeText}
                onChange={(event) =>
                  setEditForm((prev) => ({ ...prev, preferredDateTimeText: event.target.value }))
                }
                rows={3}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="workspace-edit-admin-notes">Notes for Teacher</Label>
              <Textarea
                id="workspace-edit-admin-notes"
                value={editForm.adminNotes}
                onChange={(event) => setEditForm((prev) => ({ ...prev, adminNotes: event.target.value }))}
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setEditTarget(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!!dialogSavingAction}>
                {dialogSavingAction?.startsWith('edit:') ? 'Saving...' : 'Save Details'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(conversionTarget)} onOpenChange={(open) => !open && setConversionTarget(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Demo Follow-up</DialogTitle>
            <DialogDescription className="sr-only">
              Record conversion status and follow-up details after a demo session.
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleSaveConversion}>
            <div className="rounded-md border bg-slate-50/60 p-3">
              <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Teacher Response
              </div>
              {conversionTeacherResponses.length === 0 ? (
                <div className="text-sm text-muted-foreground">No teacher response submitted yet.</div>
              ) : (
                <div className="space-y-1">
                  {conversionTeacherResponses.map((item) => (
                    <div key={item.label} className="text-sm">
                      <span className="font-medium">{item.label}:</span>{' '}
                      <span className="text-muted-foreground">{item.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Conversion Status</Label>
              <Select value={conversionStatus} onValueChange={setConversionStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select conversion status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Not set</SelectItem>
                  {CONVERSION_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="workspace-followup-course">Recommended Course</Label>
                <Input
                  id="workspace-followup-course"
                  value={recommendedCourse}
                  onChange={(event) => setRecommendedCourse(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Recommended Class Type</Label>
                <Select value={recommendedClassType} onValueChange={setRecommendedClassType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select class type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not set</SelectItem>
                    <SelectItem value="one_to_one">1:1</SelectItem>
                    <SelectItem value="group">Group</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="workspace-followup-frequency">Recommended Frequency</Label>
                <Input
                  id="workspace-followup-frequency"
                  value={recommendedFrequency}
                  onChange={(event) => setRecommendedFrequency(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="workspace-followup-fee">Fee Discussed</Label>
                <Input
                  id="workspace-followup-fee"
                  value={feeDiscussed}
                  onChange={(event) => setFeeDiscussed(event.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="workspace-followup-date">Follow-up Date</Label>
                <Input
                  id="workspace-followup-date"
                  type="date"
                  value={followUpDate}
                  onChange={(event) => setFollowUpDate(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Follow-up Call Status</Label>
                <Select value={followUpCallStatus} onValueChange={setFollowUpCallStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select call status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not set</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="not_reachable">Not Reachable</SelectItem>
                    <SelectItem value="not_required">Not Required</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="workspace-followup-completed-at">Call Completed At</Label>
                <Input
                  id="workspace-followup-completed-at"
                  type="datetime-local"
                  value={followUpCallCompletedAt}
                  onChange={(event) => setFollowUpCallCompletedAt(event.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="workspace-followup-reason">Admission Not Confirmed Reason</Label>
              <Textarea
                id="workspace-followup-reason"
                value={admissionNotConfirmedReason}
                onChange={(event) => setAdmissionNotConfirmedReason(event.target.value)}
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setConversionTarget(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!!dialogSavingAction}>
                {dialogSavingAction?.startsWith('conversion:') ? 'Saving...' : 'Save Follow-up'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(reassignTarget)} onOpenChange={(open) => !open && setReassignTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {normalizeDemoStatus(reassignTarget?.demo?.status) === 'open' ? 'Assign Demo' : 'Reassign Demo'}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Choose a teacher to assign or reassign this demo session.
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleReassign}>
            <div className="space-y-2">
              <Label>Teacher</Label>
              <Select
                value={reassignTeacherId || 'not_set'}
                onValueChange={(value) => setReassignTeacherId(value === 'not_set' ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select teacher" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not_set">Not set</SelectItem>
                  {teachers.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setReassignTarget(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!!dialogSavingAction}>
                {dialogSavingAction?.startsWith('reassign:')
                  ? 'Saving...'
                  : normalizeDemoStatus(reassignTarget?.demo?.status) === 'open'
                    ? 'Assign Demo'
                    : 'Reassign Demo'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <DemoSessionsManagement mode="trend_only" />
    </div>
  );
}
