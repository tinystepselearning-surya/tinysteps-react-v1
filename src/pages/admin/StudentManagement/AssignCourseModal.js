var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@components/ui/dialog';
import { Button } from '@components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select';
import { collection, getDocs, setDoc, doc, serverTimestamp, getDoc, query, where } from 'firebase/firestore';
import { db } from '../../../lib/firebaseConfig';
import { toast } from '@components/hooks/use-toast';
import { useAuthStore } from '../../../store/useAuthStore';
export default function AssignCourseModal({ student, onClose, onAssigned }) {
    const [courses, setCourses] = useState([]);
    const [selected, setSelected] = useState('');
    const { user } = useAuthStore();
    const [canAssign, setCanAssign] = useState(false);
    const defaultCourses = [
        'Early Phonics',
        'Phonics Foundations',
        'Advanced Phonics',
        'Basic Grammar',
        'Advanced Grammar & Writing',
        'Basic Public Speaking (Early Speakers)',
        'Advanced Public Speaking (Young Leaders)',
        'Spoken English & Confident Communication (Adults)'
    ];
    useEffect(() => {
        const load = () => __awaiter(this, void 0, void 0, function* () {
            try {
                const snap = yield getDocs(collection(db, 'courses'));
                const fetched = snap.docs.map(d => (Object.assign({ id: d.id }, d.data())));
                if (fetched.length === 0) {
                    // fallback to default list with slug ids
                    const mapped = defaultCourses.map(title => ({ id: title.toLowerCase().replace(/[^a-z0-9]+/g, '-'), title }));
                    setCourses(mapped);
                }
                else {
                    setCourses(fetched);
                }
            }
            catch (err) {
                console.error(err);
                toast({ title: 'Error', description: 'Failed to load courses', variant: 'destructive' });
            }
        });
        load();
    }, []);
    useEffect(() => {
        const check = () => __awaiter(this, void 0, void 0, function* () {
            if ((user === null || user === void 0 ? void 0 : user.role) === 'admin')
                return setCanAssign(true);
            if ((user === null || user === void 0 ? void 0 : user.role) === 'learningPartner') {
                const studentDoc = yield getDoc(doc(db, 'kids', student.id));
                const lpId = studentDoc.exists() ? studentDoc.data().lpId : student.lpId;
                return setCanAssign(lpId === user.uid);
            }
            setCanAssign(false);
        });
        check();
    }, [user, student.id]);
    const handleAssign = () => __awaiter(this, void 0, void 0, function* () {
        if (!selected)
            return toast({ title: 'Select', description: 'Please choose a course' });
        try {
            // Check if enrollment already exists for this course and student
            const existingQ = query(collection(db, 'enrollments'), where('studentId', '==', student.id), where('courseId', '==', selected));
            const existingSnap = yield getDocs(existingQ);
            if (!existingSnap.empty) {
                toast({ title: 'Already assigned', description: 'This course is already assigned to the student.', variant: 'destructive' });
                return;
            }
            const enrollmentRef = doc(collection(db, 'enrollments'));
            // read primary parent
            const studentDoc = yield getDoc(doc(db, 'kids', student.id));
            const primaryParentId = studentDoc.exists() ? studentDoc.data().primaryParentId : student.primaryParentId;
            yield setDoc(enrollmentRef, {
                studentId: student.id,
                kidIds: [student.id],
                courseId: selected,
                teacherId: null,
                lpId: null,
                parentId: primaryParentId,
                status: 'pending_teacher',
                ratePerSession: 500,
                billingCycle: 'monthly',
                creditsTotal: 0,
                creditsUsed: 0,
                creditsRemaining: 0,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });
            toast({ title: 'Assigned', description: 'Course assigned to student' });
            onAssigned === null || onAssigned === void 0 ? void 0 : onAssigned();
            onClose();
        }
        catch (err) {
            console.error(err);
            if ((err === null || err === void 0 ? void 0 : err.code) === 'permission-denied') {
                toast({ title: 'Permission denied', description: 'You do not have permission to create enrollments. Please contact an Admin or be assigned as a Learning Partner for this student.', variant: 'destructive' });
            }
            else {
                toast({ title: 'Error', description: err.message || 'Failed', variant: 'destructive' });
            }
        }
    });
    return (_jsx(Dialog, { open: true, onOpenChange: onClose, children: _jsxs(DialogContent, { className: "sm:max-w-[500px]", children: [_jsxs(DialogHeader, { children: [_jsxs(DialogTitle, { children: ["Assign Course to ", student.fullName] }), _jsx(DialogDescription, { children: "Choose a course for this student and create an enrollment. Only Admins and assigned Learning Partners can perform this action." })] }), _jsx("div", { className: "py-4", children: _jsxs(Select, { value: selected, onValueChange: setSelected, children: [_jsx(SelectTrigger, { className: "w-full", children: _jsx(SelectValue, { placeholder: "Select course" }) }), _jsx(SelectContent, { children: courses.map(c => (_jsxs(SelectItem, { value: c.id, children: [c.title || c.name, " \u2014 ", c.level || c.levelName || ''] }, c.id))) })] }) }), _jsxs(DialogFooter, { children: [_jsx(Button, { variant: "outline", onClick: onClose, children: "Cancel" }), _jsx(Button, { onClick: handleAssign, disabled: !canAssign, children: canAssign ? 'Assign' : 'Not Authorized' })] })] }) }));
}
