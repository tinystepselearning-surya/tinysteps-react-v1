import { User } from '../../../types/User';
interface CreateUserFormProps {
    onUserCreated: (user: User) => void;
    onClose?: () => void;
}
export declare function CreateUserForm({ onUserCreated, onClose }: CreateUserFormProps): import("react/jsx-runtime").JSX.Element;
export {};
