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
import { Card } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { useAuthStore } from '../../../../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../../../lib/firebaseConfig';
export const ParentHeader = ({ name, totalChildren, onOpenKidsView }) => {
    const { clearUser } = useAuthStore();
    const navigate = useNavigate();
    const handleLogout = () => __awaiter(void 0, void 0, void 0, function* () {
        try {
            yield signOut(auth);
            clearUser();
            navigate('/parent/login');
        }
        catch (error) {
            console.error('Logout error: ', error);
        }
    });
    return (_jsxs(Card, { className: "p-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-gradient-to-r from-rose-50 to-orange-50 dark:from-slate-900 dark:to-slate-800", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-muted-foreground", children: "Welcome back" }), _jsx("h1", { className: "text-2xl font-bold", children: name || 'Parent' }), typeof totalChildren === 'number' && (_jsxs("p", { className: "text-sm text-muted-foreground mt-1", children: ["Managing ", _jsx("span", { className: "font-semibold", children: totalChildren }), " child", totalChildren === 1 ? '' : 'ren', "."] }))] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Button, { variant: "default", onClick: onOpenKidsView, children: "Kids Page" }), _jsx(Button, { variant: "outline", children: "Edit Profile" }), _jsx(Button, { variant: "secondary", children: "Payment Methods" }), _jsx(Button, { variant: "outline", onClick: handleLogout, children: "Logout" })] })] }));
};
