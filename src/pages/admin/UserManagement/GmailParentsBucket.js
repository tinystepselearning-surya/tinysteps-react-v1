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
import { collection, getDocs, query, orderBy, doc, updateDoc, serverTimestamp, arrayUnion } from 'firebase/firestore';
import { db } from '../../../lib/firebaseConfig';
import { Card } from '@components/ui/card';
import { Button } from '@components/ui/button';
import AssignCourseModal from '../StudentManagement/AssignCourseModal';
import CreateStudentForm from '../StudentManagement/CreateStudentForm';
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription } from '@components/ui/dialog';
import { Input } from '@components/ui/input';
import { toast } from '@components/hooks/use-toast';
export default function GmailParentsBucket({ open = true }) {
    const [parents, setParents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [openCreateStudentForParent, setOpenCreateStudentForParent] = useState(null);
    const [assigningStudent, setAssigningStudent] = useState(null);
    useEffect(() => {
        const loadParents = () => __awaiter(this, void 0, void 0, function* () {
            setLoading(true);
            try {
                const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
                const snap = yield getDocs(q);
                const allUsers = snap.docs.map(d => (Object.assign({ id: d.id }, d.data())));
                setParents(allUsers.filter(u => (u.role === 'parent' || (u.roles && u.roles.includes && u.roles.includes('parent'))) && u.provider === 'google.com'));
            }
            catch (err) {
                console.error(err);
                toast({ title: 'Error', description: 'Failed to load Gmail parents', variant: 'destructive' });
            }
            finally {
                setLoading(false);
            }
        });
        if (open)
            loadParents();
    }, []);
    const handleAddKid = (parent) => {
        setOpenCreateStudentForParent(parent);
    };
    const handleCreatedKid = (kidId) => __awaiter(this, void 0, void 0, function* () {
        toast({ title: 'Kid created', description: 'Kid was created successfully and linked to parent' });
        // refresh parent list to show updated child counts
        setOpenCreateStudentForParent(null);
        try { // reload list
            const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
            const snap = yield getDocs(q);
            const allUsers = snap.docs.map(d => (Object.assign({ id: d.id }, d.data())));
            setParents(allUsers.filter(u => (u.role === 'parent' || (u.roles && u.roles.includes && u.roles.includes('parent'))) && u.provider === 'google.com'));
        }
        catch (err) {
            // ignore
        }
    });
    function MapExistingKidButton({ parentId, onMapped }) {
        const [open, setOpen] = useState(false);
        const [kids, setKids] = useState([]);
        const [selected, setSelected] = useState(new Set());
        const [queryText, setQueryText] = useState('');
        useEffect(() => {
            if (!open)
                return;
            const load = () => __awaiter(this, void 0, void 0, function* () {
                try {
                    const q = query(collection(db, 'kids'));
                    const snap = yield getDocs(q);
                    setKids(snap.docs.map(d => (Object.assign({ id: d.id }, d.data()))));
                }
                catch (err) {
                    console.error('Failed to load kids', err);
                }
            });
            load();
        }, [open]);
        const apply = () => __awaiter(this, void 0, void 0, function* () {
            try {
                for (const kidId of Array.from(selected)) {
                    yield updateDoc(doc(db, 'kids', kidId), { parentIds: arrayUnion(parentId), updatedAt: serverTimestamp() });
                    yield updateDoc(doc(db, 'users', parentId), { childIds: arrayUnion(kidId), updatedAt: serverTimestamp() });
                }
                toast({ title: 'Mapped', description: `Mapped ${selected.size} kid(s) to parent.` });
                setOpen(false);
                onMapped === null || onMapped === void 0 ? void 0 : onMapped();
            }
            catch (err) {
                console.error(err);
                toast({ title: 'Error', description: 'Failed to map kids', variant: 'destructive' });
            }
        });
        return (_jsxs(Dialog, { open: open, onOpenChange: setOpen, children: [_jsx(DialogTrigger, { asChild: true, children: _jsx(Button, { size: "sm", children: "Map Existing Kid" }) }), _jsxs(DialogContent, { children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Map existing kids to parent" }), _jsx(DialogDescription, { children: "Select one or more existing student profiles and link them to this parent account." })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Input, { placeholder: "Search kids...", value: queryText, onChange: (e) => setQueryText(e.target.value) }), _jsx("div", { className: "max-h-64 overflow-y-auto mt-2 space-y-1", children: kids.filter(k => !queryText || (k.fullName || '').toLowerCase().includes(queryText.toLowerCase())).map(k => (_jsxs("label", { className: "flex items-center gap-2", children: [_jsx("input", { type: "checkbox", checked: selected.has(k.id), onChange: (e) => {
                                                    const s = new Set(selected);
                                                    if (e.target.checked)
                                                        s.add(k.id);
                                                    else
                                                        s.delete(k.id);
                                                    setSelected(s);
                                                } }), _jsxs("span", { children: [k.fullName, " \u2014 ", k.grade] })] }, k.id))) }), _jsxs("div", { className: "flex justify-end gap-2", children: [_jsx(Button, { variant: "outline", onClick: () => setOpen(false), children: "Cancel" }), _jsx(Button, { onClick: apply, children: "Map Selected" })] })] })] })] }));
    }
    return (_jsxs(Card, { className: "p-4", children: [_jsx("div", { className: "flex justify-between items-center mb-4", children: _jsx("h3", { className: "text-lg font-semibold", children: "Gmail Signups (Parents)" }) }), loading ? (_jsx("div", { children: "Loading\u2026" })) : (_jsxs("div", { className: "space-y-4", children: [parents.length === 0 && _jsx("div", { children: "No Gmail-signed-up parents found" }), parents.map(p => (_jsxs("div", { className: "flex justify-between items-center border rounded p-3", children: [_jsxs("div", { children: [_jsx("div", { className: "font-medium", children: p.name || p.email }), _jsx("div", { className: "text-sm text-muted-foreground", children: p.email })] }), _jsxs("div", { className: "flex gap-2 items-center", children: [_jsx(Button, { size: "sm", variant: "outline", onClick: () => handleAddKid(p), children: "Add Kid" }), _jsx(MapExistingKidButton, { parentId: p.id, onMapped: () => {
                                            // refresh parents list after map
                                            setTimeout(() => {
                                                const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
                                                getDocs(q).then(snap => {
                                                    const allUsers = snap.docs.map(d => (Object.assign({ id: d.id }, d.data())));
                                                    setParents(allUsers.filter(u => (u.role === 'parent' || (u.roles && u.roles.includes && u.roles.includes('parent'))) && u.provider === 'google.com'));
                                                }).catch(() => { });
                                            }, 100);
                                        } }), _jsx(Button, { size: "sm", variant: "secondary", onClick: () => __awaiter(this, void 0, void 0, function* () {
                                            // Load this parent's kids and if one found prompt to assign course
                                            try {
                                                const q = query(collection(db, 'kids'));
                                                const snap = yield getDocs(q);
                                                const allKids = snap.docs.map(d => (Object.assign({ id: d.id }, d.data())));
                                                const parentKids = allKids.filter(k => (k.parentIds || []).includes(p.id));
                                                if (parentKids.length === 0) {
                                                    toast({ title: 'No kids', description: 'This parent has no kids yet. Add a kid first.' });
                                                    return;
                                                }
                                                const k = parentKids[0];
                                                const student = Object.assign({ id: k.id }, k);
                                                setAssigningStudent(student);
                                            }
                                            catch (err) {
                                                console.error(err);
                                                toast({ title: 'Error', description: 'Failed to query kids', variant: 'destructive' });
                                            }
                                        }), children: "Assign Course" }), _jsx(Button, { size: "sm", variant: "ghost", onClick: () => { window.location.href = `/dev-admin?parentId=${p.id}`; }, children: "Manage Subscriptions" })] })] }, p.id)))] })), openCreateStudentForParent && (_jsx(Dialog, { open: true, onOpenChange: () => setOpenCreateStudentForParent(null), children: _jsx(DialogContent, { className: "max-w-2xl", children: _jsx(CreateStudentForm, { defaultParentId: openCreateStudentForParent.id, onStudentCreated: (id) => handleCreatedKid(id) }) }) })), assigningStudent && (_jsx(AssignCourseModal, { student: assigningStudent, onClose: () => setAssigningStudent(null), onAssigned: () => setAssigningStudent(null) }))] }));
}
