import type { FC } from 'react';
interface ParentSidebarProps {
    activeTab?: string;
    onTabChange?: (tab: string) => void;
}
declare const ParentSidebar: FC<ParentSidebarProps>;
export default ParentSidebar;
