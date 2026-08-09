import { useMemo, useState } from 'react';

import { Badge } from '@components/ui/badge';
import { Button } from '@components/ui/button';
import { Card } from '@components/ui/card';
import { Input } from '@components/ui/input';
import { useToast } from '@components/hooks/use-toast';

import { recordAssessmentSummary } from '../../services/schoolEvidenceService';
import {
  READING_LEVEL_KEYS,
  type AssessmentCheckpoint,
  type AssessmentSummary,
  type ReadingDomainScores,
  type ReadingLevelDistribution,
  type ReadingLevelKey,
  type SchoolSection,
} from '../../types/SchoolProgramme';

const DOMAIN_FIELDS: Array<{ key: keyof ReadingDomainScores; label: string }> = [
  { key: 'phonologicalAwareness', label: 'Phonological awareness' },
  { key: 'soundKnowledge', label: 'Sound knowledge' },
  { key: 'blendingDecoding', label: 'Blending & decoding' },
  { key: 'segmentingEncoding', label: 'Segmenting & spelling' },
  { key: 'connectedText', label: 'Connected-text reading' },
  { key: 'comprehension', label: 'Comprehension' },
];

const emptyDistribution = (): ReadingLevelDistribution => ({
  TS0: 0, TS1: 0, TS2: 0, TS3: 0, TS4: 0,
  TS5: 0, TS6: 0, TS7: 0, TS8: 0, TS9: 0,
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
  const selectedSection = activeSections.find((item) => item.id === sectionId) || null;
  const [studentsAssessed, setStudentsAssessed] = useState(selectedSection?.studentCount || 0);
  const [averageReadingLevel, setAverageReadingLevel] = useState(0);
  const [distribution, setDistribution] = useState<ReadingLevelDistribution>(emptyDistribution());
  const [domains, setDomains] = useState<ReadingDomainScores>(emptyDomains());
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const distributionTotal = useMemo(
    () => READING_LEVEL_KEYS.reduce((sum, key) => sum + distribution[key], 0),
    [distribution],
  );
  const valid = Boolean(
    selectedSection &&
    studentsAssessed > 0 &&
    studentsAssessed <= selectedSection.studentCount &&
    distributionTotal === studentsAssessed &&
    averageReadingLevel >= 0 &&
    averageReadingLevel <= 9,
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
        studentsAssessed,
        averageReadingLevel,
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
          TS-0 to TS-9 is an internal Tiny Steps instructional benchmark for programme monitoring. It is not presented as a nationally standardized or population-normed assessment.
        </p>
      </Card>

      {canEdit && (
        <Card className="p-5">
          <h3 className="text-lg font-semibold text-slate-900">Record section benchmark</h3>
          <p className="mt-1 text-sm text-slate-500">Use defined checkpoints rather than daily testing.</p>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <label className="text-xs text-slate-500">Section
              <select
                className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                value={sectionId}
                onChange={(e) => {
                  const nextId = e.target.value;
                  setSectionId(nextId);
                  const nextSection = activeSections.find((item) => item.id === nextId);
                  setStudentsAssessed(nextSection?.studentCount || 0);
                  setDistribution(emptyDistribution());
                }}
              >
                {activeSections.map((section) => (
                  <option key={section.id} value={section.id}>{section.gradeLabel} — {section.sectionName}</option>
                ))}
              </select>
            </label>
            <label className="text-xs text-slate-500">Checkpoint
              <select className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm" value={checkpoint} onChange={(e) => setCheckpoint(e.target.value as AssessmentCheckpoint)}>
                <option value="baseline">Baseline</option>
                <option value="checkpoint_1">Checkpoint 1</option>
                <option value="mid">Mid-programme</option>
                <option value="final">Final</option>
                <option value="custom">Custom</option>
              </select>
            </label>
            <label className="text-xs text-slate-500">Students assessed
              <Input className="mt-1" type="number" min={1} max={selectedSection?.studentCount || 1} value={studentsAssessed} onChange={(e) => setStudentsAssessed(Number(e.target.value))} />
            </label>
            <label className="text-xs text-slate-500">Average TS level (0–9)
              <Input className="mt-1" type="number" step="0.1" min={0} max={9} value={averageReadingLevel} onChange={(e) => setAverageReadingLevel(Number(e.target.value))} />
            </label>
          </div>

          <div className="mt-5">
            <div className="flex items-center justify-between gap-3">
              <h4 className="text-sm font-semibold text-slate-800">Reading-level distribution</h4>
              <span className={`text-xs ${distributionTotal === studentsAssessed ? 'text-emerald-700' : 'text-amber-700'}`}>
                {distributionTotal}/{studentsAssessed} children allocated
              </span>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-5 lg:grid-cols-10">
              {READING_LEVEL_KEYS.map((key) => (
                <label key={key} className="text-xs text-slate-500">{key}
                  <Input className="mt-1" type="number" min={0} max={studentsAssessed} value={distribution[key]} onChange={(e) => setDistribution((current) => ({ ...current, [key]: Math.max(0, Number(e.target.value)) }))} />
                </label>
              ))}
            </div>
          </div>

          <div className="mt-5">
            <h4 className="text-sm font-semibold text-slate-800">Domain mastery (%)</h4>
            <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {DOMAIN_FIELDS.map((field) => (
                <label key={field.key} className="text-xs text-slate-500">{field.label}
                  <Input
                    className="mt-1"
                    type="number"
                    min={0}
                    max={100}
                    placeholder="Optional"
                    value={domains[field.key] ?? ''}
                    onChange={(e) => setDomains((current) => ({
                      ...current,
                      [field.key]: e.target.value === '' ? null : Number(e.target.value),
                    }))}
                  />
                </label>
              ))}
            </div>
          </div>

          <textarea className="mt-4 min-h-20 w-full rounded-md border border-slate-300 p-3 text-sm" placeholder="Assessment notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
          {!valid && selectedSection && (
            <p className="mt-2 text-xs text-amber-700">
              The TS-level distribution must total the number of children assessed, and all values must remain within the allowed range.
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
            <table className="w-full min-w-[780px] text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="py-2">Section</th>
                  <th className="py-2">Checkpoint</th>
                  <th className="py-2">Assessed</th>
                  <th className="py-2">Average level</th>
                  <th className="py-2">Date</th>
                  <th className="py-2">Version</th>
                </tr>
              </thead>
              <tbody>
                {[...assessments].reverse().map((assessment) => (
                  <tr key={assessment.id} className="border-b border-slate-100">
                    <td className="py-3 font-medium">{assessment.gradeLabel} — {assessment.sectionName}</td>
                    <td className="py-3"><Badge variant="outline">{assessment.checkpoint.replaceAll('_', ' ')}</Badge></td>
                    <td className="py-3">{assessment.studentsAssessed}/{assessment.sectionStudentCountSnapshot}</td>
                    <td className="py-3 font-semibold">TS-{assessment.averageReadingLevel.toFixed(1)}</td>
                    <td className="py-3">{dateText(assessment.assessedAt)}</td>
                    <td className="py-3 text-xs text-slate-500">{assessment.assessmentVersion}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
