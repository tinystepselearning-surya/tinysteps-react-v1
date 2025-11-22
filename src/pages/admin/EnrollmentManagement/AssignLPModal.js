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
export default function AssignLPModal({ enrollment, onClose }) {
    const [lps, setLps] = useState([]);
    const [selectedLP, setSelectedLP] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    useEffect(() => { fetchLPs(); }, []);
    const fetchLPs = () => __awaiter(this, void 0, void 0, function* () {
        const q = query(collection(db, 'users'), where('role', '==', 'learningPartner'));
        const snap = yield getDocs(q);
        const arr = [];
        snap.forEach(d => arr.push(Object.assign({ id: d.id }, d.data())));
        setLps(arr);
    });
    const handleConfirm = () => __awaiter(this, void 0, void 0, function* () {
        if (!selectedLP) {
            toast({ title: 'Select LP', description: 'Please select a Learning Partner', variant: 'destructive' });
            return;
        }
        try {
            yield updateDoc(doc(db, 'enrollments', enrollment.id), {
                lpId: selectedLP,
                status: 'active',
                startDate: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });
            toast({ title: 'Success', description: 'LP assigned and enrollment activated' });
            onClose();
        }
        catch (err) {
            toast({ title: 'Error', description: err.message || 'Failed to assign LP', variant: 'destructive' });
        }
    });
    return (_jsx(Dialog, { open: true, onOpenChange: onClose, children: _jsxs(DialogContent, { children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Assign Learning Partner" }), _jsx(DialogDescription, { children: "Choose a learning partner to manage this enrollment and activate the student's course." })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: ["Student: ", enrollment.studentId] }), _jsxs("div", { children: ["Course: ", enrollment.courseId] }), _jsx("div", { className: "flex gap-2", children: _jsx("input", { className: "flex-1 px-3 py-2 border rounded", placeholder: "Search LP by name or email", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value) }) }), _jsxs(Select, { onValueChange: (v) => setSelectedLP(v), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Select LP" }) }), _jsx(SelectContent, { children: lps.filter(lp => {
                                        if (!searchTerm)
                                            return true;
                                        const s = (lp.name || lp.email || '').toLowerCase();
                                        return s.includes(searchTerm.toLowerCase());
                                    }).map(t => (_jsx(SelectItem, { value: t.id, children: t.name || t.email }, t.id))) })] })] }), _jsxs(DialogFooter, { children: [_jsx(Button, { variant: "outline", onClick: onClose, children: "Cancel" }), _jsx(Button, { onClick: handleConfirm, children: "Confirm" })] })] }) }));
}
