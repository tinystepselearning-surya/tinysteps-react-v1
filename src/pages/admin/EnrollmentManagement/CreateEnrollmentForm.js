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
import { collection, getDocs, doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebaseConfig';
import { Card, CardHeader, CardTitle, CardContent } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select';
import { toast } from '@components/hooks/use-toast';
const monthsForCycle = { monthly: 1, quarterly: 3, annual: 12 };
const sessionsPerMonthForFrequency = (freq) => {
    switch (freq) {
        case 'weekly': return 4;
        case 'biweekly': return 2;
        case 'monthly': return 1;
        default: return 4;
    }
};
export default function CreateEnrollmentForm({ onCreated }) {
    var _a, _b;
    const [students, setStudents] = useState([]);
    const [courses, setCourses] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [billingCycle, setBillingCycle] = useState('monthly');
    const [step, setStep] = useState(1);
    useEffect(() => { fetchStudents(); fetchCourses(); }, []);
    const fetchStudents = () => __awaiter(this, void 0, void 0, function* () {
        const snap = yield getDocs(collection(db, 'kids'));
        const arr = [];
        snap.forEach(s => arr.push(Object.assign({ id: s.id }, s.data())));
        setStudents(arr);
    });
    const fetchCourses = () => __awaiter(this, void 0, void 0, function* () {
        const snap = yield getDocs(collection(db, 'courses'));
        const arr = [];
        snap.forEach(c => arr.push(Object.assign({ id: c.id }, c.data())));
        setCourses(arr.filter(c => c.status === 'active'));
    });
    const parentForStudent = useMemo(() => {
        var _a;
        if (!selectedStudent)
            return null;
        return ((_a = students.find(s => s.id === selectedStudent)) === null || _a === void 0 ? void 0 : _a.parentId) || null;
    }, [selectedStudent, students]);
    const selectedCourseData = useMemo(() => courses.find(c => c.id === selectedCourse), [selectedCourse, courses]);
    const calculateCredits = () => {
        if (!selectedCourseData)
            return 0;
        const sessionsPerMonth = sessionsPerMonthForFrequency(selectedCourseData.sessionFrequency || 'weekly');
        const months = monthsForCycle[billingCycle];
        return sessionsPerMonth * months;
    };
    const handleCreate = () => __awaiter(this, void 0, void 0, function* () {
        var _a;
        if (!selectedStudent || !selectedCourse) {
            toast({ title: 'Error', description: 'Select student and course', variant: 'destructive' });
            return;
        }
        try {
            const studentDoc = yield getDoc(doc(db, 'kids', selectedStudent));
            const parentId = studentDoc.exists() ? (_a = studentDoc.data()) === null || _a === void 0 ? void 0 : _a.parentId : null;
            const enrollmentRef = doc(collection(db, 'enrollments'));
            const credits = calculateCredits();
            yield setDoc(enrollmentRef, {
                studentId: selectedStudent,
                courseId: selectedCourse,
                parentId: parentId || null,
                teacherId: null,
                lpId: null,
                status: 'pending_teacher',
                ratePerSession: selectedCourseData.ratePerSession || 0,
                billingCycle,
                creditsTotal: credits,
                creditsUsed: 0,
                creditsRemaining: credits,
                topicProgress: {},
                enrollmentDate: serverTimestamp(),
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });
            toast({ title: 'Success', description: 'Enrollment created' });
            onCreated === null || onCreated === void 0 ? void 0 : onCreated();
            setStep(1);
            setSelectedCourse(null);
            setSelectedStudent(null);
        }
        catch (err) {
            toast({ title: 'Error', description: err.message || 'Failed to create enrollment', variant: 'destructive' });
        }
    });
    return (_jsx("div", { className: "max-w-3xl mx-auto", children: _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Create Enrollment" }) }), _jsxs(CardContent, { children: [step === 1 && (_jsxs("div", { className: "space-y-4", children: [_jsx("label", { className: "text-sm font-medium", children: "Select Student" }), _jsxs(Select, { onValueChange: (v) => setSelectedStudent(v), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Choose student" }) }), _jsx(SelectContent, { children: students.map(s => (_jsxs(SelectItem, { value: s.id, children: [s.name, " (", s.grade, ")"] }, s.id))) })] }), selectedStudent && (_jsxs("div", { className: "text-sm text-gray-600", children: ["Parent: ", ((_a = students.find(s => s.id === selectedStudent)) === null || _a === void 0 ? void 0 : _a.parentName) || 'Unknown'] })), _jsx("div", { className: "flex gap-2", children: _jsx(Button, { onClick: () => setStep(2), disabled: !selectedStudent, children: "Next" }) })] })), step === 2 && (_jsxs("div", { className: "space-y-4", children: [_jsx("label", { className: "text-sm font-medium", children: "Select Course" }), _jsxs(Select, { onValueChange: (v) => setSelectedCourse(v), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Choose course" }) }), _jsx(SelectContent, { children: courses.map(c => (_jsxs(SelectItem, { value: c.id, children: [c.name, " \u2014 \u20B9", c.ratePerSession, "/session"] }, c.id))) })] }), selectedCourseData && (_jsxs("div", { className: "p-2 border rounded", children: [_jsxs("div", { children: [_jsx("strong", { children: "Prerequisites:" }), " ", ((_b = selectedCourseData.prerequisites) === null || _b === void 0 ? void 0 : _b.join(', ')) || 'None'] }), _jsxs("div", { children: [_jsx("strong", { children: "Rate/session:" }), " \u20B9", selectedCourseData.ratePerSession] }), _jsxs("div", { children: [_jsx("strong", { children: "Session Frequency:" }), " ", selectedCourseData.sessionFrequency] })] })), _jsxs("div", { className: "flex gap-2", children: [_jsx(Button, { variant: "outline", onClick: () => setStep(1), children: "Back" }), _jsx(Button, { onClick: () => setStep(3), disabled: !selectedCourse, children: "Next" })] })] })), step === 3 && (_jsxs("div", { className: "space-y-4", children: [_jsx("label", { className: "text-sm font-medium", children: "Billing Cycle" }), _jsxs(Select, { onValueChange: (v) => setBillingCycle(v), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Select billing cycle" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "monthly", children: "Monthly" }), _jsx(SelectItem, { value: "quarterly", children: "Quarterly" }), _jsx(SelectItem, { value: "annual", children: "Annual" })] })] }), _jsxs("div", { className: "p-2 border rounded", children: [_jsxs("div", { children: ["Estimated sessions: ", calculateCredits()] }), _jsxs("div", { children: ["Estimated cost per session: \u20B9", (selectedCourseData === null || selectedCourseData === void 0 ? void 0 : selectedCourseData.ratePerSession) || 0] }), _jsxs("div", { className: "mt-2 font-semibold", children: ["Estimated total sessions: ", calculateCredits()] })] }), _jsxs("div", { className: "flex gap-2", children: [_jsx(Button, { variant: "outline", onClick: () => setStep(2), children: "Back" }), _jsx(Button, { onClick: handleCreate, children: "Confirm & Create" })] })] }))] })] }) }));
}
