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
import { useTopics } from '../../../hooks/useData';
import { doc, setDoc, updateDoc, deleteDoc, serverTimestamp, collection } from 'firebase/firestore';
import { db } from '../../../lib/firebaseConfig';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { Textarea } from '@components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/ui/table';
import { Badge } from '@components/ui/badge';
import { toast } from '@components/hooks/use-toast';
import { Edit, Trash2, Plus, ArrowUp, ArrowDown } from 'lucide-react';
import { ArrowLeft } from 'lucide-react';
export default function TopicsManagement({ courseId, onBack }) {
    const { data: topics = [], isLoading, refetch } = useTopics(courseId);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingTopic, setEditingTopic] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        sequenceNumber: 1,
        estimatedMinutes: 15,
        targetMastery: 80,
    });
    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            sequenceNumber: topics.length + 1,
            estimatedMinutes: 15,
            targetMastery: 80,
        });
    };
    const handleCreate = () => __awaiter(this, void 0, void 0, function* () {
        if (!formData.name.trim()) {
            toast({ title: 'Error', description: 'Topic name is required', variant: 'destructive' });
            return;
        }
        try {
            const topicRef = doc(collection(db, 'curriculum'));
            yield setDoc(topicRef, Object.assign(Object.assign({}, formData), { courseId, practiceExercises: [], worksheets: [], games: [], createdAt: serverTimestamp() }));
            toast({ title: 'Success', description: 'Topic created successfully' });
            setIsCreateOpen(false);
            resetForm();
            refetch();
        }
        catch (error) {
            toast({ title: 'Error', description: error.message || 'Failed to create topic', variant: 'destructive' });
        }
    });
    const handleEdit = () => __awaiter(this, void 0, void 0, function* () {
        if (!formData.name.trim()) {
            toast({ title: 'Error', description: 'Topic name is required', variant: 'destructive' });
            return;
        }
        try {
            yield updateDoc(doc(db, 'curriculum', editingTopic.id), Object.assign({}, formData));
            toast({ title: 'Success', description: 'Topic updated successfully' });
            setEditingTopic(null);
            resetForm();
            refetch();
        }
        catch (error) {
            toast({ title: 'Error', description: error.message || 'Failed to update topic', variant: 'destructive' });
        }
    });
    const handleDelete = (topicId) => __awaiter(this, void 0, void 0, function* () {
        if (!confirm('Are you sure you want to delete this topic?'))
            return;
        try {
            yield deleteDoc(doc(db, 'curriculum', topicId));
            toast({ title: 'Success', description: 'Topic deleted successfully' });
            refetch();
        }
        catch (error) {
            toast({ title: 'Error', description: error.message || 'Failed to delete topic', variant: 'destructive' });
        }
    });
    const handleMoveUp = (topicId, currentIndex) => __awaiter(this, void 0, void 0, function* () {
        if (currentIndex === 0)
            return;
        const topicToMove = topics[currentIndex];
        const topicAbove = topics[currentIndex - 1];
        try {
            yield Promise.all([
                updateDoc(doc(db, 'curriculum', topicToMove.id), { sequenceNumber: currentIndex }),
                updateDoc(doc(db, 'curriculum', topicAbove.id), { sequenceNumber: currentIndex + 1 }),
            ]);
            refetch();
        }
        catch (error) {
            toast({ title: 'Error', description: 'Failed to reorder topics', variant: 'destructive' });
        }
    });
    const handleMoveDown = (topicId, currentIndex) => __awaiter(this, void 0, void 0, function* () {
        if (currentIndex === topics.length - 1)
            return;
        const topicToMove = topics[currentIndex];
        const topicBelow = topics[currentIndex + 1];
        try {
            yield Promise.all([
                updateDoc(doc(db, 'curriculum', topicToMove.id), { sequenceNumber: currentIndex + 2 }),
                updateDoc(doc(db, 'curriculum', topicBelow.id), { sequenceNumber: currentIndex + 1 }),
            ]);
            refetch();
        }
        catch (error) {
            toast({ title: 'Error', description: 'Failed to reorder topics', variant: 'destructive' });
        }
    });
    const openEdit = (topic) => {
        setEditingTopic(topic);
        setFormData({
            name: topic.name || '',
            description: topic.description || '',
            sequenceNumber: topic.sequenceNumber || 1,
            estimatedMinutes: topic.estimatedMinutes || 15,
            targetMastery: topic.targetMastery || 80,
        });
    };
    if (isLoading) {
        return _jsx("div", { className: "flex justify-center p-8", children: "Loading topics..." });
    }
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsxs(Button, { variant: "outline", size: "sm", onClick: onBack, children: [_jsx(ArrowLeft, { className: "h-4 w-4 mr-2" }), "Back to Courses"] }), _jsx("h3", { className: "text-lg font-medium", children: "Topics Management" })] }), _jsxs(Button, { onClick: () => { resetForm(); setIsCreateOpen(true); }, children: [_jsx(Plus, { className: "h-4 w-4 mr-2" }), "Add Topic"] })] }), _jsxs(Table, { children: [_jsx(TableHeader, { children: _jsxs(TableRow, { children: [_jsx(TableHead, { children: "Order" }), _jsx(TableHead, { children: "Topic Name" }), _jsx(TableHead, { children: "Sequence" }), _jsx(TableHead, { children: "Status" }), _jsx(TableHead, { children: "Actions" })] }) }), _jsx(TableBody, { children: topics.map((topic, index) => (_jsxs(TableRow, { children: [_jsx(TableCell, { children: _jsxs("div", { className: "flex gap-1", children: [_jsx(Button, { size: "sm", variant: "outline", onClick: () => handleMoveUp(topic.id, index), disabled: index === 0, children: _jsx(ArrowUp, { className: "h-3 w-3" }) }), _jsx(Button, { size: "sm", variant: "outline", onClick: () => handleMoveDown(topic.id, index), disabled: index === topics.length - 1, children: _jsx(ArrowDown, { className: "h-3 w-3" }) })] }) }), _jsx(TableCell, { className: "font-medium", children: topic.name }), _jsx(TableCell, { children: topic.sequenceNumber }), _jsx(TableCell, { children: _jsx(Badge, { variant: "secondary", children: "Active" }) }), _jsx(TableCell, { children: _jsxs("div", { className: "flex gap-2", children: [_jsx(Button, { size: "sm", variant: "outline", onClick: () => openEdit(topic), children: _jsx(Edit, { className: "h-4 w-4" }) }), _jsx(Button, { size: "sm", variant: "destructive", onClick: () => handleDelete(topic.id), children: _jsx(Trash2, { className: "h-4 w-4" }) })] }) })] }, topic.id))) })] }), _jsx(Dialog, { open: isCreateOpen, onOpenChange: setIsCreateOpen, children: _jsxs(DialogContent, { className: "max-w-md", children: [_jsx(DialogHeader, { children: _jsx(DialogTitle, { children: "Add New Topic" }) }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium", children: "Topic Name" }), _jsx(Input, { value: formData.name, onChange: (e) => setFormData(Object.assign(Object.assign({}, formData), { name: e.target.value })), placeholder: "e.g., Phoneme 'A'" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium", children: "Description" }), _jsx(Textarea, { value: formData.description, onChange: (e) => setFormData(Object.assign(Object.assign({}, formData), { description: e.target.value })), placeholder: "Describe what students will learn..." })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium", children: "Sequence Number" }), _jsx(Input, { type: "number", value: formData.sequenceNumber, onChange: (e) => setFormData(Object.assign(Object.assign({}, formData), { sequenceNumber: parseInt(e.target.value) || 1 })) })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium", children: "Estimated Minutes" }), _jsx(Input, { type: "number", value: formData.estimatedMinutes, onChange: (e) => setFormData(Object.assign(Object.assign({}, formData), { estimatedMinutes: parseInt(e.target.value) || 15 })) })] })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium", children: "Target Mastery (%)" }), _jsx(Input, { type: "number", value: formData.targetMastery, onChange: (e) => setFormData(Object.assign(Object.assign({}, formData), { targetMastery: parseInt(e.target.value) || 80 })) })] })] }), _jsxs(DialogFooter, { children: [_jsx(Button, { variant: "outline", onClick: () => setIsCreateOpen(false), children: "Cancel" }), _jsx(Button, { onClick: handleCreate, children: "Create Topic" })] })] }) }), _jsx(Dialog, { open: !!editingTopic, onOpenChange: () => setEditingTopic(null), children: _jsxs(DialogContent, { className: "max-w-md", children: [_jsx(DialogHeader, { children: _jsx(DialogTitle, { children: "Edit Topic" }) }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium", children: "Topic Name" }), _jsx(Input, { value: formData.name, onChange: (e) => setFormData(Object.assign(Object.assign({}, formData), { name: e.target.value })), placeholder: "e.g., Phoneme 'A'" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium", children: "Description" }), _jsx(Textarea, { value: formData.description, onChange: (e) => setFormData(Object.assign(Object.assign({}, formData), { description: e.target.value })), placeholder: "Describe what students will learn..." })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium", children: "Sequence Number" }), _jsx(Input, { type: "number", value: formData.sequenceNumber, onChange: (e) => setFormData(Object.assign(Object.assign({}, formData), { sequenceNumber: parseInt(e.target.value) || 1 })) })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium", children: "Estimated Minutes" }), _jsx(Input, { type: "number", value: formData.estimatedMinutes, onChange: (e) => setFormData(Object.assign(Object.assign({}, formData), { estimatedMinutes: parseInt(e.target.value) || 15 })) })] })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium", children: "Target Mastery (%)" }), _jsx(Input, { type: "number", value: formData.targetMastery, onChange: (e) => setFormData(Object.assign(Object.assign({}, formData), { targetMastery: parseInt(e.target.value) || 80 })) })] })] }), _jsxs(DialogFooter, { children: [_jsx(Button, { variant: "outline", onClick: () => setEditingTopic(null), children: "Cancel" }), _jsx(Button, { onClick: handleEdit, children: "Update Topic" })] })] }) })] }));
}
