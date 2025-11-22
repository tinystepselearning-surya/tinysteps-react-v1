import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { Label } from '@components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@components/ui/tabs';
const ParentSettings = () => {
    const [profile, setProfile] = React.useState({
        name: '',
        email: '',
        phone: '',
        address: ''
    });
    const handleSaveProfile = () => {
        console.log('Saving profile:', profile);
    };
    return (_jsxs("div", { className: "p-4", children: [_jsx("h1", { className: "text-2xl font-bold mb-4", children: "Settings" }), _jsxs(Tabs, { defaultValue: "profile", children: [_jsxs(TabsList, { children: [_jsx(TabsTrigger, { value: "profile", children: "Profile" }), _jsx(TabsTrigger, { value: "payment", children: "Payment Methods" }), _jsx(TabsTrigger, { value: "preferences", children: "Preferences" })] }), _jsx(TabsContent, { value: "profile", children: _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Edit Profile" }) }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { children: [_jsx(Label, { children: "Name" }), _jsx(Input, { value: profile.name, placeholder: "Full name", onChange: (e) => setProfile(Object.assign(Object.assign({}, profile), { name: e.target.value })) })] }), _jsxs("div", { children: [_jsx(Label, { children: "Email" }), _jsx(Input, { value: profile.email, placeholder: "name@example.com", onChange: (e) => setProfile(Object.assign(Object.assign({}, profile), { email: e.target.value })) })] }), _jsxs("div", { children: [_jsx(Label, { children: "Phone" }), _jsx(Input, { value: profile.phone, onChange: (e) => setProfile(Object.assign(Object.assign({}, profile), { phone: e.target.value })) })] }), _jsxs("div", { children: [_jsx(Label, { children: "Address" }), _jsx(Input, { value: profile.address, onChange: (e) => setProfile(Object.assign(Object.assign({}, profile), { address: e.target.value })) })] }), _jsx(Button, { onClick: handleSaveProfile, children: "Save Changes" })] })] }) }), _jsx(TabsContent, { value: "payment", children: _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Payment Methods" }) }), _jsxs(CardContent, { children: [_jsx("p", { children: "Add UPI ID, Bank Account, or Card details here." }), _jsx(Button, { children: "Add Payment Method" })] })] }) }), _jsx(TabsContent, { value: "preferences", children: _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Preferences" }) }), _jsxs(CardContent, { children: [_jsx("p", { children: "Notification preferences, language, etc." }), _jsx(Button, { children: "Update Preferences" })] })] }) })] })] }));
};
export default ParentSettings;
