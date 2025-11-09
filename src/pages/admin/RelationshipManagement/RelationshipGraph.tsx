import React, { useEffect, useState } from 'react';
import { ForceGraph2D } from 'react-force-graph';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../../lib/firebaseConfig';

interface Node {
  id: string;
  name: string;
  group: string;
}

interface Link {
  source: string;
  target: string;
  type: string;
}

interface GraphData {
  nodes: Node[];
  links: Link[];
}

export function RelationshipGraph() {
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });

  useEffect(() => {
    const fetchData = async () => {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const users: Array<{ id: string; displayName: string; roles: string[]; assignedLPs?: string[]; assignedTeachers?: string[] }> = [];

      usersSnapshot.docs.forEach(doc => {
        users.push({
          id: doc.id,
          displayName: doc.data().displayName || 'Unknown',
          roles: doc.data().roles || [],
          assignedLPs: doc.data().assignedLPs || [],
          assignedTeachers: doc.data().assignedTeachers || []
        });
      });

      const nodes: Node[] = users.map(user => ({
        id: user.id,
        name: user.displayName,
        group: user.roles.includes('parent')
          ? 'Parent'
          : user.roles.includes('teacher')
          ? 'Teacher'
          : user.roles.includes('learningPartner')
          ? 'Learning Partner'
          : 'Unknown',
      }));

      const links: Link[] = [];

      users.forEach(user => {
        if (user.assignedLPs) {
          user.assignedLPs.forEach((lpId: string) => {
            links.push({ source: user.id, target: lpId, type: 'Parent-LP' });
          });
        }

        if (user.assignedTeachers) {
          user.assignedTeachers.forEach((teacherId: string) => {
            links.push({ source: user.id, target: teacherId, type: 'Teacher-LP' });
          });
        }
      });

      setGraphData({ nodes, links });
    };

    fetchData();
  }, []);

  return (
    <div style={{ width: '100%', height: '600px' }}>
      <ForceGraph2D
        graphData={graphData}
        nodeLabel={(node: Node) => `${node.name} (${node.group})`}
        nodeAutoColorBy="group"
        linkDirectionalArrowLength={5}
        linkDirectionalArrowRelPos={1}
        linkLabel={(link: Link) => link.type}
      />
    </div>
  );
}