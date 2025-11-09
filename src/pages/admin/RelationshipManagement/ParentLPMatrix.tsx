import React, { useEffect, useState } from 'react';
import { collection, doc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { db } from '../../../lib/firebaseConfig';

// Define types for Firestore data
interface Parent {
  id: string;
  displayName: string;
  assignedLPs?: string[];
}

interface LearningPartner {
  id: string;
  displayName: string;
}

export function ParentLPMatrix() {
  const [parents, setParents] = useState<Parent[]>([]);
  const [lps, setLps] = useState<LearningPartner[]>([]);
  const [assignments, setAssignments] = useState<Record<string, string[]>>({});

  // Load all parents
  useEffect(() => {
    const q = query(collection(db, 'users'), 
      where('roles', 'array-contains', 'parent'));
    getDocs(q).then(snapshot => {
      setParents(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Parent)));
    });
  }, []);

  // Load all LPs
  useEffect(() => {
    const q = query(collection(db, 'users'), 
      where('roles', 'array-contains', 'learningPartner'));
    getDocs(q).then(snapshot => {
      setLps(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as LearningPartner)));
    });
  }, []);

  // Load assignments
  useEffect(() => {
    const assignments: Record<string, string[]> = {};
    parents.forEach(parent => {
      assignments[parent.id] = parent.assignedLPs || [];
    });
    setAssignments(assignments);
  }, [parents]);

  // Toggle assignment
  const toggleAssignment = async (parentId: string, lpId: string) => {
    const isAssigned = assignments[parentId]?.includes(lpId);
    
    // Update in Firestore
    const newLPs = isAssigned
      ? assignments[parentId].filter(id => id !== lpId)
      : [...(assignments[parentId] || []), lpId];

    await updateDoc(doc(db, 'users', parentId), {
      assignedLPs: newLPs
    });

    // Update local state
    setAssignments({
      ...assignments,
      [parentId]: newLPs
    });
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border">
        <thead>
          <tr>
            <th>Parent</th>
            {lps.map(lp => (
              <th key={lp.id}>{lp.displayName}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {parents.map(parent => (
            <tr key={parent.id}>
              <td>{parent.displayName}</td>
              {lps.map(lp => (
                <td key={lp.id}>
                  <input
                    type="checkbox"
                    checked={assignments[parent.id]?.includes(lp.id) || false}
                    onChange={() => toggleAssignment(parent.id, lp.id)}
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