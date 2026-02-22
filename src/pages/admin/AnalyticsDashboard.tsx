import React, { useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebaseConfig';

// Lightweight helpers for export
function exportToCSV(filename: string, rows: string[][]) {
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
function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export default function AnalyticsDashboard(): JSX.Element {
  // Raw data
  const [users, setUsers] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [fsError, setFsError] = useState<string | null>(null);

  // Filters
  const [rangeDays, setRangeDays] = useState<number | 'all'>(30);
  const [areaFilter, setAreaFilter] = useState<string>('All');
  const [teacherFilter, setTeacherFilter] = useState<string | null>(null);

  // dynamic import for charts (optional)
  const [Recharts, setRecharts] = useState<any>(null);
  useEffect(() => {
    let mounted = true;
    import('recharts')
      .then(mod => { if (mounted) setRecharts(mod); })
      .catch(() => { /* optional: library missing */ });
    return () => { mounted = false; };
  }, []);

  // Firestore subscriptions (real-time)
  useEffect(() => {
    const onErr = (err: any) => setFsError(err?.message || 'Permission denied or unavailable.');
    const unsubUsers = onSnapshot(collection(db, 'users'), snap => setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() }))), onErr);
    const unsubStudents = onSnapshot(collection(db, 'kids'), snap => setStudents(snap.docs.map(d => ({ id: d.id, ...d.data() }))), onErr);
    const unsubEnroll = onSnapshot(collection(db, 'enrollments'), snap => setEnrollments(snap.docs.map(d => ({ id: d.id, ...d.data() }))), onErr);
    const unsubSessions = onSnapshot(
      collection(db, 'classSessions'),
      snap => setSessions(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      onErr
    );
    const unsubPayments = onSnapshot(collection(db, 'payments'), snap => setPayments(snap.docs.map(d => ({ id: d.id, ...d.data() }))), onErr);
    const unsubCourses = onSnapshot(collection(db, 'courses'), snap => setCourses(snap.docs.map(d => ({ id: d.id, ...d.data() }))), onErr);
    const unsubReports = onSnapshot(collection(db, 'reports'), snap => setReports(snap.docs.map(d => ({ id: d.id, ...d.data() }))), onErr);

    return () => {
      unsubUsers(); unsubStudents(); unsubEnroll(); unsubSessions(); unsubPayments(); unsubCourses(); unsubReports();
    };
  }, []);

  // Derived metrics
  const metrics = useMemo(() => {
    const totals = { admins: 0, teachers: 0, parents: 0, lps: 0 };
    users.forEach(u => {
      const roles = u.roles || [];
      if (roles.includes('admin')) totals.admins++;
      if (roles.includes('teacher')) totals.teachers++;
      if (roles.includes('parent')) totals.parents++;
      if (roles.includes('learningPartner')) totals.lps++;
    });

    const totalUsers = users.length;

    const studentCount = students.length;
    const activeEnrollments = enrollments.filter(e => e.status === 'active' || e.status === 'ongoing').length;
    const assignedTeachers = enrollments.filter(e => e.teacherId).length;
    const assignedLPs = enrollments.filter(e => e.lpId).length;

    const revenueThisMonth = payments
      .filter(p => {
        if (!p.createdAt) return false;
        const d = p.createdAt.toDate ? p.createdAt.toDate() : new Date(p.createdAt);
        const start = new Date(); start.setDate(1); start.setHours(0,0,0,0);
        return d >= start;
      })
      .reduce((s, p) => s + (p.amount || 0), 0);

    const sessionsCompleted = sessions.filter(s => s.status === 'completed').length;
    const avgPerSession = sessionsCompleted ? Math.round(revenueThisMonth / sessionsCompleted) : 0;

    const courseCount = courses.length;
    const topicsTotal = courses.reduce((acc, c) => acc + (c.topics?.length || 0), 0);
    const topicsTaught = reports.reduce((acc, r) => acc + (r.topicsCovered?.length || 0), 0);

    return {
      totals, totalUsers,
      studentCount, activeEnrollments, assignedTeachers, assignedLPs,
      revenueThisMonth, sessionsCompleted, avgPerSession,
      courseCount, topicsTotal, topicsTaught
    };
  }, [users, students, enrollments, payments, sessions, courses, reports]);

  // Enrollment status counts
  const enrollmentStatus = useMemo(() => {
    const counts: Record<string, number> = { pendingTeacher: 0, pendingLP: 0, active: 0, completed: 0, cancelled: 0 };
    enrollments.forEach(e => {
      const s = e.status || 'pending';
      if (s === 'pendingTeacher') counts.pendingTeacher++;
      else if (s === 'pendingLP') counts.pendingLP++;
      else if (s === 'active' || s === 'ongoing') counts.active++;
      else if (s === 'completed') counts.completed++;
      else if (s === 'cancelled') counts.cancelled++;
    });
    return counts;
  }, [enrollments]);

  // Revenue by course
  const revenueByCourse = useMemo(() => {
    const map: Record<string, number> = {};
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
    const latestPerStudent: Record<string, number> = {};
    reports.forEach(r => {
      if (!r.kidId) return;
      const m = r.masteryPercent || 0;
      if (!latestPerStudent[r.kidId] || (r.updatedAt && r.updatedAt > (latestPerStudent[r.kidId] as any))) {
        latestPerStudent[r.kidId] = m;
      }
    });
    Object.values(latestPerStudent).forEach((m: number) => {
      if (m <= 25) buckets['0-25']++;
      else if (m <= 50) buckets['25-50']++;
      else if (m <= 75) buckets['50-75']++;
      else buckets['75-100']++;
    });
    return Object.entries(buckets).map(([label, count]) => ({ label, count }));
  }, [reports]);

  // Sessions trend last 30 days
  const sessionsTrend = useMemo(() => {
    const days = (rangeDays === 'all') ? 90 : (typeof rangeDays === 'number' ? rangeDays : 30);
    const result: { date: string; count: number }[] = [];
    const start = startOfDay(new Date(Date.now() - (days - 1) * msPerDay));
    for (let i = 0; i < days; i++) {
      const d = new Date(start.getTime() + i * msPerDay);
      result.push({ date: d.toISOString().slice(0, 10), count: 0 });
    }
    sessions.forEach(s => {
      if (!s.date) return;
      const d = s.date.toDate ? s.date.toDate() : new Date(s.date);
      const iso = startOfDay(d).toISOString().slice(0, 10);
      const row = result.find(r => r.date === iso);
      if (row) row.count++;
    });
    return result;
  }, [sessions, rangeDays]);

  // Teacher performance table
  const teacherPerformance = useMemo(() => {
    const teachers = users.filter(u => u.roles?.includes('teacher'));
    return teachers.map(t => {
      const teacherSessions = sessions.filter(s => s.teacherId === t.id && s.status === 'completed').length;
      const studentIds = enrollments.filter(e => e.teacherId === t.id).map(e => e.kidId);
      const avgMastery = studentIds.length ? Math.round((studentIds.reduce((sum, kidId) => {
        const r = reports.filter(rep => rep.kidId === kidId).slice(-1)[0];
        return sum + (r?.masteryPercent || 0);
      }, 0) / studentIds.length)) : 0;
      const earnings = payments.filter(p => p.teacherId === t.id).reduce((s, p) => s + (p.amount || 0), 0);
      return { name: t.displayName, teacherId: t.id, sessionsCompleted: teacherSessions, avgMastery, earnings };
    });
  }, [users, sessions, enrollments, reports, payments]);

  // Busiest days (sessions by day of week)
  const busiestDays = useMemo(() => {
    const days: Record<string, number> = { Sun:0, Mon:0, Tue:0, Wed:0, Thu:0, Fri:0, Sat:0 };
    sessions.forEach(s => {
      if (!s.date) return;
      const d = s.date.toDate ? s.date.toDate() : new Date(s.date);
      const name = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()];
      days[name]++;
    });
    return Object.entries(days).map(([day, count]) => ({ day, count }));
  }, [sessions]);

  // Recent enrollments
  const recentEnrollments = useMemo(() => {
    return enrollments
      .slice()
      .sort((a,b) => (b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt)).getTime() - (a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt)).getTime())
      .slice(0, 10)
      .map(e => ({
        student: students.find(s => s.id === e.kidId)?.name || 'Unknown',
        course: courses.find(c => c.id === e.courseId)?.title || e.course || 'Unknown',
        parent: users.find(u => u.id === e.parentId)?.displayName || 'Unknown',
        teacher: users.find(u => u.id === e.teacherId)?.displayName || 'Unassigned',
        status: e.status,
        date: e.createdAt ? (e.createdAt.toDate ? e.createdAt.toDate().toISOString().slice(0,10) : new Date(e.createdAt).toISOString().slice(0,10)) : ''
      }));
  }, [enrollments, students, users, courses]);

  // Top performing students
  const topStudents = useMemo(() => {
    const byStudent: Record<string, { mastery:number; topics:number; courses:Set<string> }> = {};
    reports.forEach(r => {
      const id = r.kidId; if (!id) return;
      byStudent[id] = byStudent[id] || { mastery: 0, topics: 0, courses: new Set() };
      byStudent[id].mastery = Math.max(byStudent[id].mastery, r.masteryPercent || 0);
      byStudent[id].topics += (r.topicsCovered?.length || 0);
      if (r.courseId) byStudent[id].courses.add(r.courseId);
    });
    return Object.entries(byStudent).map(([kidId, info]) => ({
      name: students.find(s => s.id === kidId)?.name || 'Unknown',
      mastery: info.mastery,
      topicsCompleted: info.topics,
      courses: Array.from(info.courses).map(cid => courses.find(c => c.id===cid)?.title || cid)
    })).sort((a,b) => b.mastery - a.mastery).slice(0,10);
  }, [reports, students, courses]);

  // Inactive parents (no sessions in 30 days)
  const inactiveParents = useMemo(() => {
    const cutoff = Date.now() - 30 * msPerDay;
    const parentMap: Record<string, { lastSession:number | null }> = {};
    users.filter(u => u.roles?.includes('parent')).forEach(p => parentMap[p.id] = { lastSession: null });
    sessions.forEach(s => {
      const ts = s.date ? (s.date.toDate ? s.date.toDate().getTime() : new Date(s.date).getTime()) : 0;
      if (!s.parentId) return;
      const entry = parentMap[s.parentId];
      if (!entry) {
        parentMap[s.parentId] = { lastSession: ts };
      } else {
        if (!entry.lastSession || ts > entry.lastSession) entry.lastSession = ts;
      }
    });
    return Object.entries(parentMap).map(([pid, v]) => ({
      parent: users.find(u => u.id === pid)?.displayName || 'Unknown',
      lastSession: v.lastSession ? new Date(v.lastSession).toISOString().slice(0,10) : 'Never',
      daysInactive: v.lastSession ? Math.floor((Date.now() - v.lastSession)/msPerDay) : null,
      contact: users.find(u => u.id === pid)?.phone || ''
    })).filter(p => (p.daysInactive === null) || (p.daysInactive > 30)).slice(0, 20);
  }, [users, sessions]);

  // Teacher earnings breakdown
  const teacherEarnings = useMemo(() => {
    const teachers = users.filter(u => u.roles?.includes('teacher'));
    return teachers.map(t => {
      const tPayments = payments.filter(p => p.teacherId === t.id);
      const sessionsCount = sessions.filter(s => s.teacherId === t.id).length;
      const totalEarned = tPayments.reduce((s, p) => s + (p.amount || 0), 0);
      const pending = tPayments.filter(p => p.status !== 'paid').reduce((s,p) => s + (p.amount || 0), 0);
      const rate = sessionsCount ? Math.round(totalEarned / sessionsCount) : 0;
      return { teacher: t.displayName, sessions: sessionsCount, rate, totalEarned, pending };
    }).slice(0,50);
  }, [users, payments, sessions]);

  // Exports
  const exportRecentEnrollmentsCSV = () => {
    const rows = [['Student name','Course','Parent','Teacher','Status','Date'], ...recentEnrollments.map(r => [r.student, r.course, r.parent, r.teacher, r.status, r.date])];
    exportToCSV('recent-enrollments.csv', rows);
  };

  const exportTeacherEarningsCSV = () => {
    const rows = [['Teacher','Sessions','Rate','Total Earned','Pending'], ...teacherEarnings.map(t => [t.teacher, t.sessions, t.rate, t.totalEarned, t.pending])];
    exportToCSV('teacher-earnings.csv', rows);
  };

  // Print / PDF (basic)
  const printDashboard = () => { window.print(); };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Admin Analytics Dashboard</h1>

      {/* Filters */}
      <div className="flex gap-4 mb-6 items-center">
        <div>
          <label className="mr-2">Date range:</label>
          <select value={String(rangeDays)} onChange={e => setRangeDays(e.target.value === 'all' ? 'all' : Number(e.target.value))} className="border p-1 rounded">
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
            <option value={'all'}>All time</option>
          </select>
        </div>
        <div>
          <label className="mr-2">By area:</label>
          <select value={areaFilter} onChange={e => setAreaFilter(e.target.value)} className="border p-1 rounded">
            <option>All</option>
            <option>Phonics</option>
            <option>Grammar</option>
            <option>Speaking</option>
          </select>
        </div>
        <div>
          <label className="mr-2">By teacher:</label>
          <select value={teacherFilter || ''} onChange={e => setTeacherFilter(e.target.value || null)} className="border p-1 rounded">
            <option value="">All</option>
            {users.filter(u => u.roles?.includes('teacher')).map(t => (
              <option key={t.id} value={t.id}>{t.displayName}</option>
            ))}
          </select>
        </div>

        <div className="ml-auto flex gap-2">
          <button onClick={exportRecentEnrollmentsCSV} className="bg-slate-700 text-white px-3 py-1 rounded">Export Enrollments CSV</button>
          <button onClick={exportTeacherEarningsCSV} className="bg-slate-700 text-white px-3 py-1 rounded">Export Earnings CSV</button>
          <button onClick={printDashboard} className="bg-slate-500 text-white px-3 py-1 rounded">Print / Save PDF</button>
        </div>
      </div>

      {/* Top metric cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="border rounded p-4">
          <div className="text-sm text-gray-500">Total Users</div>
          <div className="text-xl font-bold">{metrics.totalUsers} total users</div>
          <div className="text-sm text-gray-600 mt-2">{metrics.totals.admins} admins • {metrics.totals.teachers} teachers • {metrics.totals.parents} parents • {metrics.totals.lps} LPs</div>
        </div>

        <div className="border rounded p-4">
          <div className="text-sm text-gray-500">Student Enrollment</div>
          <div className="text-xl font-bold">{metrics.studentCount} students</div>
          <div className="text-sm text-gray-600 mt-2">{metrics.activeEnrollments} active enrollments • {metrics.assignedTeachers} with teachers • {metrics.assignedLPs} with LPs</div>
        </div>

        <div className="border rounded p-4">
          <div className="text-sm text-gray-500">Revenue (this month)</div>
          <div className="text-xl font-bold">₹{metrics.revenueThisMonth}</div>
          <div className="text-sm text-gray-600 mt-2">{metrics.sessionsCompleted} sessions completed • Avg ₹{metrics.avgPerSession} / session</div>
        </div>

        <div className="border rounded p-4">
          <div className="text-sm text-gray-500">Course Coverage</div>
          <div className="text-xl font-bold">{metrics.courseCount} courses</div>
          <div className="text-sm text-gray-600 mt-2">{metrics.topicsTotal} topics • {metrics.topicsTaught} topics taught</div>
        </div>
      </div>

      {fsError && <div className="text-sm text-red-600 mb-4">{fsError}</div>}

      {/* Charts area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="border rounded p-4">
          <h3 className="font-semibold mb-2">Enrollments by Status</h3>
          <div className="w-full min-w-0" style={{ height: 240 }}>
            {Recharts ? (
              // @ts-ignore
              <Recharts.ResponsiveContainer width="100%" height={240}>
                {/* @ts-ignore */}
                <Recharts.PieChart>
                  {/* @ts-ignore */}
                  <Recharts.Pie data={[{ name: 'PendingTeacher', value: enrollmentStatus.pendingTeacher }, { name: 'PendingLP', value: enrollmentStatus.pendingLP }, { name: 'Active', value: enrollmentStatus.active }, { name: 'Completed', value: enrollmentStatus.completed }, { name: 'Cancelled', value: enrollmentStatus.cancelled }]} dataKey="value" nameKey="name" outerRadius={80} fill="#8884d8">
                    {/* @ts-ignore */}
                    {Object.values(enrollmentStatus).map((_, i) => (
                      // @ts-ignore
                      <Recharts.Cell key={`cell-${i}`} fill={["#FFB020","#FF7262","#4CAF50","#3B82F6","#9CA3AF"][i]} />
                    ))}
                  </Recharts.Pie>
                  {/* @ts-ignore */}
                  <Recharts.Legend />
                </Recharts.PieChart>
              </Recharts.ResponsiveContainer>
            ) : (
              <div className="text-sm text-gray-500">Chart library not available. Install <code>recharts</code> to view charts.</div>
            )}
          </div>
        </div>

        <div className="border rounded p-4">
          <h3 className="font-semibold mb-2">Revenue by Course</h3>
          <div className="w-full min-w-0" style={{ height: 240 }}>
            {Recharts ? (
              // @ts-ignore
              <Recharts.ResponsiveContainer width="100%" height={240}>
                {/* @ts-ignore */}
                <Recharts.BarChart data={revenueByCourse}>
                  {/* @ts-ignore */}
                  <Recharts.XAxis dataKey="course" />
                  {/* @ts-ignore */}
                  <Recharts.YAxis />
                  {/* @ts-ignore */}
                  <Recharts.Tooltip />
                  {/* @ts-ignore */}
                  <Recharts.Bar dataKey="amt" fill="#4CAF50" />
                </Recharts.BarChart>
              </Recharts.ResponsiveContainer>
            ) : (
              <div className="text-sm text-gray-500">Chart library not available.</div>
            )}
          </div>
        </div>

        <div className="border rounded p-4">
          <h3 className="font-semibold mb-2">Student Mastery Distribution</h3>
          <div className="w-full min-w-0" style={{ height: 240 }}>
            {Recharts ? (
              // @ts-ignore
              <Recharts.ResponsiveContainer width="100%" height={240}>
                {/* @ts-ignore */}
                <Recharts.BarChart data={masteryDistribution}>
                  {/* @ts-ignore */}
                  <Recharts.XAxis dataKey="label" />
                  {/* @ts-ignore */}
                  <Recharts.YAxis />
                  {/* @ts-ignore */}
                  <Recharts.Tooltip />
                  {/* @ts-ignore */}
                  <Recharts.Bar dataKey="count" fill="#3B82F6" />
                </Recharts.BarChart>
              </Recharts.ResponsiveContainer>
            ) : <div className="text-sm text-gray-500">Chart library not available.</div>}
          </div>
        </div>
      </div>

      {/* Sessions trend */}
      <div className="mt-6 border rounded p-4">
        <h3 className="font-semibold mb-2">Sessions Trend ({Array.isArray(sessionsTrend) && sessionsTrend.length} days)</h3>
        <div className="w-full min-w-0" style={{ height: 260 }}>
          {Recharts ? (
            // @ts-ignore
            <Recharts.ResponsiveContainer width="100%" height={260}>
              {/* @ts-ignore */}
              <Recharts.LineChart data={sessionsTrend}>
                {/* @ts-ignore */}
                <Recharts.XAxis dataKey="date" />
                {/* @ts-ignore */}
                <Recharts.YAxis />
                {/* @ts-ignore */}
                <Recharts.Tooltip />
                {/* @ts-ignore */}
                <Recharts.Line type="monotone" dataKey="count" stroke="#8884d8" strokeWidth={2} dot={false} />
              </Recharts.LineChart>
            </Recharts.ResponsiveContainer>
          ) : <div className="text-sm text-gray-500">Chart library not available.</div>}
        </div>
      </div>

      {/* Teacher performance table and busiest days */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="col-span-2 border rounded p-4">
          <h3 className="font-semibold mb-2">Teacher Performance</h3>
          <table className="w-full text-sm border-collapse table-auto">
            <thead>
              <tr className="text-left">
                <th className="p-2">Teacher</th>
                <th className="p-2">Sessions Completed</th>
                <th className="p-2">Avg Mastery</th>
                <th className="p-2">Earnings</th>
              </tr>
            </thead>
            <tbody>
              {teacherPerformance.map(tp => (
                <tr key={tp.teacherId} className="border-t">
                  <td className="p-2">{tp.name}</td>
                  <td className="p-2">{tp.sessionsCompleted}</td>
                  <td className="p-2">{tp.avgMastery}%</td>
                  <td className="p-2">₹{tp.earnings}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border rounded p-4">
          <h3 className="font-semibold mb-2">Busiest Days</h3>
          {Recharts ? (
            // @ts-ignore
            <Recharts.ResponsiveContainer width="100%" height={220}>
              {/* @ts-ignore */}
              <Recharts.BarChart data={busiestDays}>
                {/* @ts-ignore */}
                <Recharts.XAxis dataKey="day" />
                {/* @ts-ignore */}
                <Recharts.YAxis />
                {/* @ts-ignore */}
                <Recharts.Bar dataKey="count" fill="#FFB020" />
              </Recharts.BarChart>
            </Recharts.ResponsiveContainer>
          ) : <div className="text-sm text-gray-500">Chart library not available.</div>}
        </div>
      </div>

      {/* Tables: Recent Enrollments, Top Students, Inactive Parents, Teacher Earnings Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="border rounded p-4">
          <h3 className="font-semibold mb-2">Recent Enrollments</h3>
          <table className="w-full text-sm table-auto">
            <thead>
              <tr>
                <th className="p-2">Student</th>
                <th className="p-2">Course</th>
                <th className="p-2">Parent</th>
                <th className="p-2">Teacher</th>
                <th className="p-2">Status</th>
                <th className="p-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {recentEnrollments.map((r, i) => (
                <tr key={i} className="border-t">
                  <td className="p-2">{r.student}</td>
                  <td className="p-2">{r.course}</td>
                  <td className="p-2">{r.parent}</td>
                  <td className="p-2">{r.teacher}</td>
                  <td className="p-2">{r.status}</td>
                  <td className="p-2">{r.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border rounded p-4">
          <h3 className="font-semibold mb-2">Top Performing Students</h3>
          <table className="w-full text-sm table-auto">
            <thead>
              <tr>
                <th className="p-2">Student</th>
                <th className="p-2">Mastery %</th>
                <th className="p-2">Topics Completed</th>
                <th className="p-2">Courses</th>
              </tr>
            </thead>
            <tbody>
              {topStudents.map((s, i) => (
                <tr key={i} className="border-t">
                  <td className="p-2">{s.name}</td>
                  <td className="p-2">{s.mastery}%</td>
                  <td className="p-2">{s.topicsCompleted}</td>
                  <td className="p-2">{(s.courses || []).join(', ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="border rounded p-4">
          <h3 className="font-semibold mb-2">Inactive Parents (30+ days)</h3>
          <table className="w-full text-sm table-auto">
            <thead>
              <tr>
                <th className="p-2">Parent</th>
                <th className="p-2">Last session</th>
                <th className="p-2">Days inactive</th>
                <th className="p-2">Contact</th>
              </tr>
            </thead>
            <tbody>
              {inactiveParents.map((p, i) => (
                <tr key={i} className="border-t">
                  <td className="p-2">{p.parent}</td>
                  <td className="p-2">{p.lastSession}</td>
                  <td className="p-2">{p.daysInactive === null ? 'Never' : p.daysInactive}</td>
                  <td className="p-2">{p.contact}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border rounded p-4">
          <h3 className="font-semibold mb-2">Teacher Earnings Breakdown</h3>
          <table className="w-full text-sm table-auto">
            <thead>
              <tr>
                <th className="p-2">Teacher</th>
                <th className="p-2">Sessions</th>
                <th className="p-2">Rate</th>
                <th className="p-2">Total Earned</th>
                <th className="p-2">Pending</th>
              </tr>
            </thead>
            <tbody>
              {teacherEarnings.map((t, i) => (
                <tr key={i} className="border-t">
                  <td className="p-2">{t.teacher}</td>
                  <td className="p-2">{t.sessions}</td>
                  <td className="p-2">₹{t.rate}</td>
                  <td className="p-2">₹{t.totalEarned}</td>
                  <td className="p-2">₹{t.pending}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
