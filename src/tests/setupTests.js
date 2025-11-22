var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import '@testing-library/jest-dom';
import { vi, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
// Prevent firebase/analytics from attempting IndexedDB access during Node tests.
// Many firebase analytics APIs call IndexedDB when running in browser-like
// environments; in the test runner we prefer to disable analytics entirely.
vi.mock('firebase/analytics', () => ({
    // isSupported is used by Firebase to guard analytics initialization.
    isSupported: () => __awaiter(void 0, void 0, void 0, function* () { return false; }),
    getAnalytics: () => null,
    logEvent: () => { },
}));
// Some libraries attempt to access indexedDB directly. Ensure it's undefined in the
// test environment to avoid misleading runtime warnings.
// (If a test needs a real indexedDB, it should polyfill it explicitly.)
// @ts-ignore
globalThis.indexedDB = undefined;
// Filter only the specific Firebase analytics / IndexedDB warning messages
// that are expected in a Node test environment. Keep all other warnings.
const originalWarn = console.warn.bind(console);
const firebaseWarningPatterns = [
    // Exact or leading phrases from firebase analytics module
    'Firebase Analytics is not supported in this environment. Wrap initialization of analytics in analytics.isSupported() to prevent initialization in unsupported environments.',
    'IndexedDB unavailable or restricted in this environment. Wrap initialization of analytics in analytics.isSupported() to prevent initialization in unsupported environments.',
    // Prefix for IndexedDB open errors from Firebase code
    'Error thrown when opening IndexedDB. Original error:',
];
console.warn = (...args) => {
    var _a;
    try {
        const raw = args[0];
        const msg = typeof raw === 'string' ? raw : (_a = raw === null || raw === void 0 ? void 0 : raw.message) !== null && _a !== void 0 ? _a : String(raw);
        if (typeof msg === 'string') {
            for (const pattern of firebaseWarningPatterns) {
                if (msg.includes(pattern)) {
                    // swallow this known Firebase analytics / IDB warning
                    return;
                }
            }
        }
    }
    catch (e) {
        // fallthrough to default warn
    }
    return originalWarn(...args);
};
// Ensure cleanup after each test and clear mocks to avoid cross-test leakage.
afterEach(() => {
    try {
        cleanup();
    }
    finally {
        vi.clearAllMocks();
    }
});
