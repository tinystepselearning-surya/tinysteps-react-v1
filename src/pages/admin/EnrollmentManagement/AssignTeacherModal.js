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
import { collection, getDocs, query, where, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../lib/firebaseConfig';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select';
import { Button } from '@components/ui/button';
import { toast } from '@components/hooks/use-toast';
export default function AssignTeacherModal({ enrollment, onClose }) {
    const [teachers, setTeachers] = useState([]);
    const [selectedTeacher, setSelectedTeacher] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [specialization, setSpecialization] = useState(null);
    useEffect(() => { fetchTeachers(); }, []);
    const fetchTeachers = () => __awaiter(this, void 0, void 0, function* () {
        const q = query(collection(db, 'users'), where('role', '==', 'teacher'));
        const snap = yield getDocs(q);
        const arr = [];
        snap.forEach(d => arr.push(Object.assign({ id: d.id }, d.data())));
        setTeachers(arr);
    });
    const handleConfirm = () => __awaiter(this, void 0, void 0, function* () {
        if (!selectedTeacher) {
            toast({ title: 'Select teacher', description: 'Please select a teacher', variant: 'destructive' });
            return;
        }
        try {
            yield updateDoc(doc(db, 'enrollments', enrollment.id), {
                teacherId: selectedTeacher,
                status: 'pending_lp',
                updatedAt: serverTimestamp(),
            });
            // optional: add assigned mapping on user or parent if required
            toast({ title: 'Success', description: 'Teacher assigned' });
            onClose();
        }
        catch (err) {
            toast({ title: 'Error', description: err.message || 'Failed to assign teacher', variant: 'destructive' });
        }
    });
    return (_jsx(Dialog, { open: true, onOpenChange: onClose, children: _jsxs(DialogContent, { children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Assign Teacher" }), _jsx(DialogDescription, { children: "Select a teacher and optional specialization for this enrollment." })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: ["Student: ", enrollment.studentId] }), _jsxs("div", { children: ["Course: ", enrollment.courseId] }), _jsxs("div", { className: "flex gap-2", children: [_jsx("input", { className: "flex-1 px-3 py-2 border rounded", placeholder: "Search teachers by name or email", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value) }), _jsxs(Select, { value: specialization || '__all__', onValueChange: (v) => setSpecialization(v === '__all__' ? null : v), children: [_jsx(SelectTrigger, { className: "w-44", children: _jsx(SelectValue, { placeholder: "Specialization" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "__all__", children: "All" }), Array.from(new Set(teachers.flatMap(t => (t.specializations || []))))
                                                    .map((s) => _jsx(SelectItem, { value: s, children: s }, s))] })] })] }), _jsxs(Select, { onValueChange: (v) => setSelectedTeacher(v), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Select teacher" }) }), _jsx(SelectContent, { children: teachers
                                        .filter(t => {
                                        if (specialization && !(t.specializations || []).includes(specialization))
                                            return false;
                                        if (searchTerm) {
                                            const str = (t.name || t.email || '').toLowerCase();
                                            return str.includes(searchTerm.toLowerCase());
                                        }
                                        return true;
                                    })
                                        .map(t => (_jsx(SelectItem, { value: t.id, children: t.name || t.email }, t.id))) })] })] }), _jsxs(DialogFooter, { children: [_jsx(Button, { variant: "outline", onClick: onClose, children: "Cancel" }), _jsx(Button, { onClick: handleConfirm, children: "Confirm" })] })] }) }));
}
