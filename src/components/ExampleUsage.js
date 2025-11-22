import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useAuth } from '../hooks/useAuth';
import { useKidProgress } from '../hooks/useData';
export default function ExampleUsage({ kidId }) {
    const { user, isLoading } = useAuth();
    const { data: progress, isLoading: progressLoading } = useKidProgress(kidId);
    if (isLoading || progressLoading)
        return _jsx("div", { children: "Loading..." });
    return (_jsxs("div", { className: "p-4", children: [_jsx("h2", { className: "text-lg font-semibold", children: "User" }), _jsx("pre", { className: "mb-4", children: JSON.stringify(user, null, 2) }), _jsx("h2", { className: "text-lg font-semibold", children: "Kid Progress" }), _jsx("pre", { children: JSON.stringify(progress, null, 2) })] }));
}
