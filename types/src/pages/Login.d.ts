import type { FC } from 'react';
interface LoginProps {
    onLogin?: (email: string, password: string) => Promise<void> | void;
}
declare const Login: FC<LoginProps>;
export default Login;
