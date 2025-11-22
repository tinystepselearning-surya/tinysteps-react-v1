import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { RouterProvider } from 'react-router-dom';
import router from './app/routes';
import CursorAnimation from './components/common/CursorAnimation';
import useRevealAnimations from './hooks/useRevealAnimations';
import useParallaxElements from './hooks/useParallaxElements';
import { useAuth } from './hooks/useAuth';
import { useEffect } from 'react';
function App() {
    useRevealAnimations();
    useParallaxElements();
    const { isLoading } = useAuth();
    useEffect(() => {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/service-worker.js').catch(() => {
                /* ignore */
            });
        }
    }, []);
    if (isLoading) {
        return (_jsxs(_Fragment, { children: [_jsx(CursorAnimation, {}), _jsx("div", { className: "flex min-h-screen items-center justify-center bg-white text-sm text-gray-500", children: "Preparing your experience\u2026" })] }));
    }
    return (_jsxs(_Fragment, { children: [_jsx(CursorAnimation, {}), _jsx(RouterProvider, { router: router })] }));
}
export default App;
