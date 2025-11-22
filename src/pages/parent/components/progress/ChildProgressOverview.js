import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card } from '@components/ui/card';
import { cn } from '@components/lib/utils';
const getBarColor = (value) => {
    if (value >= 67)
        return 'bg-emerald-500';
    if (value >= 34)
        return 'bg-amber-400';
    return 'bg-rose-400';
};
export const ChildProgressOverview = ({ progress }) => {
    if (!progress.length) {
        return _jsx(Card, { className: "p-6 text-sm text-muted-foreground", children: "No progress data yet." });
    }
    return (_jsx("div", { className: "space-y-4", children: progress.map((snapshot) => (_jsxs(Card, { className: "p-4 space-y-3", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold", children: snapshot.childName }), snapshot.recommendations && (_jsx("p", { className: "text-sm text-muted-foreground", children: snapshot.recommendations }))] }), ['phonics', 'grammar', 'speaking'].map((topic) => (_jsxs("div", { children: [_jsxs("div", { className: "flex items-center justify-between text-xs text-muted-foreground", children: [_jsx("span", { children: topic.charAt(0).toUpperCase() + topic.slice(1) }), _jsxs("span", { children: [Number(snapshot[topic]), "%"] })] }), _jsx("div", { className: "h-2 bg-muted rounded-full", children: _jsx("div", { className: cn('h-2 rounded-full', getBarColor(Number(snapshot[topic]))), style: { width: `${Number(snapshot[topic])}%` } }) })] }, topic))), snapshot.recentActivities && snapshot.recentActivities.length > 0 && (_jsxs("div", { className: "text-xs text-muted-foreground", children: [_jsx("p", { className: "font-semibold", children: "Recent Activities" }), _jsx("ul", { className: "list-disc ml-4", children: snapshot.recentActivities.map((activity) => (_jsx("li", { children: activity }, activity))) })] }))] }, snapshot.childId))) }));
};
