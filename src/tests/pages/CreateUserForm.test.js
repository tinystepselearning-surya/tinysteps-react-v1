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
import { CreateUserForm } from '../../pages/admin/UserManagement/CreateUserForm';
vi.mock('firebase/firestore', () => __awaiter(void 0, void 0, void 0, function* () {
    const original = yield vi.importActual('firebase/firestore');
    return Object.assign(Object.assign({}, original), { getDocs: vi.fn().mockResolvedValue({ docs: [{ id: 'kid1', data: () => ({ fullName: 'Test Kid' }) }] }), collection: vi.fn() });
}));
vi.mock('firebase/functions', () => __awaiter(void 0, void 0, void 0, function* () {
    const original = yield vi.importActual('firebase/functions');
    return Object.assign(Object.assign({}, original), { httpsCallable: vi.fn().mockReturnValue(() => __awaiter(void 0, void 0, void 0, function* () { return ({ data: { uid: 'uid1', email: 'a@b.com' } }); })) });
}));
describe('CreateUserForm UI', () => {
    test('renders without runtime errors and shows Assign kids label with KidMultiSelect', () => __awaiter(void 0, void 0, void 0, function* () {
        const onUserCreated = vi.fn();
        render(_jsx(CreateUserForm, { onUserCreated: onUserCreated }));
        // check static labels
        expect(screen.getByText('Email')).toBeInTheDocument();
        expect(screen.getByText('Full Name')).toBeInTheDocument();
        expect(screen.getByText('Assign kids (optional)')).toBeInTheDocument();
        // ensure the input placeholder from our KidMultiSelect is present
        // placeholder appears after async fetch; use findBy to wait for it
        yield screen.findByPlaceholderText('Assign kids...');
    }));
});
