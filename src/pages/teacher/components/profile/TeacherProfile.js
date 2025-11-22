import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Card } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { Textarea } from '@components/ui/textarea';
import { Label } from '@components/ui/label';
import { useAuthStore } from '../../../../store/useAuthStore';
export const TeacherProfile = ({ teacherId }) => {
    const { user } = useAuthStore();
    const [isEditing, setIsEditing] = useState(false);
    const [profile, setProfile] = useState({
        name: (user === null || user === void 0 ? void 0 : user.displayName) || '',
        email: (user === null || user === void 0 ? void 0 : user.email) || '',
        phone: '',
        qualifications: '',
        specializations: '',
        bio: '',
        bankAccount: '',
    });
    const handleSave = () => {
        // Save logic
        setIsEditing(false);
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsx(Card, { className: "p-6", children: _jsxs("div", { className: "flex items-center gap-6", children: [_jsx("div", { className: "w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center", children: _jsx("span", { className: "text-2xl", children: "\uD83D\uDC68\u200D\uD83C\uDFEB" }) }), _jsxs("div", { children: [_jsx("h2", { className: "text-2xl font-bold", children: profile.name }), _jsx("p", { className: "text-muted-foreground", children: profile.email }), _jsx(Button, { onClick: () => setIsEditing(!isEditing), className: "mt-2", children: isEditing ? 'Cancel' : 'Edit Profile' })] })] }) }), _jsxs(Card, { className: "p-6", children: [_jsx("h3", { className: "text-lg font-semibold mb-4", children: "Profile Information" }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx(Label, { children: "Name" }), _jsx(Input, { value: profile.name, onChange: (e) => setProfile(p => (Object.assign(Object.assign({}, p), { name: e.target.value }))), disabled: !isEditing })] }), _jsxs("div", { children: [_jsx(Label, { children: "Email" }), _jsx(Input, { value: profile.email, onChange: (e) => setProfile(p => (Object.assign(Object.assign({}, p), { email: e.target.value }))), disabled: !isEditing })] }), _jsxs("div", { children: [_jsx(Label, { children: "Phone" }), _jsx(Input, { value: profile.phone, onChange: (e) => setProfile(p => (Object.assign(Object.assign({}, p), { phone: e.target.value }))), disabled: !isEditing })] }), _jsxs("div", { children: [_jsx(Label, { children: "Qualifications" }), _jsx(Input, { value: profile.qualifications, onChange: (e) => setProfile(p => (Object.assign(Object.assign({}, p), { qualifications: e.target.value }))), disabled: !isEditing })] }), _jsxs("div", { className: "col-span-2", children: [_jsx(Label, { children: "Specializations" }), _jsx(Input, { value: profile.specializations, onChange: (e) => setProfile(p => (Object.assign(Object.assign({}, p), { specializations: e.target.value }))), disabled: !isEditing })] }), _jsxs("div", { className: "col-span-2", children: [_jsx(Label, { children: "Bio" }), _jsx(Textarea, { value: profile.bio, onChange: (e) => setProfile(p => (Object.assign(Object.assign({}, p), { bio: e.target.value }))), disabled: !isEditing })] }), _jsxs("div", { className: "col-span-2", children: [_jsx(Label, { children: "Bank Account (for payments)" }), _jsx(Input, { value: profile.bankAccount, onChange: (e) => setProfile(p => (Object.assign(Object.assign({}, p), { bankAccount: e.target.value }))), disabled: !isEditing })] })] }), isEditing && (_jsx(Button, { onClick: handleSave, className: "mt-4", children: "Save Changes" }))] }), _jsxs(Card, { className: "p-6", children: [_jsx("h3", { className: "text-lg font-semibold mb-4", children: "Preferences" }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsx(Label, { children: "Session Notifications" }), _jsx("input", { type: "checkbox" })] }), _jsxs("div", { className: "flex items-center gap-4", children: [_jsx(Label, { children: "Email Alerts" }), _jsx("input", { type: "checkbox" })] }), _jsxs("div", { className: "flex items-center gap-4", children: [_jsx(Label, { children: "Payment Schedule" }), _jsxs("select", { children: [_jsx("option", { children: "Weekly" }), _jsx("option", { children: "Monthly" })] })] })] })] })] }));
};
