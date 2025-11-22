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
export function TeacherLPMatrix() {
    const [teachers, setTeachers] = useState([]);
    const [lps, setLps] = useState([]);
    const [assignments, setAssignments] = useState({});
    const [searchTerm, setSearchTerm] = useState('');
    // Load all teachers
    useEffect(() => {
        const q = query(collection(db, 'users'), where('roles', 'array-contains', 'teacher'));
        getDocs(q).then(snapshot => {
            setTeachers(snapshot.docs.map(d => (Object.assign({ id: d.id }, d.data()))));
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
        teachers.forEach(teacher => {
            assignments[teacher.id] = teacher.assignedLPs || [];
        });
        setAssignments(assignments);
    }, [teachers]);
    // Toggle assignment
    const toggleAssignment = (teacherId, lpId) => __awaiter(this, void 0, void 0, function* () {
        var _a;
        const isAssigned = (_a = assignments[teacherId]) === null || _a === void 0 ? void 0 : _a.includes(lpId);
        // Update in Firestore
        const newLPs = isAssigned
            ? assignments[teacherId].filter(id => id !== lpId)
            : [...(assignments[teacherId] || []), lpId];
        yield updateDoc(doc(db, 'users', teacherId), {
            assignedLPs: newLPs
        });
        // Update local state
        setAssignments(Object.assign(Object.assign({}, assignments), { [teacherId]: newLPs }));
    });
    // Filter teachers by search term
    const filteredTeachers = teachers.filter(teacher => teacher.displayName.toLowerCase().includes(searchTerm.toLowerCase()));
    return (_jsxs("div", { className: "overflow-x-auto p-4", children: [_jsxs("div", { className: "flex justify-between items-center mb-4", children: [_jsx("h2", { className: "text-xl font-bold", children: "Teacher \u2194 LP Assignment Matrix" }), _jsx("input", { type: "text", placeholder: "Search teachers...", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value), className: "border p-2 rounded w-1/3" })] }), _jsxs("table", { className: "w-full border text-sm", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { className: "border p-2", children: "Teacher" }), lps.map(lp => (_jsx("th", { className: "border p-2", children: lp.displayName }, lp.id)))] }) }), _jsx("tbody", { children: filteredTeachers.map(teacher => (_jsxs("tr", { children: [_jsx("td", { className: "border p-2", children: teacher.displayName }), lps.map(lp => {
                                    var _a;
                                    return (_jsx("td", { className: "border p-2 text-center", children: _jsx("input", { type: "checkbox", checked: ((_a = assignments[teacher.id]) === null || _a === void 0 ? void 0 : _a.includes(lp.id)) || false, onChange: () => toggleAssignment(teacher.id, lp.id) }) }, lp.id));
                                })] }, teacher.id))) })] }), _jsxs("div", { className: "flex justify-between items-center mt-4", children: [_jsx("button", { className: "bg-blue-500 text-white px-4 py-2 rounded", onClick: () => alert('Bulk operations coming soon!'), children: "Bulk Operations" }), _jsx("button", { className: "bg-green-500 text-white px-4 py-2 rounded", onClick: () => alert('Changes saved!'), children: "Save Changes" })] })] }));
}
