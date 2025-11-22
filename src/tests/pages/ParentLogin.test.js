var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { jsx as _jsx } from "react/jsx-runtime";
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import * as auth from '../../lib/auth';
import LoginPage from '../../pages/LoginPage';
import { MemoryRouter } from 'react-router-dom';
vi.mock('../../lib/auth', () => __awaiter(void 0, void 0, void 0, function* () {
    const actual = yield vi.importActual('../../lib/auth');
    return Object.assign(Object.assign({}, actual), { handleLoginWithGoogle: vi.fn().mockResolvedValue(null) });
}));
describe('Parent Login Page', () => {
    it('shows Google button for parent role and calls handler on click', () => __awaiter(void 0, void 0, void 0, function* () {
        const handleLoginWithGoogle = auth.handleLoginWithGoogle;
        // render with a memory router so useLocation/useSearchParams hooks work
        render(_jsx(MemoryRouter, { initialEntries: ["/parent/login?role=parent"], children: _jsx(LoginPage, {}) }));
        // navigate to `/parent/login` path logic not applied in this render; we just ensure component contains the button when role=parent URL is used.
        // Instead, mount the page and assert presence of the Sign in with Google button by simulating expectedRole via URL if necessary.
        // For this simple test, we assume `expectedRole` equals 'parent' in this path.
        // The existing LoginPage uses location: for robust test we'd mock the router; for now, just ensure the element text exists when page is rendered.
        const googleBtn = screen.getByText(/Sign in with Google/i);
        expect(googleBtn).toBeInTheDocument();
        fireEvent.click(googleBtn);
        // confirm the mocked login handler was called (wait for async state update)
        yield waitFor(() => expect(auth.handleLoginWithGoogle).toHaveBeenCalledWith('parent'));
    }));
});
