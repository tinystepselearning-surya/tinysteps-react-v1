/**
 * Lesson Builder
 * Create and edit lessons with activities for courses
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLesson, useLessons } from '../../hooks/useLessons';
import type { Activity, ActivityType, CreateLessonFormData } from '../../types/content';
import {
  ChevronLeftIcon,
  TrashIcon,
  VideoCameraIcon,
  PuzzlePieceIcon,
  DocumentTextIcon,
  QuestionMarkCircleIcon,
  BookOpenIcon,
  ChatBubbleLeftRightIcon,
  Bars3Icon
} from '@heroicons/react/24/outline';

const ACTIVITY_TYPES: { type: ActivityType; label: string; icon: typeof VideoCameraIcon; color: string }[] = [
  { type: 'video', label: 'Video', icon: VideoCameraIcon, color: 'bg-red-100 text-red-700' },
  { type: 'game', label: 'Game', icon: PuzzlePieceIcon, color: 'bg-purple-100 text-purple-700' },
  { type: 'worksheet', label: 'Worksheet', icon: DocumentTextIcon, color: 'bg-blue-100 text-blue-700' },
  { type: 'quiz', label: 'Quiz', icon: QuestionMarkCircleIcon, color: 'bg-green-100 text-green-700' },
  { type: 'reading', label: 'Reading', icon: BookOpenIcon, color: 'bg-yellow-100 text-yellow-700' },
  { type: 'discussion', label: 'Discussion', icon: ChatBubbleLeftRightIcon, color: 'bg-indigo-100 text-indigo-700' }
];

export default function LessonBuilder() {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEdit = !!lessonId;

  const { lesson: existingLesson, loading: loadingLesson } = useLesson(lessonId || '');
  const { createLesson, updateLesson, addActivity, removeActivity } = useLessons(courseId || '');

  const [formData, setFormData] = useState<CreateLessonFormData>({
    title: '',
    description: '',
    objectives: [],
    duration: 30
  });

  const [objectives, setObjectives] = useState<string[]>([]);
  const [newObjective, setNewObjective] = useState('');
  const [activities, setActivities] = useState<Activity[]>([]);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [selectedActivityType, setSelectedActivityType] = useState<ActivityType | null>(null);
  const [saving, setSaving] = useState(false);

  // Load existing lesson data
  useEffect(() => {
    if (existingLesson) {
      setFormData({
        title: existingLesson.title,
        description: existingLesson.description,
        objectives: existingLesson.objectives,
        duration: existingLesson.duration
      });
      setObjectives(existingLesson.objectives);
      setActivities(existingLesson.activities);
    }
  }, [existingLesson]);

  const handleAddObjective = () => {
    if (newObjective.trim()) {
      const updated = [...objectives, newObjective.trim()];
      setObjectives(updated);
      setNewObjective('');
    }
  };

  const handleRemoveObjective = (index: number) => {
    setObjectives(objectives.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!formData.title || !formData.description) {
      alert('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      const data: CreateLessonFormData = {
        ...formData,
        objectives
      };

      if (isEdit && lessonId) {
        await updateLesson(lessonId, { ...data, activities });
        alert('Lesson updated!');
      } else {
        const newLesson = await createLesson(data, user?.uid || '');
        alert('Lesson created!');
        navigate(`/surya/courses/${courseId}/lessons/${newLesson.id}/edit`);
      }
    } catch (error: any) {
      alert(error.message || 'Failed to save lesson');
    } finally {
      setSaving(false);
    }
  };

  const handleAddActivityClick = (type: ActivityType) => {
    setSelectedActivityType(type);
    setShowActivityModal(true);
  };

  const handleActivitySubmit = async (activity: Activity) => {
    if (isEdit && lessonId) {
      try {
        await addActivity(lessonId, activity);
        setActivities([...activities, activity]);
        setShowActivityModal(false);
        setSelectedActivityType(null);
      } catch (error: any) {
        alert(error.message || 'Failed to add activity');
      }
    } else {
      // For new lessons, just add to local state
      setActivities([...activities, activity]);
      setShowActivityModal(false);
      setSelectedActivityType(null);
    }
  };

  const handleRemoveActivity = async (activityId: string) => {
    if (window.confirm('Remove this activity?')) {
      if (isEdit && lessonId) {
        try {
          await removeActivity(lessonId, activityId);
          setActivities(activities.filter(a => a.id !== activityId));
        } catch (error: any) {
          alert(error.message || 'Failed to remove activity');
        }
      } else {
        setActivities(activities.filter(a => a.id !== activityId));
      }
    }
  };

  if (loadingLesson && isEdit) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(`/surya/courses/${courseId}/edit`)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ChevronLeftIcon className="w-5 h-5" />
            Back to Course
          </button>
          <h1 className="text-3xl font-bold text-gray-900">
            {isEdit ? 'Edit Lesson' : 'Create New Lesson'}
          </h1>
          <p className="text-gray-600 mt-1">Build your lesson content and activities</p>
        </div>

        {/* Lesson Info */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Lesson Information</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lesson Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="e.g., Introduction to Basic Phonemes"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Describe what this lesson covers..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Learning Objectives
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newObjective}
                  onChange={(e) => setNewObjective(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddObjective())}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="Add an objective..."
                />
                <button
                  onClick={handleAddObjective}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Add
                </button>
              </div>
              {objectives.length > 0 && (
                <div className="space-y-2">
                  {objectives.map((obj, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                      <span className="flex-1 text-sm">{obj}</span>
                      <button
                        onClick={() => handleRemoveObjective(idx)}
                        className="p-1 text-red-500 hover:bg-red-50 rounded"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Activities */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Activities</h2>
            <span className="text-sm text-gray-600">
              {activities.length} activit{activities.length !== 1 ? 'ies' : 'y'}
            </span>
          </div>

          {/* Activity Type Selector */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
            {ACTIVITY_TYPES.map(({ type, label, icon: Icon, color }) => (
              <button
                key={type}
                onClick={() => handleAddActivityClick(type)}
                className={`flex items-center gap-3 p-4 rounded-lg border-2 border-dashed border-gray-300 hover:border-indigo-500 transition-all ${color}`}
              >
                <Icon className="w-6 h-6" />
                <span className="font-medium">{label}</span>
              </button>
            ))}
          </div>

          {/* Activities List */}
          {activities.length > 0 ? (
            <div className="space-y-3">
              {activities.map((activity) => {
                const activityType = ACTIVITY_TYPES.find(t => t.type === activity.type);
                const Icon = activityType?.icon || Bars3Icon;
                
                return (
                  <div
                    key={activity.id}
                    className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className={`p-2 rounded ${activityType?.color || 'bg-gray-200'}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{activity.title}</div>
                      <div className="text-sm text-gray-600">
                        {activityType?.label} • {activity.duration} min
                        {activity.required && <span className="ml-2 text-red-600">Required</span>}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveActivity(activity.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <p className="text-gray-500">No activities yet. Click an activity type above to add one.</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            onClick={() => navigate(`/surya/courses/${courseId}/edit`)}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !formData.title || !formData.description}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : isEdit ? 'Update Lesson' : 'Create Lesson'}
          </button>
        </div>
      </div>

      {/* Activity Creation Modal */}
      {showActivityModal && selectedActivityType && (
        <ActivityModal
          type={selectedActivityType}
          onSubmit={handleActivitySubmit}
          onClose={() => {
            setShowActivityModal(false);
            setSelectedActivityType(null);
          }}
        />
      )}
    </div>
  );
}

// Activity Creation Modal Component
interface ActivityModalProps {
  type: ActivityType;
  onSubmit: (activity: Activity) => void;
  onClose: () => void;
}

function ActivityModal({ type, onSubmit, onClose }: ActivityModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState(10);
  const [required, setRequired] = useState(false);
  const [content, setContent] = useState<any>({});

  const handleSubmit = () => {
    if (!title) {
      alert('Please enter a title');
      return;
    }

    const activity: Activity = {
      id: `activity_${Date.now()}`,
      type,
      title,
      description,
      content: getContentByType(),
      duration,
      required,
      order: 0
    };

    onSubmit(activity);
  };

  const getContentByType = (): any => {
    switch (type) {
      case 'video':
        return {
          type: 'video',
          videoUrl: content.videoUrl || '',
          thumbnail: content.thumbnail || '',
          transcript: content.transcript || '',
          captions: content.captions || false
        };
      case 'game':
        return {
          type: 'game',
          gameId: content.gameId || '',
          gameName: content.gameName || '',
          gameUrl: content.gameUrl || '',
          settings: content.settings || {}
        };
      case 'worksheet':
        return {
          type: 'worksheet',
          fileUrl: content.fileUrl || '',
          fileName: content.fileName || '',
          instructions: content.instructions || '',
          answersUrl: content.answersUrl || ''
        };
      case 'quiz':
        return {
          type: 'quiz',
          questions: content.questions || [],
          passingScore: content.passingScore || 70,
          allowRetry: content.allowRetry !== false,
          showCorrectAnswers: content.showCorrectAnswers !== false
        };
      case 'reading':
        return {
          type: 'reading',
          content: content.content || '',
          wordCount: content.wordCount || 0,
          readingLevel: content.readingLevel || ''
        };
      case 'discussion':
        return {
          type: 'discussion',
          prompt: content.prompt || '',
          guidelines: content.guidelines || [],
          moderatorNotes: content.moderatorNotes || ''
        };
      default:
        return {};
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h3 className="text-2xl font-bold mb-4">Add {type.charAt(0).toUpperCase() + type.slice(1)} Activity</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="Activity title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="Brief description"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Duration (minutes)</label>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex items-center">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={required}
                    onChange={(e) => setRequired(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Required Activity</span>
                </label>
              </div>
            </div>

            {/* Type-specific fields */}
            {type === 'video' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Video URL</label>
                <input
                  type="url"
                  value={content.videoUrl || ''}
                  onChange={(e) => setContent({ ...content, videoUrl: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="https://youtube.com/watch?v=..."
                />
              </div>
            )}

            {type === 'game' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Game</label>
                  <select
                    value={content.gameId || ''}
                    onChange={(e) => {
                      const gameId = e.target.value;
                      const gameName = e.target.options[e.target.selectedIndex].text;
                      setContent({ ...content, gameId, gameName, gameUrl: `/games/${gameId}` });
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select a game...</option>
                    <option value="balloon-pop">Balloon Pop</option>
                    <option value="spell-bee">Spell Bee</option>
                    <option value="meaning-match">Meaning Match</option>
                    <option value="quick-meaning-quiz">Quick Meaning Quiz</option>
                  </select>
                </div>
              </>
            )}

            {type === 'worksheet' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">File URL</label>
                <input
                  type="url"
                  value={content.fileUrl || ''}
                  onChange={(e) => setContent({ ...content, fileUrl: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="https://..."
                />
              </div>
            )}

            {type === 'reading' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
                <textarea
                  value={content.content || ''}
                  onChange={(e) => setContent({ ...content, content: e.target.value })}
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="Reading content..."
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Add Activity
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
