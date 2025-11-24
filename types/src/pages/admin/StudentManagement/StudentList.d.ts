import { Student } from '../../../types/Student';
interface StudentListProps {
    onEdit: (student: Student) => void;
    onDelete: (studentId: string) => void;
    onAssignCourse: (student: Student) => void;
}
export default function StudentList({ onEdit, onDelete, onAssignCourse }: StudentListProps): import("react/jsx-runtime").JSX.Element;
export {};
