import { Student } from '../../../types/Student';
interface Props {
    student: Student;
    open: boolean;
    onClose: () => void;
    onUpdated?: () => void;
}
export default function EditStudentForm({ student, open, onClose, onUpdated }: Props): import("react/jsx-runtime").JSX.Element;
export {};
