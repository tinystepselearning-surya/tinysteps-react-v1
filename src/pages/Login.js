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
import { useState, useEffect } from 'react';
import { signInWithEmailAndPassword, onAuthStateChanged, signOut, sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../lib/firebaseConfig";
import { useNavigate } from 'react-router-dom';
const Login = ({ onLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [infoMessage, setInfoMessage] = useState('');
    const [isResetting, setIsResetting] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                // Check admin claim (supports both boolean `admin` claim or `role: 'admin'`)
                user.getIdTokenResult(true).then((result) => {
                    const claims = (result.claims || {});
                    const isAdmin = claims.admin === true || claims.role === 'admin';
                    if (isAdmin) {
                        navigate('/surya');
                    }
                    else {
                        setError('Access denied: Admin privileges required');
                        signOut(auth); // Sign out non-admin
                    }
                });
            }
        });
        return unsubscribe;
    }, [navigate]);
    const handleLogin = (e) => __awaiter(void 0, void 0, void 0, function* () {
        e.preventDefault();
        setLoading(true);
        setInfoMessage('');
        setError('');
        try {
            const normalizedEmail = email.trim();
            if (onLogin) {
                yield onLogin(normalizedEmail, password);
            }
            else {
                yield signInWithEmailAndPassword(auth, normalizedEmail, password);
                // Navigation handled in useEffect
            }
        }
        catch (err) {
            switch (err === null || err === void 0 ? void 0 : err.code) {
                case 'auth/wrong-password':
                case 'auth/invalid-credential':
                    setError('Incorrect email or password. You can reset the admin password using the link below.');
                    break;
                case 'auth/user-not-found':
                    setError('No admin account found for this email. Double-check the address or create an admin user via Firebase.');
                    break;
                default:
                    setError((err === null || err === void 0 ? void 0 : err.message) || 'Unable to sign in.');
            }
        }
        finally {
            setLoading(false);
        }
    });
    const handleResetPassword = () => __awaiter(void 0, void 0, void 0, function* () {
        setInfoMessage('');
        setError('');
        const normalizedEmail = email.trim();
        if (!normalizedEmail) {
            setError('Enter the admin email first to receive a reset link.');
            return;
        }
        try {
            setIsResetting(true);
            yield sendPasswordResetEmail(auth, normalizedEmail);
            setInfoMessage('Password reset email sent. Check your inbox (and spam folder) for instructions.');
        }
        catch (err) {
            switch (err === null || err === void 0 ? void 0 : err.code) {
                case 'auth/user-not-found':
                    setError('No user exists with that email. Verify the address.');
                    break;
                default:
                    setError((err === null || err === void 0 ? void 0 : err.message) || 'Could not send reset email.');
            }
        }
        finally {
            setIsResetting(false);
        }
    });
    return (_jsx("div", { className: "min-h-screen flex items-center justify-center bg-gray-50", children: _jsxs("div", { className: "max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-center text-3xl font-extrabold text-gray-900", children: "Admin Login" }), _jsx("p", { className: "mt-2 text-center text-sm text-gray-600", children: "Sign in to access the admin panel" })] }), _jsxs("form", { className: "mt-8 space-y-6", onSubmit: handleLogin, children: [_jsxs("div", { className: "rounded-md shadow-sm -space-y-px", children: [_jsx("div", { children: _jsx("input", { id: "email", name: "email", type: "email", required: true, value: email, onChange: (e) => setEmail(e.target.value), className: "appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm", placeholder: "Email address" }) }), _jsx("div", { children: _jsx("input", { id: "password", name: "password", type: "password", required: true, value: password, onChange: (e) => setPassword(e.target.value), className: "appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm", placeholder: "Password" }) })] }), (error || infoMessage) && (_jsx("div", { className: `text-sm text-center ${error ? 'text-red-600' : 'text-green-600'}`, children: error || infoMessage })), _jsxs("div", { children: [_jsx("button", { type: "submit", disabled: loading, className: "group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50", children: loading ? 'Signing in...' : 'Sign in' }), _jsx("button", { type: "button", onClick: handleResetPassword, disabled: isResetting, className: "mt-3 w-full text-sm font-medium text-indigo-600 hover:text-indigo-500 disabled:opacity-50", children: isResetting ? 'Sending reset link…' : 'Forgot password? Send reset email' })] })] })] }) }));
};
export default Login;
