import { jsx as _jsx } from "react/jsx-runtime";
// React import removed (unused)
import { useAuthStore } from '../../store/useAuthStore';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { isSuperUserEmail } from '../../constants/accessControl';
export default function RoleGate({ allowedRoles, loginPath = '/login', unauthorizedPath = '/unauthorized' }) {
    const { user, isLoading } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();
    const superUser = isSuperUserEmail(user === null || user === void 0 ? void 0 : user.email);
    const canAccess = !!user && (superUser || allowedRoles.includes(user === null || user === void 0 ? void 0 : user.role));
    useEffect(() => {
        if (isLoading) {
            return;
        }
        if (!user) {
            navigate(loginPath, { replace: true, state: { from: location.pathname } });
            return;
        }
        if (!superUser && !allowedRoles.includes(user.role)) {
            navigate(unauthorizedPath, { replace: true });
            return;
        }
    }, [user, allowedRoles, navigate, superUser, isLoading, loginPath, unauthorizedPath, location.pathname]);
    if (isLoading) {
        return (_jsx("div", { className: "flex h-[60vh] items-center justify-center text-sm text-gray-500", children: "Verifying your access\u2026" }));
    }
    if (!canAccess) {
        return null;
    }
    return _jsx(Outlet, {});
}
