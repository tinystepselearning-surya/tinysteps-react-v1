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
import { Card } from '@components/ui/card';
import { Badge } from '@components/ui/badge';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { Spinner } from '../../../../components/ui/spinner'; // Assuming a Spinner component exists
import PropTypes from 'prop-types';
export const LPStats = ({ lpId }) => {
    const [stats, setStats] = useState({
        totalFamilies: 0,
        totalTeachers: 0,
        totalStudents: 0,
        pendingPayments: 0,
        openTickets: 0,
        averageSatisfaction: 0,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        const fetchStats = () => __awaiter(void 0, void 0, void 0, function* () {
            if (!lpId)
                return;
            const db = getFirestore();
            const statsDocRef = doc(db, 'lpStats', lpId);
            try {
                const statsDoc = yield getDoc(statsDocRef);
                // Defensive checks: getDoc mocks in tests may return undefined or a non-standard object
                if (statsDoc && typeof statsDoc.exists === 'function' && statsDoc.exists()) {
                    setStats(statsDoc.data());
                }
                else {
                    setError('No statistics found for the given LP ID.');
                }
            }
            catch (error) {
                console.error('Error fetching LP stats:', error);
                setError('Failed to fetch statistics. Please try again later.');
            }
            finally {
                setLoading(false);
            }
        });
        fetchStats();
    }, [lpId]);
    if (loading) {
        return (_jsx("div", { className: "p-6 flex justify-center items-center", role: "status", children: _jsx(Spinner, {}) }));
    }
    if (error) {
        return (_jsx("div", { className: "p-6", children: _jsx("p", { className: "text-red-600 font-semibold", children: error }) }));
    }
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", children: [_jsx(Card, { className: "p-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-muted-foreground", children: "Total Families" }), _jsx("p", { className: "text-2xl font-bold", children: stats.totalFamilies })] }), _jsx("div", { className: "text-2xl", children: "\uD83D\uDC68\u200D\uD83D\uDC69\u200D\uD83D\uDC67\u200D\uD83D\uDC66" })] }) }), _jsx(Card, { className: "p-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-muted-foreground", children: "Total Teachers" }), _jsx("p", { className: "text-2xl font-bold", children: stats.totalTeachers })] }), _jsx("div", { className: "text-2xl", children: "\uD83D\uDC69\u200D\uD83C\uDFEB" })] }) }), _jsx(Card, { className: "p-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-muted-foreground", children: "Total Students" }), _jsx("p", { className: "text-2xl font-bold", children: stats.totalStudents })] }), _jsx("div", { className: "text-2xl", children: "\uD83C\uDF93" })] }) }), _jsx(Card, { className: "p-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-muted-foreground", children: "Pending Payments" }), _jsx("p", { className: "text-2xl font-bold text-orange-600", children: stats.pendingPayments })] }), _jsx("div", { className: "text-2xl", children: "\uD83D\uDCB0" })] }) }), _jsx(Card, { className: "p-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-muted-foreground", children: "Open Tickets" }), _jsx("p", { className: "text-2xl font-bold text-red-600", children: stats.openTickets })] }), _jsx("div", { className: "text-2xl", children: "\uD83C\uDFAB" })] }) }), _jsx(Card, { className: "p-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-muted-foreground", children: "Avg Satisfaction" }), _jsxs("p", { className: "text-2xl font-bold text-green-600", children: [stats.averageSatisfaction, "/5"] })] }), _jsx("div", { className: "text-2xl", children: "\u2B50" })] }) })] }), _jsxs(Card, { className: "p-6", children: [_jsx("h3", { className: "text-lg font-semibold mb-4", children: "Recent Activity" }), _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex items-center justify-between p-3 bg-muted/50 rounded", children: [_jsxs("div", { children: [_jsx("p", { className: "font-medium", children: "New enrollment: New Student" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "2 hours ago" })] }), _jsx(Badge, { variant: "secondary", children: "Phonics" })] }), _jsxs("div", { className: "flex items-center justify-between p-3 bg-muted/50 rounded", children: [_jsxs("div", { children: [_jsx("p", { className: "font-medium", children: "Payment received: \u20B92000" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "4 hours ago" })] }), _jsx(Badge, { variant: "default", children: "Paid" })] }), _jsxs("div", { className: "flex items-center justify-between p-3 bg-muted/50 rounded", children: [_jsxs("div", { children: [_jsx("p", { className: "font-medium", children: "Support ticket resolved" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "1 day ago" })] }), _jsx(Badge, { variant: "outline", children: "Resolved" })] })] })] })] }));
};
LPStats.propTypes = {
    lpId: PropTypes.string.isRequired,
};
export default LPStats;
