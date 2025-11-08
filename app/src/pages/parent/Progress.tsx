import React, { useEffect, useState, useMemo } from "react";
import { useParams, Navigate } from "react-router-dom";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase";
import useParentChildren from "../../hooks/useParentChildren";
import type { Student, CurriculumTopic } from "../../types/models";
import { CURRICULUM } from "../../data/curriculum";
import { getStudentProgress } from "../../services/studentService";
import type { ProgressRecord } from "../../types/student";

function percent(val?: number) {
  return typeof val === "number" ? Math.round(val) : 0;
}

// colors for the three mastery areas (phonics, grammar, speaking)

const ProgressPage: React.FC = () => {
  const { sid } = useParams();
  const { children, loading: childrenLoading } = useParentChildren();
  const [student, setStudent] = useState<Student | null>(null);
  const [curriculum, setCurriculum] = useState<CurriculumTopic[]>([]);
  const [progressRecords, setProgressRecords] = useState<ProgressRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sid || childrenLoading) return;
    const child = children.find(c => c.sid === sid);
    if (!child) {
      setStudent(null);
      setLoading(false);
      return;
    }
    setStudent(child);
    setLoading(true);
    // Fetch curriculum topics and progress records
    Promise.all([
      getDocs(collection(db, `students/${sid}/curriculum`)),
      getStudentProgress(sid),
    ])
      .then(([currSnap, progress]) => {
        setCurriculum(currSnap.docs.map(doc => ({ topicId: doc.id, ...doc.data() } as CurriculumTopic)));
        setProgressRecords(progress || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading curriculum or progress:', err);
        setLoading(false);
      });
  }, [sid, children, childrenLoading]);

  if (childrenLoading || loading) return <div className="p-8 text-center text-gray-500">Loading progress…</div>;
  if (!student) return <Navigate to="/parent/children" replace />;

  const summary = student.summary || {};

  const trackProgress = useMemo(() => {
    // Build progress summary per curriculum track/level using CURRICULUM and progressRecords
    const map: Record<string, {
      levelId: string;
      levelTitle: string;
      totalSkills: number;
      mastered: number;
      percent: number;
    }[]> = {};

    CURRICULUM.forEach((track) => {
      const arr: any[] = [];
      track.levels.forEach((level) => {
        // collect all skill ids under this level
        const skillIds = level.units.flatMap(u => u.skills.map(s => s.id));
        const total = skillIds.length;
        const mastered = skillIds.filter(id => progressRecords.find(p => p.topicId === id && p.masteryLevel === 'mastered')).length;
        const percent = total === 0 ? 0 : Math.round((mastered / total) * 100);
        arr.push({ levelId: level.id, levelTitle: level.title, totalSkills: total, mastered, percent });
      });
      map[track.id] = arr;
    });
    return map;
  }, [progressRecords]);


  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">{student.name} — Progress Report</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-purple-50 rounded-xl p-4 border">
          <div className="font-semibold mb-2">Phonics Mastery</div>
          <div className="w-full h-4 bg-gray-200 rounded-full mb-2">
            <div className="h-4 rounded-full bg-purple-600" style={{ width: `${percent(summary.phonicsMastery)}%` }}></div>
          </div>
          <div className="text-xs text-gray-600">{percent(summary.phonicsMastery)}%</div>
        </div>
        <div className="bg-blue-50 rounded-xl p-4 border">
          <div className="font-semibold mb-2">Grammar Mastery</div>
          <div className="w-full h-4 bg-gray-200 rounded-full mb-2">
            <div className="h-4 rounded-full bg-blue-500" style={{ width: `${percent(summary.grammarMastery)}%` }}></div>
          </div>
          <div className="text-xs text-gray-600">{percent(summary.grammarMastery)}%</div>
        </div>
        <div className="bg-green-50 rounded-xl p-4 border">
          <div className="font-semibold mb-2">Speaking Mastery</div>
          <div className="w-full h-4 bg-gray-200 rounded-full mb-2">
            <div className="h-4 rounded-full bg-green-500" style={{ width: `${percent(summary.speakingMastery)}%` }}></div>
          </div>
          <div className="text-xs text-gray-600">{percent(summary.speakingMastery)}%</div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl p-4 border">
          <div className="font-semibold mb-1">Streak Days</div>
          <div className="text-2xl text-purple-700 font-bold">{summary.streakDays ?? 0}</div>
        </div>
        <div className="bg-white rounded-xl p-4 border">
          <div className="font-semibold mb-1">Weekly Practice Minutes</div>
          <div className="text-2xl text-blue-700 font-bold">{summary.weeklyMinutes ?? 0}</div>
        </div>
      </div>
      <h2 className="text-lg font-semibold mb-3">Curriculum Progress</h2>
      {progressRecords.length === 0 ? (
        <div className="bg-gray-50 rounded-xl p-6 border text-center text-gray-600 mb-6">No progress recorded yet. Once teachers log evidence, you’ll see skill-level mastery here.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {CURRICULUM.map((track, idx) => (
            <div key={track.id} className="bg-white rounded-xl p-4 border">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-gray-700">{track.title}</div>
                  <div className="text-xs text-gray-500">{track.ageRange}</div>
                </div>
                <div className="text-sm font-bold text-indigo-600">{/* overall percent per track */}</div>
              </div>
              <div className="mt-4 space-y-3">
                {(trackProgress[track.id] || []).map((lvl) => (
                  <div key={lvl.levelId}>
                    <div className="flex items-center justify-between text-sm">
                      <div className="font-medium text-gray-700">{lvl.levelTitle}</div>
                      <div className="text-xs text-gray-500">{lvl.percent}%</div>
                    </div>
                    <div className="w-full h-3 bg-gray-200 rounded-full mt-2">
                      <div className={`h-3 rounded-full ${idx === 0 ? 'bg-purple-600' : idx === 1 ? 'bg-blue-500' : 'bg-green-500'}`} style={{ width: `${lvl.percent}%` }}></div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{lvl.mastered} of {lvl.totalSkills} skills mastered</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      <h2 className="text-lg font-semibold mb-3">Curriculum Topics</h2>
      {curriculum.length === 0 ? (
        <div className="bg-gray-50 rounded-xl p-6 border text-center text-gray-600">No curriculum topics found.</div>
      ) : (
        <table className="w-full text-sm border rounded-xl overflow-hidden">
          <thead className="bg-purple-100">
            <tr>
              <th className="p-2 text-left">Title</th>
              <th className="p-2 text-left">Status</th>
              <th className="p-2 text-left">Last Updated</th>
              <th className="p-2 text-left">Completed</th>
              <th className="p-2 text-left">Teacher Note</th>
            </tr>
          </thead>
          <tbody>
            {curriculum.map(topic => (
              <tr key={topic.topicId} className="border-b">
                <td className="p-2">{topic.title}</td>
                <td className="p-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${topic.status === "completed" ? "bg-green-100 text-green-700" : topic.status === "in_progress" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"}`}>{topic.status.replace("_", " ")}</span>
                </td>
                <td className="p-2">{topic.updatedAt?.toDate ? topic.updatedAt.toDate().toLocaleDateString() : "-"}</td>
                <td className="p-2">{(topic as any).completedDate ? ((topic as any).completedDate?.toDate ? (topic as any).completedDate.toDate().toLocaleDateString() : new Date(String((topic as any).completedDate)).toLocaleDateString()) : '-'}</td>
                <td className="p-2">{topic.teacherNote || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ProgressPage;
