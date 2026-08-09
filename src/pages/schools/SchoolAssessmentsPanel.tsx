import { useMemo, useState } from 'react';

import { Badge } from '@components/ui/badge';
import { Button } from '@components/ui/button';
import { Card } from '@components/ui/card';
import { Input } from '@components/ui/input';
import { useToast } from '@components/hooks/use-toast';

import {
  ASSESSMENT_CHECKPOINT_LABELS,
  READING_DOMAIN_DEFINITIONS,
  READING_LEVEL_DEFINITIONS,
  averageReadingLevelFromDistribution,
} from '../../constants/schoolAssessment';
import { recordAssessmentSummary } from '../../services/schoolEvidenceService';
import {
  type AssessmentCheckpoint,
  type AssessmentSummary,
  type ReadingDomainScores,
  type ReadingLevelDistribution,
  type SchoolSection,
} from '../../types/SchoolProgramme';

const emptyDistribution = (): ReadingLevelDistribution => ({
  TS0: 0,
  TS1: 0,
  TS2: 0,
  TS3: 0,
  TS4: 0,
  TS5: 0,
  TS6: 0,
  TS7: 0,
  TS8: 0,
  TS9: 0,
});

const emptyDomains = (): ReadingDomainScores => ({
  phonologicalAwareness: null,
  soundKnowledge: null,
  blendingDecoding: null,
  segmentingEncoding: null,
  connectedText: null,
  comprehension: null,
});

const dateText = (value: unknown): string => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return new Date(value).toLocaleDateString();
  }
  if (value instanceof Date) return value.toLocaleDateString();
  if (typeof value === 'string') {
    const millis = new Date(value).getTime();
    if (Number.isFinite(millis)) return new Date(millis).toLocaleDateString();
  }
  if (value && typeof value === 'object' && 'toDate' in value) {
    const fn = (value as { toDate?: () => Date }).toDate;
    if (typeof fn === 'function') return fn.call(value).toLocaleDateString();
  }
  return '—';
};

interface Props {
  schoolId: string;
  academicYearId: string;
  sections: SchoolSection[];
  assessments: AssessmentSummary[];
  canEdit: boolean;
  onRefresh: () => Promise<void>;
}

export default function SchoolAssessmentsPanel({
  schoolId,
  academicYearId,
  sections,
  assessments,
  canEdit,
  onRefresh,
}: Props) {
  const { toast } = useToast();
  const activeSections = sections.filter((item) => item.status === 'active');
  const [sectionId, setSectionId] = useState(activeSections[0]?.id || '');
  const [checkpoint, setCheckpoint] = useState<AssessmentCheckpoint>('baseline');
  const [distribution, setDistribution] = useState<ReadingLevelDistribution>(emptyDistribution());
  const [domains, setDomains] = useState<ReadingDomainScores>(emptyDomains());
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const selectedSection = activeSections.find((item) => item.id === sectionId) || null;
  const calculated = useMemo(
    () => averageReadingLevelFromDistribution(distribution),
    [distribution],
  );
  const coveragePercent = selectedSection && selectedSection.studentCount > 0
    ? Math.round((calculated.studentsAssessed / selectedSection.studentCount) * 10000) / 100
    : 0;
  const valid = Boolean(
    selectedSection &&
    calculated.studentsAssessed > 0 &&
    calculated.studentsAssessed <= selectedSection.studentCount,
  );

  const submit = async () => {
    if (!selectedSection || !valid) return;
    setSaving(true);
    try {
      await recordAssessmentSummary({
        schoolId,
        academicYearId,
        sectionId: selectedSection.id,
        checkpoint,
        studentsAssessed: calculated.studentsAssessed,
        averageReadingLevel: calculated.averageReadingLevel,
        levelDistribution: distribution,
        domainScores: domains,
        notes,
      });
      setDistribution(emptyDistribution());
      setDomains(emptyDomains());
      setNotes('');
      await onRefresh();
      toast({ title: 'Reading benchmark recorded' });
    } catch (error) {
      toast({
        title: 'Unable to record benchmark',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="border-blue-100 bg-blue-50/50 p-4">
        <p className="text-sm font-semibold text-blue-950">Tiny Steps Early Reading Benchmark</p>
        <p className="mt-1 text-xs leading-5 text-blue-800">
          TS-0 to TS-9 is an internal Tiny Steps instructional scale used to monitor programme progress. It is not presented as a nationally standardized or population-normed assessment.
        </p>
      </Card>

      <Card className="p-5">
        <h3 className="text-base font-semibold text-slate-900">TS reading-level reference</h3>
        <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-5">
          {READING_LEVEL_DEFINITIONS.map((level) => (
            <div key={level.key} className="rounded-xl border border-slate-200 p-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline">{level.key}</Badge>
                <p className="text-sm font-semibold text-slate-800">{level.shortLabel}</p>
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-500">{level.description}</p>
            </div>
          ))}
        </div>
      </Card>

      {canEdit && (
        <Card className="p-5">
          <h3 className="text-lg font-semibold text-slate-900">Record section benchmark</h3>
          <p className="mt-1 text-sm text-slate-500">
            Enter the number of assessed children at each TS level. The assessed total, coverage and average TS level are calculated automatically.
          </p>

          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <label className="text-xs text-slate-500">
              Section
              <select
                className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                value={sectionId}
                onChange={(event) => {
                  setSectionId(event.target.value);
                  setDistribution(emptyDistribution());
                }}
              >
                {activeSections.map((section) => (
                  <option key={section.id} value={section.id}>
                    {section.gradeLabel} — {section.sectionName}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-xs text-slate-500">
              Checkpoint
              <select
                className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                value={checkpoint}
                onChange={(event) => setCheckpoint(event.target.value as AssessmentCheckpoint)}
              >
                {(Object.keys(ASSESSMENT_CHECKPOINT_LABELS) as AssessmentCheckpoint[]).map((key) => (
                  <option key={key} value={key}>{ASSESSMENT_CHECKPOINT_LABELS[key]}</option>
                ))}
              </select>
            </label>

            <Metric label="Children assessed" value={`${calculated.studentsAssessed}${selectedSection ? ` / ${selectedSection.studentCount}` : ''}`} />
            <Metric label="Calculated average" value={`TS-${calculated.averageReadingLevel.toFixed(2)} · ${coveragePercent.toFixed(0)}% coverage`} />
          </div>

          <div className="mt-5">
            <div className="flex items-center justify-between gap-3">
              <h4 className="text-sm font-semibold text-slate-800">Reading-level distribution</h4>
              {selectedSection && calculated.studentsAssessed > selectedSection.studentCount && (
                <span className="text-xs font-medium text-red-700">
                  Distribution exceeds the section count by {calculated.studentsAssessed - selectedSection.studentCount}.
                </span>
              )}
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-5 lg:grid-cols-10">
              {READING_LEVEL_DEFINITIONS.map((definition) => (
                <label key={definition.key} className="text-xs text-slate-500">
                  {definition.key}
                  <Input
                    className="mt-1"
                    type="number"
                    min={0}
                    max={selectedSection?.studentCount || 500}
                    value={distribution[definition.key]}
                    onChange={(event) =>
                      setDistribution((current) => ({
                        ...current,
                        [definition.key]: Math.max(0, Math.floor(Number(event.target.value) || 0)),
                      }))
                    }
                  />
                </label>
              ))}
            </div>
          </div>

          <div className="mt-5">
            <h4 className="text-sm font-semibold text-slate-800">Domain mastery (%)</h4>
            <p className="mt-1 text-xs text-slate-500">
              Add a domain percentage only when that domain was actually assessed at this checkpoint.
            </p>
            <div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {READING_DOMAIN_DEFINITIONS.map((field) => (
                <label key={field.key} className="text-xs text-slate-500">
                  {field.label}
                  <Input
                    className="mt-1"
                    type="number"
                    min={0}
                    max={100}
                    placeholder="Optional"
                    value={domains[field.key] ?? ''}
                    onChange={(event) =>
                      setDomains((current) => ({
                        ...current,
                        [field.key]: event.target.value === '' ? null : Number(event.target.value),
                      }))
                    }
                  />
                  <span className="mt-1 block text-[11px] leading-4 text-slate-400">{field.description}</span>
                </label>
              ))}
            </div>
          </div>

          <textarea
            className="mt-4 min-h-20 w-full rounded-md border border-slate-300 p-3 text-sm"
            placeholder="Assessment notes (optional)"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />

          {!valid && selectedSection && calculated.studentsAssessed === 0 && (
            <p className="mt-2 text-xs text-amber-700">
              Allocate at least one assessed child to a TS level before recording the checkpoint.
            </p>
          )}

          <Button className="mt-3" type="button" disabled={!valid || saving} onClick={() => void submit()}>
            {saving ? 'Recording…' : 'Record benchmark'}
          </Button>
        </Card>
      )}

      <Card className="p-5">
        <h3 className="text-lg font-semibold text-slate-900">Assessment history</h3>
        {assessments.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">No reading benchmarks recorded yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="py-2">Section</th>
                  <th className="py-2">Checkpoint</th>
                  <th className="py-2">Coverage</th>
                  <th className="py-2">Average level</th>
                  <th className="py-2">Date</th>
                  <th className="py-2">Version</th>
                </tr>
              </thead>
              <tbody>
                {[...assessments].reverse().map((assessment) => {
                  const coverage = assessment.sectionStudentCountSnapshot > 0
                    ? Math.round((assessment.studentsAssessed / assessment.sectionStudentCountSnapshot) * 100)
                    : 0;
                  return (
                    <tr key={assessment.id} className="border-b border-slate-100">
                      <td className="py-3 font-medium">{assessment.gradeLabel} — {assessment.sectionName}</td>
                      <td className="py-3"><Badge variant="outline">{ASSESSMENT_CHECKPOINT_LABELS[assessment.checkpoint]}</Badge></td>
                      <td className="py-3">{assessment.studentsAssessed}/{assessment.sectionStudentCountSnapshot} · {coverage}%</td>
                      <td className="py-3 font-semibold">TS-{assessment.averageReadingLevel.toFixed(2)}</td>
                      <td className="py-3">{dateText(assessment.assessedAt)}</td>
                      <td className="py-3 text-xs text-slate-500">{assessment.assessmentVersion}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}
