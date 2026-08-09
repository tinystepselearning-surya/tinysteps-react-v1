import { useCallback, useEffect, useMemo, useState } from 'react';

import { Badge } from '@components/ui/badge';
import { Button } from '@components/ui/button';
import { Card } from '@components/ui/card';
import { Input } from '@components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@components/ui/tabs';
import { useToast } from '@components/hooks/use-toast';

import { SCHOOL_PHONICS_COURSES, type SchoolPhonicsCourseId } from '../../constants/schoolCurriculum';
import type { SchoolRecord } from '../../types/School';
import type {
  CurriculumProgressStatus,
  SchoolEvidenceSnapshot,
  SchoolProgressSnapshot,
  SchoolSection,
  SchoolStructureSnapshot,
  SchoolTeacherRecord,
  SectionCurriculumProgress,
  TeacherTrainingProgress,
  TeacherTrainingStatus,
} from '../../types/SchoolProgramme';
import {
  getSchoolProgress,
  getSchoolStructure,
  updateSectionCurriculumProgress,
  updateTeacherTraining,
} from '../../services/schoolProgrammeService';
import { getSchoolEvidence } from '../../services/schoolEvidenceService';
import { buildSectionHealthMap } from '../../lib/schoolIntelligence';
import SchoolStructureWorkspace from './SchoolStructureWorkspace';
import SchoolReviewsPanel from './SchoolReviewsPanel';
import SchoolAssessmentsPanel from './SchoolAssessmentsPanel';
import SchoolReportPanel from './SchoolReportPanel';

const errorText = (error: unknown) =>
  error instanceof Error ? error.message : 'Please try again.';

interface Props {
  school: SchoolRecord;
  canEdit: boolean;
  defaultTab?: string;
}

const EMPTY_EVIDENCE: SchoolEvidenceSnapshot = { reviews: [], assessments: [] };

export default function SchoolProgrammeWorkspace({ school, canEdit, defaultTab = 'overview' }: Props) {
  const { toast } = useToast();
  const [tab, setTab] = useState(defaultTab);
  const [structure, setStructure] = useState<SchoolStructureSnapshot | null>(null);
  const [progress, setProgress] = useState<SchoolProgressSnapshot>({ curriculum: [], training: [] });
  const [evidence, setEvidence] = useState<SchoolEvidenceSnapshot>(EMPTY_EVIDENCE);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const nextStructure = await getSchoolStructure(school.id);
      setStructure(nextStructure);
      if (nextStructure.currentAcademicYear) {
        const [nextProgress, nextEvidence] = await Promise.all([
          getSchoolProgress(school.id, nextStructure.currentAcademicYear.id),
          getSchoolEvidence(school.id, nextStructure.currentAcademicYear.id),
        ]);
        setProgress(nextProgress);
        setEvidence(nextEvidence);
      } else {
        setProgress({ curriculum: [], training: [] });
        setEvidence(EMPTY_EVIDENCE);
      }
    } catch (error) {
      toast({
        title: 'Unable to load school programme',
        description: errorText(error),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [school.id, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const curriculumBySection = useMemo(
    () => new Map(progress.curriculum.map((item) => [item.sectionId, item])),
    [progress.curriculum],
  );
  const trainingByTeacher = useMemo(
    () => new Map(progress.training.map((item) => [item.teacherId, item])),
    [progress.training],
  );
  const healthBySection = useMemo(
    () =>
      buildSectionHealthMap({
        sections: structure?.sections || [],
        curriculum: progress.curriculum,
        training: progress.training,
        assessments: evidence.assessments,
      }),
    [structure?.sections, progress.curriculum, progress.training, evidence.assessments],
  );

  if (loading && !structure) {
    return <Card className="p-8 text-center text-sm text-slate-500">Loading school programme…</Card>;
  }

  return (
    <Tabs value={tab} onValueChange={setTab} className="space-y-5">
      <TabsList className="flex h-auto flex-wrap justify-start gap-1 bg-slate-100 p-1">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="structure">Structure</TabsTrigger>
        <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
        <TabsTrigger value="training">Training</TabsTrigger>
        <TabsTrigger value="reviews">Reviews</TabsTrigger>
        <TabsTrigger value="assessments">Assessments</TabsTrigger>
        <TabsTrigger value="report">Report</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="mt-0">
        <ProgrammeOverview
          school={school}
          structure={structure}
          progress={progress}
          healthBySection={healthBySection}
        />
      </TabsContent>

      <TabsContent value="structure" className="mt-0">
        <SchoolStructureWorkspace school={school} canEdit={canEdit} />
      </TabsContent>

      <TabsContent value="curriculum" className="mt-0">
        {!structure?.currentAcademicYear ? (
          <Card className="p-6 text-sm text-slate-500">Configure a current academic year first.</Card>
        ) : (
          <Card className="p-5">
            <h3 className="text-lg font-semibold text-slate-900">Section curriculum progress</h3>
            <p className="mt-1 text-sm text-slate-500">
              Periodic verified progress only — school teachers are not expected to mark every lesson.
            </p>
            <div className="mt-4 space-y-3">
              {structure.sections.filter((section) => section.status === 'active').map((section) => (
                <CurriculumRow
                  key={section.id}
                  section={section}
                  current={curriculumBySection.get(section.id) || null}
                  canEdit={canEdit}
                  onSave={async (value) => {
                    await updateSectionCurriculumProgress({
                      schoolId: school.id,
                      academicYearId: structure.currentAcademicYear!.id,
                      sectionId: section.id,
                      ...value,
                    });
                    await load();
                    toast({ title: `${section.gradeLabel} ${section.sectionName} curriculum updated` });
                  }}
                />
              ))}
            </div>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="training" className="mt-0">
        {!structure?.currentAcademicYear ? (
          <Card className="p-6 text-sm text-slate-500">Configure a current academic year first.</Card>
        ) : (
          <Card className="p-5">
            <h3 className="text-lg font-semibold text-slate-900">Teacher training progress</h3>
            <p className="mt-1 text-sm text-slate-500">
              Tiny Steps records training checkpoints; school teachers do not maintain this dashboard.
            </p>
            <div className="mt-4 space-y-3">
              {structure.teachers.filter((teacher) => teacher.status === 'active').map((teacher) => (
                <TrainingRow
                  key={teacher.id}
                  teacher={teacher}
                  current={trainingByTeacher.get(teacher.id) || null}
                  canEdit={canEdit}
                  onSave={async (value) => {
                    await updateTeacherTraining({
                      schoolId: school.id,
                      academicYearId: structure.currentAcademicYear!.id,
                      teacherId: teacher.id,
                      ...value,
                    });
                    await load();
                    toast({ title: `${teacher.name} training updated` });
                  }}
                />
              ))}
            </div>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="reviews" className="mt-0">
        {!structure?.currentAcademicYear ? (
          <Card className="p-6 text-sm text-slate-500">Configure a current academic year first.</Card>
        ) : (
          <SchoolReviewsPanel
            schoolId={school.id}
            academicYearId={structure.currentAcademicYear.id}
            sections={structure.sections}
            reviews={evidence.reviews}
            canEdit={canEdit}
            onRefresh={load}
          />
        )}
      </TabsContent>

      <TabsContent value="assessments" className="mt-0">
        {!structure?.currentAcademicYear ? (
          <Card className="p-6 text-sm text-slate-500">Configure a current academic year first.</Card>
        ) : (
          <SchoolAssessmentsPanel
            schoolId={school.id}
            academicYearId={structure.currentAcademicYear.id}
            sections={structure.sections}
            assessments={evidence.assessments}
            canEdit={canEdit}
            onRefresh={load}
          />
        )}
      </TabsContent>

      <TabsContent value="report" className="mt-0">
        {!structure ? null : (
          <SchoolReportPanel school={school} structure={structure} progress={progress} evidence={evidence} />
        )}
      </TabsContent>
    </Tabs>
  );
}

function ProgrammeOverview({
  school,
  structure,
  progress,
  healthBySection,
}: {
  school: SchoolRecord;
  structure: SchoolStructureSnapshot | null;
  progress: SchoolProgressSnapshot;
  healthBySection: ReturnType<typeof buildSectionHealthMap>;
}) {
  const health = Array.from(healthBySection.values());
  const onTrack = health.filter((item) => item.status === 'on_track').length;
  const needsSupport = health.filter((item) => item.status === 'needs_support').length;
  const intervention = health.filter((item) => item.status === 'intervention').length;
  const trainingComplete = progress.training.filter((item) => item.status === 'completed').length;
  return (
    <div className="space-y-4">
      <Card className="p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">Tiny Steps School Partnership</p>
        <h2 className="mt-1 text-2xl font-bold text-slate-900">{school.name}</h2>
        <p className="text-sm text-slate-500">
          {structure?.currentAcademicYear?.label || 'Academic year not configured'} · {school.learningPartnerName || 'Learning Partner not assigned'}
        </p>
      </Card>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ['Classes', structure?.totals.grades ?? 0],
          ['Sections', structure?.totals.sections ?? 0],
          ['Students', structure?.totals.students ?? 0],
          ['Teachers', structure?.totals.teachers ?? 0],
          ['On track', onTrack],
          ['Needs support', needsSupport],
          ['Intervention', intervention],
          ['Training completed', trainingComplete],
        ].map(([label, value]) => (
          <Card key={label} className="p-4">
            <p className="text-xs text-slate-500">{label}</p>
            <p className="mt-1 text-xl font-bold text-slate-900">{value}</p>
          </Card>
        ))}
      </div>
      <Card className="p-4 text-xs leading-5 text-slate-500">
        Programme-health statuses are internal operational signals based on verified curriculum stage, the latest aggregate Tiny Steps reading benchmark, and available teacher-training progress. They are not external standardized ratings.
      </Card>
    </div>
  );
}

function CurriculumRow({
  section,
  current,
  canEdit,
  onSave,
}: {
  section: SchoolSection;
  current: SectionCurriculumProgress | null;
  canEdit: boolean;
  onSave: (value: {
    courseId: SchoolPhonicsCourseId;
    stageOrder: number;
    status: CurriculumProgressStatus;
    notes?: string;
  }) => Promise<void>;
}) {
  const [courseId, setCourseId] = useState<SchoolPhonicsCourseId>(
    current?.courseId || 'phonics-foundations',
  );
  const [stageOrder, setStageOrder] = useState(current?.stageOrder || 0);
  const [status, setStatus] = useState<CurriculumProgressStatus>(current?.status || 'not_started');
  const [saving, setSaving] = useState(false);
  const course = SCHOOL_PHONICS_COURSES.find((item) => item.id === courseId)!;

  const save = async () => {
    setSaving(true);
    try {
      await onSave({ courseId, stageOrder, status });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="grid gap-3 lg:grid-cols-[180px_1fr_1fr_1fr_auto] lg:items-center">
        <div>
          <p className="font-semibold text-slate-900">{section.gradeLabel} — {section.sectionName}</p>
          <p className="text-xs text-slate-500">{section.studentCount} students</p>
        </div>
        {canEdit ? (
          <>
            <select className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm" value={courseId} onChange={(e) => { setCourseId(e.target.value as SchoolPhonicsCourseId); setStageOrder(0); setStatus('not_started'); }}>
              {SCHOOL_PHONICS_COURSES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>
            <select className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm" value={stageOrder} onChange={(e) => { const next = Number(e.target.value); setStageOrder(next); setStatus(next === 0 ? 'not_started' : next === 6 ? 'completed' : 'on_track'); }}>
              <option value={0}>Not started</option>
              {course.stages.map((stage) => <option key={stage.stageOrder} value={stage.stageOrder}>{stage.label}</option>)}
            </select>
            <select className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm" value={status} onChange={(e) => setStatus(e.target.value as CurriculumProgressStatus)}>
              <option value="not_started">Not started</option>
              <option value="on_track">On track</option>
              <option value="needs_attention">Needs attention</option>
              <option value="completed">Completed</option>
            </select>
            <Button type="button" size="sm" disabled={saving} onClick={() => void save()}>{saving ? 'Saving…' : 'Save'}</Button>
          </>
        ) : (
          <>
            <p className="text-sm text-slate-700">{current?.courseLabel || 'Not started'}</p>
            <p className="text-sm text-slate-700">{current?.stageLabel || 'Not started'}</p>
            <Badge variant="outline">{current?.status || 'not_started'}</Badge>
            <span />
          </>
        )}
      </div>
      {current && <p className="mt-2 text-xs text-slate-500">Verified progress: {current.progressPercent}%</p>}
    </div>
  );
}

function TrainingRow({
  teacher,
  current,
  canEdit,
  onSave,
}: {
  teacher: SchoolTeacherRecord;
  current: TeacherTrainingProgress | null;
  canEdit: boolean;
  onSave: (value: {
    completedUnits: number;
    totalUnits: number;
    currentStage: number;
    status: TeacherTrainingStatus;
  }) => Promise<void>;
}) {
  const [completed, setCompleted] = useState(current?.completedUnits || 0);
  const [total, setTotal] = useState(current?.totalUnits || 10);
  const [status, setStatus] = useState<TeacherTrainingStatus>(current?.status || 'not_started');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const safeTotal = Math.max(1, total);
      const safeCompleted = Math.max(0, Math.min(completed, safeTotal));
      await onSave({
        completedUnits: safeCompleted,
        totalUnits: safeTotal,
        currentStage: safeCompleted,
        status: safeCompleted === 0 ? 'not_started' : safeCompleted === safeTotal ? 'completed' : status === 'training_due' ? 'training_due' : 'on_track',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="grid gap-3 lg:grid-cols-[220px_120px_120px_1fr_auto] lg:items-center">
        <div>
          <p className="font-semibold text-slate-900">{teacher.name}</p>
          <p className="text-xs text-slate-500">{teacher.designation || 'Teacher'}</p>
        </div>
        {canEdit ? (
          <>
            <label className="text-xs text-slate-500">Completed<Input className="mt-1" type="number" min={0} value={completed} onChange={(e) => setCompleted(Number(e.target.value))} /></label>
            <label className="text-xs text-slate-500">Total<Input className="mt-1" type="number" min={1} value={total} onChange={(e) => setTotal(Number(e.target.value))} /></label>
            <select className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm" value={status} onChange={(e) => setStatus(e.target.value as TeacherTrainingStatus)}>
              <option value="not_started">Not started</option>
              <option value="on_track">On track</option>
              <option value="training_due">Training due</option>
              <option value="completed">Completed</option>
            </select>
            <Button type="button" size="sm" disabled={saving} onClick={() => void save()}>{saving ? 'Saving…' : 'Save'}</Button>
          </>
        ) : (
          <>
            <p className="text-sm">{current ? `${current.completedUnits}/${current.totalUnits}` : 'Not started'}</p>
            <p className="text-sm">{current?.progressPercent || 0}%</p>
            <Badge variant="outline">{current?.status || 'not_started'}</Badge>
            <span />
          </>
        )}
      </div>
    </div>
  );
}
