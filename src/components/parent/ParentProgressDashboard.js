import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRealtimeData } from '../../hooks/useRealtime';
// Simple progress bar component
function ProgressBar({ value }) {
    return (_jsx("div", { className: "w-full bg-gray-200 rounded h-4", children: _jsx("div", { className: "bg-green-500 h-4 rounded", style: { width: `${Math.min(100, Math.max(0, value))}%` } }) }));
}
export default function ParentProgressDashboard({ childId }) {
    const { data: progress = [], isLoading, error } = useRealtimeData('progress', [
    // query will be built inside hook by supplying constraints; here we pass nothing and filter client-side
    ]);
    if (isLoading)
        return _jsx("div", { children: "Loading progress..." });
    if (error)
        return _jsxs("div", { className: "text-red-600", children: ["Failed to load progress: ", String(error.message)] });
    const filtered = progress.filter((p) => p.studentId === childId);
    const masteryByArea = {};
    filtered.forEach((p) => {
        const area = p.area || 'general';
        const scoreBand = Number(p.score || p.scoreBand || 0);
        if (!masteryByArea[area])
            masteryByArea[area] = [];
        masteryByArea[area].push(scoreBand);
    });
    const entries = Object.entries(masteryByArea);
    if (entries.length === 0)
        return _jsx("div", { children: "No progress data yet." });
    return (_jsx("div", { className: "space-y-4", children: entries.map(([area, scores]) => {
            const avg = scores.reduce((a, b) => a + b, 0) / Math.max(1, scores.length);
            return (_jsxs("div", { className: "p-4 bg-white rounded shadow", children: [_jsx("h3", { className: "font-semibold capitalize", children: area }), _jsxs("div", { className: "text-2xl font-bold", children: [Math.round(avg), "%"] }), _jsx("div", { className: "mt-2", children: _jsx(ProgressBar, { value: avg }) })] }, area));
        }) }));
}
