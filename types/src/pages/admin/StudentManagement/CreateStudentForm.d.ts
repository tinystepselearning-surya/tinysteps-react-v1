interface Props {
    onStudentCreated?: (studentId: string) => void;
    defaultParentId?: string | null;
}
export declare function CreateStudentForm({ onStudentCreated, defaultParentId, }: Props): import("react/jsx-runtime").JSX.Element;
export default CreateStudentForm;
