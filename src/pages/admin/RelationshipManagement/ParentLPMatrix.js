var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { collection, doc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { db } from '../../../lib/firebaseConfig';
import { Input } from '@components/ui/input';
import { Button } from '@components/ui/button';
export function ParentLPMatrix() {
    const [parents, setParents] = useState([]);
    const [lps, setLps] = useState([]);
    const [assignments, setAssignments] = useState({});
    const [searchParent, setSearchParent] = useState('');
    const [searchLP, setSearchLP] = useState('');
    // Load all parents
    useEffect(() => {
        const q = query(collection(db, 'users'), where('roles', 'array-contains', 'parent'));
        getDocs(q).then(snapshot => {
            setParents(snapshot.docs.map(d => (Object.assign({ id: d.id }, d.data()))));
        });
    }, []);
    // Load all LPs
    useEffect(() => {
        const q = query(collection(db, 'users'), where('roles', 'array-contains', 'learningPartner'));
        getDocs(q).then(snapshot => {
            setLps(snapshot.docs.map(d => (Object.assign({ id: d.id }, d.data()))));
        });
    }, []);
    // Load assignments
    useEffect(() => {
        const assignments = {};
        parents.forEach(parent => {
            assignments[parent.id] = parent.assignedLPs || [];
        });
        setAssignments(assignments);
    }, [parents]);
    // Toggle assignment
    const toggleAssignment = (parentId, lpId) => __awaiter(this, void 0, void 0, function* () {
        var _a;
        const isAssigned = (_a = assignments[parentId]) === null || _a === void 0 ? void 0 : _a.includes(lpId);
        // Update in Firestore
        const newLPs = isAssigned
            ? assignments[parentId].filter(id => id !== lpId)
            : [...(assignments[parentId] || []), lpId];
        yield updateDoc(doc(db, 'users', parentId), {
            assignedLPs: newLPs
        });
        // Update local state
        setAssignments(Object.assign(Object.assign({}, assignments), { [parentId]: newLPs }));
    });
    const filteredParents = parents.filter(parent => parent.displayName.toLowerCase().includes(searchParent.toLowerCase()));
    const filteredLPs = lps.filter(lp => lp.displayName.toLowerCase().includes(searchLP.toLowerCase()));
    return (_jsxs("div", { className: "overflow-x-auto p-4", children: [_jsx("h1", { className: "text-xl font-bold mb-4", children: "Parent-LP Assignment Matrix" }), _jsxs("div", { className: "flex gap-4 mb-4", children: [_jsx(Input, { placeholder: "Search Parents", value: searchParent, onChange: (e) => setSearchParent(e.target.value) }), _jsx(Input, { placeholder: "Search LPs", value: searchLP, onChange: (e) => setSearchLP(e.target.value) })] }), _jsxs("table", { className: "w-full border", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Parent" }), filteredLPs.map(lp => (_jsx("th", { children: lp.displayName }, lp.id)))] }) }), _jsx("tbody", { children: filteredParents.map(parent => (_jsxs("tr", { children: [_jsx("td", { children: parent.displayName }), filteredLPs.map(lp => {
                                    var _a;
                                    return (_jsx("td", { children: _jsx("input", { type: "checkbox", checked: ((_a = assignments[parent.id]) === null || _a === void 0 ? void 0 : _a.includes(lp.id)) || false, onChange: () => toggleAssignment(parent.id, lp.id) }) }, lp.id));
                                })] }, parent.id))) })] }), _jsx("div", { className: "mt-4", children: _jsx(Button, { onClick: () => alert('Bulk operations coming soon!'), children: "Bulk Assign" }) })] }));
}
