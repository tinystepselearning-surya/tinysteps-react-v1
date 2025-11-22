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
import { useEffect, useState } from 'react';
import { TodaySession } from './components/session/TodaySession';
import { ProgressBars } from './components/progress/ProgressBars';
import { Achievements } from './components/achievements/Achievements';
import { WorksheetsList } from './components/worksheets/WorksheetsList';
import { useAuthStore } from '../../store/useAuthStore';
import DailyProgressCard from '../../components/DailyPractice/DailyProgressCard.jsx';
import { collection, getDocs, limit, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebaseConfig';
export default function KidDashboard() {
    const { user } = useAuthStore();
    const practiceLink = (user === null || user === void 0 ? void 0 : user.uid) ? `/kids/${user.uid}/practice-buddy` : '/kids/me/practice-buddy';
    const dailyLink = (user === null || user === void 0 ? void 0 : user.uid) ? `/kids/${user.uid}/daily-practice` : '/kids/me/daily-practice';
    const [dailyStatus, setDailyStatus] = useState({ score: 0, total: 5, completed: false });
    useEffect(() => {
        const fetchDaily = () => __awaiter(this, void 0, void 0, function* () {
            if (!(user === null || user === void 0 ? void 0 : user.uid))
                return;
            const todayKey = new Date().toISOString().slice(0, 10);
            const q = query(collection(db, 'daily-practice'), where('studentId', '==', user.uid), where('dateKey', '==', todayKey), limit(1));
            const snap = yield getDocs(q);
            if (!snap.empty) {
                const data = snap.docs[0].data();
                setDailyStatus({
                    score: Math.round(((data.score || 0) / 100) * (data.totalExercises || 5)),
                    total: data.totalExercises || 5,
                    completed: !!data.completed,
                });
            }
        });
        fetchDaily().catch(() => { });
    }, [user === null || user === void 0 ? void 0 : user.uid]);
    return (_jsx("div", { className: "min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4 md:p-8", children: _jsxs("div", { className: "max-w-7xl mx-auto space-y-8", children: [_jsxs("div", { className: "text-center py-6", children: [_jsx("h1", { className: "text-4xl font-bold text-blue-800 mb-2", children: "\uD83C\uDF93 Tiny Steps Learning" }), _jsx("p", { className: "text-lg text-purple-600", children: "Welcome back! Let's learn and have fun! \uD83C\uDF1F" })] }), _jsx("div", { className: "w-full", children: _jsx(TodaySession, {}) }), _jsx("div", { className: "grid grid-cols-1", children: _jsx(DailyProgressCard, { score: dailyStatus.score, total: dailyStatus.total, completed: dailyStatus.completed, onStart: () => (window.location.href = dailyLink) }) }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-8", children: [_jsx(ProgressBars, {}), _jsx(Achievements, {})] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-8", children: [_jsx(WorksheetsList, {}), _jsx(GamesList, {})] }), _jsx("div", { className: "text-center py-8", children: _jsxs("div", { className: "inline-flex items-center space-x-2 bg-white px-6 py-3 rounded-full shadow-lg", children: [_jsx("span", { className: "text-2xl", children: "\uD83D\uDCAA" }), _jsx("span", { className: "text-lg font-semibold text-gray-700", children: "Keep learning, you're amazing!" }), _jsx("span", { className: "text-2xl", children: "\uD83C\uDF89" })] }) })] }) }));
        return (_jsx("div", { className: "min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4 md:p-8", children: _jsxs("div", { className: "max-w-7xl mx-auto space-y-8", children: [_jsxs("div", { className: "text-center py-6", children: [_jsx("h1", { className: "text-4xl font-bold text-blue-800 mb-2", children: "\uD83C\uDF93 Tiny Steps Learning" }), _jsx("p", { className: "text-lg text-purple-600", children: "Welcome back! Let's learn and have fun! \uD83C\uDF1F" })] }), _jsx("div", { className: "w-full", children: _jsx(TodaySession, {}) }), _jsx("div", { className: "grid grid-cols-1", children: _jsx(DailyProgressCard, { score: dailyStatus.score, total: dailyStatus.total, completed: dailyStatus.completed, onStart: () => (window.location.href = dailyLink) }) }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-8", children: [_jsx(ProgressBars, {}), _jsx(Achievements, {})] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-8", children: [_jsx(WorksheetsList, {})] }), _jsx("div", { className: "text-center py-8", children: _jsxs("div", { className: "inline-flex items-center space-x-2 bg-white px-6 py-3 rounded-full shadow-lg", children: [_jsx("span", { className: "text-2xl", children: "\uD83D\uDCAA" }), _jsx("span", { className: "text-lg font-semibold text-gray-700", children: "Keep learning, you're amazing!" }), _jsx("span", { className: "text-2xl", children: "\uD83C\uDF89" })] }) })] }) }));
}
