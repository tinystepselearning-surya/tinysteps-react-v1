import { Download, Printer } from 'lucide-react';

import { Badge } from '@components/ui/badge';
import { Button } from '@components/ui/button';
import { Card } from '@components/ui/card';

import type { SchoolRecord } from '../../types/School';
import type {
  SchoolEvidenceSnapshot,
  SchoolProgressSnapshot,
  SchoolStructureSnapshot,
} from '../../types/SchoolProgramme';
import { buildSectionHealthMap } from '../../lib/schoolIntelligence';
import { buildSchoolAnalytics, buildSchoolSummaryCsv } from '../../lib/schoolAnalytics';
import './schoolReportPrint.css';

interface Props {
  school: SchoolRecord;
  structure: SchoolStructureSnapshot;
  progress: SchoolProgressSnapshot;
  evidence: SchoolEvidenceSnapshot;
}

export default function SchoolReportPanel({ school, structure, progress, evidence }: Props) {
  const healthBySection = buildSectionHealthMap({
    sections: structure.sections.filter((item) => item.status === 'active'),
    curriculum: progress.curriculum,
    training: progress.training,
    assessments: evidence.assessments,
  });
  const analytics = buildSchoolAnalytics({
    structure,
    assessments: evidence.assessments,
    healthBySection,
  });

  const download = () => {
    const csv = buildSchoolSummaryCsv({
      schoolName: school.name,
      academicYearLabel: structure.currentAcademicYear?.label || '',
      analytics,
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${school.schoolCode}-${structure.currentAcademicYear?.label || 'school-report'}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5 bg-white" data-school-management-report>
      <div className="school-report-no-print flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Management report</h3>
          <p className="text-sm text-slate-500">Executive view of implementation, evidence coverage and early-reading progress.</p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" className="gap-2" onClick={download}>
            <Download className="h-4 w-4" /> CSV
          </Button>
          <Button type="button" variant="outline" className="gap-2" onClick={() => window.print()}>
            <Printer className="h-4 w-4" /> Print / PDF
          </Button>
        </div>
      </div>

      <Card className="p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">Tiny Steps School Partnership</p>
        <h2 className="mt-1 text-2xl font-bold text-slate-900">{school.name}</h2>
        <p className="text-sm text-slate-500">{structure.currentAcademicYear?.label || 'Academic year not configured'} · {school.schoolCode}</p>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ['Students', analytics.students],
          ['Classes', analytics.grades],
          ['Sections', analytics.sections],
          ['Teachers', analytics.teachers],
        ].map(([label, value]) => (
          <Card key={label} className="p-4">
            <p className="text-xs text-slate-500">{label}</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatusCard label="On track" value={analytics.onTrack} tone="green" />
        <StatusCard label="Needs support" value={analytics.needsSupport} tone="amber" />
        <StatusCard label="Intervention" value={analytics.intervention} tone="red" />
        <StatusCard label="Insufficient data" value={analytics.insufficientData} tone="slate" />
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <MetricCard label="Baseline reading level" value={analytics.baselineReadingLevel === null ? '—' : `TS-${analytics.baselineReadingLevel.toFixed(2)}`} />
        <MetricCard label="Current reading level" value={analytics.currentReadingLevel === null ? '—' : `TS-${analytics.currentReadingLevel.toFixed(2)}`} />
        <MetricCard
          label={`Matched growth${analytics.matchedGrowthSections ? ` · ${analytics.matchedGrowthSections} section${analytics.matchedGrowthSections === 1 ? '' : 's'}` : ''}`}
          value={analytics.readingLevelGrowth === null ? '—' : `${analytics.readingLevelGrowth >= 0 ? '+' : ''}${analytics.readingLevelGrowth.toFixed(2)} TS levels`}
        />
      </div>

      <Card className="p-5">
        <h3 className="font-semibold text-slate-900">Section implementation health</h3>
        <p className="mt-1 text-xs text-slate-500">
          Internal programme-health signal based on verified curriculum stage, latest aggregate benchmark and assigned-teacher training evidence. It is not an external standardized rating.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[1080px] text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="py-2">Section</th>
                <th className="py-2">Students</th>
                <th className="py-2">Curriculum</th>
                <th className="py-2">Programme reference</th>
                <th className="py-2">Demonstrated</th>
                <th className="py-2">Gap</th>
                <th className="py-2">Training</th>
                <th className="py-2">Status</th>
                <th className="py-2">Reason</th>
              </tr>
            </thead>
            <tbody>
              {structure.sections.filter((item) => item.status === 'active').map((section) => {
                const health = healthBySection.get(section.id);
                return (
                  <tr key={section.id} className="border-b border-slate-100 align-top">
                    <td className="py-3 font-medium">{section.gradeLabel} — {section.sectionName}</td>
                    <td className="py-3">{section.studentCount}</td>
                    <td className="py-3">{health?.curriculumPercent ?? 0}%</td>
                    <td className="py-3">{health?.expectedReadingLevel === null || health?.expectedReadingLevel === undefined ? '—' : `TS-${health.expectedReadingLevel}`}</td>
                    <td className="py-3">{health?.demonstratedReadingLevel === null || health?.demonstratedReadingLevel === undefined ? '—' : `TS-${health.demonstratedReadingLevel.toFixed(2)}`}</td>
                    <td className="py-3">{health?.benchmarkGap === null || health?.benchmarkGap === undefined ? '—' : health.benchmarkGap.toFixed(2)}</td>
                    <td className="py-3">{health?.teacherTrainingPercent === null || health?.teacherTrainingPercent === undefined ? '—' : `${health.teacherTrainingPercent}%`}</td>
                    <td className="py-3"><HealthBadge status={health?.status || 'insufficient_data'} /></td>
                    <td className="max-w-[280px] py-3 text-xs leading-5 text-slate-500">{health?.reason || 'No programme-health evidence available.'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="font-semibold text-slate-900">Current reading level by class</h3>
          <div className="mt-4 space-y-3">
            {analytics.gradesSummary.map((grade) => (
              <div key={grade.gradeId} className="flex items-center justify-between gap-4 border-b border-slate-100 pb-2">
                <div>
                  <p className="font-medium text-slate-800">{grade.gradeLabel}</p>
                  <p className="text-xs text-slate-500">{grade.sections} sections · {grade.students} students</p>
                </div>
                <p className="text-lg font-bold text-slate-900">{grade.averageReadingLevel === null ? '—' : `TS-${grade.averageReadingLevel.toFixed(2)}`}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold text-slate-900">Reading-domain growth</h3>
          <p className="mt-1 text-xs text-slate-500">Baseline-to-current changes use only sections with both baseline and a later checkpoint for that domain.</p>
          <div className="mt-4 space-y-3">
            {analytics.domainProgress.map((domain) => (
              <div key={domain.key} className="grid grid-cols-[1fr_70px_70px_70px] gap-2 border-b border-slate-100 pb-2 text-sm">
                <span className="font-medium text-slate-800">{domain.label}</span>
                <span className="text-right text-slate-500">{domain.baseline === null ? '—' : `${domain.baseline.toFixed(0)}%`}</span>
                <span className="text-right font-semibold text-slate-800">{domain.current === null ? '—' : `${domain.current.toFixed(0)}%`}</span>
                <span className="text-right text-slate-600">{domain.change === null ? '—' : `${domain.change >= 0 ? '+' : ''}${domain.change.toFixed(0)}`}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-4 text-xs leading-5 text-slate-500">
        Reading levels and programme-reference levels in this report are Tiny Steps internal instructional descriptors. Management should interpret growth together with assessment coverage, classroom review evidence and teacher-training progress.
      </Card>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-bold text-slate-900">{value}</p>
    </Card>
  );
}

function StatusCard({ label, value, tone }: { label: string; value: number; tone: 'green' | 'amber' | 'red' | 'slate' }) {
  const classes = {
    green: 'border-emerald-200 bg-emerald-50',
    amber: 'border-amber-200 bg-amber-50',
    red: 'border-red-200 bg-red-50',
    slate: 'border-slate-200 bg-slate-50',
  }[tone];
  return (
    <Card className={`p-4 ${classes}`}>
      <p className="text-xs text-slate-600">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
    </Card>
  );
}

function HealthBadge({ status }: { status: 'on_track' | 'needs_support' | 'intervention' | 'insufficient_data' }) {
  const label = {
    on_track: 'On track',
    needs_support: 'Needs support',
    intervention: 'Intervention',
    insufficient_data: 'Insufficient data',
  }[status];
  return <Badge variant={status === 'on_track' ? 'default' : 'outline'}>{label}</Badge>;
}
