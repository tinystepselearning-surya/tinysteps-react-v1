import { Student } from '../../../types/Student';
interface Props {
    student: Student;
    onClose: () => void;
    onAssigned?: () => void;
}
export default function AssignLPModal({ student, onClose, onAssigned, }: Props): import("react/jsx-runtime").JSX.Element;
export {};
