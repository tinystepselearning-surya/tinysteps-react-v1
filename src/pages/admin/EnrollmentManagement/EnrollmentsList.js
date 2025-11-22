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
import { collection, getDocs, query, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../lib/firebaseConfig';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/ui/table';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { Badge } from '@components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@components/ui/card';
import { Eye, Edit } from 'lucide-react';
import EnrollmentDetailView from './EnrollmentDetailView';
import AssignTeacherModal from './AssignTeacherModal';
import AssignLPModal from './AssignLPModal';
export default function EnrollmentsList() {
    const [enrollments, setEnrollments] = useState([]);
    const [studentsMap, setStudentsMap] = useState({});
    const [coursesMap, setCoursesMap] = useState({});
    const [usersMap, setUsersMap] = useState({});
    const [filters, setFilters] = useState({ course: '', parent: '', teacher: '', lp: '', status: '' });
    const [search, setSearch] = useState('');
    const [selectedEnrollment, setSelectedEnrollment] = useState(null);
    const [assignTeacherFor, setAssignTeacherFor] = useState(null);
    const [assignLPFor, setAssignLPFor] = useState(null);
    useEffect(() => {
        fetchEnrollments();
    }, []);
    const fetchEnrollments = () => __awaiter(this, void 0, void 0, function* () {
        const q = query(collection(db, 'enrollments'));
        const snap = yield getDocs(q);
        const items = [];
        const userIds = new Set();
        const studentIds = new Set();
        const courseIds = new Set();
        snap.forEach((d) => {
            const data = Object.assign({ id: d.id }, d.data());
            items.push(data);
            // Enrollment documents may use "studentId" (singular) OR "kidIds" (array)
            if (data.studentId)
                studentIds.add(data.studentId);
            if (Array.isArray(data.kidIds))
                data.kidIds.forEach((k) => studentIds.add(k));
            if (data.parentId)
                userIds.add(data.parentId);
            if (data.teacherId)
                userIds.add(data.teacherId);
            if (data.lpId)
                userIds.add(data.lpId);
            if (data.courseId)
                courseIds.add(data.courseId);
        });
        // fetch students
        const sMap = {};
        if (studentIds.size > 0) {
            const studentsSnap = yield getDocs(collection(db, 'kids'));
            studentsSnap.forEach(s => {
                if (studentIds.has(s.id))
                    sMap[s.id] = Object.assign({ id: s.id }, s.data());
            });
        }
        // fetch courses
        const cMap = {};
        if (courseIds.size > 0) {
            const coursesSnap = yield getDocs(collection(db, 'courses'));
            coursesSnap.forEach(c => {
                if (courseIds.has(c.id))
                    cMap[c.id] = Object.assign({ id: c.id }, c.data());
            });
        }
        // fetch users (parents/teachers/lps)
        const uMap = {};
        if (userIds.size > 0) {
            const usersSnap = yield getDocs(collection(db, 'users'));
            usersSnap.forEach(u => {
                if (userIds.has(u.id))
                    uMap[u.id] = Object.assign({ id: u.id }, u.data());
            });
        }
        setStudentsMap(sMap);
        setCoursesMap(cMap);
        setUsersMap(uMap);
        setEnrollments(items);
    });
    const getBadge = (status) => {
        switch (status) {
            case 'pending_teacher': return _jsx(Badge, { variant: "secondary", children: "\uD83D\uDFE1 Pending Teacher" });
            case 'pending_lp': return _jsx(Badge, { variant: "secondary", children: "\uD83D\uDFE1 Pending LP" });
            case 'active': return _jsx(Badge, { variant: "default", children: "\uD83D\uDFE2 Active" });
            case 'completed': return _jsx(Badge, { variant: "outline", children: "\uD83D\uDD35 Completed" });
            case 'cancelled': return _jsx(Badge, { variant: "destructive", children: "\uD83D\uDD34 Cancelled" });
            default: return _jsx(Badge, { children: "Unknown" });
        }
    };
    const openAssignTeacher = (enrollment) => setAssignTeacherFor(enrollment);
    const openAssignLP = (enrollment) => setAssignLPFor(enrollment);
    const cancelEnrollment = (id) => __awaiter(this, void 0, void 0, function* () {
        if (!confirm('Cancel this enrollment?'))
            return;
        yield updateDoc(doc(db, 'enrollments', id), { status: 'cancelled', updatedAt: serverTimestamp() });
        fetchEnrollments();
    });
    const filtered = enrollments.filter(e => {
        const student = studentsMap[e.studentId] || (Array.isArray(e.kidIds) && e.kidIds.length > 0 ? studentsMap[e.kidIds[0]] : undefined);
        if (search && !((student === null || student === void 0 ? void 0 : student.name) || '').toLowerCase().includes(search.toLowerCase()))
            return false;
        if (filters.course && e.courseId !== filters.course)
            return false;
        if (filters.parent && e.parentId !== filters.parent)
            return false;
        if (filters.teacher && e.teacherId !== filters.teacher)
            return false;
        if (filters.lp && e.lpId !== filters.lp)
            return false;
        if (filters.status && e.status !== filters.status)
            return false;
        return true;
    });
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h2", { className: "text-xl font-semibold", children: "Enrollments" }), _jsx("div", { className: "flex gap-2", children: _jsx(Input, { placeholder: "Search by student name", value: search, onChange: (e) => setSearch(e.target.value) }) })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "All Enrollments" }) }), _jsx(CardContent, { children: _jsxs(Table, { children: [_jsx(TableHeader, { children: _jsxs(TableRow, { children: [_jsx(TableHead, { children: "Student" }), _jsx(TableHead, { children: "Course" }), _jsx(TableHead, { children: "Parent" }), _jsx(TableHead, { children: "Teacher" }), _jsx(TableHead, { children: "LP" }), _jsx(TableHead, { children: "Status" }), _jsx(TableHead, { children: "Progress" }), _jsx(TableHead, { children: "Duration" }), _jsx(TableHead, { children: "Actions" })] }) }), _jsx(TableBody, { children: filtered.map(e => {
                                        // Enrollment doc may store kid id as 'studentId' or as an array under 'kidIds'
                                        const student = studentsMap[e.studentId] || (Array.isArray(e.kidIds) && e.kidIds.length > 0 ? studentsMap[e.kidIds[0]] : undefined);
                                        // Course ID could be stored as 'courseId' or as 'course_id' in some schemas; support both
                                        const course = coursesMap[e.courseId] || coursesMap[e.course_id];
                                        const parent = usersMap[e.parentId];
                                        const teacher = usersMap[e.teacherId];
                                        const lp = usersMap[e.lpId];
                                        // progress percent
                                        const tp = e.topicProgress && typeof e.topicProgress === 'object'
                                            ? e.topicProgress
                                            : {};
                                        const totalTopicsFromProgress = Object.keys(tp).length;
                                        const totalTopicsFromCourse = Array.isArray(course === null || course === void 0 ? void 0 : course.topics)
                                            ? course.topics.length
                                            : 0;
                                        const totalTopics = totalTopicsFromProgress || totalTopicsFromCourse;
                                        const completed = Object.values(tp).filter((t) => t && t.status === 'completed').length;
                                        const progressPct = totalTopics === 0 ? 0 : Math.round((completed / totalTopics) * 100);
                                        // duration days
                                        const resolveDate = (value) => {
                                            if (!value)
                                                return null;
                                            if (value instanceof Date) {
                                                return isNaN(value.getTime()) ? null : value;
                                            }
                                            if (typeof value.toDate === 'function') {
                                                const d = value.toDate();
                                                return d instanceof Date && !isNaN(d.getTime()) ? d : null;
                                            }
                                            const d = new Date(value);
                                            return isNaN(d.getTime()) ? null : d;
                                        };
                                        const enrollmentDate = resolveDate(e.enrollmentDate);
                                        const startDate = resolveDate(e.startDate) || enrollmentDate;
                                        let durationDays = '-';
                                        if (startDate) {
                                            const diffMs = new Date().getTime() - startDate.getTime();
                                            if (!isNaN(diffMs)) {
                                                durationDays =
                                                    diffMs >= 0
                                                        ? Math.ceil(diffMs / (1000 * 60 * 60 * 24))
                                                        : 0;
                                            }
                                        }
                                        return (_jsxs(TableRow, { children: [_jsx(TableCell, { className: "font-medium", children: (student === null || student === void 0 ? void 0 : student.name) || 'Unknown' }), _jsx(TableCell, { children: (course === null || course === void 0 ? void 0 : course.name) || 'Unknown Course' }), _jsx(TableCell, { children: (parent === null || parent === void 0 ? void 0 : parent.name) || (parent === null || parent === void 0 ? void 0 : parent.email) || 'Unknown Parent' }), _jsx(TableCell, { children: (teacher === null || teacher === void 0 ? void 0 : teacher.name) || 'Unassigned' }), _jsx(TableCell, { children: (lp === null || lp === void 0 ? void 0 : lp.name) || 'Unassigned' }), _jsx(TableCell, { children: getBadge(e.status) }), _jsxs(TableCell, { children: [progressPct, "%"] }), _jsx(TableCell, { children: durationDays }), _jsx(TableCell, { children: _jsxs("div", { className: "flex gap-2", children: [_jsx(Button, { size: "sm", variant: "outline", onClick: () => setSelectedEnrollment(e), children: _jsx(Eye, { className: "h-4 w-4" }) }), _jsx(Button, { size: "sm", variant: "ghost", onClick: () => setSelectedEnrollment(e), children: _jsx(Edit, { className: "h-4 w-4" }) }), e.status === 'pending_teacher' && (_jsx(Button, { size: "sm", onClick: () => openAssignTeacher(e), children: "Assign Teacher" })), e.status === 'pending_lp' && (_jsx(Button, { size: "sm", onClick: () => openAssignLP(e), children: "Assign LP" })), _jsx(Button, { size: "sm", variant: "destructive", onClick: () => cancelEnrollment(e.id), children: "Cancel" })] }) })] }, e.id));
                                    }) })] }) })] }), selectedEnrollment && (_jsx("div", { className: "mt-4", children: _jsx(EnrollmentDetailView, { enrollmentId: selectedEnrollment.id, onClose: () => setSelectedEnrollment(null) }) })), assignTeacherFor && (_jsx(AssignTeacherModal, { enrollment: assignTeacherFor, onClose: () => { setAssignTeacherFor(null); fetchEnrollments(); } })), assignLPFor && (_jsx(AssignLPModal, { enrollment: assignLPFor, onClose: () => { setAssignLPFor(null); fetchEnrollments(); } }))] }));
}
