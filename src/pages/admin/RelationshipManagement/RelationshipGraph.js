var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { ForceGraph2D } from 'react-force-graph';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../../lib/firebaseConfig';
export function RelationshipGraph() {
    const [graphData, setGraphData] = useState({ nodes: [], links: [] });
    useEffect(() => {
        const fetchData = () => __awaiter(this, void 0, void 0, function* () {
            const usersSnapshot = yield getDocs(collection(db, 'users'));
            const users = [];
            usersSnapshot.docs.forEach(doc => {
                users.push({
                    id: doc.id,
                    displayName: doc.data().displayName || 'Unknown',
                    roles: doc.data().roles || [],
                    assignedLPs: doc.data().assignedLPs || [],
                    assignedTeachers: doc.data().assignedTeachers || []
                });
            });
            const nodes = users.map(user => ({
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
            const links = [];
            users.forEach(user => {
                if (user.assignedLPs) {
                    user.assignedLPs.forEach((lpId) => {
                        links.push({ source: user.id, target: lpId, type: 'Parent-LP' });
                    });
                }
                if (user.assignedTeachers) {
                    user.assignedTeachers.forEach((teacherId) => {
                        links.push({ source: user.id, target: teacherId, type: 'Teacher-LP' });
                    });
                }
            });
            setGraphData({ nodes, links });
        });
        fetchData();
    }, []);
    return (_jsx("div", { style: { width: '100%', height: '600px' }, children: _jsx(ForceGraph2D, { graphData: graphData, nodeLabel: (node) => `${node.name} (${node.group})`, nodeAutoColorBy: "group", linkDirectionalArrowLength: 5, linkDirectionalArrowRelPos: 1, linkLabel: (link) => link.type }) }));
}
