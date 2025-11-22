import { jsx as _jsx } from "react/jsx-runtime";
import { useState } from 'react';
import CourseList from './CourseList';
import CreateCourseForm from './CreateCourseForm';
import EditCourseForm from './EditCourseForm';
import { CourseDetailView } from './CourseDetailView';
import TopicsManagement from './TopicsManagement';
export const CourseManagement = () => {
    const [currentView, setCurrentView] = useState('list');
    const [selectedCourse, setSelectedCourse] = useState(null);
    const handleViewCourse = (course) => {
        setSelectedCourse(course);
        setCurrentView('detail');
    };
    const handleEditCourse = (course) => {
        setSelectedCourse(course);
        setCurrentView('edit');
    };
    const handleManageTopics = (course) => {
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
            return _jsx(CreateCourseForm, { onSuccess: handleCourseCreated, onCancel: handleBackToList });
        case 'edit':
            return selectedCourse ? (_jsx(EditCourseForm, { courseId: selectedCourse.id, onSuccess: handleCourseUpdated, onCancel: handleBackToList })) : null;
        case 'detail':
            return selectedCourse ? (_jsx(CourseDetailView, { courseId: selectedCourse.id, onBack: handleBackToList, onEdit: handleEditCourse })) : null;
        case 'topics':
            return selectedCourse ? (_jsx(TopicsManagement, { courseId: selectedCourse.id, onBack: handleBackToList })) : null;
        default:
            return (_jsx(CourseList, { onCreateCourse: () => setCurrentView('create'), onViewCourse: handleViewCourse, onEditCourse: handleEditCourse }));
    }
};
