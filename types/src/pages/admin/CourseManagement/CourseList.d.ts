interface CourseListProps {
    onViewCourse?: (courseId: string) => void;
    onEditCourse?: (courseId: string) => void;
    onDeleteCourse?: (courseId: string) => void;
    onCreateCourse?: () => void;
}
export default function CourseList({ onViewCourse, onEditCourse, onDeleteCourse, onCreateCourse }: CourseListProps): import("react/jsx-runtime").JSX.Element;
export {};
