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
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { doc, setDoc, serverTimestamp, collection } from 'firebase/firestore';
import { db } from '../../../lib/firebaseConfig';
import { useAuth } from '../../../hooks/useAuth';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { Textarea } from '@components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@components/ui/tabs';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import { Badge } from '@components/ui/badge';
import { toast } from '@components/hooks/use-toast';
import { Loader2, Plus, X } from 'lucide-react';
const courseSchema = z.object({
    name: z.string().min(3, "Course name must be at least 3 characters"),
    area: z.enum(['Phonics', 'Grammar', 'Speaking']),
    level: z.number().min(1).max(8),
    description: z.string().min(10, "Description must be at least 10 characters"),
    status: z.enum(['active', 'inactive', 'draft']),
    ratePerSession: z.number().min(100, "Rate must be at least ₹100"),
    durationMinutes: z.number().min(15).max(60),
    sessionFrequency: z.enum(['weekly', 'biweekly', 'monthly']),
    maxStudentsPerSession: z.number().min(1).max(10),
    targetAge: z.array(z.number()).min(1, "At least one target age required"),
    targetGrade: z.array(z.string()).min(1, "At least one target grade required"),
    topics: z.array(z.string()).min(1, "At least one topic required"),
    prerequisites: z.array(z.string()).optional(),
});
export default function CreateCourseForm({ onSuccess, onCancel }) {
    var _a;
    const { user } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentTab, setCurrentTab] = useState('basic');
    const form = useForm({
        resolver: zodResolver(courseSchema),
        defaultValues: {
            name: '',
            area: 'Phonics',
            level: 1,
            description: '',
            status: 'draft',
            ratePerSession: 500,
            durationMinutes: 35,
            sessionFrequency: 'weekly',
            maxStudentsPerSession: 3,
            targetAge: [5, 6],
            targetGrade: ['KG', 'Grade 1'],
            topics: [],
            prerequisites: [],
        },
    });
    const onSubmit = (data) => __awaiter(this, void 0, void 0, function* () {
        if (!(user === null || user === void 0 ? void 0 : user.uid)) {
            toast({ title: 'Error', description: 'User not authenticated', variant: 'destructive' });
            return;
        }
        setIsSubmitting(true);
        try {
            const courseRef = doc(collection(db, 'courses'));
            yield setDoc(courseRef, Object.assign(Object.assign({}, data), { createdBy: user.uid, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }));
            toast({ title: 'Success', description: `Course "${data.name}" created successfully!` });
            onSuccess === null || onSuccess === void 0 ? void 0 : onSuccess(courseRef.id);
        }
        catch (error) {
            console.error('Error creating course:', error);
            toast({
                title: 'Error',
                description: error.message || 'Failed to create course',
                variant: 'destructive'
            });
        }
        finally {
            setIsSubmitting(false);
        }
    });
    const addToArray = (field, value) => {
        const current = form.getValues(field);
        if (!current.includes(value)) {
            form.setValue(field, [...current, value]);
        }
    };
    const removeFromArray = (field, value) => {
        const current = form.getValues(field);
        form.setValue(field, current.filter(item => item !== value));
    };
    return (_jsx("div", { className: "max-w-4xl mx-auto", children: _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Create New Course" }) }), _jsx(CardContent, { children: _jsx(Form, Object.assign({}, form, { children: _jsxs("form", { onSubmit: form.handleSubmit(onSubmit), className: "space-y-6", children: [_jsxs(Tabs, { value: currentTab, onValueChange: setCurrentTab, children: [_jsxs(TabsList, { className: "grid w-full grid-cols-4", children: [_jsx(TabsTrigger, { value: "basic", children: "Basic Info" }), _jsx(TabsTrigger, { value: "pricing", children: "Pricing & Logistics" }), _jsx(TabsTrigger, { value: "topics", children: "Topics" }), _jsx(TabsTrigger, { value: "prerequisites", children: "Prerequisites" })] }), _jsxs(TabsContent, { value: "basic", className: "space-y-4", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsx(FormField, { control: form.control, name: "name", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Course Name *" }), _jsx(FormControl, { children: _jsx(Input, Object.assign({ placeholder: "e.g., Phonics Level 1" }, field)) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "area", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Area *" }), _jsxs(Select, { onValueChange: field.onChange, value: field.value, children: [_jsx(FormControl, { children: _jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Select area" }) }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "Phonics", children: "Phonics" }), _jsx(SelectItem, { value: "Grammar", children: "Grammar" }), _jsx(SelectItem, { value: "Speaking", children: "Speaking" })] })] }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "level", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Level *" }), _jsxs(Select, { onValueChange: (value) => field.onChange(parseInt(value)), value: field.value.toString(), children: [_jsx(FormControl, { children: _jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Select level" }) }) }), _jsx(SelectContent, { children: Array.from({ length: 8 }, (_, i) => (_jsx(SelectItem, { value: (i + 1).toString(), children: i + 1 }, i + 1))) })] }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "status", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Status *" }), _jsxs(Select, { onValueChange: field.onChange, value: field.value, children: [_jsx(FormControl, { children: _jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Select status" }) }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "draft", children: "Draft" }), _jsx(SelectItem, { value: "active", children: "Active" }), _jsx(SelectItem, { value: "inactive", children: "Inactive" })] })] }), _jsx(FormMessage, {})] })) })] }), _jsx(FormField, { control: form.control, name: "description", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Description *" }), _jsx(FormControl, { children: _jsx(Textarea, Object.assign({ placeholder: "Describe what students will learn in this course...", className: "min-h-[100px]" }, field)) }), _jsx(FormMessage, {})] })) })] }), _jsxs(TabsContent, { value: "pricing", className: "space-y-4", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsx(FormField, { control: form.control, name: "ratePerSession", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Rate per Session (\u20B9) *" }), _jsx(FormControl, { children: _jsx(Input, Object.assign({ type: "number", placeholder: "500" }, field, { onChange: (e) => field.onChange(parseInt(e.target.value) || 0) })) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "durationMinutes", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Duration per Session (minutes) *" }), _jsx(FormControl, { children: _jsx(Input, Object.assign({ type: "number", placeholder: "35" }, field, { onChange: (e) => field.onChange(parseInt(e.target.value) || 0) })) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "sessionFrequency", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Session Frequency *" }), _jsxs(Select, { onValueChange: field.onChange, value: field.value, children: [_jsx(FormControl, { children: _jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Select frequency" }) }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "weekly", children: "Weekly" }), _jsx(SelectItem, { value: "biweekly", children: "Bi-weekly" }), _jsx(SelectItem, { value: "monthly", children: "Monthly" })] })] }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "maxStudentsPerSession", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Max Students per Session *" }), _jsx(FormControl, { children: _jsx(Input, Object.assign({ type: "number", placeholder: "3" }, field, { onChange: (e) => field.onChange(parseInt(e.target.value) || 0) })) }), _jsx(FormMessage, {})] })) })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx(FormLabel, { children: "Target Age Range *" }), _jsx("div", { className: "flex flex-wrap gap-2 mt-2", children: form.watch('targetAge').map((age) => (_jsxs(Badge, { variant: "secondary", className: "cursor-pointer", onClick: () => removeFromArray('targetAge', age), children: ["Age ", age, " ", _jsx(X, { className: "ml-1 h-3 w-3" })] }, age))) }), _jsx("div", { className: "flex gap-2 mt-2", children: _jsxs(Select, { onValueChange: (value) => addToArray('targetAge', parseInt(value)), children: [_jsx(SelectTrigger, { className: "w-32", children: _jsx(SelectValue, { placeholder: "Add age" }) }), _jsx(SelectContent, { children: Array.from({ length: 10 }, (_, i) => i + 3).map((age) => (_jsx(SelectItem, { value: age.toString(), children: age }, age))) })] }) })] }), _jsxs("div", { children: [_jsx(FormLabel, { children: "Target Grades *" }), _jsx("div", { className: "flex flex-wrap gap-2 mt-2", children: form.watch('targetGrade').map((grade) => (_jsxs(Badge, { variant: "secondary", className: "cursor-pointer", onClick: () => removeFromArray('targetGrade', grade), children: [grade, " ", _jsx(X, { className: "ml-1 h-3 w-3" })] }, grade))) }), _jsx("div", { className: "flex gap-2 mt-2", children: _jsxs(Select, { onValueChange: (value) => addToArray('targetGrade', value), children: [_jsx(SelectTrigger, { className: "w-48", children: _jsx(SelectValue, { placeholder: "Add grade" }) }), _jsx(SelectContent, { children: ['Nursery', 'KG', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5'].map((grade) => (_jsx(SelectItem, { value: grade, children: grade }, grade))) })] }) })] })] })] }), _jsx(TabsContent, { value: "topics", className: "space-y-4", children: _jsxs("div", { children: [_jsx(FormLabel, { children: "Topics *" }), _jsx("div", { className: "flex flex-wrap gap-2 mt-2", children: form.watch('topics').map((topic) => (_jsxs(Badge, { variant: "secondary", className: "cursor-pointer", onClick: () => removeFromArray('topics', topic), children: [topic, " ", _jsx(X, { className: "ml-1 h-3 w-3" })] }, topic))) }), _jsxs("div", { className: "flex gap-2 mt-2", children: [_jsx(Input, { placeholder: "Add topic name", onKeyPress: (e) => {
                                                                    if (e.key === 'Enter') {
                                                                        e.preventDefault();
                                                                        const value = e.target.value.trim();
                                                                        if (value) {
                                                                            addToArray('topics', value);
                                                                            e.target.value = '';
                                                                        }
                                                                    }
                                                                } }), _jsx(Button, { type: "button", variant: "outline", onClick: () => {
                                                                    const input = document.querySelector('input[placeholder="Add topic name"]');
                                                                    const value = input === null || input === void 0 ? void 0 : input.value.trim();
                                                                    if (value) {
                                                                        addToArray('topics', value);
                                                                        input.value = '';
                                                                    }
                                                                }, children: _jsx(Plus, { className: "h-4 w-4" }) })] })] }) }), _jsx(TabsContent, { value: "prerequisites", className: "space-y-4", children: _jsxs("div", { children: [_jsx(FormLabel, { children: "Prerequisites (Optional)" }), _jsx("div", { className: "flex flex-wrap gap-2 mt-2", children: (_a = form.watch('prerequisites')) === null || _a === void 0 ? void 0 : _a.map((prereq) => (_jsxs(Badge, { variant: "outline", className: "cursor-pointer", onClick: () => removeFromArray('prerequisites', prereq), children: [prereq, " ", _jsx(X, { className: "ml-1 h-3 w-3" })] }, prereq))) }), _jsxs("div", { className: "flex gap-2 mt-2", children: [_jsx(Input, { placeholder: "Add prerequisite course", onKeyPress: (e) => {
                                                                    if (e.key === 'Enter') {
                                                                        e.preventDefault();
                                                                        const value = e.target.value.trim();
                                                                        if (value) {
                                                                            addToArray('prerequisites', value);
                                                                            e.target.value = '';
                                                                        }
                                                                    }
                                                                } }), _jsx(Button, { type: "button", variant: "outline", onClick: () => {
                                                                    const input = document.querySelector('input[placeholder="Add prerequisite course"]');
                                                                    const value = input === null || input === void 0 ? void 0 : input.value.trim();
                                                                    if (value) {
                                                                        addToArray('prerequisites', value);
                                                                        input.value = '';
                                                                    }
                                                                }, children: _jsx(Plus, { className: "h-4 w-4" }) })] })] }) })] }), _jsxs("div", { className: "flex justify-end gap-4 pt-6 border-t", children: [onCancel && (_jsx(Button, { type: "button", variant: "outline", onClick: onCancel, children: "Cancel" })), _jsxs(Button, { type: "submit", disabled: isSubmitting, children: [isSubmitting && _jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }), "Create Course"] })] })] }) })) })] }) }));
}
