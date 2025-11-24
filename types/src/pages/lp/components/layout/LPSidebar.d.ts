import type { FC } from 'react';
interface LPSidebarProps {
    active: string;
    onSelect: (tab: string) => void;
}
export declare const LPSidebar: FC<LPSidebarProps>;
export {};
