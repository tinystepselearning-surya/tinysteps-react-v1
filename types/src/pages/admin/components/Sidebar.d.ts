interface SidebarProps {
    selectedTab: string;
    onTabChange: (tab: string) => void;
}
export default function Sidebar({ selectedTab, onTabChange }: SidebarProps): import("react/jsx-runtime").JSX.Element;
export {};
