import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// no React import needed in new JSX runtime
import { UserList } from './UserList';
export default function UserManagement() {
    return (_jsxs("div", { className: "space-y-6", children: [_jsx("div", { className: "flex justify-between items-center", children: _jsx("h2", { className: "text-2xl font-bold", children: "User Management" }) }), _jsx(UserList, {})] }));
}
