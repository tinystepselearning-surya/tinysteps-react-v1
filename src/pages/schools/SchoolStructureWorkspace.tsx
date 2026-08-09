import { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, Pencil, Plus, RefreshCw, X } from 'lucide-react';

import { Badge } from '@components/ui/badge';
import { Button } from '@components/ui/button';
import { Card } from '@components/ui/card';
import { Input } from '@components/ui/input';
import { useToast } from '@components/hooks/use-toast';

import type { SchoolRecord } from '../../types/School';
import {
  DEFAULT_SCHOOL_GRADES,
  type SchoolGrade,
  type SchoolSection,
  type SchoolStructureSnapshot,
  type SchoolTeacherRecord,
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

const slug = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 80);

interface Props {
  school: SchoolRecord;
  canEdit: boolean;
  onChanged?: () => Promise<void> | void;
}

export default function SchoolStructureWorkspace({ school, canEdit, onChanged }: Props) {
  const { toast } = useToast();
  const [snapshot, setSnapshot] = useState<SchoolStructureSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedYearId, setSelectedYearId] = useState<string | null>(
    school.currentAcademicYearId,
  );
  const [busy, setBusy] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<SchoolTeacherRecord | null>(null);
  const [editingSection, setEditingSection] = useState<SchoolSection | null>(null);

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
    setSelectedYearId(school.currentAcademicYearId);
  }, [school.id, school.currentAcademicYearId]);

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
      await onChanged?.();
      toast({ title: success });
    } catch (error) {
      toast({ title: 'Unable to save', description: message(error), variant: 'destructive' });
      throw error;
    } finally {
      setBusy(false);
    }
  };

  if (loading && !snapshot) {
    return <div className="p-6 text-sm text-slate-500">Loading academic structure…</div>;
  }
  if (!snapshot) return null;

  const viewedYear = snapshot.currentAcademicYear;
  const canEditViewedYear = canEdit && Boolean(viewedYear) && viewedYear?.status !== 'closed';

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
            <p className="text-xs text-slate-500">
              Closed years are preserved as read-only history. A closed year can be made current again when correction is required.
            </p>
          </div>
          <select
            aria-label="Academic year"
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
            value={viewedYear?.id || ''}
            onChange={(event) => {
              setEditingSection(null);
              setSelectedYearId(event.target.value || null);
            }}
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
          />
        )}

        {canEdit && snapshot.academicYears.some((year) => year.status !== 'current') && (
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
                    ).then(() => setSelectedYearId(year.id))
                  }
                >
                  Make {year.label} current
                </Button>
              ))}
          </div>
        )}
      </Card>

      {!viewedYear ? (
        <Card className="p-6 text-center text-sm text-slate-500">
          Create an academic year to configure classes and sections.
        </Card>
      ) : (
        <>
          {viewedYear.status === 'closed' && (
            <Card className="border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              You are viewing a closed academic year. Its academic structure and programme records are intentionally read-only.
            </Card>
          )}

          <Card className="p-5">
            <h3 className="font-semibold text-slate-900">Classes / Grades</h3>
            <p className="text-xs text-slate-500">
              Use the school’s own naming convention — Nursery/LKG/UKG, PP1/PP2, Pre-K/K1/K2, Grade 1, or another equivalent label.
            </p>
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
                  {canEditViewedYear && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="mt-2"
                      disabled={busy}
                      onClick={() =>
                        void run(
                          () => setSchoolGradeStatus({
                            schoolId: school.id,
                            academicYearId: viewedYear.id,
                            gradeId: grade.id,
                            status: grade.status === 'active' ? 'inactive' : 'active',
                          }),
                          'Class status updated',
                        )
                      }
                    >
                      {grade.status === 'active' ? 'Deactivate' : 'Reactivate'}
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {canEditViewedYear && (
              <div className="mt-4 space-y-3">
                <GradeQuickAdd
                  disabled={busy}
                  existingKeys={new Set(snapshot.grades.map((grade) => grade.gradeKey))}
                  onAdd={(grade) =>
                    run(
                      () => upsertSchoolGrade({
                        schoolId: school.id,
                        academicYearId: viewedYear.id,
                        ...grade,
                      }),
                      `${grade.label} added`,
                    )
                  }
                />
                <CustomGradeForm
                  disabled={busy}
                  grades={snapshot.grades}
                  onAdd={(grade) =>
                    run(
                      () => upsertSchoolGrade({
                        schoolId: school.id,
                        academicYearId: viewedYear.id,
                        ...grade,
                      }),
                      `${grade.label} added`,
                    )
                  }
                />
              </div>
            )}
          </Card>

          <Card className="p-5">
            <h3 className="font-semibold text-slate-900">School teachers</h3>
            <p className="text-xs text-slate-500">
              Lightweight school staff records only. These teachers do not need Tiny Steps accounts to appear in the partnership workspace.
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {snapshot.teachers.map((teacher) => (
                <div key={teacher.id} className="rounded-xl border border-slate-200 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-900">{teacher.name}</p>
                      <p className="text-xs text-slate-500">{teacher.designation || 'Teacher'}</p>
                      {teacher.email && <p className="text-xs text-slate-500">{teacher.email}</p>}
                      {teacher.phone && <p className="text-xs text-slate-500">{teacher.phone}</p>}
                    </div>
                    <Badge variant={teacher.status === 'active' ? 'default' : 'secondary'}>{teacher.status}</Badge>
                  </div>
                  {canEdit && (
                    <div className="mt-2 flex gap-2">
                      <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => setEditingTeacher(teacher)}>
                        <Pencil className="mr-1 h-3 w-3" /> Edit
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        disabled={busy}
                        onClick={() =>
                          void run(
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
                    </div>
                  )}
                </div>
              ))}
            </div>

            {canEdit && (
              <TeacherForm
                disabled={busy}
                initial={editingTeacher}
                onCancel={() => setEditingTeacher(null)}
                onSubmit={async (payload) => {
                  await run(
                    () => upsertSchoolTeacher({
                      schoolId: school.id,
                      teacherId: editingTeacher?.id,
                      ...payload,
                    }),
                    editingTeacher ? 'Teacher updated' : 'Teacher added',
                  );
                  setEditingTeacher(null);
                }}
              />
            )}
          </Card>

          <Card className="p-5">
            <h3 className="font-semibold text-slate-900">Sections & student counts</h3>
            <p className="text-xs text-slate-500">
              Student totals are derived from active section counts. A section may have multiple participating teachers.
            </p>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[900px] text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase tracking-wide text-slate-500">
                    <th className="py-2">Class</th>
                    <th className="py-2">Section</th>
                    <th className="py-2">Students</th>
                    <th className="py-2">Teachers</th>
                    <th className="py-2">Status</th>
                    {canEditViewedYear && <th className="py-2">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {snapshot.sections.map((section) => (
                    <tr key={section.id} className="border-b border-slate-100 align-top">
                      <td className="py-3 font-medium">{section.gradeLabel}</td>
                      <td className="py-3">{section.sectionName}</td>
                      <td className="py-3">{section.studentCount}</td>
                      <td className="max-w-[320px] py-3">
                        {section.teacherIds.length
                          ? section.teacherIds
                              .map((id) => teachersById.get(id)?.name || 'Unknown teacher')
                              .join(', ')
                          : 'Not assigned'}
                      </td>
                      <td className="py-3"><Badge variant="outline">{section.status}</Badge></td>
                      {canEditViewedYear && (
                        <td className="py-3">
                          <div className="flex gap-2">
                            <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => setEditingSection(section)}>
                              <Pencil className="mr-1 h-3 w-3" /> Edit
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              disabled={busy}
                              onClick={() =>
                                void run(
                                  () => setSchoolSectionStatus({
                                    schoolId: school.id,
                                    academicYearId: viewedYear.id,
                                    sectionId: section.id,
                                    status: section.status === 'active' ? 'inactive' : 'active',
                                  }),
                                  'Section status updated',
                                )
                              }
                            >
                              {section.status === 'active' ? 'Deactivate' : 'Reactivate'}
                            </Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {canEditViewedYear && (
              <SectionForm
                key={editingSection?.id || 'new-section'}
                disabled={busy}
                initial={editingSection}
                grades={snapshot.grades.filter((grade) => grade.status === 'active')}
                teachers={snapshot.teachers.filter((teacher) => teacher.status === 'active')}
                onCancel={() => setEditingSection(null)}
                onSubmit={async (payload) => {
                  await run(
                    () => upsertSchoolSection({
                      schoolId: school.id,
                      academicYearId: viewedYear.id,
                      sectionId: editingSection?.id,
                      ...payload,
                    }),
                    editingSection ? 'Section updated' : 'Section added',
                  );
                  setEditingSection(null);
                }}
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
}) {
  const [year, setYear] = useState(new Date().getFullYear());
  return (
    <div className="mt-4 flex flex-wrap items-end gap-2">
      <label className="text-xs text-slate-600">
        Start year
        <Input className="mt-1 w-32" type="number" min={2020} max={2100} value={year} onChange={(event) => setYear(Number(event.target.value))} />
      </label>
      <Button type="button" size="sm" disabled={disabled} onClick={() => void onCreate(year, true)}>
        <Plus className="mr-1 h-4 w-4" /> Create & make current
      </Button>
      <Button type="button" size="sm" variant="outline" disabled={disabled} onClick={() => void onCreate(year, false)}>
        Create planned year
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
    <div className="flex flex-wrap gap-2">
      {available.map((grade) => (
        <Button key={grade.gradeKey} type="button" size="sm" variant="outline" disabled={disabled} onClick={() => void onAdd(grade)}>
          <Plus className="mr-1 h-3 w-3" /> {grade.label}
        </Button>
      ))}
    </div>
  );
}

function CustomGradeForm({
  disabled,
  grades,
  onAdd,
}: {
  disabled: boolean;
  grades: SchoolGrade[];
  onAdd: (grade: { gradeKey: string; label: string; sortOrder: number }) => Promise<unknown>;
}) {
  const [label, setLabel] = useState('');
  const nextSortOrder = Math.max(0, ...grades.map((grade) => grade.sortOrder)) + 10;
  const submit = async () => {
    const normalizedLabel = label.trim();
    if (!normalizedLabel) return;
    await onAdd({
      gradeKey: slug(normalizedLabel),
      label: normalizedLabel,
      sortOrder: nextSortOrder,
    });
    setLabel('');
  };
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-dashed border-slate-300 p-3 sm:flex-row sm:items-end">
      <label className="flex-1 text-xs text-slate-600">
        Custom class / grade name
        <Input className="mt-1" placeholder="e.g. PP1, PP2, Pre-K, K1" value={label} onChange={(event) => setLabel(event.target.value)} />
      </label>
      <Button type="button" size="sm" disabled={disabled || !label.trim() || !slug(label)} onClick={() => void submit()}>
        <Plus className="mr-1 h-3 w-3" /> Add class
      </Button>
    </div>
  );
}

function TeacherForm({
  disabled,
  initial,
  onCancel,
  onSubmit,
}: {
  disabled: boolean;
  initial: SchoolTeacherRecord | null;
  onCancel: () => void;
  onSubmit: (value: { name: string; email?: string; phone?: string; designation?: string }) => Promise<unknown>;
}) {
  const [name, setName] = useState(initial?.name || '');
  const [email, setEmail] = useState(initial?.email || '');
  const [phone, setPhone] = useState(initial?.phone || '');
  const [designation, setDesignation] = useState(initial?.designation || 'Teacher');

  useEffect(() => {
    setName(initial?.name || '');
    setEmail(initial?.email || '');
    setPhone(initial?.phone || '');
    setDesignation(initial?.designation || 'Teacher');
  }, [initial]);

  const submit = async () => {
    if (!name.trim()) return;
    await onSubmit({ name, email, phone, designation });
    if (!initial) {
      setName('');
      setEmail('');
      setPhone('');
      setDesignation('Teacher');
    }
  };

  return (
    <div className="mt-4 rounded-xl border border-dashed border-slate-300 p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-800">{initial ? 'Edit school teacher' : 'Add school teacher'}</p>
        {initial && (
          <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
            <X className="mr-1 h-3 w-3" /> Cancel
          </Button>
        )}
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        <Input placeholder="Teacher name" value={name} onChange={(event) => setName(event.target.value)} />
        <Input placeholder="Designation" value={designation} onChange={(event) => setDesignation(event.target.value)} />
        <Input type="email" placeholder="Email (optional)" value={email} onChange={(event) => setEmail(event.target.value)} />
        <Input placeholder="Phone (optional)" value={phone} onChange={(event) => setPhone(event.target.value)} />
        <Button type="button" disabled={disabled || !name.trim()} onClick={() => void submit()}>
          {initial ? 'Save teacher' : 'Add teacher'}
        </Button>
      </div>
    </div>
  );
}

function SectionForm({
  disabled,
  initial,
  grades,
  teachers,
  onCancel,
  onSubmit,
}: {
  disabled: boolean;
  initial: SchoolSection | null;
  grades: SchoolStructureSnapshot['grades'];
  teachers: SchoolStructureSnapshot['teachers'];
  onCancel: () => void;
  onSubmit: (value: { gradeId: string; sectionName: string; studentCount: number; teacherIds: string[] }) => Promise<unknown>;
}) {
  const [gradeId, setGradeId] = useState(initial?.gradeId || grades[0]?.id || '');
  const [sectionName, setSectionName] = useState(initial?.sectionName || 'A');
  const [studentCount, setStudentCount] = useState(initial?.studentCount || 0);
  const [teacherIds, setTeacherIds] = useState<string[]>(initial?.teacherIds || []);

  const toggleTeacher = (teacherId: string) => {
    setTeacherIds((current) =>
      current.includes(teacherId)
        ? current.filter((id) => id !== teacherId)
        : [...current, teacherId],
    );
  };

  const submit = async () => {
    if (!gradeId || !sectionName.trim()) return;
    await onSubmit({
      gradeId,
      sectionName: sectionName.trim(),
      studentCount: Math.max(0, Math.min(500, Math.floor(studentCount || 0))),
      teacherIds,
    });
    if (!initial) {
      setSectionName('A');
      setStudentCount(0);
      setTeacherIds([]);
    }
  };

  if (!grades.length) {
    return <p className="mt-4 text-sm text-amber-700">Add at least one active class before creating sections.</p>;
  }

  return (
    <div className="mt-4 rounded-xl border border-dashed border-slate-300 p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-800">{initial ? `Edit ${initial.gradeLabel} — ${initial.sectionName}` : 'Add section'}</p>
          <p className="text-xs text-slate-500">Choose every teacher who actively participates in this section.</p>
        </div>
        {initial && (
          <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
            <X className="mr-1 h-3 w-3" /> Cancel
          </Button>
        )}
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <label className="text-xs text-slate-600">Class
          <select className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm" value={gradeId} onChange={(event) => setGradeId(event.target.value)}>
            {grades.map((grade) => <option key={grade.id} value={grade.id}>{grade.label}</option>)}
          </select>
        </label>
        <label className="text-xs text-slate-600">Section name
          <Input className="mt-1" placeholder="A" value={sectionName} onChange={(event) => setSectionName(event.target.value)} />
        </label>
        <label className="text-xs text-slate-600">Student count
          <Input className="mt-1" type="number" min={0} max={500} value={studentCount} onChange={(event) => setStudentCount(Number(event.target.value))} />
        </label>
      </div>

      <div className="mt-3">
        <p className="text-xs font-medium text-slate-600">Assigned school teachers</p>
        {teachers.length === 0 ? (
          <p className="mt-2 text-xs text-amber-700">No active teachers are available. You can save the section now and assign teachers later.</p>
        ) : (
          <div className="mt-2 flex flex-wrap gap-2">
            {teachers.map((teacher) => {
              const selected = teacherIds.includes(teacher.id);
              return (
                <button
                  key={teacher.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => toggleTeacher(teacher.id)}
                  className={`inline-flex items-center rounded-lg border px-3 py-2 text-xs font-medium transition ${
                    selected
                      ? 'border-blue-300 bg-blue-50 text-blue-800'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {selected && <Check className="mr-1 h-3 w-3" />}
                  {teacher.name}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <Button className="mt-4" type="button" disabled={disabled || !gradeId || !sectionName.trim()} onClick={() => void submit()}>
        {initial ? 'Save section' : 'Add section'}
      </Button>
    </div>
  );
}
