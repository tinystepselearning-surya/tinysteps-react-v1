import React from 'react';
interface TeacherSidebarProps {
    activeTab?: string;
    onTabChange?: (tab: string) => void;
}
declare const TeacherSidebar: React.FC<TeacherSidebarProps>;
export default TeacherSidebar;
