import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, RefreshCw } from 'lucide-react';

import { Badge } from '@components/ui/badge';
import { Button } from '@components/ui/button';
import { Card } from '@components/ui/card';
import { Input } from '@components/ui/input';
import { useToast } from '@components/hooks/use-toast';

import type { SchoolRecord } from '../../types/School';
import {
  DEFAULT_SCHOOL_GRADES,
  type SchoolStructureSnapshot,
} from '../../types/SchoolProgramme';
import {
  createAcademicYear,
  getSchoolStructure,
  setCurrentAcademicYear,
  setSchoolGradeStatus,
  setSchoolSectionStatus,
  setSchoolTeacherStatus,
  upsertSchoolGrade,
  upsertSchoolSection,
  upsertSchoolTeacher,
} from '../../services/schoolProgrammeService';

const message = (error: unknown) =>
  error instanceof Error ? error.message : 'Please try again.';

interface Props {
  school: SchoolRecord;
  canEdit: boolean;
}

export default function SchoolStructureWorkspace({ school, canEdit }: Props) {
  const { toast } = useToast();
  const [snapshot, setSnapshot] = useState<SchoolStructureSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedYearId, setSelectedYearId] = useState<string | null>(
    (school as SchoolRecord & { currentAcademicYearId?: string | null }).currentAcademicYearId || null,
  );
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const next = await getSchoolStructure(school.id, selectedYearId);
      setSnapshot(next);
      if (next.currentAcademicYear && next.currentAcademicYear.id !== selectedYearId) {
        setSelectedYearId(next.currentAcademicYear.id);
      }
    } catch (error) {
      toast({
        title: 'Unable to load school structure',
        description: message(error),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [school.id, selectedYearId, toast]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const teachersById = useMemo(
    () => new Map((snapshot?.teachers || []).map((teacher) => [teacher.id, teacher])),
    [snapshot?.teachers],
  );

  const run = async (work: () => Promise<unknown>, success: string) => {
    setBusy(true);
    try {
      await work();
      await refresh();
      toast({ title: success });
    } catch (error) {
      toast({ title: 'Unable to save', description: message(error), variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  if (loading && !snapshot) {
    return <div className="p-6 text-sm text-slate-500">Loading academic structure…</div>;
  }

  if (!snapshot) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Academic Structure</h2>
          <p className="text-sm text-slate-500">
            {school.name} · Academic years, classes, sections, student counts and school teachers.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => void refresh()}>
          <RefreshCw className="h-4 w-4" /> Refresh
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ['Classes', snapshot.totals.grades],
          ['Sections', snapshot.totals.sections],
          ['Students', snapshot.totals.students],
          ['Teachers', snapshot.totals.teachers],
        ].map(([label, value]) => (
          <Card key={label} className="p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
          </Card>
        ))}
      </div>

      <Card className="p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-semibold text-slate-900">Academic year</h3>
            <p className="text-xs text-slate-500">Only one year is current at a time.</p>
          </div>
          <select
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
            value={snapshot.currentAcademicYear?.id || ''}
            onChange={(event) => setSelectedYearId(event.target.value || null)}
          >
            {snapshot.academicYears.length === 0 && <option value="">No academic year</option>}
            {snapshot.academicYears.map((year) => (
              <option key={year.id} value={year.id}>{year.label} · {year.status}</option>
            ))}
          </select>
        </div>
        {canEdit && (
          <AcademicYearForm
            disabled={busy}
            onCreate={(startYear, makeCurrent) =>
              run(
                () => createAcademicYear({ schoolId: school.id, startYear, makeCurrent }),
                'Academic year created',
              )
            }
            onMakeCurrent={
              snapshot.currentAcademicYear
                ? undefined
                : undefined
            }
          />
        )}
        {canEdit && snapshot.academicYears.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {snapshot.academicYears
              .filter((year) => year.status !== 'current')
              .map((year) => (
                <Button
                  key={year.id}
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={() =>
                    run(
                      () => setCurrentAcademicYear({ schoolId: school.id, academicYearId: year.id }),
                      `${year.label} is now current`,
                    )
                  }
                >
                  Make {year.label} current
                </Button>
              ))}
          </div>
        )}
      </Card>

      {!snapshot.currentAcademicYear ? (
        <Card className="p-6 text-center text-sm text-slate-500">
          Create an academic year to configure classes and sections.
        </Card>
      ) : (
        <>
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-900">Classes / Grades</h3>
                <p className="text-xs text-slate-500">Configure the grades participating in the programme.</p>
              </div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {snapshot.grades.map((grade) => (
                <div key={grade.id} className="rounded-xl border border-slate-200 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-900">{grade.label}</p>
                      <p className="text-xs text-slate-500">{grade.gradeKey}</p>
                    </div>
                    <Badge variant={grade.status === 'active' ? 'default' : 'secondary'}>{grade.status}</Badge>
                  </div>
                  {canEdit && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="mt-2"
                      disabled={busy}
                      onClick={() =>
                        run(
                          () => setSchoolGradeStatus({
                            schoolId: school.id,
                            academicYearId: snapshot.currentAcademicYear!.id,
                            gradeId: grade.id,
                            status: grade.status === 'active' ? 'inactive' : 'active',
                          }),
                          'Grade status updated',
                        )
                      }
                    >
                      {grade.status === 'active' ? 'Deactivate' : 'Reactivate'}
                    </Button>
                  )}
                </div>
              ))}
            </div>
            {canEdit && (
              <GradeQuickAdd
                disabled={busy}
                existingKeys={new Set(snapshot.grades.map((grade) => grade.gradeKey))}
                onAdd={(grade) =>
                  run(
                    () => upsertSchoolGrade({
                      schoolId: school.id,
                      academicYearId: snapshot.currentAcademicYear!.id,
                      ...grade,
                    }),
                    `${grade.label} added`,
                  )
                }
              />
            )}
          </Card>

          <Card className="p-5">
            <h3 className="font-semibold text-slate-900">School teachers</h3>
            <p className="text-xs text-slate-500">These are school staff records; no Tiny Steps login is required.</p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {snapshot.teachers.map((teacher) => (
                <div key={teacher.id} className="rounded-xl border border-slate-200 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-900">{teacher.name}</p>
                      <p className="text-xs text-slate-500">{teacher.designation || 'Teacher'}</p>
                      {teacher.email && <p className="text-xs text-slate-500">{teacher.email}</p>}
                    </div>
                    <Badge variant={teacher.status === 'active' ? 'default' : 'secondary'}>{teacher.status}</Badge>
                  </div>
                  {canEdit && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      disabled={busy}
                      onClick={() =>
                        run(
                          () => setSchoolTeacherStatus({
                            schoolId: school.id,
                            teacherId: teacher.id,
                            status: teacher.status === 'active' ? 'inactive' : 'active',
                          }),
                          'Teacher status updated',
                        )
                      }
                    >
                      {teacher.status === 'active' ? 'Deactivate' : 'Reactivate'}
                    </Button>
                  )}
                </div>
              ))}
            </div>
            {canEdit && (
              <TeacherForm
                disabled={busy}
                onSubmit={(payload) =>
                  run(() => upsertSchoolTeacher({ schoolId: school.id, ...payload }), 'Teacher added')
                }
              />
            )}
          </Card>

          <Card className="p-5">
            <h3 className="font-semibold text-slate-900">Sections & student counts</h3>
            <p className="text-xs text-slate-500">Student totals are derived from active section counts.</p>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase tracking-wide text-slate-500">
                    <th className="py-2">Class</th>
                    <th className="py-2">Section</th>
                    <th className="py-2">Students</th>
                    <th className="py-2">Teachers</th>
                    <th className="py-2">Status</th>
                    {canEdit && <th className="py-2">Action</th>}
                  </tr>
                </thead>
                <tbody>
                  {snapshot.sections.map((section) => (
                    <tr key={section.id} className="border-b border-slate-100">
                      <td className="py-3 font-medium">{section.gradeLabel}</td>
                      <td className="py-3">{section.sectionName}</td>
                      <td className="py-3">{section.studentCount}</td>
                      <td className="py-3">
                        {section.teacherIds.length
                          ? section.teacherIds
                              .map((id) => teachersById.get(id)?.name || 'Unknown')
                              .join(', ')
                          : 'Not assigned'}
                      </td>
                      <td className="py-3"><Badge variant="outline">{section.status}</Badge></td>
                      {canEdit && (
                        <td className="py-3">
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            disabled={busy}
                            onClick={() =>
                              run(
                                () => setSchoolSectionStatus({
                                  schoolId: school.id,
                                  academicYearId: snapshot.currentAcademicYear!.id,
                                  sectionId: section.id,
                                  status: section.status === 'active' ? 'inactive' : 'active',
                                }),
                                'Section status updated',
                              )
                            }
                          >
                            {section.status === 'active' ? 'Deactivate' : 'Reactivate'}
                          </Button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {canEdit && (
              <SectionForm
                disabled={busy}
                grades={snapshot.grades.filter((grade) => grade.status === 'active')}
                teachers={snapshot.teachers.filter((teacher) => teacher.status === 'active')}
                onSubmit={(payload) =>
                  run(
                    () => upsertSchoolSection({
                      schoolId: school.id,
                      academicYearId: snapshot.currentAcademicYear!.id,
                      ...payload,
                    }),
                    'Section saved',
                  )
                }
              />
            )}
          </Card>
        </>
      )}
    </div>
  );
}

function AcademicYearForm({
  disabled,
  onCreate,
}: {
  disabled: boolean;
  onCreate: (startYear: number, makeCurrent: boolean) => Promise<unknown>;
  onMakeCurrent?: never;
}) {
  const [year, setYear] = useState(new Date().getFullYear());
  return (
    <div className="mt-4 flex flex-wrap items-end gap-2">
      <label className="text-xs text-slate-600">
        Start year
        <Input className="mt-1 w-32" type="number" min={2020} max={2100} value={year} onChange={(e) => setYear(Number(e.target.value))} />
      </label>
      <Button type="button" size="sm" disabled={disabled} onClick={() => void onCreate(year, true)}>
        <Plus className="mr-1 h-4 w-4" /> Create & make current
      </Button>
    </div>
  );
}

function GradeQuickAdd({
  disabled,
  existingKeys,
  onAdd,
}: {
  disabled: boolean;
  existingKeys: Set<string>;
  onAdd: (grade: { gradeKey: string; label: string; sortOrder: number }) => Promise<unknown>;
}) {
  const available = DEFAULT_SCHOOL_GRADES.filter((grade) => !existingKeys.has(grade.gradeKey));
  if (!available.length) return null;
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {available.map((grade) => (
        <Button key={grade.gradeKey} type="button" size="sm" variant="outline" disabled={disabled} onClick={() => void onAdd(grade)}>
          <Plus className="mr-1 h-3 w-3" /> {grade.label}
        </Button>
      ))}
    </div>
  );
}

function TeacherForm({
  disabled,
  onSubmit,
}: {
  disabled: boolean;
  onSubmit: (value: { name: string; email?: string; phone?: string; designation?: string }) => Promise<unknown>;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [designation, setDesignation] = useState('Teacher');
  const submit = async () => {
    if (!name.trim()) return;
    await onSubmit({ name, email, phone, designation });
    setName(''); setEmail(''); setPhone(''); setDesignation('Teacher');
  };
  return (
    <div className="mt-4 grid gap-2 rounded-xl border border-dashed border-slate-300 p-3 sm:grid-cols-2 lg:grid-cols-5">
      <Input placeholder="Teacher name" value={name} onChange={(e) => setName(e.target.value)} />
      <Input placeholder="Designation" value={designation} onChange={(e) => setDesignation(e.target.value)} />
      <Input placeholder="Email (optional)" value={email} onChange={(e) => setEmail(e.target.value)} />
      <Input placeholder="Phone (optional)" value={phone} onChange={(e) => setPhone(e.target.value)} />
      <Button type="button" disabled={disabled || !name.trim()} onClick={() => void submit()}>Add teacher</Button>
    </div>
  );
}

function SectionForm({
  disabled,
  grades,
  teachers,
  onSubmit,
}: {
  disabled: boolean;
  grades: SchoolStructureSnapshot['grades'];
  teachers: SchoolStructureSnapshot['teachers'];
  onSubmit: (value: { gradeId: string; sectionName: string; studentCount: number; teacherIds: string[] }) => Promise<unknown>;
}) {
  const [gradeId, setGradeId] = useState('');
  const [sectionName, setSectionName] = useState('A');
  const [studentCount, setStudentCount] = useState(0);
  const [teacherId, setTeacherId] = useState('');
  const resolvedGradeId = gradeId || grades[0]?.id || '';
  const submit = async () => {
    if (!resolvedGradeId || !sectionName.trim()) return;
    await onSubmit({
      gradeId: resolvedGradeId,
      sectionName,
      studentCount,
      teacherIds: teacherId ? [teacherId] : [],
    });
    setSectionName('A');
    setStudentCount(0);
    setTeacherId('');
  };
  if (!grades.length) return <p className="mt-4 text-sm text-amber-700">Add at least one active class before creating sections.</p>;
  return (
    <div className="mt-4 grid gap-2 rounded-xl border border-dashed border-slate-300 p-3 sm:grid-cols-2 lg:grid-cols-5">
      <select className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm" value={resolvedGradeId} onChange={(e) => setGradeId(e.target.value)}>
        {grades.map((grade) => <option key={grade.id} value={grade.id}>{grade.label}</option>)}
      </select>
      <Input placeholder="Section" value={sectionName} onChange={(e) => setSectionName(e.target.value)} />
      <Input type="number" min={0} max={500} value={studentCount} onChange={(e) => setStudentCount(Number(e.target.value))} />
      <select className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm" value={teacherId} onChange={(e) => setTeacherId(e.target.value)}>
        <option value="">No teacher yet</option>
        {teachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.name}</option>)}
      </select>
      <Button type="button" disabled={disabled || !resolvedGradeId || !sectionName.trim()} onClick={() => void submit()}>Add section</Button>
    </div>
  );
}
