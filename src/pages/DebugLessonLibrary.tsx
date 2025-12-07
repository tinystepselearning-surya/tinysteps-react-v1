// Temporary debug component to test lesson library without routing
import { useState } from 'react';
import { cn } from '../components/lib/utils';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { useTeacherLessons } from '../hooks/useTeacherLessons';

const CATEGORIES = [
  { key: 'phonics', label: 'Phonics' },
  { key: 'grammar', label: 'Grammar' }, 
  { key: 'speaking', label: 'Public Speaking' }
];

export default function DebugLessonLibrary() {
  const [activeCategory, setActiveCategory] = useState('phonics');
  const { lessons, isLoading, error } = useTeacherLessons();

  if (isLoading) return <div className="p-8">Loading lessons...</div>;
  if (error) return <div className="p-8 text-red-600">Error: {error.message}</div>;

  const filteredLessons = lessons.filter(lesson => lesson.category === activeCategory);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">DEBUG: Teacher Lesson Library</h1>
      
      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6">
        {CATEGORIES.map((category) => (
          <Button
            key={category.key}
            variant={activeCategory === category.key ? 'default' : 'outline'}
            onClick={() => setActiveCategory(category.key)}
            className={cn(
              'rounded-lg px-4 py-2',
              activeCategory === category.key
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border-gray-300'
            )}
          >
            {category.label}
          </Button>
        ))}
      </div>

      {/* Lessons Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredLessons.map((lesson) => (
          <Card key={lesson.id} className="p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {lesson.title}
              </h3>
              <p className="text-sm text-gray-600 mb-2">
                Ages {lesson.ageRange} • {lesson.durationMinutes} mins • {lesson.level}
              </p>
              <div className="flex flex-wrap gap-1">
                {lesson.tags?.map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
              View Lesson
            </Button>
          </Card>
        ))}
      </div>

      {filteredLessons.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No lessons found for {CATEGORIES.find(c => c.key === activeCategory)?.label}</p>
        </div>
      )}
      
      <div className="mt-8 text-sm text-gray-500">
        Total lessons loaded: {lessons.length}
      </div>
    </div>
  );
}