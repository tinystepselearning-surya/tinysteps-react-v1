// src/pages/admin/RelationshipManagement/LPAssignmentMatrix.tsx

import React, { useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
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
  lps: User[];   // Learning Partners
  assignments: Record<string, string[]>; // userId -> [lpIds]
}

function getRole(data: any): string | undefined {
  // Prefer explicit role
  if (typeof data.role === 'string') return data.role;
  // Fallback to first role in roles[]
  if (Array.isArray(data.roles) && data.roles.length > 0) {
    return data.roles[0];
  }
  return undefined;
}

function isLPRole(role: string | undefined): boolean {
  if (!role) return false;
  return role === 'learningPartner' || role === 'learning-partner';
}

export function LPAssignmentMatrix(): JSX.Element {
  const [parentMatrix, setParentMatrix] = useState<AssignmentMatrix>({
    users: [],
    lps: [],
    assignments: {},
  });
  const [teacherMatrix, setTeacherMatrix] = useState<AssignmentMatrix>({
    users: [],
    lps: [],
    assignments: {},
  });

  const [searchParent, setSearchParent] = useState('');
  const [searchTeacher, setSearchTeacher] = useState('');
  const [searchLP, setSearchLP] = useState('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    setLoading(true);
    const usersRef = collection(db, 'users');

    const unsub = onSnapshot(
      usersRef,
      (snap) => {
        const parents: User[] = [];
        const teachers: User[] = [];
        const lps: User[] = [];
        const parentAssignments: Record<string, string[]> = {};
        const teacherAssignments: Record<string, string[]> = {};

        snap.docs.forEach((doc) => {
          const data = doc.data() as any;
          const role = getRole(data);
          const displayName: string = data.displayName || data.name || 'Unknown';
          const assignedLPs: string[] = Array.isArray(data.assignedLPs)
            ? data.assignedLPs
            : [];

          // Parents
          if (role === 'parent') {
            parents.push({
              uid: doc.id,
              displayName,
              role: 'parent',
              assignedLPs,
            });
            parentAssignments[doc.id] = assignedLPs;
          }

          // Teachers
          if (role === 'teacher') {
            teachers.push({
              uid: doc.id,
              displayName,
              role: 'teacher',
              assignedLPs,
            });
            teacherAssignments[doc.id] = assignedLPs;
          }

          // Learning Partners
          if (isLPRole(role)) {
            lps.push({
              uid: doc.id,
              displayName,
              role: 'learningPartner',
            });
          }
        });

        setParentMatrix({
          users: parents,
          lps,
          assignments: parentAssignments,
        });
        setTeacherMatrix({
          users: teachers,
          lps,
          assignments: teacherAssignments,
        });
        setLoading(false);
      },
      (err) => {
        console.error('users onSnapshot error', err);
        toast({
          title: 'Error',
          description: 'Failed to load users for LP assignment',
          variant: 'destructive',
        });
        setLoading(false);
      }
    );

    return () => {
      unsub();
    };
  }, [toast]);

  const handleAssignment = async (
    userId: string,
    lpId: string,
    isAssigning: boolean,
    userRole: 'parent' | 'teacher'
  ) => {
    try {
      let fnName = '';
      if (userRole === 'parent') {
        fnName = isAssigning ? 'assignLPToParent' : 'unassignLPFromParent';
      } else {
        fnName = isAssigning ? 'assignLPToTeacher' : 'unassignLPFromTeacher';
      }

      const call = httpsCallable(functions, fnName);
      const payload: any =
        userRole === 'parent'
          ? { parentId: userId, lpId }
          : { teacherId: userId, lpId };

      await call(payload);

      toast({
        title: 'Success',
        description: isAssigning ? 'LP assigned' : 'LP unassigned',
      });
    } catch (err: any) {
      console.error('Assignment failed', err);
      const msg =
        err?.message ||
        err?.data?.message ||
        (err?.code === 'permission-denied'
          ? 'Only admins can assign Learning Partners. Please sign in as admin.'
          : 'Could not update assignment');
      toast({
        title: 'Error',
        description: msg,
        variant: 'destructive',
      });
    }
  };

  const handleBulkAssign = async (
    lpId: string,
    userRole: 'parent' | 'teacher',
    assign: boolean
  ) => {
    try {
      const matrix = userRole === 'parent' ? parentMatrix : teacherMatrix;
      if (matrix.users.length > 400) {
        toast({
          title: 'Too many users',
          description: 'Bulk operations are limited to 400 users at a time.',
          variant: 'destructive',
        });
        return;
      }

      const fnName =
        userRole === 'parent'
          ? assign
            ? 'assignLPToParent'
            : 'unassignLPFromParent'
          : assign
          ? 'assignLPToTeacher'
          : 'unassignLPFromTeacher';

      const fn = httpsCallable(functions, fnName);

      for (const user of matrix.users) {
        const currently = (matrix.assignments[user.uid] || []).includes(lpId);
        if (assign && !currently) {
          const payload =
            userRole === 'parent'
              ? { parentId: user.uid, lpId }
              : { teacherId: user.uid, lpId };
          await fn(payload as any);
        } else if (!assign && currently) {
          const payload =
            userRole === 'parent'
              ? { parentId: user.uid, lpId }
              : { teacherId: user.uid, lpId };
          await fn(payload as any);
        }
      }

      toast({
        title: 'Success',
        description: assign ? 'Assigned to all' : 'Unassigned from all',
      });
    } catch (err: any) {
      console.error('Bulk assign failed', err);
      toast({
        title: 'Error',
        description: err?.message || 'Bulk assignment failed',
        variant: 'destructive',
      });
    }
  };

  const filteredParents = useMemo(
    () =>
      parentMatrix.users.filter((u) =>
        u.displayName.toLowerCase().includes(searchParent.toLowerCase())
      ),
    [parentMatrix.users, searchParent]
  );

  const filteredTeachers = useMemo(
    () =>
      teacherMatrix.users.filter((u) =>
        u.displayName.toLowerCase().includes(searchTeacher.toLowerCase())
      ),
    [teacherMatrix.users, searchTeacher]
  );

  const filteredLPs = useMemo(
    () =>
      parentMatrix.lps.filter((lp) =>
        lp.displayName.toLowerCase().includes(searchLP.toLowerCase())
      ),
    [parentMatrix.lps, searchLP]
  );

  const renderMatrix = (
    matrix: AssignmentMatrix,
    filteredUsers: User[],
    filteredLPs: User[],
    userRole: 'parent' | 'teacher',
    searchTerm: string,
    setSearchTerm: (s: string) => void
  ) => {
    return (
      <div className="space-y-4">
        <div className="flex gap-4">
          <Input
            aria-label={`${userRole} search`}
            placeholder={`Search ${userRole}s...`}
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setSearchTerm(e.target.value)
            }
            className="flex-1"
          />
          <Input
            aria-label="LP search"
            placeholder="Search LPs..."
            value={searchLP}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setSearchLP(e.target.value)
            }
            className="flex-1"
          />
        </div>

        <div className="overflow-x-auto border rounded-lg">
          <table
            className="w-full"
            role="table"
            aria-label={`${userRole} lp assignment matrix`}
          >
            <thead className="bg-gray-100">
              <tr>
                <th className="text-left p-3">{userRole.toUpperCase()}</th>
                {filteredLPs.map((lp) => (
                  <th
                    key={lp.uid}
                    className="text-center p-2 min-w-[120px]"
                  >
                    <div className="text-sm font-medium truncate">
                      {lp.displayName}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.uid} className="border-t hover:bg-gray-50">
                  <td className="p-3 font-medium">{user.displayName}</td>
                  {filteredLPs.map((lp) => {
                    const isAssigned =
                      (matrix.assignments[user.uid] || []).includes(lp.uid);
                    return (
                      <td
                        key={`${user.uid}-${lp.uid}`}
                        className="text-center p-2"
                      >
                        <input
                          aria-label={`Assign ${lp.displayName} to ${user.displayName}`}
                          type="checkbox"
                          checked={isAssigned}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            handleAssignment(
                              user.uid,
                              lp.uid,
                              e.target.checked,
                              userRole
                            )
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
            {matrix.lps.map((lp) => (
              <div key={lp.uid} className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkAssign(lp.uid, userRole, true)}
                >
                  Assign {lp.displayName} to all
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkAssign(lp.uid, userRole, false)}
                >
                  Unassign {lp.displayName} from all
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return <div className="p-8 text-center">Loading assignment data...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Learning Partner Assignments</h2>
      <Tabs defaultValue="parents" className="w-full">
        <TabsList>
          <TabsTrigger value="parents">Parents ← LPs</TabsTrigger>
          <TabsTrigger value="teachers">Teachers ← LPs</TabsTrigger>
        </TabsList>

        <TabsContent value="parents" className="space-y-4">
          <p className="text-sm text-gray-600">
            Assign Learning Partners to Parents. LPs will see only their assigned parents.
          </p>
          {renderMatrix(
            parentMatrix,
            filteredParents,
            filteredLPs,
            'parent',
            searchParent,
            setSearchParent
          )}
        </TabsContent>

        <TabsContent value="teachers" className="space-y-4">
          <p className="text-sm text-gray-600">
            Assign Learning Partners to Teachers. LPs will see only their assigned teachers.
          </p>
          {renderMatrix(
            teacherMatrix,
            filteredTeachers,
            filteredLPs,
            'teacher',
            searchTeacher,
            setSearchTeacher
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default LPAssignmentMatrix;
