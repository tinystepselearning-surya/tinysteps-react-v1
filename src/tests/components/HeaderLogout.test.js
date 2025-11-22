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
import { act } from 'react';
import { ParentHeader } from '../../pages/parent/components/layout/ParentHeader';
import useAuthStore from '../../store/useAuthStore';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
vi.mock('firebase/auth', (importOriginal) => __awaiter(void 0, void 0, void 0, function* () {
    const actual = yield importOriginal();
    return Object.assign(Object.assign({}, actual), { signOut: vi.fn(() => Promise.resolve()) });
}));
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => __awaiter(void 0, void 0, void 0, function* () {
    const actual = yield vi.importActual('react-router-dom');
    return Object.assign(Object.assign({}, actual), { useNavigate: () => mockNavigate });
}));
describe('Header logout', () => {
    afterEach(() => {
        useAuthStore.setState({ user: null });
        mockNavigate.mockReset();
    });
    it('redirects parent to parent login after logout', () => __awaiter(void 0, void 0, void 0, function* () {
        act(() => useAuthStore.setState({ user: { uid: 'u1', email: 'p@test.com', displayName: 'Parent', role: 'parent' }, clearUser: vi.fn() }));
        yield act(() => __awaiter(void 0, void 0, void 0, function* () {
            render(_jsx(MemoryRouter, { children: _jsx(ParentHeader, { name: "Test Parent", totalChildren: 1 }) }));
            yield Promise.resolve();
        }));
        // Find logout text in header (desktop or mobile)
        const logoutButton = screen.getByText(/Logout/i);
        expect(logoutButton).toBeTruthy();
        yield act(() => __awaiter(void 0, void 0, void 0, function* () {
            fireEvent.click(logoutButton);
            // wait for async work (signOut -> clearUser -> navigate) to finish inside act
            yield waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/parent/login'));
        }));
    }));
});
