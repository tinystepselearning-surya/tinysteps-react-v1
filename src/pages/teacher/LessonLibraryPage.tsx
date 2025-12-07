import React, { useState } from 'react';
import { cn } from '@components/lib/utils';
import { Card } from '@components/ui/card';
import { Button } from '@components/ui/button';
import type { TeacherLesson, LessonCategory } from '../../types/lessonLibrary';
import { useTeacherLessons } from '../../hooks/useTeacherLessons';

const CATEGORIES: { key: LessonCategory; label: string }[] = [
  { key: 'phonics', label: 'Phonics' },
  { key: 'grammar', label: 'Grammar' },
  { key: 'speaking', label: 'Public Speaking' },
];

// Lessons are loaded from Firestore via `useTeacherLessons` hook

export default function LessonLibraryPage(): JSX.Element {
  const [active, setActive] = useState<LessonCategory>('phonics');
  const [selected, setSelected] = useState<TeacherLesson | null>(null);

  const { lessons, isLoading, error } = useTeacherLessons(active);

  return (
    <div className="min-h-screen py-6">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm text-indigo-600 font-semibold">Teacher Portal</p>
            <h1 className="text-3xl font-bold">Lesson Library</h1>
            <p className="text-sm text-gray-600 mt-1">Browse and open Canva lesson covers for your classes.</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActive(cat.key)}
              className={cn(
                'px-4 py-2 rounded-full text-sm font-semibold transition',
                active === cat.key
                  ? 'bg-blue-600 text-white shadow'
                  : 'bg-white border border-gray-100 text-gray-700'
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Gallery */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl bg-gray-100 animate-pulse h-56" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-2xl p-6 bg-red-50 border border-red-100 text-red-700">
            We couldn’t load lessons right now. Please try again or contact admin.
          </div>
        ) : lessons.length === 0 ? (
          <div className="border-dashed border-2 border-gray-200 rounded-2xl p-8 text-center text-gray-600">
            No lessons added for this category yet. Ask admin to add Tiny Steps Canva lessons here.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {lessons.map((lesson) => (
              <Card key={lesson.id} className="rounded-2xl overflow-hidden shadow-sm cursor-pointer" onClick={() => setSelected(lesson)}>
                <div className="h-36 bg-gradient-to-br from-indigo-200 via-sky-100 to-white flex items-center justify-center">
                  {lesson.thumbnailUrl ? (
                    <img src={lesson.thumbnailUrl} alt={lesson.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="text-sm text-indigo-700 font-semibold">Canva Lesson Cover</div>
                  )}
                </div>

                <div className="p-4">
                  <h3 className="text-md font-semibold text-gray-900 line-clamp-2 mb-2">{lesson.title}</h3>
                  <div className="text-xs text-gray-500 mb-2">
                    {lesson.level ? `${lesson.level} · ` : ''}
                    {lesson.ageRange ? `${lesson.ageRange} · ` : ''}
                    {lesson.durationMinutes ? `${lesson.durationMinutes} mins` : ''}
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {lesson.tags?.map((t) => (
                      <span key={t} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                        {t}
                      </span>
                    ))}
                  </div>

                  <div className="pt-2 border-t mt-2">
                    <p className="text-sm text-blue-600 font-medium">Open Canva lesson →</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full mx-4 overflow-hidden">
            <div className="p-4 border-b flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold">{selected.title}</h2>
                <div className="text-sm text-gray-500">{selected.level || ''} {selected.ageRange ? `· ${selected.ageRange}` : ''}</div>
              </div>
              <div>
                <Button variant="ghost" onClick={() => setSelected(null)}>Close</Button>
              </div>
            </div>

            <div className="p-4">
              {selected.canvaUrl ? (
                <div className="aspect-video">
                  <iframe src={selected.canvaUrl} title={selected.title} className="w-full h-full border rounded" />
                </div>
              ) : (
                <div className="p-6 text-center text-gray-600">No Canva URL available for this lesson.</div>
              )}
            </div>

            <div className="p-4 border-t flex justify-end">
              <Button onClick={() => setSelected(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
