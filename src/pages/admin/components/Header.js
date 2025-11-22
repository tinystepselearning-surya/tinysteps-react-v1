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
// React default import removed
import { Button } from '@components/ui/button';
import { useAuthStore } from '../../../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../../lib/firebaseConfig';
export default function Header({ user }) {
    const { clearUser } = useAuthStore();
    const navigate = useNavigate();
    const handleLogout = () => __awaiter(this, void 0, void 0, function* () {
        try {
            yield signOut(auth);
            clearUser();
            navigate('/surya/login');
        }
        catch (err) {
            console.error('Logout error', err);
        }
    });
    return (_jsx("header", { className: "bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4", children: _jsxs("div", { className: "flex justify-between items-center", children: [_jsx("div", { className: "flex items-center space-x-4", children: _jsx("h1", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: "Tiny Steps Admin" }) }), _jsxs("div", { className: "flex items-center space-x-4", children: [_jsxs("span", { className: "text-sm text-gray-600 dark:text-gray-400", children: ["Welcome, ", (user === null || user === void 0 ? void 0 : user.name) || (user === null || user === void 0 ? void 0 : user.email)] }), _jsx(Button, { variant: "outline", onClick: handleLogout, children: "Logout" })] })] }) }));
}
