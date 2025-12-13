// src/pages/admin/CourseManagement/index.tsx
import React, { useState } from 'react';
import CourseList from './CourseList';
import CreateCourseForm from './CreateCourseForm';
import EditCourseForm from './EditCourseForm';
import { CourseDetailView } from './CourseDetailView';
import TopicsManagement from './TopicsManagement';

type ViewMode = 'list' | 'create' | 'edit' | 'detail' | 'topics';

export const CourseManagement: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewMode>('list');
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  const handleViewCourse = (courseId: string) => {
    setSelectedCourseId(courseId);
    setCurrentView('detail');
  };

  const handleEditCourse = (courseId: string) => {
    setSelectedCourseId(courseId);
    setCurrentView('edit');
  };

  const handleManageTopics = (courseId: string) => {
    setSelectedCourseId(courseId);
    setCurrentView('topics');
  };

  const handleBackToList = () => {
    setCurrentView('list');
    setSelectedCourseId(null);
  };

  const handleCourseCreated = () => {
    setCurrentView('list');
    setSelectedCourseId(null);
  };

  const handleCourseUpdated = () => {
    setCurrentView('list');
    setSelectedCourseId(null);
  };

  switch (currentView) {
    case 'create':
      return (
        <CreateCourseForm
          onSuccess={handleCourseCreated}
          onCancel={handleBackToList}
        />
      );

    case 'edit':
      return selectedCourseId ? (
        <EditCourseForm
          courseId={selectedCourseId}
          onSuccess={handleCourseUpdated}
          onCancel={handleBackToList}
        />
      ) : null;

    case 'detail':
      return selectedCourseId ? (
        <CourseDetailView
          courseId={selectedCourseId}
          onBack={handleBackToList}
          onEdit={handleEditCourse}
        />
      ) : null;

    case 'topics':
      return selectedCourseId ? (
        <TopicsManagement
          courseId={selectedCourseId}
          onBack={handleBackToList}
        />
      ) : null;

    default:
      return (
        <CourseList
          onCreateCourse={() => setCurrentView('create')}
          onViewCourse={handleViewCourse}
          onEditCourse={handleEditCourse}
          // Optional: if you later add a "Manage Topics" button in CourseList:
          // onManageTopics={handleManageTopics}
        />
      );
  }
};
