import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebaseConfig';
// Lightweight helpers for export
function exportToCSV(filename, rows) {
    const csvContent = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
// Date helpers
const msPerDay = 24 * 60 * 60 * 1000;
function startOfDay(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
}
export default function AnalyticsDashboard() {
    // Raw data
    const [users, setUsers] = useState([]);
    const [students, setStudents] = useState([]);
    const [enrollments, setEnrollments] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [payments, setPayments] = useState([]);
    const [courses, setCourses] = useState([]);
    const [reports, setReports] = useState([]);
    const [fsError, setFsError] = useState(null);
    // Filters
    const [rangeDays, setRangeDays] = useState(30);
    const [areaFilter, setAreaFilter] = useState('All');
    const [teacherFilter, setTeacherFilter] = useState(null);
    // dynamic import for charts (optional)
    const [Recharts, setRecharts] = useState(null);
    useEffect(() => {
        let mounted = true;
        import('recharts')
            .then(mod => { if (mounted)
            setRecharts(mod); })
            .catch(() => { });
        return () => { mounted = false; };
    }, []);
    // Firestore subscriptions (real-time)
    useEffect(() => {
        const onErr = (err) => setFsError((err === null || err === void 0 ? void 0 : err.message) || 'Permission denied or unavailable.');
        const unsubUsers = onSnapshot(collection(db, 'users'), snap => setUsers(snap.docs.map(d => (Object.assign({ id: d.id }, d.data())))), onErr);
        const unsubStudents = onSnapshot(collection(db, 'kids'), snap => setStudents(snap.docs.map(d => (Object.assign({ id: d.id }, d.data())))), onErr);
        const unsubEnroll = onSnapshot(collection(db, 'enrollments'), snap => setEnrollments(snap.docs.map(d => (Object.assign({ id: d.id }, d.data())))), onErr);
        const unsubSessions = onSnapshot(collection(db, 'sessions'), snap => setSessions(snap.docs.map(d => (Object.assign({ id: d.id }, d.data())))), onErr);
        const unsubPayments = onSnapshot(collection(db, 'payments'), snap => setPayments(snap.docs.map(d => (Object.assign({ id: d.id }, d.data())))), onErr);
        const unsubCourses = onSnapshot(collection(db, 'courses'), snap => setCourses(snap.docs.map(d => (Object.assign({ id: d.id }, d.data())))), onErr);
        const unsubReports = onSnapshot(collection(db, 'reports'), snap => setReports(snap.docs.map(d => (Object.assign({ id: d.id }, d.data())))), onErr);
        return () => {
            unsubUsers();
            unsubStudents();
            unsubEnroll();
            unsubSessions();
            unsubPayments();
            unsubCourses();
            unsubReports();
        };
    }, []);
    // Derived metrics
    const metrics = useMemo(() => {
        const totals = { admins: 0, teachers: 0, parents: 0, lps: 0 };
        users.forEach(u => {
            const roles = u.roles || [];
            if (roles.includes('admin'))
                totals.admins++;
            if (roles.includes('teacher'))
                totals.teachers++;
            if (roles.includes('parent'))
                totals.parents++;
            if (roles.includes('learningPartner'))
                totals.lps++;
        });
        const totalUsers = users.length;
        const studentCount = students.length;
        const activeEnrollments = enrollments.filter(e => e.status === 'active' || e.status === 'ongoing').length;
        const assignedTeachers = enrollments.filter(e => e.teacherId).length;
        const assignedLPs = enrollments.filter(e => e.lpId).length;
        const revenueThisMonth = payments
            .filter(p => {
            if (!p.createdAt)
                return false;
            const d = p.createdAt.toDate ? p.createdAt.toDate() : new Date(p.createdAt);
            const start = new Date();
            start.setDate(1);
            start.setHours(0, 0, 0, 0);
            return d >= start;
        })
            .reduce((s, p) => s + (p.amount || 0), 0);
        const sessionsCompleted = sessions.filter(s => s.status === 'completed').length;
        const avgPerSession = sessionsCompleted ? Math.round(revenueThisMonth / sessionsCompleted) : 0;
        const courseCount = courses.length;
        const topicsTotal = courses.reduce((acc, c) => { var _a; return acc + (((_a = c.topics) === null || _a === void 0 ? void 0 : _a.length) || 0); }, 0);
        const topicsTaught = reports.reduce((acc, r) => { var _a; return acc + (((_a = r.topicsCovered) === null || _a === void 0 ? void 0 : _a.length) || 0); }, 0);
        return {
            totals, totalUsers,
            studentCount, activeEnrollments, assignedTeachers, assignedLPs,
            revenueThisMonth, sessionsCompleted, avgPerSession,
            courseCount, topicsTotal, topicsTaught
        };
    }, [users, students, enrollments, payments, sessions, courses, reports]);
    // Enrollment status counts
    const enrollmentStatus = useMemo(() => {
        const counts = { pendingTeacher: 0, pendingLP: 0, active: 0, completed: 0, cancelled: 0 };
        enrollments.forEach(e => {
            const s = e.status || 'pending';
            if (s === 'pendingTeacher')
                counts.pendingTeacher++;
            else if (s === 'pendingLP')
                counts.pendingLP++;
            else if (s === 'active' || s === 'ongoing')
                counts.active++;
            else if (s === 'completed')
                counts.completed++;
            else if (s === 'cancelled')
                counts.cancelled++;
        });
        return counts;
    }, [enrollments]);
    // Revenue by course
    const revenueByCourse = useMemo(() => {
        const map = {};
        payments.forEach(p => {
            const c = p.course || 'Unknown';
            map[c] = (map[c] || 0) + (p.amount || 0);
        });
        return Object.entries(map).map(([course, amt]) => ({ course, amt }));
    }, [payments]);
    // Mastery distribution
    const masteryDistribution = useMemo(() => {
        // Suppose reports contain mastery % per student
        const buckets = { '0-25': 0, '25-50': 0, '50-75': 0, '75-100': 0 };
        const latestPerStudent = {};
        reports.forEach(r => {
            if (!r.kidId)
                return;
            const m = r.masteryPercent || 0;
            if (!latestPerStudent[r.kidId] || (r.updatedAt && r.updatedAt > latestPerStudent[r.kidId])) {
                latestPerStudent[r.kidId] = m;
            }
        });
        Object.values(latestPerStudent).forEach((m) => {
            if (m <= 25)
                buckets['0-25']++;
            else if (m <= 50)
                buckets['25-50']++;
            else if (m <= 75)
                buckets['50-75']++;
            else
                buckets['75-100']++;
        });
        return Object.entries(buckets).map(([label, count]) => ({ label, count }));
    }, [reports]);
    // Sessions trend last 30 days
    const sessionsTrend = useMemo(() => {
        const days = (rangeDays === 'all') ? 90 : (typeof rangeDays === 'number' ? rangeDays : 30);
        const result = [];
        const start = startOfDay(new Date(Date.now() - (days - 1) * msPerDay));
        for (let i = 0; i < days; i++) {
            const d = new Date(start.getTime() + i * msPerDay);
            result.push({ date: d.toISOString().slice(0, 10), count: 0 });
        }
        sessions.forEach(s => {
            if (!s.date)
                return;
            const d = s.date.toDate ? s.date.toDate() : new Date(s.date);
            const iso = startOfDay(d).toISOString().slice(0, 10);
            const row = result.find(r => r.date === iso);
            if (row)
                row.count++;
        });
        return result;
    }, [sessions, rangeDays]);
    // Teacher performance table
    const teacherPerformance = useMemo(() => {
        const teachers = users.filter(u => { var _a; return (_a = u.roles) === null || _a === void 0 ? void 0 : _a.includes('teacher'); });
        return teachers.map(t => {
            const teacherSessions = sessions.filter(s => s.teacherId === t.id && s.status === 'completed').length;
            const studentIds = enrollments.filter(e => e.teacherId === t.id).map(e => e.kidId);
            const avgMastery = studentIds.length ? Math.round((studentIds.reduce((sum, kidId) => {
                const r = reports.filter(rep => rep.kidId === kidId).slice(-1)[0];
                return sum + ((r === null || r === void 0 ? void 0 : r.masteryPercent) || 0);
            }, 0) / studentIds.length)) : 0;
            const earnings = payments.filter(p => p.teacherId === t.id).reduce((s, p) => s + (p.amount || 0), 0);
            return { name: t.displayName, teacherId: t.id, sessionsCompleted: teacherSessions, avgMastery, earnings };
        });
    }, [users, sessions, enrollments, reports, payments]);
    // Busiest days (sessions by day of week)
    const busiestDays = useMemo(() => {
        const days = { Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0 };
        sessions.forEach(s => {
            if (!s.date)
                return;
            const d = s.date.toDate ? s.date.toDate() : new Date(s.date);
            const name = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()];
            days[name]++;
        });
        return Object.entries(days).map(([day, count]) => ({ day, count }));
    }, [sessions]);
    // Recent enrollments
    const recentEnrollments = useMemo(() => {
        return enrollments
            .slice()
            .sort((a, b) => { var _a, _b; return (((_a = b.createdAt) === null || _a === void 0 ? void 0 : _a.toDate) ? b.createdAt.toDate() : new Date(b.createdAt)).getTime() - (((_b = a.createdAt) === null || _b === void 0 ? void 0 : _b.toDate) ? a.createdAt.toDate() : new Date(a.createdAt)).getTime(); })
            .slice(0, 10)
            .map(e => {
            var _a, _b, _c, _d;
            return ({
                student: ((_a = students.find(s => s.id === e.kidId)) === null || _a === void 0 ? void 0 : _a.name) || 'Unknown',
                course: ((_b = courses.find(c => c.id === e.courseId)) === null || _b === void 0 ? void 0 : _b.title) || e.course || 'Unknown',
                parent: ((_c = users.find(u => u.id === e.parentId)) === null || _c === void 0 ? void 0 : _c.displayName) || 'Unknown',
                teacher: ((_d = users.find(u => u.id === e.teacherId)) === null || _d === void 0 ? void 0 : _d.displayName) || 'Unassigned',
                status: e.status,
                date: e.createdAt ? (e.createdAt.toDate ? e.createdAt.toDate().toISOString().slice(0, 10) : new Date(e.createdAt).toISOString().slice(0, 10)) : ''
            });
        });
    }, [enrollments, students, users, courses]);
    // Top performing students
    const topStudents = useMemo(() => {
        const byStudent = {};
        reports.forEach(r => {
            var _a;
            const id = r.kidId;
            if (!id)
                return;
            byStudent[id] = byStudent[id] || { mastery: 0, topics: 0, courses: new Set() };
            byStudent[id].mastery = Math.max(byStudent[id].mastery, r.masteryPercent || 0);
            byStudent[id].topics += (((_a = r.topicsCovered) === null || _a === void 0 ? void 0 : _a.length) || 0);
            if (r.courseId)
                byStudent[id].courses.add(r.courseId);
        });
        return Object.entries(byStudent).map(([kidId, info]) => {
            var _a;
            return ({
                name: ((_a = students.find(s => s.id === kidId)) === null || _a === void 0 ? void 0 : _a.name) || 'Unknown',
                mastery: info.mastery,
                topicsCompleted: info.topics,
                courses: Array.from(info.courses).map(cid => { var _a; return ((_a = courses.find(c => c.id === cid)) === null || _a === void 0 ? void 0 : _a.title) || cid; })
            });
        }).sort((a, b) => b.mastery - a.mastery).slice(0, 10);
    }, [reports, students, courses]);
    // Inactive parents (no sessions in 30 days)
    const inactiveParents = useMemo(() => {
        const cutoff = Date.now() - 30 * msPerDay;
        const parentMap = {};
        users.filter(u => { var _a; return (_a = u.roles) === null || _a === void 0 ? void 0 : _a.includes('parent'); }).forEach(p => parentMap[p.id] = { lastSession: null });
        sessions.forEach(s => {
            const ts = s.date ? (s.date.toDate ? s.date.toDate().getTime() : new Date(s.date).getTime()) : 0;
            if (!s.parentId)
                return;
            const entry = parentMap[s.parentId];
            if (!entry) {
                parentMap[s.parentId] = { lastSession: ts };
            }
            else {
                if (!entry.lastSession || ts > entry.lastSession)
                    entry.lastSession = ts;
            }
        });
        return Object.entries(parentMap).map(([pid, v]) => {
            var _a, _b;
            return ({
                parent: ((_a = users.find(u => u.id === pid)) === null || _a === void 0 ? void 0 : _a.displayName) || 'Unknown',
                lastSession: v.lastSession ? new Date(v.lastSession).toISOString().slice(0, 10) : 'Never',
                daysInactive: v.lastSession ? Math.floor((Date.now() - v.lastSession) / msPerDay) : null,
                contact: ((_b = users.find(u => u.id === pid)) === null || _b === void 0 ? void 0 : _b.phone) || ''
            });
        }).filter(p => (p.daysInactive === null) || (p.daysInactive > 30)).slice(0, 20);
    }, [users, sessions]);
    // Teacher earnings breakdown
    const teacherEarnings = useMemo(() => {
        const teachers = users.filter(u => { var _a; return (_a = u.roles) === null || _a === void 0 ? void 0 : _a.includes('teacher'); });
        return teachers.map(t => {
            const tPayments = payments.filter(p => p.teacherId === t.id);
            const sessionsCount = sessions.filter(s => s.teacherId === t.id).length;
            const totalEarned = tPayments.reduce((s, p) => s + (p.amount || 0), 0);
            const pending = tPayments.filter(p => p.status !== 'paid').reduce((s, p) => s + (p.amount || 0), 0);
            const rate = sessionsCount ? Math.round(totalEarned / sessionsCount) : 0;
            return { teacher: t.displayName, sessions: sessionsCount, rate, totalEarned, pending };
        }).slice(0, 50);
    }, [users, payments, sessions]);
    // Exports
    const exportRecentEnrollmentsCSV = () => {
        const rows = [['Student name', 'Course', 'Parent', 'Teacher', 'Status', 'Date'], ...recentEnrollments.map(r => [r.student, r.course, r.parent, r.teacher, r.status, r.date])];
        exportToCSV('recent-enrollments.csv', rows);
    };
    const exportTeacherEarningsCSV = () => {
        const rows = [['Teacher', 'Sessions', 'Rate', 'Total Earned', 'Pending'], ...teacherEarnings.map(t => [t.teacher, t.sessions, t.rate, t.totalEarned, t.pending])];
        exportToCSV('teacher-earnings.csv', rows);
    };
    // Print / PDF (basic)
    const printDashboard = () => { window.print(); };
    return (_jsxs("div", { className: "p-6", children: [_jsx("h1", { className: "text-2xl font-bold mb-4", children: "Admin Analytics Dashboard" }), _jsxs("div", { className: "flex gap-4 mb-6 items-center", children: [_jsxs("div", { children: [_jsx("label", { className: "mr-2", children: "Date range:" }), _jsxs("select", { value: String(rangeDays), onChange: e => setRangeDays(e.target.value === 'all' ? 'all' : Number(e.target.value)), className: "border p-1 rounded", children: [_jsx("option", { value: 7, children: "Last 7 days" }), _jsx("option", { value: 30, children: "Last 30 days" }), _jsx("option", { value: 90, children: "Last 90 days" }), _jsx("option", { value: 'all', children: "All time" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "mr-2", children: "By area:" }), _jsxs("select", { value: areaFilter, onChange: e => setAreaFilter(e.target.value), className: "border p-1 rounded", children: [_jsx("option", { children: "All" }), _jsx("option", { children: "Phonics" }), _jsx("option", { children: "Grammar" }), _jsx("option", { children: "Speaking" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "mr-2", children: "By teacher:" }), _jsxs("select", { value: teacherFilter || '', onChange: e => setTeacherFilter(e.target.value || null), className: "border p-1 rounded", children: [_jsx("option", { value: "", children: "All" }), users.filter(u => { var _a; return (_a = u.roles) === null || _a === void 0 ? void 0 : _a.includes('teacher'); }).map(t => (_jsx("option", { value: t.id, children: t.displayName }, t.id)))] })] }), _jsxs("div", { className: "ml-auto flex gap-2", children: [_jsx("button", { onClick: exportRecentEnrollmentsCSV, className: "bg-slate-700 text-white px-3 py-1 rounded", children: "Export Enrollments CSV" }), _jsx("button", { onClick: exportTeacherEarningsCSV, className: "bg-slate-700 text-white px-3 py-1 rounded", children: "Export Earnings CSV" }), _jsx("button", { onClick: printDashboard, className: "bg-slate-500 text-white px-3 py-1 rounded", children: "Print / Save PDF" })] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-4 mb-6", children: [_jsxs("div", { className: "border rounded p-4", children: [_jsx("div", { className: "text-sm text-gray-500", children: "Total Users" }), _jsxs("div", { className: "text-xl font-bold", children: [metrics.totalUsers, " total users"] }), _jsxs("div", { className: "text-sm text-gray-600 mt-2", children: [metrics.totals.admins, " admins \u2022 ", metrics.totals.teachers, " teachers \u2022 ", metrics.totals.parents, " parents \u2022 ", metrics.totals.lps, " LPs"] })] }), _jsxs("div", { className: "border rounded p-4", children: [_jsx("div", { className: "text-sm text-gray-500", children: "Student Enrollment" }), _jsxs("div", { className: "text-xl font-bold", children: [metrics.studentCount, " students"] }), _jsxs("div", { className: "text-sm text-gray-600 mt-2", children: [metrics.activeEnrollments, " active enrollments \u2022 ", metrics.assignedTeachers, " with teachers \u2022 ", metrics.assignedLPs, " with LPs"] })] }), _jsxs("div", { className: "border rounded p-4", children: [_jsx("div", { className: "text-sm text-gray-500", children: "Revenue (this month)" }), _jsxs("div", { className: "text-xl font-bold", children: ["\u20B9", metrics.revenueThisMonth] }), _jsxs("div", { className: "text-sm text-gray-600 mt-2", children: [metrics.sessionsCompleted, " sessions completed \u2022 Avg \u20B9", metrics.avgPerSession, " / session"] })] }), _jsxs("div", { className: "border rounded p-4", children: [_jsx("div", { className: "text-sm text-gray-500", children: "Course Coverage" }), _jsxs("div", { className: "text-xl font-bold", children: [metrics.courseCount, " courses"] }), _jsxs("div", { className: "text-sm text-gray-600 mt-2", children: [metrics.topicsTotal, " topics \u2022 ", metrics.topicsTaught, " topics taught"] })] })] }), fsError && _jsx("div", { className: "text-sm text-red-600 mb-4", children: fsError }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6", children: [_jsxs("div", { className: "border rounded p-4", children: [_jsx("h3", { className: "font-semibold mb-2", children: "Enrollments by Status" }), _jsx("div", { className: "w-full min-w-0", style: { height: 240 }, children: Recharts ? (
                                // @ts-ignore
                                _jsx(Recharts.ResponsiveContainer, { width: "100%", height: 240, children: _jsxs(Recharts.PieChart, { children: [_jsx(Recharts.Pie, { data: [{ name: 'PendingTeacher', value: enrollmentStatus.pendingTeacher }, { name: 'PendingLP', value: enrollmentStatus.pendingLP }, { name: 'Active', value: enrollmentStatus.active }, { name: 'Completed', value: enrollmentStatus.completed }, { name: 'Cancelled', value: enrollmentStatus.cancelled }], dataKey: "value", nameKey: "name", outerRadius: 80, fill: "#8884d8", children: Object.values(enrollmentStatus).map((_, i) => (
                                                // @ts-ignore
                                                _jsx(Recharts.Cell, { fill: ["#FFB020", "#FF7262", "#4CAF50", "#3B82F6", "#9CA3AF"][i] }, `cell-${i}`))) }), _jsx(Recharts.Legend, {})] }) })) : (_jsxs("div", { className: "text-sm text-gray-500", children: ["Chart library not available. Install ", _jsx("code", { children: "recharts" }), " to view charts."] })) })] }), _jsxs("div", { className: "border rounded p-4", children: [_jsx("h3", { className: "font-semibold mb-2", children: "Revenue by Course" }), _jsx("div", { className: "w-full min-w-0", style: { height: 240 }, children: Recharts ? (
                                // @ts-ignore
                                _jsx(Recharts.ResponsiveContainer, { width: "100%", height: 240, children: _jsxs(Recharts.BarChart, { data: revenueByCourse, children: [_jsx(Recharts.XAxis, { dataKey: "course" }), _jsx(Recharts.YAxis, {}), _jsx(Recharts.Tooltip, {}), _jsx(Recharts.Bar, { dataKey: "amt", fill: "#4CAF50" })] }) })) : (_jsx("div", { className: "text-sm text-gray-500", children: "Chart library not available." })) })] }), _jsxs("div", { className: "border rounded p-4", children: [_jsx("h3", { className: "font-semibold mb-2", children: "Student Mastery Distribution" }), _jsx("div", { className: "w-full min-w-0", style: { height: 240 }, children: Recharts ? (
                                // @ts-ignore
                                _jsx(Recharts.ResponsiveContainer, { width: "100%", height: 240, children: _jsxs(Recharts.BarChart, { data: masteryDistribution, children: [_jsx(Recharts.XAxis, { dataKey: "label" }), _jsx(Recharts.YAxis, {}), _jsx(Recharts.Tooltip, {}), _jsx(Recharts.Bar, { dataKey: "count", fill: "#3B82F6" })] }) })) : _jsx("div", { className: "text-sm text-gray-500", children: "Chart library not available." }) })] })] }), _jsxs("div", { className: "mt-6 border rounded p-4", children: [_jsxs("h3", { className: "font-semibold mb-2", children: ["Sessions Trend (", Array.isArray(sessionsTrend) && sessionsTrend.length, " days)"] }), _jsx("div", { className: "w-full min-w-0", style: { height: 260 }, children: Recharts ? (
                        // @ts-ignore
                        _jsx(Recharts.ResponsiveContainer, { width: "100%", height: 260, children: _jsxs(Recharts.LineChart, { data: sessionsTrend, children: [_jsx(Recharts.XAxis, { dataKey: "date" }), _jsx(Recharts.YAxis, {}), _jsx(Recharts.Tooltip, {}), _jsx(Recharts.Line, { type: "monotone", dataKey: "count", stroke: "#8884d8", strokeWidth: 2, dot: false })] }) })) : _jsx("div", { className: "text-sm text-gray-500", children: "Chart library not available." }) })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6", children: [_jsxs("div", { className: "col-span-2 border rounded p-4", children: [_jsx("h3", { className: "font-semibold mb-2", children: "Teacher Performance" }), _jsxs("table", { className: "w-full text-sm border-collapse table-auto", children: [_jsx("thead", { children: _jsxs("tr", { className: "text-left", children: [_jsx("th", { className: "p-2", children: "Teacher" }), _jsx("th", { className: "p-2", children: "Sessions Completed" }), _jsx("th", { className: "p-2", children: "Avg Mastery" }), _jsx("th", { className: "p-2", children: "Earnings" })] }) }), _jsx("tbody", { children: teacherPerformance.map(tp => (_jsxs("tr", { className: "border-t", children: [_jsx("td", { className: "p-2", children: tp.name }), _jsx("td", { className: "p-2", children: tp.sessionsCompleted }), _jsxs("td", { className: "p-2", children: [tp.avgMastery, "%"] }), _jsxs("td", { className: "p-2", children: ["\u20B9", tp.earnings] })] }, tp.teacherId))) })] })] }), _jsxs("div", { className: "border rounded p-4", children: [_jsx("h3", { className: "font-semibold mb-2", children: "Busiest Days" }), Recharts ? (
                            // @ts-ignore
                            _jsx(Recharts.ResponsiveContainer, { width: "100%", height: 220, children: _jsxs(Recharts.BarChart, { data: busiestDays, children: [_jsx(Recharts.XAxis, { dataKey: "day" }), _jsx(Recharts.YAxis, {}), _jsx(Recharts.Bar, { dataKey: "count", fill: "#FFB020" })] }) })) : _jsx("div", { className: "text-sm text-gray-500", children: "Chart library not available." })] })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6", children: [_jsxs("div", { className: "border rounded p-4", children: [_jsx("h3", { className: "font-semibold mb-2", children: "Recent Enrollments" }), _jsxs("table", { className: "w-full text-sm table-auto", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { className: "p-2", children: "Student" }), _jsx("th", { className: "p-2", children: "Course" }), _jsx("th", { className: "p-2", children: "Parent" }), _jsx("th", { className: "p-2", children: "Teacher" }), _jsx("th", { className: "p-2", children: "Status" }), _jsx("th", { className: "p-2", children: "Date" })] }) }), _jsx("tbody", { children: recentEnrollments.map((r, i) => (_jsxs("tr", { className: "border-t", children: [_jsx("td", { className: "p-2", children: r.student }), _jsx("td", { className: "p-2", children: r.course }), _jsx("td", { className: "p-2", children: r.parent }), _jsx("td", { className: "p-2", children: r.teacher }), _jsx("td", { className: "p-2", children: r.status }), _jsx("td", { className: "p-2", children: r.date })] }, i))) })] })] }), _jsxs("div", { className: "border rounded p-4", children: [_jsx("h3", { className: "font-semibold mb-2", children: "Top Performing Students" }), _jsxs("table", { className: "w-full text-sm table-auto", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { className: "p-2", children: "Student" }), _jsx("th", { className: "p-2", children: "Mastery %" }), _jsx("th", { className: "p-2", children: "Topics Completed" }), _jsx("th", { className: "p-2", children: "Courses" })] }) }), _jsx("tbody", { children: topStudents.map((s, i) => (_jsxs("tr", { className: "border-t", children: [_jsx("td", { className: "p-2", children: s.name }), _jsxs("td", { className: "p-2", children: [s.mastery, "%"] }), _jsx("td", { className: "p-2", children: s.topicsCompleted }), _jsx("td", { className: "p-2", children: (s.courses || []).join(', ') })] }, i))) })] })] })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6", children: [_jsxs("div", { className: "border rounded p-4", children: [_jsx("h3", { className: "font-semibold mb-2", children: "Inactive Parents (30+ days)" }), _jsxs("table", { className: "w-full text-sm table-auto", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { className: "p-2", children: "Parent" }), _jsx("th", { className: "p-2", children: "Last session" }), _jsx("th", { className: "p-2", children: "Days inactive" }), _jsx("th", { className: "p-2", children: "Contact" })] }) }), _jsx("tbody", { children: inactiveParents.map((p, i) => (_jsxs("tr", { className: "border-t", children: [_jsx("td", { className: "p-2", children: p.parent }), _jsx("td", { className: "p-2", children: p.lastSession }), _jsx("td", { className: "p-2", children: p.daysInactive === null ? 'Never' : p.daysInactive }), _jsx("td", { className: "p-2", children: p.contact })] }, i))) })] })] }), _jsxs("div", { className: "border rounded p-4", children: [_jsx("h3", { className: "font-semibold mb-2", children: "Teacher Earnings Breakdown" }), _jsxs("table", { className: "w-full text-sm table-auto", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { className: "p-2", children: "Teacher" }), _jsx("th", { className: "p-2", children: "Sessions" }), _jsx("th", { className: "p-2", children: "Rate" }), _jsx("th", { className: "p-2", children: "Total Earned" }), _jsx("th", { className: "p-2", children: "Pending" })] }) }), _jsx("tbody", { children: teacherEarnings.map((t, i) => (_jsxs("tr", { className: "border-t", children: [_jsx("td", { className: "p-2", children: t.teacher }), _jsx("td", { className: "p-2", children: t.sessions }), _jsxs("td", { className: "p-2", children: ["\u20B9", t.rate] }), _jsxs("td", { className: "p-2", children: ["\u20B9", t.totalEarned] }), _jsxs("td", { className: "p-2", children: ["\u20B9", t.pending] })] }, i))) })] })] })] })] }));
}
