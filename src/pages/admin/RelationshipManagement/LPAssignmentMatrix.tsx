import React, { useEffect, useMemo, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, functions } from '../../../lib/firebaseConfig';
import { httpsCallable } from 'firebase/functions';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@components/ui/tabs';
import { useToast } from '@components/hooks/use-toast';

interface User {
  uid: string;
  displayName: string;
  role: string;
  assignedLPs?: string[]; // for parents/teachers
}

interface AssignmentMatrix {
  users: User[]; // Parents or Teachers
  lps: User[]; // Learning Partners
  assignments: Record<string, string[]>; // userId -> [lpIds]
}

export function LPAssignmentMatrix(): JSX.Element {
  const [parentMatrix, setParentMatrix] = useState<AssignmentMatrix>({ users: [], lps: [], assignments: {} });
  const [teacherMatrix, setTeacherMatrix] = useState<AssignmentMatrix>({ users: [], lps: [], assignments: {} });

  const [searchParent, setSearchParent] = useState('');
  const [searchTeacher, setSearchTeacher] = useState('');
  const [searchLP, setSearchLP] = useState('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    setLoading(true);

    const parentsQ = query(collection(db, 'users'), where('role', '==', 'parent'));
    const teachersQ = query(collection(db, 'users'), where('role', '==', 'teacher'));
    const lpsQ = query(collection(db, 'users'), where('role', '==', 'learningPartner'));

    const unsubParents = onSnapshot(parentsQ, (snap) => {
      const parents: User[] = snap.docs.map((d) => ({
        uid: d.id,
        displayName: (d.data() as any).displayName || 'Unknown',
        role: 'parent',
        assignedLPs: (d.data() as any).assignedLPs || []
      }));

      setParentMatrix((prev) => ({ ...prev, users: parents }));
      setLoading(false);
    }, (err) => {
      console.error('parents onSnapshot error', err);
      toast({ title: 'Error', description: 'Failed to listen for parents', variant: 'destructive' });
      setLoading(false);
    });

    const unsubTeachers = onSnapshot(teachersQ, (snap) => {
      const teachers: User[] = snap.docs.map((d) => ({
        uid: d.id,
        displayName: (d.data() as any).displayName || 'Unknown',
        role: 'teacher',
        assignedLPs: (d.data() as any).assignedLPs || []
      }));

      setTeacherMatrix((prev) => ({ ...prev, users: teachers }));
      setLoading(false);
    }, (err) => {
      console.error('teachers onSnapshot error', err);
      toast({ title: 'Error', description: 'Failed to listen for teachers', variant: 'destructive' });
      setLoading(false);
    });

    const unsubLPs = onSnapshot(lpsQ, (snap) => {
      const lps: User[] = snap.docs.map((d) => ({
        uid: d.id,
        displayName: (d.data() as any).displayName || 'Unknown',
        role: 'learningPartner'
      }));

      // Attach LPs to both matrices
      setParentMatrix((prev) => ({ ...prev, lps }));
      setTeacherMatrix((prev) => ({ ...prev, lps }));
      setLoading(false);
    }, (err) => {
      console.error('lps onSnapshot error', err);
      toast({ title: 'Error', description: 'Failed to listen for learning partners', variant: 'destructive' });
      setLoading(false);
    });

    // Additionally, listen for assignment changes on any user doc to keep assignments in sync.
    const usersColl = collection(db, 'users');
    const unsubAll = onSnapshot(usersColl, (snap) => {
      const parentAssignments: Record<string, string[]> = {};
      const teacherAssignments: Record<string, string[]> = {};
      snap.docs.forEach((d) => {
        const data = d.data() as any;
        const role = data.role as string | undefined;
        const assignedLPs = Array.isArray(data.assignedLPs) ? data.assignedLPs : [];
        if (role === 'parent') parentAssignments[d.id] = assignedLPs;
        if (role === 'teacher') teacherAssignments[d.id] = assignedLPs;
      });

      setParentMatrix((prev) => ({ ...prev, assignments: parentAssignments }));
      setTeacherMatrix((prev) => ({ ...prev, assignments: teacherAssignments }));
    }, (err) => {
      console.error('users onSnapshot error', err);
      toast({ title: 'Error', description: 'Failed to keep assignments in sync', variant: 'destructive' });
    });

    return () => {
      unsubParents();
      unsubTeachers();
      unsubLPs();
      unsubAll();
    };
  }, [toast]);

  const handleAssignment = async (
    userId: string,
    lpId: string,
    isAssigning: boolean,
    userRole: 'parent' | 'teacher'
  ) => {
    try {
      // Choose callable function based on role and action
      let fnName = '';
      if (userRole === 'parent') fnName = isAssigning ? 'assignLPToParent' : 'unassignLPFromParent';
      else fnName = isAssigning ? 'assignLPToTeacher' : 'unassignLPFromTeacher';

      const call = httpsCallable(functions, fnName);
      const payload: any = userRole === 'parent' ? { parentId: userId, lpId } : { teacherId: userId, lpId };
      await call(payload);

      toast({ title: 'Success', description: isAssigning ? 'LP assigned' : 'LP unassigned' });
    } catch (err: any) {
      console.error('Assignment failed', err);
      toast({ title: 'Error', description: err?.message || 'Could not update assignment', variant: 'destructive' });
    }
  };

  const handleBulkAssign = async (lpId: string, userRole: 'parent' | 'teacher', assign: boolean) => {
    try {
      const matrix = userRole === 'parent' ? parentMatrix : teacherMatrix;
      // safety: limit bulk client-side calls
      if (matrix.users.length > 400) {
        toast({ title: 'Too many users', description: 'Bulk operations limited to 400 users at a time', variant: 'destructive' });
        return;
      }

      const fnAssign = userRole === 'parent' ? httpsCallable(functions, assign ? 'assignLPToParent' : 'unassignLPFromParent') : httpsCallable(functions, assign ? 'assignLPToTeacher' : 'unassignLPFromTeacher');

      // sequentially call the callable for each user (could be optimized server-side)
      for (const user of matrix.users) {
        const currently = (matrix.assignments[user.uid] || []).includes(lpId);
        if (assign && !currently) {
          const payload = userRole === 'parent' ? { parentId: user.uid, lpId } : { teacherId: user.uid, lpId };
          await fnAssign(payload as any);
        } else if (!assign && currently) {
          const payload = userRole === 'parent' ? { parentId: user.uid, lpId } : { teacherId: user.uid, lpId };
          await fnAssign(payload as any);
        }
      }

      toast({ title: 'Success', description: assign ? 'Assigned to all' : 'Unassigned from all' });
    } catch (err: any) {
      console.error('Bulk assign failed', err);
      toast({ title: 'Error', description: err?.message || 'Bulk assignment failed', variant: 'destructive' });
    }
  };

  const renderMatrix = (
    matrix: AssignmentMatrix,
    userRole: 'parent' | 'teacher',
    searchTerm: string,
    setSearchTerm: (s: string) => void
  ) => {
    const filteredUsers = useMemo(() => matrix.users.filter(u => u.displayName.toLowerCase().includes(searchTerm.toLowerCase())), [matrix.users, searchTerm]);
    const filteredLPs = useMemo(() => matrix.lps.filter(lp => lp.displayName.toLowerCase().includes(searchLP.toLowerCase())), [matrix.lps, searchLP]);

    return (
      <div className="space-y-4">
        <div className="flex gap-4">
          <Input
            aria-label={`${userRole} search`}
            placeholder={`Search ${userRole}s...`}
            value={searchTerm}
            onChange={(e: any) => setSearchTerm(e.target.value)}
            className="flex-1"
          />
          <Input
            aria-label="LP search"
            placeholder="Search LPs..."
            value={searchLP}
            onChange={(e: any) => setSearchLP(e.target.value)}
            className="flex-1"
          />
        </div>

        <div className="overflow-x-auto border rounded-lg">
          <table className="w-full" role="table" aria-label={`${userRole} lp assignment matrix`}> 
            <thead className="bg-gray-100">
              <tr>
                <th className="text-left p-3">{userRole.toUpperCase()}</th>
                {filteredLPs.map(lp => (
                  <th key={lp.uid} className="text-center p-2 min-w-[120px]"><div className="text-sm font-medium truncate">{lp.displayName}</div></th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr key={user.uid} className="border-t hover:bg-gray-50">
                  <td className="p-3 font-medium">{user.displayName}</td>
                  {filteredLPs.map(lp => {
                    const isAssigned = (matrix.assignments[user.uid] || []).includes(lp.uid);
                    return (
                      <td key={`${user.uid}-${lp.uid}`} className="text-center p-2">
                        <input
                          aria-label={`Assign ${lp.displayName} to ${user.displayName}`}
                          type="checkbox"
                          checked={isAssigned}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            handleAssignment(user.uid, lp.uid, e.target.checked, userRole)
                          }
                          disabled={loading}
                          className="w-5 h-5 mx-auto"
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg space-y-2">
          <p className="text-sm font-medium">Bulk Actions:</p>
          <div className="flex gap-2 flex-wrap">
            {matrix.lps.map(lp => (
              <div key={lp.uid} className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => handleBulkAssign(lp.uid, userRole, true)}>
                  Assign {lp.displayName} to all
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleBulkAssign(lp.uid, userRole, false)}>
                  Unassign {lp.displayName} from all
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  if (loading) return <div className="p-8 text-center">Loading assignment data...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Learning Partner Assignments</h2>
      <Tabs defaultValue="parents" className="w-full">
        <TabsList>
          <TabsTrigger value="parents">Parents ← LPs</TabsTrigger>
          <TabsTrigger value="teachers">Teachers ← LPs</TabsTrigger>
        </TabsList>

        <TabsContent value="parents" className="space-y-4">
          <p className="text-sm text-gray-600">Assign Learning Partners to Parents. LPs will see only their assigned parents.</p>
          {renderMatrix(parentMatrix, 'parent', searchParent, setSearchParent)}
        </TabsContent>

        <TabsContent value="teachers" className="space-y-4">
          <p className="text-sm text-gray-600">Assign Learning Partners to Teachers. LPs will see only their assigned teachers.</p>
          {renderMatrix(teacherMatrix, 'teacher', searchTeacher, setSearchTeacher)}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default LPAssignmentMatrix;
