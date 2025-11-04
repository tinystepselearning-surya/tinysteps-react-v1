import type { ReactNode } from "react";
type DashboardNavItem = {
    key: string;
    label: string;
    icon?: ReactNode;
    badge?: string;
    active?: boolean;
    href?: string;
    onSelect?: () => void;
};
type DashboardShellProps = {
    navItems: DashboardNavItem[];
    header: {
        title: string;
        subtitle?: string;
        toolbar?: ReactNode;
    };
    rightRail?: ReactNode;
    children: ReactNode;
};
/** Shared dashboard layout used across teacher, parent, and learning manager previews. */
export default function DashboardShell({ navItems, header, rightRail, children }: DashboardShellProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=DashboardShell.d.ts.map