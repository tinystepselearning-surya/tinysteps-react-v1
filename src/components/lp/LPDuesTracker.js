import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRealtimeData } from '../../hooks/useRealtime';
import { useAuthStore } from '../../store/useAuthStore';
export default function LPDuesTracker() {
    const { user } = useAuthStore();
    const { data: invoices = [], isLoading, error } = useRealtimeData('invoices', []);
    if (isLoading)
        return _jsx("div", { children: "Loading dues..." });
    if (error)
        return _jsxs("div", { className: "text-red-600", children: ["Failed to load invoices: ", String(error.message)] });
    // filter for this LP and issued status
    const mine = invoices.filter((inv) => inv.lpId === (user === null || user === void 0 ? void 0 : user.uid) && inv.status === 'issued');
    const totalDue = mine.reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);
    const overdue = mine.filter((inv) => new Date(inv.dueDate) < new Date()).length;
    return (_jsxs("div", { className: "p-4 bg-white rounded shadow", children: [_jsx("h2", { className: "text-2xl font-bold mb-4", children: "Dues This Week" }), _jsxs("p", { children: ["Total Due: \u20B9", totalDue] }), _jsxs("p", { className: "text-red-600", children: ["Overdue: ", overdue, " invoices"] }), _jsx("div", { className: "mt-4 space-y-2", children: mine.map((inv) => (_jsxs("div", { className: "p-3 bg-gray-50 rounded flex justify-between items-center", children: [_jsxs("div", { children: [_jsx("div", { className: "text-sm text-gray-700", children: inv.parentId }), _jsxs("div", { className: "text-xs text-gray-500", children: ["Due: ", inv.dueDate] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsxs("div", { className: "font-semibold", children: ["\u20B9", inv.amount] }), _jsx("button", { className: "px-2 py-1 bg-blue-600 text-white rounded text-sm", children: "Follow Up" })] })] }, inv.id))) })] }));
}
