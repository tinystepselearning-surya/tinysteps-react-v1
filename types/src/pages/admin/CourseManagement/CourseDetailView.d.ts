import React from 'react';
interface CourseDetailViewProps {
    courseId: string;
    onBack: () => void;
    onEdit: (course: any) => void;
}
export declare const CourseDetailView: React.FC<CourseDetailViewProps>;
export {};
