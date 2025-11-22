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
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@components/ui/dialog';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebaseConfig';
import { toast } from '@components/hooks/use-toast';
import { useAuthStore } from '../../../store/useAuthStore';
export default function EditStudentForm({ student, open, onClose, onUpdated }) {
    const [fullName, setFullName] = useState(student.fullName || '');
    const [dob, setDob] = useState(student.dob || '');
    const [grade, setGrade] = useState(student.grade || '');
    const [status, setStatus] = useState(student.status || 'active');
    const [loading, setLoading] = useState(false);
    const { user } = useAuthStore();
    const canEdit = (user === null || user === void 0 ? void 0 : user.role) === 'admin';
    const handleUpdate = () => __awaiter(this, void 0, void 0, function* () {
        setLoading(true);
        try {
            yield updateDoc(doc(db, 'kids', student.id), {
                fullName,
                dob,
                grade,
                status,
            });
            toast({ title: 'Updated', description: 'Student updated' });
            onUpdated === null || onUpdated === void 0 ? void 0 : onUpdated();
            onClose();
        }
        catch (err) {
            if ((err === null || err === void 0 ? void 0 : err.code) === 'permission-denied') {
                toast({ title: 'Permission denied', description: 'You do not have permission to edit student details. Please contact an Admin.', variant: 'destructive' });
            }
            else {
                toast({ title: 'Error', description: err.message || 'Update failed', variant: 'destructive' });
            }
        }
        finally {
            setLoading(false);
        }
    });
    return (_jsx(Dialog, { open: open, onOpenChange: onClose, children: _jsxs(DialogContent, { className: "sm:max-w-[500px]", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Edit Student" }), _jsx(DialogDescription, { children: "Edit the basic details of the student. Only admins may edit this information." })] }), _jsxs("div", { className: "space-y-4 py-2", children: [_jsx(Input, { value: fullName, onChange: e => setFullName(e.target.value), placeholder: "Full Name" }), _jsx(Input, { value: dob, onChange: e => setDob(e.target.value), placeholder: "DOB (YYYY-MM-DD)" }), _jsxs(Select, { value: grade, onValueChange: (value) => setGrade(value), children: [_jsx(SelectTrigger, { className: "w-full", children: _jsx(SelectValue, { placeholder: "Grade" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "Pre-K", children: "Pre-K" }), _jsx(SelectItem, { value: "KG", children: "KG" }), _jsx(SelectItem, { value: "Grade 1", children: "Grade 1" }), _jsx(SelectItem, { value: "Grade 2", children: "Grade 2" })] })] }), _jsxs(Select, { value: status, onValueChange: (value) => setStatus(value), children: [_jsx(SelectTrigger, { className: "w-full", children: _jsx(SelectValue, { placeholder: "Status" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "active", children: "Active" }), _jsx(SelectItem, { value: "suspended", children: "Suspended" }), _jsx(SelectItem, { value: "archived", children: "Archived" })] })] })] }), _jsxs(DialogFooter, { children: [_jsx(Button, { variant: "outline", onClick: onClose, children: "Cancel" }), _jsx(Button, { onClick: handleUpdate, disabled: loading || !canEdit, children: loading ? 'Saving...' : (canEdit ? 'Save Changes' : 'Not Authorized') })] })] }) }));
}
