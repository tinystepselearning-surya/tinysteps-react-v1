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
import { collection, getDocs, query, where, updateDoc, doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../lib/firebaseConfig';
import { toast } from '@components/hooks/use-toast';
import { useAuthStore } from '../../../store/useAuthStore';
export default function AssignTeacherModal({ student, onClose, onAssigned }) {
    const [teachers, setTeachers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [specialization, setSpecialization] = useState(null);
    const [enrollments, setEnrollments] = useState([]);
    const [courses, setCourses] = useState([]);
    const [courseMap, setCourseMap] = useState({});
    const [selectedEnrollment, setSelectedEnrollment] = useState('');
    const [selectedTeacher, setSelectedTeacher] = useState('');
    const { user } = useAuthStore();
    const [canAssign, setCanAssign] = useState(false);
    useEffect(() => {
        const load = () => __awaiter(this, void 0, void 0, function* () {
            try {
                const tQ = query(collection(db, 'users'), where('role', '==', 'teacher'));
                const tSnap = yield getDocs(tQ);
                setTeachers(tSnap.docs.map(d => (Object.assign({ id: d.id }, d.data()))));
                const eQ = query(collection(db, 'enrollments'), where('studentId', '==', student.id));
                const eSnap = yield getDocs(eQ);
                setEnrollments(eSnap.docs.map(d => (Object.assign({ id: d.id }, d.data()))));
                const cSnap = yield getDocs(collection(db, 'courses'));
                const cList = cSnap.docs.map(d => (Object.assign({ id: d.id }, d.data())));
                setCourses(cList);
                const cMap = {};
                cList.forEach(c => cMap[c.id] = c.title || c.name || c.id);
                setCourseMap(cMap);
            }
            catch (err) {
                console.error(err);
                toast({ title: 'Error', description: 'Failed to load data', variant: 'destructive' });
            }
        });
        load();
    }, [student.id]);
    useEffect(() => {
        const check = () => __awaiter(this, void 0, void 0, function* () {
            if ((user === null || user === void 0 ? void 0 : user.role) === 'admin')
                return setCanAssign(true);
            if ((user === null || user === void 0 ? void 0 : user.role) === 'learningPartner') {
                const studentDoc = yield getDoc(doc(db, 'kids', student.id));
                const lpId = studentDoc.exists() ? studentDoc.data().lpId : undefined;
                return setCanAssign(lpId === user.uid);
            }
            if ((user === null || user === void 0 ? void 0 : user.role) === 'teacher') {
                // Teacher can update teacher assignment only if they are the same teacher assigned (not typical), but keep false for now
                setCanAssign(false);
            }
            setCanAssign(false);
        });
        check();
    }, [user, student.id]);
    const handleAssign = () => __awaiter(this, void 0, void 0, function* () {
        if (!selectedEnrollment)
            return toast({ title: 'Select', description: 'Select enrollment' });
        if (!selectedTeacher)
            return toast({ title: 'Select', description: 'Select teacher' });
        try {
            const enrRef = doc(db, 'enrollments', selectedEnrollment);
            yield updateDoc(enrRef, {
                teacherId: selectedTeacher,
                status: 'pending_payment',
                updatedAt: new Date(),
            });
            // Update the kid's teacherId
            yield updateDoc(doc(db, 'kids', student.id), {
                teacherId: selectedTeacher,
                updatedAt: serverTimestamp(),
            });
            toast({ title: 'Assigned', description: 'Teacher assigned' });
            onAssigned === null || onAssigned === void 0 ? void 0 : onAssigned();
            onClose();
        }
        catch (err) {
            console.error(err);
            if ((err === null || err === void 0 ? void 0 : err.code) === 'permission-denied') {
                toast({ title: 'Permission denied', description: 'You do not have permission to assign teachers. Please contact an Admin or the assigned Learning Partner.', variant: 'destructive' });
            }
            else {
                toast({ title: 'Error', description: err.message || 'Failed to assign', variant: 'destructive' });
            }
        }
    });
    return (_jsx(Dialog, { open: true, onOpenChange: onClose, children: _jsxs(DialogContent, { className: "sm:max-w-[600px]", children: [_jsxs(DialogHeader, { children: [_jsxs(DialogTitle, { children: ["Assign Teacher for ", student.fullName] }), _jsx(DialogDescription, { children: "Select an enrollment and a teacher to assign. Admins and Learning Partners can update teacher assignments for students under their supervision." })] }), _jsxs("div", { className: "py-4 space-y-4", children: [_jsxs("div", { className: "flex gap-2", children: [_jsx("input", { className: "flex-1 px-3 py-2 border rounded", placeholder: "Search teachers by name or email", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value) }), _jsxs(Select, { value: specialization || '__all__', onValueChange: (v) => setSpecialization(v === '__all__' ? null : v), children: [_jsx(SelectTrigger, { className: "w-44", children: _jsx(SelectValue, { placeholder: "Specialization" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "__all__", children: "All" }), Array.from(new Set(teachers.flatMap(t => (t.specializations || []))))
                                                    .map((s) => _jsx(SelectItem, { value: s, children: s }, s))] })] })] }), _jsx("div", { children: _jsxs(Select, { value: selectedEnrollment, onValueChange: setSelectedEnrollment, children: [_jsx(SelectTrigger, { className: "w-full", children: _jsx(SelectValue, { placeholder: "Select enrollment (course)" }) }), _jsx(SelectContent, { children: enrollments.map(e => (_jsxs(SelectItem, { value: e.id, children: [courseMap[e.courseId] || e.courseId, " \u2014 ", e.status] }, e.id))) })] }) }), _jsx("div", { children: _jsxs(Select, { value: selectedTeacher, onValueChange: setSelectedTeacher, children: [_jsx(SelectTrigger, { className: "w-full", children: _jsx(SelectValue, { placeholder: "Select teacher" }) }), _jsx(SelectContent, { children: teachers
                                            .filter(t => {
                                            if (specialization && !(t.specializations || []).includes(specialization))
                                                return false;
                                            if (searchTerm) {
                                                const str = (t.name || t.email || '').toLowerCase();
                                                return str.includes(searchTerm.toLowerCase());
                                            }
                                            return true;
                                        })
                                            .map(t => (_jsx(SelectItem, { value: t.uid || t.id, children: t.name || t.email }, t.uid || t.id))) })] }) })] }), _jsxs(DialogFooter, { children: [_jsx(Button, { variant: "outline", onClick: onClose, children: "Cancel" }), _jsx(Button, { onClick: handleAssign, disabled: !canAssign, children: canAssign ? 'Assign Teacher' : 'Not Authorized' })] })] }) }));
}
