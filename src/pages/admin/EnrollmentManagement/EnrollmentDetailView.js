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
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../lib/firebaseConfig';
import { Card, CardHeader, CardTitle, CardContent } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Badge } from '@components/ui/badge';
import { Textarea } from '@components/ui/textarea';
import { toast } from '@components/hooks/use-toast';
export default function EnrollmentDetailView({ enrollmentId, onClose }) {
    var _a;
    const [enrollment, setEnrollment] = useState(null);
    const [student, setStudent] = useState(null);
    const [course, setCourse] = useState(null);
    const [teacher, setTeacher] = useState(null);
    const [lp, setLp] = useState(null);
    const [parent, setParent] = useState(null);
    const [note, setNote] = useState('');
    useEffect(() => { fetch(); }, [enrollmentId]);
    const fetch = () => __awaiter(this, void 0, void 0, function* () {
        const eSnap = yield getDoc(doc(db, 'enrollments', enrollmentId));
        if (!eSnap.exists())
            return;
        const data = Object.assign({ id: eSnap.id }, eSnap.data());
        setEnrollment(data);
        if (data.studentId) {
            const s = yield getDoc(doc(db, 'kids', data.studentId));
            setStudent(s.exists() ? Object.assign({ id: s.id }, s.data()) : null);
        }
        if (data.courseId) {
            const c = yield getDoc(doc(db, 'courses', data.courseId));
            setCourse(c.exists() ? Object.assign({ id: c.id }, c.data()) : null);
        }
        if (data.teacherId) {
            const t = yield getDoc(doc(db, 'users', data.teacherId));
            setTeacher(t.exists() ? Object.assign({ id: t.id }, t.data()) : null);
        }
        if (data.lpId) {
            const l = yield getDoc(doc(db, 'users', data.lpId));
            setLp(l.exists() ? Object.assign({ id: l.id }, l.data()) : null);
        }
        if (data.parentId) {
            const p = yield getDoc(doc(db, 'users', data.parentId));
            setParent(p.exists() ? Object.assign({ id: p.id }, p.data()) : null);
        }
    });
    const saveNote = () => __awaiter(this, void 0, void 0, function* () {
        if (!enrollment)
            return;
        try {
            const notes = (enrollment.notes || '') + '\n' + note;
            yield updateDoc(doc(db, 'enrollments', enrollment.id), { notes, updatedAt: serverTimestamp() });
            setNote('');
            toast({ title: 'Saved', description: 'Note saved' });
            fetch();
        }
        catch (err) {
            toast({ title: 'Error', description: err.message || 'Failed to save note', variant: 'destructive' });
        }
    });
    if (!enrollment)
        return _jsx("div", { children: "Loading..." });
    const topicProgress = enrollment.topicProgress || {};
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h3", { className: "text-xl font-semibold", children: "Enrollment Details" }), _jsx("div", { children: _jsx(Button, { variant: "outline", size: "sm", onClick: onClose, children: "Close" }) })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Student & Course" }) }), _jsxs(CardContent, { children: [_jsxs("div", { children: [_jsx("strong", { children: "Student:" }), " ", student === null || student === void 0 ? void 0 : student.name, " - ", student === null || student === void 0 ? void 0 : student.grade] }), _jsxs("div", { children: [_jsx("strong", { children: "Age:" }), " ", (student === null || student === void 0 ? void 0 : student.age) || (student === null || student === void 0 ? void 0 : student.dob) || 'Unknown'] }), _jsxs("div", { children: [_jsx("strong", { children: "Course:" }), " ", course === null || course === void 0 ? void 0 : course.name, " (", course === null || course === void 0 ? void 0 : course.area, ")"] }), _jsxs("div", { children: [_jsx("strong", { children: "Teacher:" }), " ", (teacher === null || teacher === void 0 ? void 0 : teacher.name) || 'Unassigned'] }), _jsxs("div", { children: [_jsx("strong", { children: "Learning Partner:" }), " ", (lp === null || lp === void 0 ? void 0 : lp.name) || 'Unassigned'] }), _jsxs("div", { children: [_jsx("strong", { children: "Parent:" }), " ", (parent === null || parent === void 0 ? void 0 : parent.name) || (parent === null || parent === void 0 ? void 0 : parent.email)] })] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Progress by Topic" }) }), _jsx(CardContent, { children: Object.keys(topicProgress).length === 0 ? (_jsx("div", { className: "text-sm text-gray-500", children: "No topic progress yet." })) : (_jsx("div", { className: "space-y-2", children: Object.entries(topicProgress).map(([topicId, t]) => {
                                var _a;
                                return (_jsxs("div", { className: "p-2 border rounded", children: [_jsxs("div", { children: [_jsx("strong", { children: "Topic:" }), " ", t.name || topicId] }), _jsxs("div", { children: ["Status: ", _jsx(Badge, { variant: t.status === 'completed' ? 'default' : 'secondary', children: t.status })] }), _jsxs("div", { children: ["Mastery: ", t.mastery || 0, "%"] }), _jsxs("div", { children: ["Last Updated: ", ((_a = t.lastUpdated) === null || _a === void 0 ? void 0 : _a.toDate) ? t.lastUpdated.toDate().toLocaleString() : '-'] })] }, topicId));
                            }) })) })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Credits & Timeline" }) }), _jsxs(CardContent, { children: [_jsxs("div", { children: ["Credits Used: ", enrollment.creditsUsed || 0] }), _jsxs("div", { children: ["Credits Total: ", enrollment.creditsTotal || 0] }), _jsxs("div", { children: ["Credits Remaining: ", enrollment.creditsRemaining || 0] }), _jsxs("div", { children: ["Enrollment Date: ", ((_a = enrollment.enrollmentDate) === null || _a === void 0 ? void 0 : _a.toDate) ? enrollment.enrollmentDate.toDate().toLocaleDateString() : 'Unknown'] }), _jsxs("div", { children: ["Start Date: ", enrollment.startDate ? new Date(enrollment.startDate).toLocaleDateString() : 'Not started'] }), _jsxs("div", { children: ["Completion Date: ", enrollment.completionDate || 'N/A'] })] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Admin Notes" }) }), _jsxs(CardContent, { children: [_jsx("div", { className: "mb-2", children: enrollment.notes || 'No notes' }), _jsx(Textarea, { value: note, onChange: (e) => setNote(e.target.value), placeholder: "Add admin note" }), _jsx("div", { className: "flex gap-2 mt-2", children: _jsx(Button, { onClick: saveNote, children: "Save Note" }) })] })] })] }));
}
