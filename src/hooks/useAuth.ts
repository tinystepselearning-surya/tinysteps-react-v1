import useAuthStore from '../store/useAuthStore';

export function useAuth() {
  const user = useAuthStore((state) => state.user);
  const authStatus = useAuthStore((state) => state.authStatus);
  return {
    user,
    authStatus,
    isLoading: authStatus === 'initializing',
  };
}

export default useAuth;
