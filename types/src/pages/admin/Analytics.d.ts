export interface AdminStats {
    totalUsers: number;
    totalStudents: number;
    totalCourses: number;
    activeSessionsToday: number;
}
interface AnalyticsProps {
    stats?: AdminStats;
    isLoading: boolean;
    error?: string;
}
export default function Analytics({ stats, isLoading, error }: AnalyticsProps): import("react/jsx-runtime").JSX.Element;
export {};
