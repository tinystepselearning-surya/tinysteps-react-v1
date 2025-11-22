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
import { Button } from '@components/ui/button';
import { signOut } from 'firebase/auth';
import { auth } from '../../../../lib/firebaseConfig';
import { useAuthStore } from '../../../../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
export const LPHeader = ({ name }) => {
    const { clearUser } = useAuthStore();
    const navigate = useNavigate();
    const handleLogout = () => __awaiter(void 0, void 0, void 0, function* () {
        try {
            yield signOut(auth);
            clearUser();
            navigate('/learning-partner/login');
        }
        catch (error) {
            console.error('Logout error:', error);
        }
    });
    return (_jsxs("header", { className: "flex items-center justify-between mb-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold", children: "Learning Partner Hub" }), _jsxs("p", { className: "text-muted-foreground", children: ["Welcome back, ", name] })] }), _jsx("div", { className: "flex items-center gap-4", children: _jsx(Button, { variant: "outline", onClick: handleLogout, children: "Logout" }) })] }));
};
;
