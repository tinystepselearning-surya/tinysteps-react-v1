/**
 * Course Builder - 5-Step Wizard
 * Create and edit courses with comprehensive workflow
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCourse, useCourses } from '../../hooks/useCourses';
import type { CreateCourseFormData, DifficultyLevel } from '../../types/content';
import { CONTENT_CATEGORIES, PHONICS_PHASES } from '../../types/content';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckCircleIcon,
  XCircleIcon,
  PlusIcon,
  TrashIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline';

type WizardStep = 1 | 2 | 3 | 4 | 5;

interface StepStatus {
  completed: boolean;
  valid: boolean;
}

export default function CourseBuilder() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEdit = !!courseId;
  
  const { course: existingCourse, loading: loadingCourse } = useCourse(courseId || '');
  const { createCourse, updateCourse, publishCourse } = useCourses();

  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [formData, setFormData] = useState<CreateCourseFormData>({
    title: '',
    description: '',
    difficulty: 'beginner',
    phase: 0,
    ageRange: { min: 4, max: 6 },
    category: Object.values(CONTENT_CATEGORIES)[0],
    objectives: [],
    tags: []
  });
  
  const [objectives, setObjectives] = useState<string[]>([]);
  const [newObjective, setNewObjective] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [saving, setSaving] = useState(false);

  // Load existing course data
  useEffect(() => {
    if (existingCourse) {
      setFormData({
        title: existingCourse.title,
        description: existingCourse.description,
        difficulty: existingCourse.difficulty,
        phase: existingCourse.phase,
        ageRange: existingCourse.ageRange,
        category: existingCourse.category,
        objectives: existingCourse.objectives,
        tags: existingCourse.tags
      });
      setObjectives(existingCourse.objectives);
      setTags(existingCourse.tags);
      setThumbnailUrl(existingCourse.thumbnailUrl || '');
    }
  }, [existingCourse]);

  // Validate each step
  const step1Valid = !!(formData.title && formData.description && formData.category);
  const step2Valid = objectives.length > 0;
  
  const stepStatus: Record<WizardStep, StepStatus> = {
    1: {
      completed: step1Valid,
      valid: step1Valid
    },
    2: {
      completed: step2Valid,
      valid: step2Valid
    },
    3: {
      completed: isEdit ? (existingCourse?.lessons.length || 0) > 0 : false,
      valid: true // Optional for draft
    },
    4: {
      completed: false,
      valid: true // Optional
    },
    5: {
      completed: false,
      valid: step1Valid && step2Valid
    }
  };

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep((currentStep + 1) as WizardStep);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as WizardStep);
    }
  };

  const handleAddObjective = () => {
    if (newObjective.trim()) {
      setObjectives([...objectives, newObjective.trim()]);
      setNewObjective('');
    }
  };

  const handleRemoveObjective = (index: number) => {
    setObjectives(objectives.filter((_, i) => i !== index));
  };

  const handleMoveObjective = (index: number, direction: 'up' | 'down') => {
    const newObjectives = [...objectives];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex >= 0 && targetIndex < objectives.length) {
      [newObjectives[index], newObjectives[targetIndex]] = [newObjectives[targetIndex], newObjectives[index]];
      setObjectives(newObjectives);
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      const data: CreateCourseFormData = {
        ...formData,
        objectives,
        tags
      };

      if (isEdit && courseId) {
        await updateCourse(courseId, data);
        alert('Course draft saved!');
      } else {
        const newCourse = await createCourse(data, user?.uid || '', thumbnailUrl || undefined);
        alert('Course draft created!');
        navigate(`/surya/courses/${newCourse.id}/edit`);
      }
    } catch (error: any) {
      alert(error.message || 'Failed to save course');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!stepStatus[1].valid || !stepStatus[2].valid) {
      alert('Please complete required steps (Basic Info and Objectives)');
      return;
    }

    setSaving(true);
    try {
      let finalCourseId = courseId;
      
      // Save if not saved yet
      if (!isEdit) {
        const data: CreateCourseFormData = {
          ...formData,
          objectives,
          tags
        };
        const newCourse = await createCourse(data, user?.uid || '', thumbnailUrl || undefined);
        finalCourseId = newCourse.id;
      } else {
        const data = {
          ...formData,
          objectives,
          tags
        };
        await updateCourse(courseId!, data);
      }

      // Publish
      if (finalCourseId) {
        await publishCourse(finalCourseId);
        alert('Course published successfully!');
        navigate('/surya/courses');
      }
    } catch (error: any) {
      alert(error.message || 'Failed to publish course');
    } finally {
      setSaving(false);
    }
  };

  if (loadingCourse && isEdit) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/surya/courses')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ChevronLeftIcon className="w-5 h-5" />
            Back to Courses
          </button>
          <h1 className="text-3xl font-bold text-gray-900">
            {isEdit ? 'Edit Course' : 'Create New Course'}
          </h1>
          <p className="text-gray-600 mt-1">Follow the steps to build your course</p>
        </div>

        {/* Progress Steps */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4, 5].map((step, idx) => (
              <div key={step} className="flex items-center flex-1">
                <button
                  onClick={() => setCurrentStep(step as WizardStep)}
                  className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold transition-all ${
                    currentStep === step
                      ? 'bg-indigo-600 text-white ring-4 ring-indigo-100'
                      : stepStatus[step as WizardStep]?.completed
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {stepStatus[step as WizardStep]?.completed ? (
                    <CheckCircleIcon className="w-6 h-6" />
                  ) : (
                    step
                  )}
                </button>
                {idx < 4 && (
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      stepStatus[step as WizardStep]?.completed ? 'bg-green-500' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-600">
            <span>Basic Info</span>
            <span>Objectives</span>
            <span>Lessons</span>
            <span>Resources</span>
            <span>Review</span>
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          {/* Step 1: Basic Info */}
          {currentStep === 1 && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Basic Information</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Course Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="e.g., Phonics Phase 2 - Basic Sounds"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Describe what students will learn in this course..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    >
                      {Object.values(CONTENT_CATEGORIES).map((cat: string) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Difficulty Level
                    </label>
                    <select
                      value={formData.difficulty}
                      onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as DifficultyLevel })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phonics Phase
                    </label>
                    <select
                      value={formData.phase}
                      onChange={(e) => setFormData({ ...formData, phase: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    >
                      {PHONICS_PHASES.map(phase => (
                        <option key={phase.value} value={phase.value}>{phase.label}</option>
                      ))}
                    </select>
                  </div>

                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Age Range (Min)
                    </label>
                    <input
                      type="number"
                      value={formData.ageRange.min}
                      onChange={(e) => setFormData({
                        ...formData,
                        ageRange: { ...formData.ageRange, min: parseInt(e.target.value) || 0 }
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      placeholder="4"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Age Range (Max)
                    </label>
                    <input
                      type="number"
                      value={formData.ageRange.max}
                      onChange={(e) => setFormData({
                        ...formData,
                        ageRange: { ...formData.ageRange, max: parseInt(e.target.value) || 0 }
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      placeholder="6"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Thumbnail URL (optional)
                  </label>
                  <input
                    type="url"
                    value={thumbnailUrl}
                    onChange={(e) => setThumbnailUrl(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      placeholder="Add a tag..."
                    />
                    <button
                      onClick={handleAddTag}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {tags.map(tag => (
                      <span
                        key={tag}
                        className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm flex items-center gap-2"
                      >
                        {tag}
                        <button onClick={() => handleRemoveTag(tag)}>
                          <XCircleIcon className="w-4 h-4" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Objectives */}
          {currentStep === 2 && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Learning Objectives</h2>
              <p className="text-gray-600 mb-6">
                Define what students will achieve by completing this course. Add at least one objective.
              </p>

              <div className="space-y-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newObjective}
                    onChange={(e) => setNewObjective(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddObjective())}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g., Students will be able to identify and pronounce basic phonemes"
                  />
                  <button
                    onClick={handleAddObjective}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    <PlusIcon className="w-5 h-5" />
                    Add
                  </button>
                </div>

                {objectives.length > 0 && (
                  <div className="space-y-2">
                    {objectives.map((objective, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => handleMoveObjective(idx, 'up')}
                            disabled={idx === 0}
                            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                          >
                            <ArrowUpIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleMoveObjective(idx, 'down')}
                            disabled={idx === objectives.length - 1}
                            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                          >
                            <ArrowDownIcon className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex-1">
                          <span className="text-sm font-semibold text-indigo-600 mr-2">#{idx + 1}</span>
                          {objective}
                        </div>
                        <button
                          onClick={() => handleRemoveObjective(idx)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {objectives.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No objectives added yet. Add at least one to continue.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Lessons */}
          {currentStep === 3 && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Course Lessons</h2>
              <p className="text-gray-600 mb-6">
                Add and organize lessons for this course. You can add lessons after creating the course.
              </p>

              {isEdit && existingCourse && (
                <div className="space-y-3">
                  {existingCourse.lessons.map((lessonId, idx) => (
                    <div
                      key={lessonId}
                      className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <span className="text-sm font-semibold text-indigo-600">Lesson {idx + 1}</span>
                      <span className="flex-1 text-gray-700">{lessonId}</span>
                      <button
                        onClick={() => navigate(`/surya/courses/${courseId}/lessons/${lessonId}/edit`)}
                        className="px-3 py-1 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700"
                      >
                        Edit
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {(!isEdit || !existingCourse?.lessons.length) && (
                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <p className="text-gray-500 mb-4">No lessons yet. Save this course first, then add lessons.</p>
                  {!isEdit && (
                    <button
                      onClick={handleSaveDraft}
                      disabled={saving}
                      className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {saving ? 'Saving...' : 'Save Draft'}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 4: Resources */}
          {currentStep === 4 && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Course Resources</h2>
              <p className="text-gray-600 mb-6">
                Attach supplementary materials, worksheets, or reference documents (optional).
              </p>

              <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <p className="text-gray-500 mb-4">Resource management coming soon!</p>
                <p className="text-sm text-gray-400">You can add resources from the Content Library after publishing.</p>
              </div>
            </div>
          )}

          {/* Step 5: Review */}
          {currentStep === 5 && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Review & Publish</h2>
              <p className="text-gray-600 mb-6">Review your course details before publishing.</p>

              <div className="space-y-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Basic Information</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-gray-600">Title:</span> <span className="font-medium">{formData.title}</span></div>
                    <div><span className="text-gray-600">Category:</span> <span className="font-medium">{formData.category}</span></div>
                    <div><span className="text-gray-600">Difficulty:</span> <span className="font-medium">{formData.difficulty}</span></div>
                    <div><span className="text-gray-600">Phase:</span> <span className="font-medium">Phase {formData.phase}</span></div>
                    <div><span className="text-gray-600">Age Range:</span> <span className="font-medium">{formData.ageRange.min}-{formData.ageRange.max} years</span></div>
                    {isEdit && existingCourse && (
                      <div><span className="text-gray-600">Duration:</span> <span className="font-medium">{existingCourse.estimatedDuration} minutes</span></div>
                    )}
                  </div>
                  <div className="mt-3">
                    <span className="text-gray-600 text-sm">Description:</span>
                    <p className="text-sm mt-1">{formData.description}</p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Learning Objectives ({objectives.length})</h3>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    {objectives.map((obj, idx) => (
                      <li key={idx}>{obj}</li>
                    ))}
                  </ol>
                </div>

                {tags.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {tags.map(tag => (
                        <span key={tag} className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {isEdit && existingCourse && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">Lessons</h3>
                    <p className="text-sm">{existingCourse.lessons.length} lesson(s) added</p>
                  </div>
                )}

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> Publishing will make this course visible to students. You can still edit it after publishing.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="flex items-center gap-2 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeftIcon className="w-5 h-5" />
            Previous
          </button>

          <div className="flex gap-3">
            <button
              onClick={handleSaveDraft}
              disabled={saving || !stepStatus[1].valid}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Draft'}
            </button>

            {currentStep === 5 ? (
              <button
                onClick={handlePublish}
                disabled={saving || !stepStatus[1].valid || !stepStatus[2].valid}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {saving ? 'Publishing...' : 'Publish Course'}
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Next
                <ChevronRightIcon className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
