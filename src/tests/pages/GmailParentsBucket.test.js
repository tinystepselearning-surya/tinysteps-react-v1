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
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import GmailParentsBucket from '../../pages/admin/UserManagement/GmailParentsBucket';
vi.mock('firebase/firestore', () => __awaiter(void 0, void 0, void 0, function* () {
    const original = yield vi.importActual('firebase/firestore');
    return Object.assign(Object.assign({}, original), { getDocs: vi.fn().mockResolvedValue({ docs: [{ id: 'p1', data: () => ({ email: 'a@gmail.com', name: 'Parent One', role: 'parent', provider: 'google.com' }) }] }), collection: vi.fn(), query: vi.fn(), where: vi.fn(), orderBy: vi.fn() });
}));
describe('GmailParentsBucket', () => {
    it('renders and shows parents list', () => __awaiter(void 0, void 0, void 0, function* () {
        render(_jsx(GmailParentsBucket, { open: true }));
        expect(yield screen.findByText('Gmail Signups (Parents)')).toBeInTheDocument();
        expect(yield screen.findByText('Parent One')).toBeInTheDocument();
    }));
});
