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
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { vi } from 'vitest';
import Login from '../../pages/Login';
// Mock the Firebase auth
vi.mock('firebase/auth', () => ({
    signInWithEmailAndPassword: vi.fn(),
    onAuthStateChanged: vi.fn(),
    signOut: vi.fn(),
}));
vi.mock('../../lib/firebaseConfig', () => ({
    auth: {},
}));
// Mock react-router-dom
vi.mock('react-router-dom', () => ({
    useNavigate: () => vi.fn(),
}));
describe('LoginForm', () => {
    test('Renders form fields', () => {
        render(_jsx(Login, {}));
        expect(screen.getByPlaceholderText('Email address')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
    });
    test('Submits form', () => __awaiter(void 0, void 0, void 0, function* () {
        const onLogin = vi.fn();
        render(_jsx(Login, { onLogin: onLogin }));
        yield act(() => __awaiter(void 0, void 0, void 0, function* () {
            fireEvent.change(screen.getByPlaceholderText('Email address'), {
                target: { value: 'test@test.com' }
            });
            fireEvent.change(screen.getByPlaceholderText('Password'), {
                target: { value: 'password123' }
            });
            fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
        }));
        yield waitFor(() => {
            expect(onLogin).toHaveBeenCalledWith('test@test.com', 'password123');
        });
    }));
    test('Shows error on invalid login', () => __awaiter(void 0, void 0, void 0, function* () {
        const onLogin = vi.fn().mockRejectedValue(new Error('Invalid credentials'));
        render(_jsx(Login, { onLogin: onLogin }));
        yield act(() => __awaiter(void 0, void 0, void 0, function* () {
            fireEvent.change(screen.getByPlaceholderText('Email address'), {
                target: { value: 'wrong@test.com' }
            });
            fireEvent.change(screen.getByPlaceholderText('Password'), {
                target: { value: 'wrongpass' }
            });
            fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
        }));
        yield waitFor(() => {
            expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
        });
    }));
    test('Shows loading state', () => __awaiter(void 0, void 0, void 0, function* () {
        const onLogin = vi.fn(() => new Promise(() => { })); // Never resolves
        render(_jsx(Login, { onLogin: onLogin }));
        yield act(() => __awaiter(void 0, void 0, void 0, function* () {
            fireEvent.change(screen.getByPlaceholderText('Email address'), {
                target: { value: 'test@test.com' }
            });
            fireEvent.change(screen.getByPlaceholderText('Password'), {
                target: { value: 'password123' }
            });
            fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
        }));
        expect(screen.getByText('Signing in...')).toBeInTheDocument();
    }));
});
