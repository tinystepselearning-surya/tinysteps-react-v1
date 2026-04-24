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
/// <reference types="vitest" />
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginPage from '../../pages/LoginPage';
import { MemoryRouter } from 'react-router-dom';
vi.mock('../../lib/auth', () => ({
    handleLogin: vi.fn(),
}));
import { handleLogin } from '../../lib/auth';
describe('LoginPage', () => {
    beforeEach(() => {
        var _a, _b;
        (_b = (_a = handleLogin).mockReset) === null || _b === void 0 ? void 0 : _b.call(_a);
    });
    it('calls handleLogin with email and password', () => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b;
        (_b = (_a = handleLogin).mockResolvedValue) === null || _b === void 0 ? void 0 : _b.call(_a, undefined);
        render(_jsx(MemoryRouter, { initialEntries: ["/teacher/login"], children: _jsx(LoginPage, {}) }));
        const email = screen.getByLabelText('Email, username, or phone number');
        const password = screen.getByLabelText('Password');
        const button = screen.getByRole('button', { name: /sign in/i });
        fireEvent.change(email, { target: { value: 'test@example.com' } });
        fireEvent.change(password, { target: { value: 'secret' } });
        fireEvent.click(button);
        yield waitFor(() => {
            // LoginPage calls handleLogin(email, password, role) based on the route
            expect(handleLogin).toHaveBeenCalledWith('test@example.com', 'secret', 'teacher');
        });
    }));
    it('shows error when handleLogin rejects', () => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b;
        (_b = (_a = handleLogin).mockRejectedValue) === null || _b === void 0 ? void 0 : _b.call(_a, new Error('Bad credentials'));
        render(_jsx(MemoryRouter, { initialEntries: ["/teacher/login"], children: _jsx(LoginPage, {}) }));
        const email = screen.getByLabelText('Email, username, or phone number');
        const password = screen.getByLabelText('Password');
        const button = screen.getByRole('button', { name: /sign in/i });
        fireEvent.change(email, { target: { value: 'wrong@example.com' } });
        fireEvent.change(password, { target: { value: 'wrong' } });
        fireEvent.click(button);
        yield waitFor(() => {
            expect(screen.getByText(/bad credentials/i)).toBeInTheDocument();
        });
    }));
});
