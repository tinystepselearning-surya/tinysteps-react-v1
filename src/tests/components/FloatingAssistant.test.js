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
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import FloatingAssistant from '../../components/common/FloatingAssistant';
import useAuthStore from '../../store/useAuthStore';
import { act } from 'react';
describe('FloatingAssistant', () => {
    const rafBackup = global.requestAnimationFrame;
    beforeEach(() => {
        vi.useFakeTimers();
        // stub requestAnimationFrame to immediate callback to avoid animation scheduling triggers
        // framer-motion uses RAF internally which can cause unwrapped updates in tests
        // @ts-ignore
        global.requestAnimationFrame = (cb) => cb(0);
    });
    afterEach(() => {
        useAuthStore.setState({ user: null });
        vi.useRealTimers();
        // restore RAF
        // @ts-ignore
        global.requestAnimationFrame = rafBackup;
    });
    it('renders for anonymous users', () => __awaiter(void 0, void 0, void 0, function* () {
        act(() => useAuthStore.setState({ user: null }));
        act(() => render(_jsx(FloatingAssistant, {})));
        // advance timers to flush the setTimeout in the component
        yield act(() => __awaiter(void 0, void 0, void 0, function* () { vi.runAllTimers(); yield Promise.resolve(); }));
        expect(screen.getByText(/Ask TinySteps/i)).toBeInTheDocument();
        expect(screen.getByText(/WhatsApp Advisor/i)).toBeInTheDocument();
    }));
    it('does not render for logged-in users', () => __awaiter(void 0, void 0, void 0, function* () {
        act(() => useAuthStore.setState({ user: { uid: 'u1', email: 'test@example.com', displayName: 'Test', role: 'parent' } }));
        act(() => render(_jsx(FloatingAssistant, {})));
        yield act(() => __awaiter(void 0, void 0, void 0, function* () { vi.runAllTimers(); yield Promise.resolve(); }));
        // should not find the label
        expect(screen.queryByText(/Ask TinySteps/i)).toBeNull();
    }));
});
