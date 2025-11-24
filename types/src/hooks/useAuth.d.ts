import { AuthUser } from '../store/useAuthStore';
export declare function useAuth(): {
    user: AuthUser | null;
    isLoading: boolean;
};
export default useAuth;
