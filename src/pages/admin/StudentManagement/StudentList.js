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
import { onSnapshot, collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../../../lib/firebaseConfig';
import { Card } from '@components/ui/card';
import { Input } from '@components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/ui/table';
import { Button } from '@components/ui/button';
import { toast } from '@components/hooks/use-toast';
import AssignCourseModal from './AssignCourseModal';
import AssignTeacherModal from './AssignTeacherModal';
import AssignLPModal from './AssignLPModal';
import { useEnrollmentsForStudents } from '../../../hooks/useData';
const PAGE_SIZE = 25;
import { useAuthStore } from '../../../store/useAuthStore';
export default function StudentList({ onEdit, onDelete, onAssignCourse }) {
    const [students, setStudents] = useState([]);
    const [parents, setParents] = useState([]);
    const [search, setSearch] = useState('');
    const [gradeFilter, setGradeFilter] = useState('all');
    const [parentFilter, setParentFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [page, setPage] = useState(0);
    const [assignCourseFor, setAssignCourseFor] = useState(null);
    const [assignTeacherFor, setAssignTeacherFor] = useState(null);
    const [assignLPFor, setAssignLPFor] = useState(null);
    const { user } = useAuthStore();
    const handleDeleteEnrollment = (enrollmentId) => __awaiter(this, void 0, void 0, function* () {
        if (!window.confirm('Delete this enrollment?'))
            return;
        try {
            yield import('firebase/firestore').then(({ deleteDoc, doc }) => deleteDoc(doc(db, 'enrollments', enrollmentId)));
            toast({ title: 'Enrollment removed' });
            enrollmentsQuery.refetch();
        }
        catch (err) {
            console.error(err);
            toast({ title: 'Error', description: 'Failed to delete enrollment', variant: 'destructive' });
        }
    });
    useEffect(() => {
        // load parents list for filters
        const loadParents = () => __awaiter(this, void 0, void 0, function* () {
            try {
                const q = query(collection(db, 'users'));
                const snap = yield getDocs(q);
                const allUsers = snap.docs.map(d => (Object.assign({ id: d.id }, d.data())));
                setParents(allUsers.filter(u => u.role === 'parent'));
            }
            catch (err) {
                console.error('parents onSnapshot error', err);
            }
        });
        loadParents();
    }, []);
    useEffect(() => {
        const q = query(collection(db, 'kids'), orderBy('createdAt', 'desc'));
        const unsub = onSnapshot(q, snap => {
            const list = snap.docs.map(d => (Object.assign({ id: d.id }, d.data())));
            setStudents(list);
        }, err => console.error(err));
        return () => unsub();
    }, []);
    const filtered = useMemo(() => {
        let list = students.slice();
        if (search) {
            const s = search.toLowerCase();
            list = list.filter(st => st.fullName.toLowerCase().includes(s) || (st.parentIds || []).some(pid => {
                var _a;
                const p = parents.find(x => x.uid === pid || x.id === pid);
                return (_a = p === null || p === void 0 ? void 0 : p.email) === null || _a === void 0 ? void 0 : _a.toLowerCase().includes(s);
            }));
        }
        if (gradeFilter !== 'all')
            list = list.filter(s => s.grade === gradeFilter);
        if (statusFilter !== 'all')
            list = list.filter(s => s.status === statusFilter);
        if (parentFilter !== 'all')
            list = list.filter(s => (s.parentIds || []).includes(parentFilter));
        return list;
    }, [students, search, gradeFilter, statusFilter, parentFilter, parents]);
    const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const paged = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
    const pagedStudentIds = paged.map(s => s.id);
    const enrollmentsQuery = useEnrollmentsForStudents(pagedStudentIds);
    const enrollmentsByStudent = useMemo(() => {
        const map = {};
        if (!enrollmentsQuery.data)
            return map;
        enrollmentsQuery.data.forEach((e) => {
            const sid = e.studentId || e.studentId || e.kidId || (e.kidIds && e.kidIds[0]);
            // Ensure array exists
            if (!map[sid])
                map[sid] = [];
            map[sid].push(e);
        });
        return map;
    }, [enrollmentsQuery.data]);
    return (_jsxs("div", { className: "space-y-4", children: [_jsx("div", { className: "flex justify-between items-center", children: _jsx("h2", { className: "text-2xl font-bold", children: "Students" }) }), _jsx(Card, { className: "p-4", children: _jsxs("div", { className: "flex flex-wrap gap-4", children: [_jsx("div", { className: "flex-1 min-w-[200px]", children: _jsx(Input, { placeholder: "Search name or parent email", value: search, onChange: e => setSearch(e.target.value) }) }), _jsxs(Select, { value: gradeFilter, onValueChange: setGradeFilter, children: [_jsx(SelectTrigger, { className: "w-[150px]", children: _jsx(SelectValue, { placeholder: "Grade" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "all", children: "All Grades" }), _jsx(SelectItem, { value: "Pre-K", children: "Pre-K" }), _jsx(SelectItem, { value: "KG", children: "KG" }), _jsx(SelectItem, { value: "Grade 1", children: "Grade 1" }), _jsx(SelectItem, { value: "Grade 2", children: "Grade 2" })] })] }), _jsxs(Select, { value: statusFilter, onValueChange: setStatusFilter, children: [_jsx(SelectTrigger, { className: "w-[150px]", children: _jsx(SelectValue, { placeholder: "Status" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "all", children: "All Status" }), _jsx(SelectItem, { value: "active", children: "Active" }), _jsx(SelectItem, { value: "suspended", children: "Suspended" }), _jsx(SelectItem, { value: "archived", children: "Archived" })] })] }), _jsxs(Select, { value: parentFilter, onValueChange: setParentFilter, children: [_jsx(SelectTrigger, { className: "w-[250px]", children: _jsx(SelectValue, { placeholder: "Filter by parent" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "all", children: "All Parents" }), parents.map(p => (_jsxs(SelectItem, { value: p.uid || p.id, children: [p.email, " \u2014 ", p.name || p.email] }, p.uid || p.id)))] })] })] }) }), _jsxs(Card, { children: [_jsxs(Table, { children: [_jsx(TableHeader, { children: _jsxs(TableRow, { children: [_jsx(TableHead, { children: "Student" }), _jsx(TableHead, { children: "Parents" }), _jsx(TableHead, { children: "DOB" }), _jsx(TableHead, { children: "Grade" }), _jsx(TableHead, { children: "Status" }), _jsx(TableHead, { children: "Enrollments" }), _jsx(TableHead, { children: "Actions" })] }) }), _jsx(TableBody, { children: paged.map(s => (_jsxs(TableRow, { children: [_jsx(TableCell, { children: s.fullName }), _jsxs(TableCell, { children: [(s.parentIds || []).map(pid => {
                                                    const p = parents.find(x => x.uid === pid || x.id === pid);
                                                    return _jsx("div", { children: (p === null || p === void 0 ? void 0 : p.email) || pid }, pid);
                                                }), enrollmentsByStudent[s.id] && enrollmentsByStudent[s.id].length > 0 ? (_jsx("div", { className: "space-y-1", children: enrollmentsByStudent[s.id].map((e) => {
                                                        var _a;
                                                        return (_jsxs("div", { className: "text-sm flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("strong", { children: ((_a = e.course) === null || _a === void 0 ? void 0 : _a.title) || e.courseId }), e.teacher && ` — ${e.teacher.name || e.teacher.email}`, ` — ${e.status}`] }), _jsx("div", { className: "ml-4", children: _jsx(Button, { size: "sm", variant: "destructive", onClick: () => handleDeleteEnrollment(e.id), disabled: !((user === null || user === void 0 ? void 0 : user.role) === 'admin' || ((user === null || user === void 0 ? void 0 : user.role) === 'learningPartner' && (s.lpId === user.uid))), children: "Remove" }) })] }, e.id));
                                                    }) })) : (_jsx("div", { className: "text-sm text-gray-400", children: "No enrollments" }))] }), _jsx(TableCell, { children: s.dob }), _jsx(TableCell, { children: s.grade }), _jsx(TableCell, { children: s.status }), _jsx(TableCell, { children: _jsxs("div", { className: "flex gap-2", children: [_jsx(Button, { size: "sm", onClick: () => onAssignCourse(s), disabled: !((user === null || user === void 0 ? void 0 : user.role) === 'admin' || ((user === null || user === void 0 ? void 0 : user.role) === 'learningPartner' && (s.lpId === user.uid))), children: "Assign Course" }), _jsx(Button, { size: "sm", onClick: () => setAssignTeacherFor(s), disabled: !((user === null || user === void 0 ? void 0 : user.role) === 'admin' || ((user === null || user === void 0 ? void 0 : user.role) === 'learningPartner' && (s.lpId === user.uid))), children: "Assign Teacher" }), _jsx(Button, { size: "sm", onClick: () => setAssignLPFor(s), disabled: !((user === null || user === void 0 ? void 0 : user.role) === 'admin'), children: (user === null || user === void 0 ? void 0 : user.role) === 'admin' ? 'Assign LP' : 'Not Authorized' }), _jsx(Button, { size: "sm", variant: "destructive", onClick: () => onDelete(s.id), children: "Delete" }), _jsx(Button, { size: "sm", variant: "secondary", onClick: () => onEdit(s), children: "Edit" })] }) })] }, s.id))) })] }), _jsxs("div", { className: "flex items-center justify-between p-4", children: [_jsxs("div", { children: ["Showing ", filtered.length, " students"] }), _jsxs("div", { className: "space-x-2", children: [_jsx(Button, { onClick: () => setPage(p => Math.max(0, p - 1)), disabled: page === 0, children: "Prev" }), _jsxs("span", { children: ["Page ", page + 1, " / ", pageCount] }), _jsx(Button, { onClick: () => setPage(p => Math.min(pageCount - 1, p + 1)), disabled: page >= pageCount - 1, children: "Next" })] })] })] }), assignCourseFor && _jsx(AssignCourseModal, { student: assignCourseFor, onClose: () => setAssignCourseFor(null), onAssigned: () => { setAssignCourseFor(null); enrollmentsQuery.refetch(); } }), assignTeacherFor && _jsx(AssignTeacherModal, { student: assignTeacherFor, onClose: () => setAssignTeacherFor(null), onAssigned: () => { setAssignTeacherFor(null); enrollmentsQuery.refetch(); } }), assignLPFor && _jsx(AssignLPModal, { student: assignLPFor, onClose: () => setAssignLPFor(null), onAssigned: () => { setAssignLPFor(null); enrollmentsQuery.refetch(); } })] }));
}
