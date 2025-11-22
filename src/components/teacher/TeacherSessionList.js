import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// React is not required in new JSX transform; keep imports minimal
import { useRealtimeData } from '../../hooks/useRealtime';
import { useAuthStore } from '../../store/useAuthStore';
import { where } from 'firebase/firestore';
import { format } from 'date-fns';
export default function TeacherSessionList() {
    const { user } = useAuthStore();
    const today = format(new Date(), 'yyyy-MM-dd');
    const { data: sessions = [], isLoading, error } = useRealtimeData('sessions', [
        where('teacherId', '==', user === null || user === void 0 ? void 0 : user.uid),
        where('date', '==', today),
    ]);
    if (isLoading)
        return _jsx("div", { children: "Loading sessions..." });
    if (error)
        return _jsxs("div", { className: "text-red-600", children: ["Failed to load sessions: ", String(error.message)] });
    if (!sessions || sessions.length === 0)
        return _jsx("div", { children: "No sessions for today." });
    return (_jsx("div", { className: "space-y-3", children: sessions.map((session) => (_jsxs("div", { className: "p-4 bg-white rounded shadow", children: [_jsxs("h3", { className: "font-semibold", children: [session.startTime || '—', " \u2014 ", session.endTime || '—'] }), _jsxs("p", { className: "text-sm text-gray-600", children: ["Kids: ", (session.kidIds || []).length] }), _jsx("div", { className: "mt-3", children: _jsx("a", { className: "inline-block px-3 py-1 bg-blue-600 text-white rounded", href: session.joinUrl || '#', target: "_blank", rel: "noreferrer", children: "Join Zoom" }) })] }, session.id))) }));
}
