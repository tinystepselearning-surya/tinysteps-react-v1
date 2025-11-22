import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Badge } from '@components/ui/badge';
const ParentProfile = () => {
    // Do not include real or demo parent/child data in product builds. Profile data should be fetched.
    const profile = {
        name: '',
        email: '',
        phone: '',
        address: '',
        joined: '',
        children: [],
        paymentMethods: [],
    };
    return (_jsxs("div", { className: "p-4", children: [_jsx("h1", { className: "text-2xl font-bold mb-4", children: "My Profile" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Profile Information" }) }), _jsxs(CardContent, { children: [_jsxs("p", { children: [_jsx("strong", { children: "Name:" }), " ", profile.name || '—'] }), _jsxs("p", { children: [_jsx("strong", { children: "Email:" }), " ", profile.email] }), _jsxs("p", { children: [_jsx("strong", { children: "Phone:" }), " ", profile.phone] }), _jsxs("p", { children: [_jsx("strong", { children: "Address:" }), " ", profile.address] }), _jsxs("p", { children: [_jsx("strong", { children: "Joined:" }), " ", profile.joined || '—'] }), _jsx(Button, { className: "mt-4", children: "Edit Profile" })] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "My Children" }) }), _jsxs(CardContent, { children: [profile.children.length === 0 && _jsx("p", { className: "text-sm text-gray-500", children: "No children yet" }), profile.children.map((child, index) => (_jsxs("div", { className: "mb-2", children: [_jsxs("p", { children: [_jsx("strong", { children: child.name }), " - ", child.grade] }), _jsx(Badge, { variant: "default", children: child.status })] }, index))), _jsx(Button, { className: "mt-4", children: "Manage Children" })] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Payment Methods" }) }), _jsxs(CardContent, { children: [profile.paymentMethods.map((method, index) => (_jsx("p", { children: method }, index))), _jsx(Button, { className: "mt-4", children: "Add Payment Method" })] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Emergency Contact" }) }), _jsxs(CardContent, { children: [_jsxs("p", { children: ["Name: ", profile.name || 'Parent Name'] }), _jsx("p", { children: "Phone: 0987654321" }), _jsx(Button, { className: "mt-4", children: "Edit Contact" })] })] })] })] }));
};
export default ParentProfile;
