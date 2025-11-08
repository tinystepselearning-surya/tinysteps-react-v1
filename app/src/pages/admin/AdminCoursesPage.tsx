import { useEffect, useState } from 'react';
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  addDoc,
  updateDoc,
  doc,
} from 'firebase/firestore';
import { db } from '../../firebase';
import { createAuditLog } from '../../services/adminService';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/ToastContext';

type CourseCategory = 'phonics' | 'grammar_writing' | 'public_speaking';

interface Course {
  id: string;
  title: string;
  category: CourseCategory;
  level?: string;
  sortOrder: number;
  active: boolean;
}

export default function AdminCoursesPage() {
  const { user, role, isAdmin, isRM } = useAuth();
  const { showToast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  const admin = isAdmin();
  const canView = admin || isRM() || role === 'learning-partner';

  useEffect(() => {
    if (!user) return;
    if (!canView) return;

    const q = query(
      collection(db, 'courses'),
      orderBy('sortOrder', 'asc')
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list: Course[] = snap.docs.map((d) => {
          const data: any = d.data();
          return {
            id: d.id,
            title: data.title,
            category: data.category,
            level: data.level,
            sortOrder: data.sortOrder ?? 999,
            active: data.active ?? true,
          };
        });
        setCourses(list);
        setLoading(false);
      },
      (err) => {
        console.error('Error loading courses', err);
        showToast({
          type: 'error',
          message: 'Unable to load courses. Check Firestore rules.',
        });
        setLoading(false);
      }
    );
    return () => unsub();
  }, [user, canView, showToast]);

  if (!user) {
    return (
      <div className="p-6 text-sm text-gray-600">
        Please sign in to view this page.
      </div>
    );
  }

  if (!canView) {
    return (
      <div className="p-6 text-sm text-red-500">
        You do not have permission to view the Courses admin page.
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <header className="flex items-baseline justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Courses Catalog</h1>
          <p className="text-xs text-gray-500">
            Central library used by Admin & Learning Partners to assign courses to students.
          </p>
        </div>
        {admin && (
          <NewCourseForm
            onCreated={() => {
              showToast({ type: 'success', message: 'Course added.' });
            }}
            actorId={user?.uid}
            actorName={user?.displayName ?? ''}
            actorRole={role ?? 'admin'}
          />
        )}
      </header>

      {loading ? (
        <div className="text-sm text-gray-500">Loading courses…</div>
      ) : courses.length === 0 ? (
        <div className="text-sm text-gray-500">
          No courses found. As admin, add the standard TinySteps courses above.
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-4">
          <CourseGroup
            label="Phonics Curriculum"
            courses={courses.filter((c) => c.category === 'phonics')}
            isAdmin={admin}
            actorId={user?.uid}
            actorName={user?.displayName ?? ''}
            actorRole={role ?? 'admin'}
          />
          <CourseGroup
            label="Grammar & Writing Curriculum"
            courses={courses.filter((c) => c.category === 'grammar_writing')}
            isAdmin={admin}
            actorId={user?.uid}
            actorName={user?.displayName ?? ''}
            actorRole={role ?? 'admin'}
          />
          <CourseGroup
            label="Public Speaking Curriculum"
            courses={courses.filter((c) => c.category === 'public_speaking')}
            isAdmin={admin}
            actorId={user?.uid}
            actorName={user?.displayName ?? ''}
            actorRole={role ?? 'admin'}
          />
        </div>
      )}
    </div>
  );
}

function CourseGroup({
  label,
  courses,
  isAdmin,
  actorId,
  actorName,
  actorRole,
}: {
  label: string;
  courses: Course[];
  isAdmin: boolean;
  actorId?: string | null;
  actorName?: string;
  actorRole?: string | null;
}) {
  const { showToast } = useToast();

  const toggleActive = async (course: Course) => {
    try {
      await updateDoc(doc(db, 'courses', course.id), {
        active: !course.active,
      });
      showToast({
        type: 'success',
        message: `${course.title} ${course.active ? 'disabled' : 'enabled'}.`,
      });
      // Audit log for toggle
      try {
        await createAuditLog({
          userId: actorId || '',
          userName: actorName || '',
          userRole: (actorRole as any) || ('admin' as any),
          action: ('course_toggle_active' as any),
          entityType: 'course',
          entityId: course.id,
          details: JSON.stringify({ to: !course.active })
        });
      } catch (e) {
        console.warn('Failed to write audit log for course toggle', e);
      }
    } catch (e) {
      console.error(e);
      showToast({
        type: 'error',
        message: 'Failed to update course.',
      });
    }
  };

  if (!courses.length) return null;

  return (
    <div className="p-4 bg-white rounded-2xl shadow-sm border border-gray-100">
      <h2 className="text-sm font-semibold text-gray-800 mb-2">{label}</h2>
      <div className="space-y-1 text-xs">
        {courses.map((c) => (
          <div
            key={c.id}
            className="flex items-center justify-between gap-2 px-2 py-1 rounded-xl bg-gray-50"
          >
            <div className="flex flex-col">
              <span className="font-medium text-gray-800">{c.title}</span>
              {c.level && (
                <span className="text-[10px] text-gray-500">Level: {c.level}</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span
                className={
                  'px-2 py-0.5 rounded-full text-[9px] ' +
                  (c.active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500')
                }
              >
                {c.active ? 'Active' : 'Inactive'}
              </span>
              {isAdmin && (
                <button
                  onClick={() => toggleActive(c)}
                  className="text-[9px] px-2 py-1 rounded-full border border-gray-300 text-gray-700 hover:bg-gray-100"
                >
                  {c.active ? 'Disable' : 'Enable'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function NewCourseForm({ onCreated, actorId, actorName, actorRole }: { onCreated: () => void; actorId?: string | null; actorName?: string; actorRole?: string | null; }) {
  const { showToast } = useToast();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<CourseCategory>('phonics');
  const [level, setLevel] = useState('');
  const [sortOrder, setSortOrder] = useState<number>(999);
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!title.trim()) {
      showToast({ type: 'error', message: 'Course title is required.' });
      return;
    }
    try {
      setSaving(true);
      const docRef = await addDoc(collection(db, 'courses'), {
        title: title.trim(),
        category,
        level: level || null,
        sortOrder,
        active: true,
      });
      // Audit log for course creation
      try {
        await createAuditLog({
          userId: actorId || '',
          userName: actorName || '',
          userRole: (actorRole as any) || ('admin' as any),
          action: ('course_create' as any),
          entityType: 'course',
          entityId: docRef.id,
          details: JSON.stringify({ title: title.trim(), category, level })
        });
      } catch (e) {
        console.warn('Failed to persist audit log for course create', e);
      }
      setTitle('');
      setLevel('');
      setSortOrder(999);
      onCreated();
    } catch (e) {
      console.error(e);
      showToast({ type: 'error', message: 'Failed to add course.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-end gap-2 text-[10px]">
      <div className="flex flex-col">
        <label className="text-[9px] text-gray-500">Title</label>
        <input
          className="px-2 py-1 rounded-xl border border-gray-200 text-xs"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Phonics - Foundations"
        />
      </div>
      <div className="flex flex-col">
        <label className="text-[9px] text-gray-500">Category</label>
        <select
          className="px-2 py-1 rounded-xl border border-gray-200 text-xs"
          value={category}
          onChange={(e) => setCategory(e.target.value as CourseCategory)}
        >
          <option value="phonics">Phonics</option>
          <option value="grammar_writing">Grammar & Writing</option>
          <option value="public_speaking">Public Speaking</option>
        </select>
      </div>
      <div className="flex flex-col">
        <label className="text-[9px] text-gray-500">Level (opt)</label>
        <input
          className="px-2 py-1 rounded-xl border border-gray-200 text-xs"
          value={level}
          onChange={(e) => setLevel(e.target.value)}
          placeholder="e.g. Foundations / L1"
        />
      </div>
      <div className="flex flex-col w-20">
        <label className="text-[9px] text-gray-500">Sort</label>
        <input
          type="number"
          className="px-2 py-1 rounded-xl border border-gray-200 text-xs"
          value={sortOrder}
          onChange={(e) => setSortOrder(Number(e.target.value))}
        />
      </div>
      <button
        onClick={handleCreate}
        disabled={saving}
        className="px-3 py-1 rounded-2xl bg-indigo-600 text-white text-[10px] disabled:opacity-60"
      >
        {saving ? 'Saving...' : 'Add'}
      </button>
    </div>
  );
}
