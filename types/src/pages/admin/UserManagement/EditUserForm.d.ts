import { User } from '../../../types/User';
interface EditUserFormProps {
    user: User;
    onUserUpdated: () => void;
    onCancel: () => void;
}
export declare function EditUserForm({ user, onUserUpdated, onCancel }: EditUserFormProps): import("react/jsx-runtime").JSX.Element;
export {};
