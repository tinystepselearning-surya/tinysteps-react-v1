import { useCallback, useEffect, useState } from 'react';
import { Building2 } from 'lucide-react';

import { Badge } from '@components/ui/badge';
import { Button } from '@components/ui/button';
import { Card } from '@components/ui/card';

import type { SchoolRecord } from '../../../../types/School';
import { listAssignedSchoolsForLearningPartner } from '../../../../services/schoolProgrammeService';
import SchoolStructureWorkspace from '../../../schools/SchoolStructureWorkspace';

interface Props {
  learningPartnerId: string;
}

export default function LPSchoolsWorkspace({ learningPartnerId }: Props) {
  const [schools, setSchools] = useState<SchoolRecord[]>([]);
  const [selected, setSelected] = useState<SchoolRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const next = await listAssignedSchoolsForLearningPartner(learningPartnerId);
      setSchools(next);
      setSelected((current) =>
        current ? next.find((school) => school.id === current.id) || null : null,
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to load assigned schools.');
    } finally {
      setLoading(false);
    }
  }, [learningPartnerId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (selected) {
    return (
      <div className="space-y-4">
        <Button type="button" variant="outline" size="sm" onClick={() => setSelected(null)}>
          ← Back to My Schools
        </Button>
        <Card className="p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">Assigned school</p>
              <h2 className="mt-1 text-2xl font-bold text-slate-900">{selected.name}</h2>
              <p className="text-sm text-slate-500">{selected.schoolCode}</p>
            </div>
            <Badge variant={selected.status === 'active' ? 'default' : 'outline'}>{selected.status}</Badge>
          </div>
        </Card>
        <SchoolStructureWorkspace school={selected} canEdit={selected.status !== 'archived'} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Card className="p-5">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-blue-50 p-2 text-blue-700">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">My Schools</h2>
            <p className="text-sm text-slate-500">
              Schools currently assigned to you for Tiny Steps implementation support.
            </p>
          </div>
        </div>
      </Card>

      {loading ? (
        <Card className="p-8 text-center text-sm text-slate-500">Loading assigned schools…</Card>
      ) : error ? (
        <Card className="p-6 text-sm text-red-600">{error}</Card>
      ) : schools.length === 0 ? (
        <Card className="p-8 text-center text-sm text-slate-500">
          No partner schools are currently assigned to you.
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {schools.map((school) => (
            <Card key={school.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-slate-900">{school.name}</h3>
                  <p className="text-xs text-slate-500">{school.schoolCode}</p>
                </div>
                <Badge variant={school.status === 'active' ? 'default' : 'outline'}>{school.status}</Badge>
              </div>
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-500">Contact</dt>
                  <dd className="text-right font-medium text-slate-800">{school.contact.name}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-500">Academic year</dt>
                  <dd className="font-medium text-slate-800">{school.currentAcademicYearId ? 'Configured' : 'Not configured'}</dd>
                </div>
              </dl>
              <Button className="mt-5 w-full" type="button" onClick={() => setSelected(school)}>
                Open School
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
