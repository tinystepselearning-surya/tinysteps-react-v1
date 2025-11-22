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
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { handleLogin, handleLoginWithGoogle } from '../lib/auth';
export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const location = useLocation();
    // Extract role from URL path or query parameter
    const getExpectedRole = () => {
        const pathSegments = location.pathname.split('/').filter(Boolean);
        const roleFromPath = (pathSegments[0] || '').toLowerCase(); // e.g., 'admin' from '/admin/login'
        // Map path segments to role names
        const pathToRoleMap = {
            'admin': 'admin',
            'surya': 'admin',
            'teacher': 'teacher',
            'parent': 'parent',
            'learning-partner': 'learningPartner',
            'learningpartner': 'learningPartner',
            'kid': 'kid'
        };
        return pathToRoleMap[roleFromPath] || searchParams.get('role');
    };
    const expectedRole = getExpectedRole();
    const onSubmit = (e) => __awaiter(this, void 0, void 0, function* () {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);
        try {
            yield handleLogin(email, password, expectedRole || undefined);
            // handleLogin will redirect on success
        }
        catch (err) {
            setError((err === null || err === void 0 ? void 0 : err.message) || 'Login failed');
        }
        finally {
            setIsSubmitting(false);
        }
    });
    // If role parameter is specified, show a message
    const getRoleMessage = () => {
        if (!expectedRole)
            return null;
        const roleNames = {
            parent: 'Parent',
            teacher: 'Teacher',
            learningPartner: 'Learning Partner',
            admin: 'Administrator',
            kid: 'Kid'
        };
        return `Please log in with your ${roleNames[expectedRole] || expectedRole} credentials.`;
    };
    return (_jsx("div", { className: "min-h-screen flex items-center justify-center bg-gray-50", children: _jsxs("div", { className: "w-full max-w-md p-8 bg-white rounded shadow", children: [_jsx("h1", { className: "text-2xl font-bold mb-6", children: "Login" }), expectedRole && (_jsx("div", { className: "mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-blue-800 text-sm", children: getRoleMessage() })), error && _jsx("div", { className: "mb-4 text-red-600", children: error }), _jsxs("form", { className: "space-y-4", onSubmit: onSubmit, children: [_jsx("input", { value: email, onChange: (e) => setEmail(e.target.value), type: "email", placeholder: "Email", className: "w-full px-3 py-2 border rounded", required: true, "aria-label": "email" }), _jsx("input", { value: password, onChange: (e) => setPassword(e.target.value), type: "password", placeholder: "Password", className: "w-full px-3 py-2 border rounded", required: true, "aria-label": "password" }), _jsx("button", { type: "submit", className: `w-full px-4 py-2 rounded ${isSubmitting ? 'bg-gray-400' : 'bg-blue-600 text-white'}`, disabled: isSubmitting, children: isSubmitting ? 'Signing in…' : 'Sign In' }), expectedRole === 'parent' && (_jsx("div", { children: _jsx("button", { type: "button", onClick: () => __awaiter(this, void 0, void 0, function* () {
                                    setError(null);
                                    setIsSubmitting(true);
                                    try {
                                        yield handleLoginWithGoogle('parent');
                                    }
                                    catch (err) {
                                        setError((err === null || err === void 0 ? void 0 : err.message) || 'Google sign-in failed');
                                    }
                                    finally {
                                        setIsSubmitting(false);
                                    }
                                }), className: `w-full mt-2 px-4 py-2 rounded border ${isSubmitting ? 'opacity-60' : 'bg-white'}`, children: "Sign in with Google" }) }))] })] }) }));
}
