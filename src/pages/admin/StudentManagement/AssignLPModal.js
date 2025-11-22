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
import { collection, getDocs, query, where, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../lib/firebaseConfig';
import { toast } from '@components/hooks/use-toast';
import { useAuthStore } from '../../../store/useAuthStore';
export default function AssignLPModal({ student, onClose, onAssigned }) {
    const [lps, setLps] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [enrollments, setEnrollments] = useState([]);
    const [courses, setCourses] = useState([]);
    const [courseMap, setCourseMap] = useState({});
    const [selectedEnrollment, setSelectedEnrollment] = useState('');
    const [selectedLP, setSelectedLP] = useState('');
    const { user } = useAuthStore();
    const [canAssign, setCanAssign] = useState(false);
    useEffect(() => {
        const load = () => __awaiter(this, void 0, void 0, function* () {
            try {
                const lpQ = query(collection(db, 'users'), where('role', '==', 'learningPartner'));
                const lpSnap = yield getDocs(lpQ);
                setLps(lpSnap.docs.map(d => (Object.assign({ id: d.id }, d.data()))));
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
        // Only Admins can assign LPs to a student
        setCanAssign((user === null || user === void 0 ? void 0 : user.role) === 'admin');
    }, [user]);
    const handleAssign = () => __awaiter(this, void 0, void 0, function* () {
        if (!selectedEnrollment)
            return toast({ title: 'Select', description: 'Select enrollment' });
        if (!selectedLP)
            return toast({ title: 'Select', description: 'Select LP' });
        try {
            const enrRef = doc(db, 'enrollments', selectedEnrollment);
            yield updateDoc(enrRef, {
                lpId: selectedLP,
                status: 'active',
                updatedAt: new Date(),
            });
            // Update the kid's lpId
            yield updateDoc(doc(db, 'kids', student.id), {
                lpId: selectedLP,
                updatedAt: serverTimestamp(),
            });
            // Optionally link LP to parent: simplistic approach - find enrollment parentId and update LP's managed list
            // Skipping complex linking here; can be added later
            toast({ title: 'Assigned', description: 'Learning Partner assigned' });
            onAssigned === null || onAssigned === void 0 ? void 0 : onAssigned();
            onClose();
        }
        catch (err) {
            console.error(err);
            if ((err === null || err === void 0 ? void 0 : err.code) === 'permission-denied') {
                toast({ title: 'Permission denied', description: 'You do not have permission to assign a Learning Partner. Please contact an Admin.', variant: 'destructive' });
            }
            else {
                toast({ title: 'Error', description: err.message || 'Failed to assign', variant: 'destructive' });
            }
        }
    });
    return (_jsx(Dialog, { open: true, onOpenChange: onClose, children: _jsxs(DialogContent, { className: "sm:max-w-[600px]", children: [_jsxs(DialogHeader, { children: [_jsxs(DialogTitle, { children: ["Assign Learning Partner for ", student.fullName] }), _jsx(DialogDescription, { children: "Assign a Learning Partner to the student\u2019s enrollment. Only Admins can set a Learning Partner for a student." })] }), _jsxs("div", { className: "py-4 space-y-4", children: [_jsx("div", { children: _jsxs(Select, { value: selectedEnrollment, onValueChange: setSelectedEnrollment, children: [_jsx(SelectTrigger, { className: "w-full", children: _jsx(SelectValue, { placeholder: "Select enrollment (course)" }) }), _jsx(SelectContent, { children: enrollments.map(e => (_jsxs(SelectItem, { value: e.id, children: [courseMap[e.courseId] || e.courseId, " \u2014 ", e.status] }, e.id))) })] }) }), _jsx("div", { className: "flex gap-2", children: _jsx("input", { className: "flex-1 px-3 py-2 border rounded", placeholder: "Search LP by name or email", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value) }) }), _jsx("div", { children: _jsxs(Select, { value: selectedLP, onValueChange: setSelectedLP, children: [_jsx(SelectTrigger, { className: "w-full", children: _jsx(SelectValue, { placeholder: "Select LP" }) }), _jsx(SelectContent, { children: lps.filter(lp => {
                                            if (!searchTerm)
                                                return true;
                                            const s = (lp.name || lp.email || '').toLowerCase();
                                            return s.includes(searchTerm.toLowerCase());
                                        }).map(l => (_jsx(SelectItem, { value: l.uid || l.id, children: l.name || l.email }, l.uid || l.id))) })] }) })] }), _jsxs(DialogFooter, { children: [_jsx(Button, { variant: "outline", onClick: onClose, children: "Cancel" }), _jsx(Button, { onClick: handleAssign, disabled: !canAssign, children: canAssign ? 'Assign LP' : 'Not Authorized' })] })] }) }));
}
