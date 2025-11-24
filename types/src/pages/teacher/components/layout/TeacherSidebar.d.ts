import type { FC } from 'react';
interface SidebarProps {
    active: string;
    onSelect: (value: string) => void;
    todayCount?: number;
    teacherId?: string;
}
export declare const TeacherSidebar: FC<SidebarProps>;
export {};
