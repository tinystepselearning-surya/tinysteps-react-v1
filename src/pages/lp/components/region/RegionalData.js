import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Badge } from '@components/ui/badge';
export const RegionalData = ({ lpId }) => {
    // Mock data - in real implementation, fetch from Firestore
    const regionalStats = [
        {
            region: 'Mumbai',
            totalFamilies: 25,
            totalStudents: 35,
            totalRevenue: 87500,
            growthRate: 15.2,
            topSubject: 'Phonics',
            avgSatisfaction: 4.4,
        },
        {
            region: 'Delhi',
            totalFamilies: 18,
            totalStudents: 24,
            totalRevenue: 60000,
            growthRate: 8.7,
            topSubject: 'Grammar',
            avgSatisfaction: 4.2,
        },
        {
            region: 'Bangalore',
            totalFamilies: 22,
            totalStudents: 31,
            totalRevenue: 77500,
            growthRate: 12.1,
            topSubject: 'Speaking',
            avgSatisfaction: 4.5,
        },
    ];
    const totalStats = regionalStats.reduce((acc, region) => ({
        totalFamilies: acc.totalFamilies + region.totalFamilies,
        totalStudents: acc.totalStudents + region.totalStudents,
        totalRevenue: acc.totalRevenue + region.totalRevenue,
        avgGrowth: acc.avgGrowth + region.growthRate,
        avgSatisfaction: acc.avgSatisfaction + region.avgSatisfaction,
    }), { totalFamilies: 0, totalStudents: 0, totalRevenue: 0, avgGrowth: 0, avgSatisfaction: 0 });
    totalStats.avgGrowth /= regionalStats.length;
    totalStats.avgSatisfaction /= regionalStats.length;
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4", children: [_jsx(Card, { className: "p-6", children: _jsxs("div", { className: "text-center", children: [_jsx("p", { className: "text-sm text-muted-foreground", children: "Total Families" }), _jsx("p", { className: "text-3xl font-bold", children: totalStats.totalFamilies })] }) }), _jsx(Card, { className: "p-6", children: _jsxs("div", { className: "text-center", children: [_jsx("p", { className: "text-sm text-muted-foreground", children: "Total Students" }), _jsx("p", { className: "text-3xl font-bold", children: totalStats.totalStudents })] }) }), _jsx(Card, { className: "p-6", children: _jsxs("div", { className: "text-center", children: [_jsx("p", { className: "text-sm text-muted-foreground", children: "Total Revenue" }), _jsxs("p", { className: "text-3xl font-bold", children: ["\u20B9", (totalStats.totalRevenue / 1000).toFixed(0), "K"] })] }) }), _jsx(Card, { className: "p-6", children: _jsxs("div", { className: "text-center", children: [_jsx("p", { className: "text-sm text-muted-foreground", children: "Avg Growth" }), _jsxs("p", { className: "text-3xl font-bold text-green-600", children: ["+", totalStats.avgGrowth.toFixed(1), "%"] })] }) })] }), _jsxs(Card, { className: "p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h3", { className: "text-lg font-semibold", children: "Regional Performance" }), _jsx(Button, { variant: "outline", children: "Export Data" })] }), _jsx("div", { className: "space-y-4", children: regionalStats.map((region) => (_jsxs("div", { className: "border rounded p-4", children: [_jsxs("div", { className: "flex items-center justify-between mb-3", children: [_jsx("h4", { className: "text-lg font-semibold", children: region.region }), _jsxs(Badge, { variant: "secondary", children: ["\u2B50 ", region.avgSatisfaction, "/5"] })] }), _jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4 text-sm", children: [_jsxs("div", { children: [_jsx("p", { className: "text-muted-foreground", children: "Families" }), _jsx("p", { className: "font-semibold", children: region.totalFamilies })] }), _jsxs("div", { children: [_jsx("p", { className: "text-muted-foreground", children: "Students" }), _jsx("p", { className: "font-semibold", children: region.totalStudents })] }), _jsxs("div", { children: [_jsx("p", { className: "text-muted-foreground", children: "Revenue" }), _jsxs("p", { className: "font-semibold", children: ["\u20B9", (region.totalRevenue / 1000).toFixed(0), "K"] })] }), _jsxs("div", { children: [_jsx("p", { className: "text-muted-foreground", children: "Growth" }), _jsxs("p", { className: "font-semibold text-green-600", children: ["+", region.growthRate, "%"] })] })] }), _jsx("div", { className: "mt-3 pt-3 border-t", children: _jsxs("p", { className: "text-sm", children: [_jsx("span", { className: "text-muted-foreground", children: "Top Subject:" }), " ", region.topSubject] }) })] }, region.region))) })] })] }));
};
export default RegionalData;
