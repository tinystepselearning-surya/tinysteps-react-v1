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
import { useEffect, useMemo, useState } from 'react';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db, functions } from '../../../lib/firebaseConfig';
import { httpsCallable } from 'firebase/functions';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@components/ui/tabs';
import { useToast } from '@components/hooks/use-toast';
export function LPAssignmentMatrix() {
    const [parentMatrix, setParentMatrix] = useState({ users: [], lps: [], assignments: {} });
    const [teacherMatrix, setTeacherMatrix] = useState({ users: [], lps: [], assignments: {} });
    const [searchParent, setSearchParent] = useState('');
    const [searchTeacher, setSearchTeacher] = useState('');
    const [searchLP, setSearchLP] = useState('');
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    useEffect(() => {
        setLoading(true);
        const parentsQ = query(collection(db, 'users'));
        const teachersQ = query(collection(db, 'users'));
        const lpsQ = query(collection(db, 'users'));
        const unsubParents = onSnapshot(parentsQ, (snap) => {
            const parents = snap.docs
                .filter(d => d.data().role === 'parent')
                .map((d) => ({
                uid: d.id,
                displayName: d.data().displayName || 'Unknown',
                role: 'parent',
                assignedLPs: d.data().assignedLPs || []
            }));
            setParentMatrix((prev) => (Object.assign(Object.assign({}, prev), { users: parents })));
            setLoading(false);
        }, (err) => {
            console.error('parents onSnapshot error', err);
            toast({ title: 'Error', description: 'Failed to listen for parents', variant: 'destructive' });
            setLoading(false);
        });
        const unsubTeachers = onSnapshot(teachersQ, (snap) => {
            const teachers = snap.docs
                .filter(d => d.data().role === 'teacher')
                .map((d) => ({
                uid: d.id,
                displayName: d.data().displayName || 'Unknown',
                role: 'teacher',
                assignedLPs: d.data().assignedLPs || []
            }));
            setTeacherMatrix((prev) => (Object.assign(Object.assign({}, prev), { users: teachers })));
            setLoading(false);
        }, (err) => {
            console.error('teachers onSnapshot error', err);
            toast({ title: 'Error', description: 'Failed to listen for teachers', variant: 'destructive' });
            setLoading(false);
        });
        const unsubLPs = onSnapshot(lpsQ, (snap) => {
            const lps = snap.docs
                .filter(d => d.data().role === 'learningPartner')
                .map((d) => ({
                uid: d.id,
                displayName: d.data().displayName || 'Unknown',
                role: 'learningPartner'
            }));
            // Attach LPs to both matrices
            setParentMatrix((prev) => (Object.assign(Object.assign({}, prev), { lps })));
            setTeacherMatrix((prev) => (Object.assign(Object.assign({}, prev), { lps })));
            setLoading(false);
        }, (err) => {
            console.error('lps onSnapshot error', err);
            toast({ title: 'Error', description: 'Failed to listen for learning partners', variant: 'destructive' });
            setLoading(false);
        });
        // Additionally, listen for assignment changes on any user doc to keep assignments in sync.
        const usersColl = collection(db, 'users');
        const unsubAll = onSnapshot(usersColl, (snap) => {
            const parentAssignments = {};
            const teacherAssignments = {};
            snap.docs.forEach((d) => {
                const data = d.data();
                const role = data.role;
                const assignedLPs = Array.isArray(data.assignedLPs) ? data.assignedLPs : [];
                if (role === 'parent')
                    parentAssignments[d.id] = assignedLPs;
                if (role === 'teacher')
                    teacherAssignments[d.id] = assignedLPs;
            });
            setParentMatrix((prev) => (Object.assign(Object.assign({}, prev), { assignments: parentAssignments })));
            setTeacherMatrix((prev) => (Object.assign(Object.assign({}, prev), { assignments: teacherAssignments })));
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
    const handleAssignment = (userId, lpId, isAssigning, userRole) => __awaiter(this, void 0, void 0, function* () {
        try {
            // Choose callable function based on role and action
            let fnName = '';
            if (userRole === 'parent')
                fnName = isAssigning ? 'assignLPToParent' : 'unassignLPFromParent';
            else
                fnName = isAssigning ? 'assignLPToTeacher' : 'unassignLPFromTeacher';
            const call = httpsCallable(functions, fnName);
            const payload = userRole === 'parent' ? { parentId: userId, lpId } : { teacherId: userId, lpId };
            yield call(payload);
            toast({ title: 'Success', description: isAssigning ? 'LP assigned' : 'LP unassigned' });
        }
        catch (err) {
            console.error('Assignment failed', err);
            toast({ title: 'Error', description: (err === null || err === void 0 ? void 0 : err.message) || 'Could not update assignment', variant: 'destructive' });
        }
    });
    const handleBulkAssign = (lpId, userRole, assign) => __awaiter(this, void 0, void 0, function* () {
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
                    yield fnAssign(payload);
                }
                else if (!assign && currently) {
                    const payload = userRole === 'parent' ? { parentId: user.uid, lpId } : { teacherId: user.uid, lpId };
                    yield fnAssign(payload);
                }
            }
            toast({ title: 'Success', description: assign ? 'Assigned to all' : 'Unassigned from all' });
        }
        catch (err) {
            console.error('Bulk assign failed', err);
            toast({ title: 'Error', description: (err === null || err === void 0 ? void 0 : err.message) || 'Bulk assignment failed', variant: 'destructive' });
        }
    });
    const filteredParents = useMemo(() => parentMatrix.users.filter(u => u.displayName.toLowerCase().includes(searchParent.toLowerCase())), [parentMatrix.users, searchParent]);
    const filteredTeachers = useMemo(() => teacherMatrix.users.filter(u => u.displayName.toLowerCase().includes(searchTeacher.toLowerCase())), [teacherMatrix.users, searchTeacher]);
    const filteredLPs = useMemo(() => parentMatrix.lps.filter(lp => lp.displayName.toLowerCase().includes(searchLP.toLowerCase())), [parentMatrix.lps, searchLP]);
    const renderMatrix = (matrix, filteredUsers, filteredLPs, userRole, searchTerm, setSearchTerm) => {
        return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex gap-4", children: [_jsx(Input, { "aria-label": `${userRole} search`, placeholder: `Search ${userRole}s...`, value: searchTerm, onChange: (e) => setSearchTerm(e.target.value), className: "flex-1" }), _jsx(Input, { "aria-label": "LP search", placeholder: "Search LPs...", value: searchLP, onChange: (e) => setSearchLP(e.target.value), className: "flex-1" })] }), _jsx("div", { className: "overflow-x-auto border rounded-lg", children: _jsxs("table", { className: "w-full", role: "table", "aria-label": `${userRole} lp assignment matrix`, children: [_jsx("thead", { className: "bg-gray-100", children: _jsxs("tr", { children: [_jsx("th", { className: "text-left p-3", children: userRole.toUpperCase() }), filteredLPs.map(lp => (_jsx("th", { className: "text-center p-2 min-w-[120px]", children: _jsx("div", { className: "text-sm font-medium truncate", children: lp.displayName }) }, lp.uid)))] }) }), _jsx("tbody", { children: filteredUsers.map(user => (_jsxs("tr", { className: "border-t hover:bg-gray-50", children: [_jsx("td", { className: "p-3 font-medium", children: user.displayName }), filteredLPs.map(lp => {
                                            const isAssigned = (matrix.assignments[user.uid] || []).includes(lp.uid);
                                            return (_jsx("td", { className: "text-center p-2", children: _jsx("input", { "aria-label": `Assign ${lp.displayName} to ${user.displayName}`, type: "checkbox", checked: isAssigned, onChange: (e) => handleAssignment(user.uid, lp.uid, e.target.checked, userRole), disabled: loading, className: "w-5 h-5 mx-auto" }) }, `${user.uid}-${lp.uid}`));
                                        })] }, user.uid))) })] }) }), _jsxs("div", { className: "bg-blue-50 p-4 rounded-lg space-y-2", children: [_jsx("p", { className: "text-sm font-medium", children: "Bulk Actions:" }), _jsx("div", { className: "flex gap-2 flex-wrap", children: matrix.lps.map(lp => (_jsxs("div", { className: "flex gap-2", children: [_jsxs(Button, { size: "sm", variant: "outline", onClick: () => handleBulkAssign(lp.uid, userRole, true), children: ["Assign ", lp.displayName, " to all"] }), _jsxs(Button, { size: "sm", variant: "outline", onClick: () => handleBulkAssign(lp.uid, userRole, false), children: ["Unassign ", lp.displayName, " from all"] })] }, lp.uid))) })] })] }));
    };
    if (loading)
        return _jsx("div", { className: "p-8 text-center", children: "Loading assignment data..." });
    return (_jsxs("div", { className: "space-y-6", children: [_jsx("h2", { className: "text-2xl font-bold", children: "Learning Partner Assignments" }), _jsxs(Tabs, { defaultValue: "parents", className: "w-full", children: [_jsxs(TabsList, { children: [_jsx(TabsTrigger, { value: "parents", children: "Parents \u2190 LPs" }), _jsx(TabsTrigger, { value: "teachers", children: "Teachers \u2190 LPs" })] }), _jsxs(TabsContent, { value: "parents", className: "space-y-4", children: [_jsx("p", { className: "text-sm text-gray-600", children: "Assign Learning Partners to Parents. LPs will see only their assigned parents." }), renderMatrix(parentMatrix, filteredParents, filteredLPs, 'parent', searchParent, setSearchParent)] }), _jsxs(TabsContent, { value: "teachers", className: "space-y-4", children: [_jsx("p", { className: "text-sm text-gray-600", children: "Assign Learning Partners to Teachers. LPs will see only their assigned teachers." }), renderMatrix(teacherMatrix, filteredTeachers, filteredLPs, 'teacher', searchTeacher, setSearchTeacher)] })] })] }));
}
export default LPAssignmentMatrix;
