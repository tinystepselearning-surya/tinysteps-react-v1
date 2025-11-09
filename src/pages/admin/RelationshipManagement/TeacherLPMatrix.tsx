import React, { useEffect, useState } from 'react';
import { collection, doc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { db } from '../../../lib/firebaseConfig';

interface User {
  id: string;
  displayName: string;
  roles: string[];
  assignedLPs?: string[];
}

interface Assignments {
  [teacherId: string]: string[];
}

export function TeacherLPMatrix() {
  const [teachers, setTeachers] = useState<User[]>([]);
  const [lps, setLps] = useState<User[]>([]);
  const [assignments, setAssignments] = useState<Assignments>({});

  // Load all teachers
  useEffect(() => {
    const q = query(collection(db, 'users'), 
      where('roles', 'array-contains', 'teacher'));
    getDocs(q).then(snapshot => {
      setTeachers(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as User)));
    });
  }, []);

  // Load all LPs
  useEffect(() => {
    const q = query(collection(db, 'users'), 
      where('roles', 'array-contains', 'learningPartner'));
    getDocs(q).then(snapshot => {
      setLps(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as User)));
    });
  }, []);

  // Load assignments
  useEffect(() => {
    const assignments: Assignments = {};
    teachers.forEach(teacher => {
      assignments[teacher.id] = teacher.assignedLPs || [];
    });
    setAssignments(assignments);
  }, [teachers]);

  // Toggle assignment
  const toggleAssignment = async (teacherId: string, lpId: string) => {
    const isAssigned = assignments[teacherId]?.includes(lpId);
    
    // Update in Firestore
    const newLPs = isAssigned
      ? assignments[teacherId].filter(id => id !== lpId)
      : [...(assignments[teacherId] || []), lpId];

    await updateDoc(doc(db, 'users', teacherId), {
      assignedLPs: newLPs
    });

    // Update local state
    setAssignments({
      ...assignments,
      [teacherId]: newLPs
    });
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border">
        <thead>
          <tr>
            <th>Teacher</th>
            {lps.map(lp => (
              <th key={lp.id}>{lp.displayName}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {teachers.map(teacher => (
            <tr key={teacher.id}>
              <td>{teacher.displayName}</td>
              {lps.map(lp => (
                <td key={lp.id}>
                  <input
                    type="checkbox"
                    checked={assignments[teacher.id]?.includes(lp.id) || false}
                    onChange={() => toggleAssignment(teacher.id, lp.id)}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}