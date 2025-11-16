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
  const [searchTerm, setSearchTerm] = useState('');

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

  // Filter teachers by search term
  const filteredTeachers = teachers.filter(teacher =>
    teacher.displayName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="overflow-x-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Teacher ↔ LP Assignment Matrix</h2>
        <input
          type="text"
          placeholder="Search teachers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border p-2 rounded w-1/3"
        />
      </div>
      <table className="w-full border text-sm">
        <thead>
          <tr>
            <th className="border p-2">Teacher</th>
            {lps.map(lp => (
              <th key={lp.id} className="border p-2">{lp.displayName}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filteredTeachers.map(teacher => (
            <tr key={teacher.id}>
              <td className="border p-2">{teacher.displayName}</td>
              {lps.map(lp => (
                <td key={lp.id} className="border p-2 text-center">
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
      <div className="flex justify-between items-center mt-4">
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded"
          onClick={() => alert('Bulk operations coming soon!')}
        >
          Bulk Operations
        </button>
        <button
          className="bg-green-500 text-white px-4 py-2 rounded"
          onClick={() => alert('Changes saved!')}
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}