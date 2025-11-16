import React, { useState } from 'react';
import CourseList from './CourseList';
import CreateCourseForm from './CreateCourseForm';
import EditCourseForm from './EditCourseForm';
import { CourseDetailView } from './CourseDetailView';
import TopicsManagement from './TopicsManagement';

type ViewMode = 'list' | 'create' | 'edit' | 'detail' | 'topics';

export const CourseManagement: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewMode>('list');
  const [selectedCourse, setSelectedCourse] = useState<any>(null);

  const handleViewCourse = (course: any) => {
    setSelectedCourse(course);
    setCurrentView('detail');
  };

  const handleEditCourse = (course: any) => {
    setSelectedCourse(course);
    setCurrentView('edit');
  };

  const handleManageTopics = (course: any) => {
    setSelectedCourse(course);
    setCurrentView('topics');
  };

  const handleBackToList = () => {
    setCurrentView('list');
    setSelectedCourse(null);
  };

  const handleCourseCreated = () => {
    setCurrentView('list');
    setSelectedCourse(null);
  };

  const handleCourseUpdated = () => {
    setCurrentView('list');
    setSelectedCourse(null);
  };

  switch (currentView) {
    case 'create':
      return <CreateCourseForm onSuccess={handleCourseCreated} onCancel={handleBackToList} />;
    
    case 'edit':
      return selectedCourse ? (
        <EditCourseForm 
          courseId={selectedCourse.id} 
          onSuccess={handleCourseUpdated} 
          onCancel={handleBackToList}
        />
      ) : null;
    
    case 'detail':
      return selectedCourse ? (
        <CourseDetailView 
          courseId={selectedCourse.id} 
          onBack={handleBackToList}
          onEdit={handleEditCourse}
        />
      ) : null;
    
    case 'topics':
      return selectedCourse ? (
        <TopicsManagement courseId={selectedCourse.id} onBack={handleBackToList} />
      ) : null;
    
    default:
      return (
        <CourseList 
          onCreateCourse={() => setCurrentView('create')}
          onViewCourse={handleViewCourse}
          onEditCourse={handleEditCourse}
        />
      );
  }
};