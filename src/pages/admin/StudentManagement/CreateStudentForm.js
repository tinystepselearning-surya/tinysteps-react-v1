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
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { collection, getDocs, query, setDoc, doc, serverTimestamp, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../../../lib/firebaseConfig';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@components/ui/form';
import { toast } from '@components/hooks/use-toast';
const createStudentSchema = z.object({
    parentId: z.string().min(1, 'Select a parent'),
    fullName: z.string().min(2, 'Name required'),
    dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD'),
    grade: z.string().min(1, 'Select grade'),
    status: z.enum(['active', 'suspended', 'archived']).default('active'),
});
export function CreateStudentForm({ onStudentCreated, defaultParentId }) {
    const [open, setOpen] = useState(false);
    const [parents, setParents] = useState([]);
    const form = useForm({
        // zodResolver generic typing can be strict in some RHF versions; cast to any to avoid incompat issues
        resolver: zodResolver(createStudentSchema),
        defaultValues: { parentId: defaultParentId || '', fullName: '', dob: '', grade: '', status: 'active' },
    });
    useEffect(() => {
        // load parents
        const loadParents = () => __awaiter(this, void 0, void 0, function* () {
            try {
                const q = query(collection(db, 'users'));
                const snap = yield getDocs(q);
                const allUsers = snap.docs.map(d => (Object.assign({ id: d.id }, d.data())));
                setParents(allUsers.filter(u => u.role === 'parent'));
            }
            catch (err) {
                console.error(err);
                toast({ title: 'Error', description: 'Failed to load parents', variant: 'destructive' });
            }
        });
        if (open)
            loadParents();
        // If defaultParentId is provided, set form value
        if (open && defaultParentId) {
            form.setValue('parentId', defaultParentId);
        }
    }, [open]);
    const onSubmit = (values) => __awaiter(this, void 0, void 0, function* () {
        try {
            const studentRef = doc(collection(db, 'kids'));
            const payload = {
                fullName: values.fullName,
                dob: values.dob,
                grade: values.grade,
                parentIds: [values.parentId],
                primaryParentId: values.parentId,
                status: values.status,
                summary: {
                    phonicsMastery: 0,
                    grammarMastery: 0,
                    speakingMastery: 0,
                    attendanceRate30d: 0,
                    creditsRemaining: 0,
                },
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            };
            yield setDoc(studentRef, payload);
            // Update parent user document to include this kid id
            try {
                if (values.parentId) {
                    yield updateDoc(doc(db, 'users', values.parentId), { childIds: arrayUnion(studentRef.id), updatedAt: serverTimestamp() });
                }
            }
            catch (err) {
                // ignore if update failed; admin can fix manually
            }
            toast({ title: 'Student created', description: `${values.fullName} created successfully` });
            setOpen(false);
            form.reset();
            onStudentCreated === null || onStudentCreated === void 0 ? void 0 : onStudentCreated(studentRef.id);
        }
        catch (err) {
            console.error(err);
            toast({ title: 'Error', description: err.message || 'Failed to create student', variant: 'destructive' });
        }
    });
    return (_jsxs(Dialog, { open: open, onOpenChange: setOpen, children: [_jsx(DialogTrigger, { asChild: true, children: _jsx(Button, { children: "Create Student" }) }), _jsxs(DialogContent, { className: "sm:max-w-[600px]", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Create Student" }), _jsx(DialogDescription, { children: "Fill in basic information to create a new student profile and associate it with a parent." })] }), _jsx(Form, Object.assign({}, form, { children: _jsxs("form", { onSubmit: form.handleSubmit(onSubmit), className: "space-y-4", children: [_jsx(FormField, { control: form.control, name: "parentId", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Select Primary Parent" }), _jsx(FormControl, { children: _jsxs(Select, { onValueChange: field.onChange, defaultValue: field.value, children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Select parent" }) }), _jsx(SelectContent, { children: parents.map(p => (_jsxs(SelectItem, { value: p.uid || p.id, children: [p.email, " \u2014 ", p.name || p.email] }, p.uid || p.id))) })] }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "fullName", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Full Name" }), _jsx(FormControl, { children: _jsx(Input, Object.assign({ placeholder: "Child Name" }, field)) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "dob", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Date of Birth" }), _jsx(FormControl, { children: _jsx(Input, Object.assign({ type: "date" }, field)) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "grade", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Grade" }), _jsx(FormControl, { children: _jsxs(Select, { onValueChange: field.onChange, defaultValue: field.value, children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Select grade" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "Pre-K", children: "Pre-K" }), _jsx(SelectItem, { value: "KG", children: "KG" }), _jsx(SelectItem, { value: "Grade 1", children: "Grade 1" }), _jsx(SelectItem, { value: "Grade 2", children: "Grade 2" }), _jsx(SelectItem, { value: "Grade 3", children: "Grade 3" })] })] }) }), _jsx(FormMessage, {})] })) }), _jsxs("div", { className: "flex justify-end space-x-2", children: [_jsx(Button, { type: "button", variant: "outline", onClick: () => setOpen(false), children: "Cancel" }), _jsx(Button, { type: "submit", children: "Create" })] })] }) }))] })] }));
}
export default CreateStudentForm;
