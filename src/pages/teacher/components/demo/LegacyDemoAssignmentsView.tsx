import React, { useEffect, useMemo, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { Card } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Badge } from '@components/ui/badge';
import { Tabs, TabsContent } from '@components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@components/ui/dialog';
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
import { useToast } from '@components/hooks/use-toast';
import type {
  DemoAttentionSpan,
  DemoChildLevelObserved,
  DemoOutcome,
  DemoGrammarEvaluation,
  DemoParentExpectation,
  DemoPhonicsAwareness,
  DemoReadingLevel,
  DemoRecommendedNextStep,
  DemoSession,
  DemoSpeakingConfidence,
} from '../../../../types/models';
import {
  claimDemoSession,
  completeDemoSession,
  listenOpenDemoSessions,
  listenTeacherDemoSessions,
  updateDemoSessionSchedule,
} from '../../../../services/demoSessionsService';
import { db } from '../../../../lib/firebaseConfig';

interface DemoAssignmentsViewProps {
  teacherId?: string;
  prefetchedMyDemos?: DemoSession[];
}

type TeacherDemoTab = 'available' | 'upcoming' | 'completed' | 'today';
type DemoTrack = 'phonics' | 'grammar' | 'speaking';

const OUTCOME_OPTIONS: Array<{ value: DemoOutcome; label: string }> = [
  { value: 'completed', label: 'Completed' },
  { value: 'parent_no_show', label: 'Parent No-show' },
  { value: 'teacher_no_show', label: 'Teacher No-show' },
  { value: 'reschedule_requested', label: 'Reschedule Needed' },
  { value: 'not_interested', label: 'Not Interested' },
  { value: 'follow_up_needed', label: 'Follow Up Needed' },
];

const CHILD_LEVEL_OPTIONS: Array<{ value: DemoChildLevelObserved; label: string }> = [
  { value: 'below_grade_level', label: 'Below Grade Level' },
  { value: 'near_grade_level', label: 'Near Grade Level' },
  { value: 'at_grade_level', label: 'At Grade Level' },
  { value: 'above_grade_level', label: 'Above Grade Level' },
];

const READING_LEVEL_OPTIONS: Array<{ value: DemoReadingLevel; label: string }> = [
  { value: 'non_reader', label: 'Non Reader' },
  { value: 'beginner_reader', label: 'Beginner Reader' },
  { value: 'developing_reader', label: 'Developing Reader' },
  { value: 'fluent_reader', label: 'Fluent Reader' },
];

const PHONICS_AWARENESS_OPTIONS: Array<{ value: DemoPhonicsAwareness; label: string }> = [
  { value: 'needs_support', label: 'Needs Support' },
  { value: 'basic', label: 'Basic' },
  { value: 'good', label: 'Good' },
  { value: 'strong', label: 'Strong' },
];

const GRAMMAR_EVALUATION_OPTIONS: Array<{ value: DemoGrammarEvaluation; label: string }> = [
  { value: 'needs_support', label: 'Needs Support' },
  { value: 'basic', label: 'Basic' },
  { value: 'good', label: 'Good' },
  { value: 'strong', label: 'Strong' },
];

const SPEAKING_CONFIDENCE_OPTIONS: Array<{ value: DemoSpeakingConfidence; label: string }> = [
  { value: 'very_low', label: 'Very Low' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

const ATTENTION_SPAN_OPTIONS: Array<{ value: DemoAttentionSpan; label: string }> = [
  { value: 'short', label: 'Short' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'good', label: 'Good' },
  { value: 'strong', label: 'Strong' },
];

const PARENT_EXPECTATION_OPTIONS: Array<{ value: DemoParentExpectation; label: string }> = [
  { value: 'school_support', label: 'School Support' },
  { value: 'phonics_improvement', label: 'Phonics Improvement' },
  { value: 'grammar_improvement', label: 'Grammar Improvement' },
  { value: 'reading_improvement', label: 'Reading Improvement' },
  { value: 'speaking_confidence', label: 'Speaking Improvement' },
  { value: 'exam_preparation', label: 'Exam Preparation' },
  { value: 'mixed_goals', label: 'Mixed Goals' },
];

const NEXT_STEP_OPTIONS: Array<{ value: DemoRecommendedNextStep; label: string }> = [
  { value: 'start_trial_classes', label: 'Start Trial Classes' },
  { value: 'start_weekly_program', label: 'Start Weekly Program' },
  { value: 'one_to_one_plan', label: '1:1 Plan' },
  { value: 'group_batch_plan', label: 'Group Batch Plan' },
  { value: 'reassess_later', label: 'Reassess Later' },
];

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
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

const statusBadge = (status: DemoSession['status']) => {
  if (status === 'open') return <Badge variant="outline">Open</Badge>;
  if (status === 'assigned') return <Badge variant="secondary">Assigned</Badge>;
  if (status === 'completed') return <Badge>Completed</Badge>;
  return <Badge variant="outline">Cancelled</Badge>;
};

const formatOutcome = (outcome?: DemoOutcome | null) => {
  if (!outcome) return '—';
  return outcome
    .split('_')
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(' ');
};

const formatEnum = (value?: string | null) => {
  if (!value) return '—';
  return value
    .split('_')
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(' ');
};

const normalizeTrack = (value: string): DemoTrack | null => {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;
  if (normalized.includes('phonics') || normalized.includes('reading')) return 'phonics';
  if (normalized.includes('grammar') || normalized.includes('writing')) return 'grammar';
  if (normalized.includes('speaking') || normalized.includes('communication') || normalized.includes('public speaking')) {
    return 'speaking';
  }
  return null;
};

const toStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === 'string');
  if (typeof value === 'string') return [value];
  return [];
};

const normalizeSearchValue = (value: unknown): string => {
  if (typeof value !== 'string') return '';
  return value.trim().toLowerCase();
};

const demoMatchesQuery = (demo: DemoSession, query: string): boolean => {
  if (!query) return true;
  const haystack = [
    demo.parentName,
    demo.childName,
    demo.courseInterested,
    demo.preferredDateTimeText,
    demo.teacherConfirmedDate,
    demo.teacherConfirmedTime,
    demo.teacherPreDemoNote,
    demo.teacherRemarks,
    demo.teacherRecommendation,
  ]
    .map((value) => normalizeSearchValue(value))
    .filter(Boolean)
    .join(' ');

  return haystack.includes(query);
};

export const DemoAssignmentsView: React.FC<DemoAssignmentsViewProps> = ({ teacherId, prefetchedMyDemos }) => {
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<TeacherDemoTab>('available');
  const [availableDemos, setAvailableDemos] = useState<DemoSession[]>([]);
  const [myDemos, setMyDemos] = useState<DemoSession[]>([]);
  const [eligibleTracks, setEligibleTracks] = useState<DemoTrack[]>([]);
  const [hasEligibilityConfig, setHasEligibilityConfig] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedRowIds, setExpandedRowIds] = useState<Record<string, boolean>>({});

  const [claimTarget, setClaimTarget] = useState<DemoSession | null>(null);
  const [claimDate, setClaimDate] = useState('');
  const [claimTime, setClaimTime] = useState('');
  const [claimNote, setClaimNote] = useState('');
  const [claiming, setClaiming] = useState(false);

  const [updateTarget, setUpdateTarget] = useState<DemoSession | null>(null);
  const [updateDate, setUpdateDate] = useState('');
  const [updateTime, setUpdateTime] = useState('');
  const [updateNote, setUpdateNote] = useState('');
  const [updating, setUpdating] = useState(false);

  const [completeTarget, setCompleteTarget] = useState<DemoSession | null>(null);
  const [outcome, setOutcome] = useState<DemoOutcome>('completed');
  const [remarks, setRemarks] = useState('');
  const [recommendation, setRecommendation] = useState('');
  const [childLevelObserved, setChildLevelObserved] = useState<DemoChildLevelObserved | ''>('');
  const [readingLevel, setReadingLevel] = useState<DemoReadingLevel | ''>('');
  const [phonicsAwareness, setPhonicsAwareness] = useState<DemoPhonicsAwareness | ''>('');
  const [grammarEvaluation, setGrammarEvaluation] = useState<DemoGrammarEvaluation | ''>('');
  const [speakingConfidence, setSpeakingConfidence] = useState<DemoSpeakingConfidence | ''>('');
  const [attentionSpan, setAttentionSpan] = useState<DemoAttentionSpan | ''>('');
  const [parentExpectation, setParentExpectation] = useState<DemoParentExpectation | ''>('');
  const [recommendedNextStep, setRecommendedNextStep] = useState<DemoRecommendedNextStep | ''>('');
  const [completing, setCompleting] = useState(false);
  const shouldListenForMyDemos = prefetchedMyDemos === undefined;

  useEffect(() => {
    if (prefetchedMyDemos !== undefined) setMyDemos(prefetchedMyDemos);
  }, [prefetchedMyDemos]);

  useEffect(() => {
    if (!teacherId) return;

    const unsubOpen = listenOpenDemoSessions(
      (next) => setAvailableDemos(next),
      (error) => {
        toast({
          title: 'Failed to load available demos',
          description: error.message,
          variant: 'destructive',
        });
      },
    );

    const unsubMine = shouldListenForMyDemos
      ? listenTeacherDemoSessions(
          teacherId,
          (next) => setMyDemos(next),
          (error) => {
            toast({
              title: 'Failed to load your demos',
              description: error.message,
              variant: 'destructive',
            });
          },
        )
      : null;

    return () => {
      unsubOpen();
      unsubMine?.();
    };
  }, [shouldListenForMyDemos, teacherId, toast]);

  useEffect(() => {
    if (!teacherId) return;

    let mounted = true;
    const loadEligibility = async () => {
      try {
        const userSnap = await getDoc(doc(db, 'users', teacherId));
        if (!mounted) return;

        if (!userSnap.exists()) {
          setEligibleTracks([]);
          setHasEligibilityConfig(false);
          return;
        }

        const userData = userSnap.data() as Record<string, unknown>;
        const rawValues = [
          ...toStringArray(userData.specialization),
          ...toStringArray(userData.specializations),
          ...toStringArray(userData.subjects),
        ];
        const nextTracks = Array.from(
          new Set(
            rawValues
              .map((value) => normalizeTrack(value))
              .filter((value): value is DemoTrack => Boolean(value)),
          ),
        );
        setEligibleTracks(nextTracks);
        setHasEligibilityConfig(nextTracks.length > 0);
      } catch (error: any) {
        setEligibleTracks([]);
        setHasEligibilityConfig(false);
        toast({
          title: 'Unable to load eligibility filters',
          description: error?.message || 'Showing all open demos.',
          variant: 'destructive',
        });
      }
    };

    void loadEligibility();
    return () => {
      mounted = false;
    };
  }, [teacherId, toast]);

  const upcomingDemos = useMemo(
    () => myDemos.filter((demo) => demo.status === 'assigned'),
    [myDemos],
  );

  const completedDemos = useMemo(
    () => myDemos.filter((demo) => demo.status === 'completed'),
    [myDemos],
  );

  const filteredAvailableDemos = useMemo(() => {
    if (!hasEligibilityConfig) return availableDemos;
    return availableDemos.filter((demo) => {
      const track = normalizeTrack(demo.courseInterested || '');
      if (!track) return true;
      return eligibleTracks.includes(track);
    });
  }, [availableDemos, eligibleTracks, hasEligibilityConfig]);

  const todayYmd = useMemo(() => {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${now.getFullYear()}-${month}-${day}`;
  }, []);

  const todaysUpcomingCount = useMemo(
    () => upcomingDemos.filter((demo) => demo.teacherConfirmedDate === todayYmd).length,
    [todayYmd, upcomingDemos],
  );
  const todaysDemos = useMemo(
    () => upcomingDemos.filter((demo) => demo.teacherConfirmedDate === todayYmd),
    [todayYmd, upcomingDemos],
  );

  const normalizedSearchQuery = useMemo(() => normalizeSearchValue(searchQuery), [searchQuery]);

  const filteredAvailableBySearch = useMemo(
    () => filteredAvailableDemos.filter((demo) => demoMatchesQuery(demo, normalizedSearchQuery)),
    [filteredAvailableDemos, normalizedSearchQuery],
  );

  const filteredUpcomingBySearch = useMemo(
    () => upcomingDemos.filter((demo) => demoMatchesQuery(demo, normalizedSearchQuery)),
    [normalizedSearchQuery, upcomingDemos],
  );

  const filteredCompletedBySearch = useMemo(
    () => completedDemos.filter((demo) => demoMatchesQuery(demo, normalizedSearchQuery)),
    [completedDemos, normalizedSearchQuery],
  );

  const filteredTodayBySearch = useMemo(
    () => todaysDemos.filter((demo) => demoMatchesQuery(demo, normalizedSearchQuery)),
    [normalizedSearchQuery, todaysDemos],
  );

  const currentTabRows = useMemo(() => {
    if (activeTab === 'available') return filteredAvailableBySearch;
    if (activeTab === 'upcoming') return filteredUpcomingBySearch;
    if (activeTab === 'completed') return filteredCompletedBySearch;
    return filteredTodayBySearch;
  }, [
    activeTab,
    filteredAvailableBySearch,
    filteredCompletedBySearch,
    filteredTodayBySearch,
    filteredUpcomingBySearch,
  ]);

  const isExpanded = (demoId: string) => Boolean(expandedRowIds[demoId]);

  const toggleExpand = (demoId: string) => {
    setExpandedRowIds((prev) => ({
      ...prev,
      [demoId]: !prev[demoId],
    }));
  };

  const expandAllVisible = () => {
    setExpandedRowIds((prev) => {
      const next = {...prev};
      currentTabRows.forEach((demo) => {
        next[demo.id] = true;
      });
      return next;
    });
  };

  const collapseAllRows = () => setExpandedRowIds({});

  const openClaimDialog = (demo: DemoSession) => {
    setClaimTarget(demo);
    setClaimDate('');
    setClaimTime('');
    setClaimNote('');
  };

  const openUpdateDialog = (demo: DemoSession) => {
    setUpdateTarget(demo);
    setUpdateDate(demo.teacherConfirmedDate || '');
    setUpdateTime(demo.teacherConfirmedTime || '');
    setUpdateNote(demo.teacherPreDemoNote || '');
  };

  const openCompleteDialog = (demo: DemoSession) => {
    setCompleteTarget(demo);
    setOutcome('completed');
    setRemarks('');
    setRecommendation('');
    setChildLevelObserved('');
    setReadingLevel('');
    setPhonicsAwareness('');
    setGrammarEvaluation('');
    setSpeakingConfidence('');
    setAttentionSpan('');
    setParentExpectation('');
    setRecommendedNextStep('');
  };

  const handleClaimSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!claimTarget) return;

    if (!claimDate || !claimTime) {
      toast({
        title: 'Confirmed date and time are required',
        variant: 'destructive',
      });
      return;
    }

    setClaiming(true);
    try {
      await claimDemoSession({
        demoId: claimTarget.id,
        teacherConfirmedDate: claimDate,
        teacherConfirmedTime: claimTime,
        teacherPreDemoNote: claimNote,
      });
      setClaimTarget(null);
      setActiveTab('upcoming');
      toast({
        title: 'Demo assigned',
        description: 'The demo is now in your upcoming list.',
      });
    } catch (error: any) {
      toast({
        title: 'Unable to assign demo',
        description: error?.message || 'This demo may have been claimed already.',
        variant: 'destructive',
      });
    } finally {
      setClaiming(false);
    }
  };

  const handleUpdateSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!updateTarget) return;

    if (!updateDate || !updateTime) {
      toast({
        title: 'Confirmed date and time are required',
        variant: 'destructive',
      });
      return;
    }

    setUpdating(true);
    try {
      await updateDemoSessionSchedule({
        demoId: updateTarget.id,
        teacherConfirmedDate: updateDate,
        teacherConfirmedTime: updateTime,
        teacherPreDemoNote: updateNote,
      });
      setUpdateTarget(null);
      toast({ title: 'Timing updated' });
    } catch (error: any) {
      toast({
        title: 'Unable to update timing',
        description: error?.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleCompleteSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!completeTarget) return;

    if (!remarks.trim()) {
      toast({
        title: 'Remarks are required to complete the demo',
        variant: 'destructive',
      });
      return;
    }

    setCompleting(true);
    try {
      const result = await completeDemoSession({
        demoId: completeTarget.id,
        outcome,
        teacherRemarks: remarks,
        teacherRecommendation: recommendation,
        childLevelObserved: childLevelObserved || undefined,
        readingLevel: readingLevel || undefined,
        phonicsAwareness: phonicsAwareness || undefined,
        grammarEvaluation: grammarEvaluation || undefined,
        speakingConfidence: speakingConfidence || undefined,
        attentionSpan: attentionSpan || undefined,
        parentExpectation: parentExpectation || undefined,
        recommendedNextStep: recommendedNextStep || undefined,
      });
      setCompleteTarget(null);
      setActiveTab('completed');
      if (outcome === 'reschedule_requested' && result.rescheduledDemoId) {
        toast({
          title: 'Reschedule requested',
          description: 'Current record is closed and a new open demo request has been created.',
        });
      } else {
        toast({ title: 'Demo marked complete' });
      }
    } catch (error: any) {
      toast({
        title: 'Unable to complete demo',
        description: error?.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setCompleting(false);
    }
  };

  const countLabel = (visibleCount: number, totalCount: number) =>
    normalizedSearchQuery ? `${visibleCount}/${totalCount}` : `${totalCount}`;

  const tableColumnsClass =
    'grid grid-cols-[1.1fr_1.1fr_1.2fr_1fr_0.7fr_260px] items-center gap-3';

  const renderDemoRow = (
    demo: DemoSession,
    section: 'available' | 'upcoming' | 'today' | 'completed',
  ) => {
    const expanded = isExpanded(demo.id);
    const confirmedSlot = `${demo.teacherConfirmedDate || ''} ${demo.teacherConfirmedTime || ''}`.trim();

    return (
      <div key={demo.id} className="border-b border-slate-100 px-4 py-3 last:border-b-0">
        <div className={tableColumnsClass}>
          <div className="text-sm font-medium text-slate-900">{demo.parentName || '—'}</div>
          <div className="text-sm font-semibold text-slate-900">
            {demo.childName || '—'}
            <span className="ml-1 font-normal text-slate-500">({demo.childGrade || '—'})</span>
          </div>
          <div className="text-sm text-slate-900">{demo.preferredDateTimeText || '—'}</div>
          <div className="text-sm text-slate-900">{demo.courseInterested || '—'}</div>
          <div className="text-sm text-slate-900">
            {typeof demo.childAge === 'number' ? demo.childAge : '—'}
          </div>

          <div className="flex items-center justify-end gap-2">
            {statusBadge(demo.status)}
            <Button size="sm" variant="outline" onClick={() => toggleExpand(demo.id)}>
              {expanded ? 'Collapse' : 'Expand'}
            </Button>
            {section === 'available' && (
              <Button size="sm" onClick={() => openClaimDialog(demo)}>
                Assign to me
              </Button>
            )}
            {(section === 'upcoming' || section === 'today') && (
              <>
                <Button size="sm" variant="outline" onClick={() => openUpdateDialog(demo)}>
                  Update timing
                </Button>
                <Button size="sm" onClick={() => openCompleteDialog(demo)}>
                  Mark completed
                </Button>
              </>
            )}
          </div>
        </div>

        {expanded && (
          <div className="mt-3 space-y-2 border-t border-slate-100 pt-3 text-sm text-slate-600">
            {confirmedSlot ? (
              <div>
                <span className="font-medium text-slate-800">Confirmed slot:</span> {confirmedSlot}
              </div>
            ) : null}
            {demo.timezone ? (
              <div>
                <span className="font-medium text-slate-800">Timezone:</span> {demo.timezone}
              </div>
            ) : null}
            <div>
              <span className="font-medium text-slate-800">Request received:</span>{' '}
              {demo.requestReceivedDate || '—'}
            </div>
            <div>
              <span className="font-medium text-slate-800">Entered at:</span> {formatTs(demo.createdAt)}
            </div>
            {demo.assignedAt ? (
              <div>
                <span className="font-medium text-slate-800">Assigned at:</span> {formatTs(demo.assignedAt)}
              </div>
            ) : null}
            {demo.adminNotes ? (
              <div>
                <span className="font-medium text-slate-800">Assignment notes:</span> {demo.adminNotes}
              </div>
            ) : null}
            {demo.teacherPreDemoNote ? (
              <div>
                <span className="font-medium text-slate-800">Pre-demo note:</span> {demo.teacherPreDemoNote}
              </div>
            ) : null}
            {section === 'completed' && (
              <>
                <div>
                  <span className="font-medium text-slate-800">Outcome:</span> {formatOutcome(demo.outcome)}
                </div>
                <div>
                  <span className="font-medium text-slate-800">Remarks:</span> {demo.teacherRemarks || '—'}
                </div>
                {demo.teacherRecommendation ? (
                  <div>
                    <span className="font-medium text-slate-800">Recommendation:</span>{' '}
                    {demo.teacherRecommendation}
                  </div>
                ) : null}
                {demo.childLevelObserved ? (
                  <div>
                    <span className="font-medium text-slate-800">Overall level:</span>{' '}
                    {formatEnum(demo.childLevelObserved)}
                  </div>
                ) : null}
                {demo.readingLevel ? (
                  <div>
                    <span className="font-medium text-slate-800">Reading skill:</span>{' '}
                    {formatEnum(demo.readingLevel)}
                  </div>
                ) : null}
                {demo.phonicsAwareness ? (
                  <div>
                    <span className="font-medium text-slate-800">Phonics skill:</span>{' '}
                    {formatEnum(demo.phonicsAwareness)}
                  </div>
                ) : null}
                {demo.grammarEvaluation ? (
                  <div>
                    <span className="font-medium text-slate-800">Grammar skill:</span>{' '}
                    {formatEnum(demo.grammarEvaluation)}
                  </div>
                ) : null}
                {demo.speakingConfidence ? (
                  <div>
                    <span className="font-medium text-slate-800">Speaking confidence:</span>{' '}
                    {formatEnum(demo.speakingConfidence)}
                  </div>
                ) : null}
                {demo.attentionSpan ? (
                  <div>
                    <span className="font-medium text-slate-800">Attention:</span>{' '}
                    {formatEnum(demo.attentionSpan)}
                  </div>
                ) : null}
                {demo.parentExpectation ? (
                  <div>
                    <span className="font-medium text-slate-800">Parent goal:</span>{' '}
                    {formatEnum(demo.parentExpectation)}
                  </div>
                ) : null}
                {demo.recommendedNextStep ? (
                  <div>
                    <span className="font-medium text-slate-800">Next step:</span>{' '}
                    {formatEnum(demo.recommendedNextStep)}
                  </div>
                ) : null}
                <div>
                  <span className="font-medium text-slate-800">Completed:</span> {formatTs(demo.completedAt)}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderDemoTable = (
    rows: DemoSession[],
    section: 'available' | 'upcoming' | 'today' | 'completed',
    emptyMessage: string,
  ) => {
    if (rows.length === 0) {
      return <Card className="p-6 text-sm text-muted-foreground">{emptyMessage}</Card>;
    }

    return (
      <Card className="overflow-hidden border-slate-200 bg-white/95 shadow-sm">
        <div className="max-h-[58vh] overflow-auto">
          <div className="min-w-[980px]">
            <div className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50/95 px-4 py-2 backdrop-blur">
              <div className={tableColumnsClass}>
                <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Parent</div>
                <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Student</div>
                <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Preferred Slot</div>
                <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Course</div>
                <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Child Age</div>
                <div className="text-[11px] font-semibold uppercase tracking-wide text-right text-slate-500">Actions</div>
              </div>
            </div>
            <div>{rows.map((demo) => renderDemoRow(demo, section))}</div>
          </div>
        </div>
      </Card>
    );
  };

  const hasExpandedRows = useMemo(
    () => Object.values(expandedRowIds).some((isOpen) => isOpen),
    [expandedRowIds],
  );

  if (!teacherId) {
    return (
      <Card className="p-6">
        <p className="text-sm text-muted-foreground">Teacher context is missing.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      <Card className="border-slate-200 bg-white/95 p-2 shadow-sm">
        <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('available')}
          className={`inline-flex h-9 items-center rounded-full border px-4 text-sm font-medium shadow-sm transition ${
            activeTab === 'available'
              ? 'border-sky-300 bg-sky-100 text-sky-800'
              : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
          }`}
        >
          <span>Open demos</span>
          <span className="ml-1 tabular-nums">
            {countLabel(filteredAvailableBySearch.length, filteredAvailableDemos.length)}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('upcoming')}
          className={`inline-flex h-9 items-center rounded-full border px-4 text-sm font-medium shadow-sm transition ${
            activeTab === 'upcoming'
              ? 'border-emerald-300 bg-emerald-100 text-emerald-800'
              : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
          }`}
        >
          <span>My demos</span>
          <span className="ml-1 tabular-nums">
            {countLabel(filteredUpcomingBySearch.length, upcomingDemos.length)}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('completed')}
          className={`inline-flex h-9 items-center rounded-full border px-4 text-sm font-medium shadow-sm transition ${
            activeTab === 'completed'
              ? 'border-violet-300 bg-violet-100 text-violet-800'
              : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
          }`}
        >
          <span>Completed</span>
          <span className="ml-1 tabular-nums">
            {countLabel(filteredCompletedBySearch.length, completedDemos.length)}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('today')}
          className={`inline-flex h-9 items-center rounded-full border px-4 text-sm font-medium shadow-sm transition ${
            activeTab === 'today'
              ? 'border-amber-300 bg-amber-100 text-amber-800'
              : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
          }`}
        >
          <span>Today's load</span>
          <span className="ml-1 tabular-nums">
            {countLabel(filteredTodayBySearch.length, todaysUpcomingCount)}
          </span>
        </button>
        </div>
      </Card>

      <Card className="border-slate-200 bg-white/95 p-3 shadow-sm">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <Input
            id="demo-global-search"
            className="h-10 lg:max-w-3xl lg:flex-1"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Global search by parent name or student name"
          />
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={expandAllVisible}
              disabled={currentTabRows.length === 0}
            >
              Expand all
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={collapseAllRows}
              disabled={!hasExpandedRows}
            >
              Collapse all
            </Button>
          </div>
        </div>
      </Card>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TeacherDemoTab)}>
        <TabsContent value="available" className="mt-4 space-y-3">
          {renderDemoTable(
            filteredAvailableBySearch,
            'available',
            normalizedSearchQuery ? 'No open demos match this search.' : 'No open demos right now.',
          )}
        </TabsContent>

        <TabsContent value="upcoming" className="mt-4 space-y-3">
          {renderDemoTable(
            filteredUpcomingBySearch,
            'upcoming',
            normalizedSearchQuery ? 'No assigned demos match this search.' : 'You have no assigned demos right now.',
          )}
        </TabsContent>

        <TabsContent value="today" className="mt-4 space-y-3">
          {renderDemoTable(
            filteredTodayBySearch,
            'today',
            normalizedSearchQuery ? "No demos in today's load match this search." : 'No demos scheduled for today.',
          )}
        </TabsContent>

        <TabsContent value="completed" className="mt-4 space-y-3">
          {renderDemoTable(
            filteredCompletedBySearch,
            'completed',
            normalizedSearchQuery ? 'No completed demos match this search.' : 'No completed demos yet.',
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={!!claimTarget} onOpenChange={(open) => (!open ? setClaimTarget(null) : undefined)}>
        <DialogContent className="max-h-[90vh] w-[calc(100vw-1rem)] overflow-y-auto border-slate-200 bg-gradient-to-b from-white to-slate-50 shadow-xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Assign Demo To Me</DialogTitle>
          </DialogHeader>
          <form className="space-y-3" onSubmit={handleClaimSubmit}>
            <div className="space-y-2">
              <Label htmlFor="claim-date">Confirmed Date *</Label>
              <Input
                id="claim-date"
                type="date"
                value={claimDate}
                onChange={(e) => setClaimDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="claim-time">Confirmed Time *</Label>
              <Input
                id="claim-time"
                type="time"
                value={claimTime}
                onChange={(e) => setClaimTime(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="claim-note">Pre-demo Note</Label>
              <Textarea
                id="claim-note"
                value={claimNote}
                onChange={(e) => setClaimNote(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex justify-end">
              <Button type="submit" className="w-full sm:w-auto" disabled={claiming}>
                {claiming ? 'Assigning...' : 'Confirm Assignment'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!updateTarget} onOpenChange={(open) => (!open ? setUpdateTarget(null) : undefined)}>
        <DialogContent className="max-h-[90vh] w-[calc(100vw-1rem)] overflow-y-auto border-slate-200 bg-gradient-to-b from-white to-slate-50 shadow-xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Update Confirmed Timing</DialogTitle>
          </DialogHeader>
          <form className="space-y-3" onSubmit={handleUpdateSubmit}>
            <div className="space-y-2">
              <Label htmlFor="update-date">Confirmed Date *</Label>
              <Input
                id="update-date"
                type="date"
                value={updateDate}
                onChange={(e) => setUpdateDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="update-time">Confirmed Time *</Label>
              <Input
                id="update-time"
                type="time"
                value={updateTime}
                onChange={(e) => setUpdateTime(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="update-note">Pre-demo Note</Label>
              <Textarea
                id="update-note"
                value={updateNote}
                onChange={(e) => setUpdateNote(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex justify-end">
              <Button type="submit" className="w-full sm:w-auto" disabled={updating}>
                {updating ? 'Saving...' : 'Save Timing'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!completeTarget} onOpenChange={(open) => (!open ? setCompleteTarget(null) : undefined)}>
        <DialogContent className="max-h-[85vh] w-[calc(100vw-1rem)] overflow-hidden border-slate-200 bg-gradient-to-b from-white to-slate-50 p-0 shadow-xl sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="px-4 pt-4 sm:px-6 sm:pt-6">Complete Demo</DialogTitle>
          </DialogHeader>
          <form className="flex max-h-[85vh] flex-col" onSubmit={handleCompleteSubmit}>
            <div className="space-y-3 overflow-y-auto px-4 pb-4 sm:px-6">
            <p className="text-xs text-muted-foreground">
              Choose Reschedule Needed if the demo needs a fresh new booking.
            </p>
            <div className="space-y-2">
              <Label>Outcome *</Label>
              <Select value={outcome} onValueChange={(value) => setOutcome(value as DemoOutcome)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select outcome" />
                </SelectTrigger>
                <SelectContent>
                  {OUTCOME_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="complete-remarks">Teacher Remarks *</Label>
              <Textarea
                id="complete-remarks"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                rows={4}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="complete-recommendation">Recommendation</Label>
              <Textarea
                id="complete-recommendation"
                value={recommendation}
                onChange={(e) => setRecommendation(e.target.value)}
                rows={3}
              />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Overall Level</Label>
                <Select
                  value={childLevelObserved || undefined}
                  onValueChange={(value) => setChildLevelObserved(value as DemoChildLevelObserved)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select child level" />
                  </SelectTrigger>
                  <SelectContent>
                    {CHILD_LEVEL_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Reading Skill</Label>
                <Select
                  value={readingLevel || undefined}
                  onValueChange={(value) => setReadingLevel(value as DemoReadingLevel)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select reading level" />
                  </SelectTrigger>
                  <SelectContent>
                    {READING_LEVEL_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Phonics Skill</Label>
                <Select
                  value={phonicsAwareness || undefined}
                  onValueChange={(value) => setPhonicsAwareness(value as DemoPhonicsAwareness)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select phonics awareness" />
                  </SelectTrigger>
                  <SelectContent>
                    {PHONICS_AWARENESS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Grammar Skill</Label>
                <Select
                  value={grammarEvaluation || undefined}
                  onValueChange={(value) => setGrammarEvaluation(value as DemoGrammarEvaluation)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select grammar level" />
                  </SelectTrigger>
                  <SelectContent>
                    {GRAMMAR_EVALUATION_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Speaking Confidence</Label>
                <Select
                  value={speakingConfidence || undefined}
                  onValueChange={(value) => setSpeakingConfidence(value as DemoSpeakingConfidence)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select speaking confidence" />
                  </SelectTrigger>
                  <SelectContent>
                    {SPEAKING_CONFIDENCE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Attention</Label>
                <Select
                  value={attentionSpan || undefined}
                  onValueChange={(value) => setAttentionSpan(value as DemoAttentionSpan)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select attention span" />
                  </SelectTrigger>
                  <SelectContent>
                    {ATTENTION_SPAN_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Parent Goal</Label>
                <Select
                  value={parentExpectation || undefined}
                  onValueChange={(value) => setParentExpectation(value as DemoParentExpectation)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select parent expectation" />
                  </SelectTrigger>
                  <SelectContent>
                    {PARENT_EXPECTATION_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Next Step</Label>
                <Select
                  value={recommendedNextStep || undefined}
                  onValueChange={(value) => setRecommendedNextStep(value as DemoRecommendedNextStep)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select next step" />
                  </SelectTrigger>
                  <SelectContent>
                    {NEXT_STEP_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            </div>
            <div className="sticky bottom-0 border-t bg-white/95 px-4 py-3 backdrop-blur sm:px-6">
              <div className="flex flex-col-reverse justify-end gap-2 sm:flex-row">
                <Button type="button" variant="outline" onClick={() => setCompleteTarget(null)}>
                  Cancel
                </Button>
                <Button type="submit" className="w-full sm:w-auto" disabled={completing}>
                  {completing ? 'Saving...' : 'Save Demo Result'}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
