import type { ReactNode } from "react";
export type DashboardNavBaseItem = {
    key: string;
    label: string;
    icon?: ReactNode;
    badge?: string;
    href?: string;
    onSelect?: () => void;
};
export declare const DASHBOARD_NAV_ITEMS: DashboardNavBaseItem[];
type BuildNavOptions = {
    overrides?: Partial<Record<string, Partial<DashboardNavBaseItem>>>;
    includeKeys?: string[];
};
export declare function buildNavItems(activeKey: string, options?: BuildNavOptions): {
    active: boolean;
    key: string;
    label: string;
    icon?: ReactNode;
    badge?: string;
    href?: string;
    onSelect?: () => void;
}[];
export {};
//# sourceMappingURL=navItems.d.ts.map