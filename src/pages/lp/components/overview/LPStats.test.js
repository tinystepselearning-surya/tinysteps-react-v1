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
import { render, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { LPStats } from './LPStats';
import { getDoc } from 'firebase/firestore';
import { vi } from 'vitest';
vi.mock('firebase/firestore', () => ({
    getFirestore: vi.fn(),
    doc: vi.fn(),
    getDoc: vi.fn(),
}));
describe('LPStats Component', () => {
    const mockLpId = 'test-lp-id';
    const mockFirestore = {
        type: 'firestore',
        app: {},
        toJSON: vi.fn(() => ({})),
    };
    const mockMetadata = {
        hasPendingWrites: false,
        fromCache: false,
        isEqual: vi.fn(() => true),
    };
    const mockRef = {
        converter: null,
        type: 'document',
        firestore: mockFirestore,
        id: 'mock-id',
        path: 'mock-path',
        parent: {},
        withConverter: vi.fn(),
        toJSON: vi.fn(() => ({})),
    };
    beforeEach(() => {
        vi.clearAllMocks();
    });
    it('renders loading state initially', () => __awaiter(void 0, void 0, void 0, function* () {
        // Prevent the getDoc promise from resolving so the component remains in loading state.
        getDoc.mockImplementation(() => new Promise(() => { }));
        // Synchronous render; we don't wait for effects so there are no async state updates
        // that would trigger act() warnings.
        render(_jsx(LPStats, { lpId: mockLpId }));
        expect(screen.getByRole('status')).toBeInTheDocument();
    }));
    it('renders error message when Firestore fetch fails', () => __awaiter(void 0, void 0, void 0, function* () {
        getDoc.mockRejectedValue(new Error('Firestore fetch failed'));
        yield act(() => __awaiter(void 0, void 0, void 0, function* () {
            render(_jsx(LPStats, { lpId: mockLpId }));
        }));
        yield waitFor(() => {
            expect(screen.getByText('Failed to fetch statistics. Please try again later.')).toBeInTheDocument();
        });
    }));
    it('renders error message when no data is found', () => __awaiter(void 0, void 0, void 0, function* () {
        getDoc.mockResolvedValue({
            exists: () => false,
            metadata: mockMetadata,
            id: 'mock-id',
            ref: mockRef,
            data: () => undefined,
            get: () => undefined,
            toJSON: () => ({}),
        });
        yield act(() => __awaiter(void 0, void 0, void 0, function* () {
            render(_jsx(LPStats, { lpId: mockLpId }));
        }));
        yield waitFor(() => {
            expect(screen.getByText('No statistics found for the given LP ID.')).toBeInTheDocument();
        });
    }));
    it('renders stats correctly when Firestore fetch succeeds', () => __awaiter(void 0, void 0, void 0, function* () {
        getDoc.mockResolvedValue({
            exists: () => true,
            metadata: mockMetadata,
            id: 'mock-id',
            ref: mockRef,
            data: () => ({
                totalFamilies: 10,
                totalTeachers: 5,
                totalStudents: 50,
                pendingPayments: 2,
                openTickets: 3,
                averageSatisfaction: 4.5,
            }),
            get: () => undefined,
            toJSON: () => ({}),
        });
        yield act(() => __awaiter(void 0, void 0, void 0, function* () {
            render(_jsx(LPStats, { lpId: mockLpId }));
        }));
        yield waitFor(() => {
            expect(screen.getByText('10')).toBeInTheDocument();
            expect(screen.getByText('5')).toBeInTheDocument();
            expect(screen.getByText('50')).toBeInTheDocument();
            expect(screen.getByText('2')).toBeInTheDocument();
            expect(screen.getByText('3')).toBeInTheDocument();
            expect(screen.getByText('4.5/5')).toBeInTheDocument();
        });
    }));
});
