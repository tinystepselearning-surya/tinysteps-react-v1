var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import { vi } from 'vitest';
import '@testing-library/jest-dom';
// Mock framer-motion to avoid animation/RAF scheduling during tests
vi.mock('framer-motion', () => {
    const React = require('react');
    const motion = new Proxy({}, {
        get: (_, prop) => {
            // Return a simple functional component that renders as a native element
            return (_a) => {
                var { children } = _a, rest = __rest(_a, ["children"]);
                // Remove common animation props which would cause React to forward them to DOM
                const filtered = Object.fromEntries(Object.entries(rest).filter(([k]) => !['initial', 'animate', 'whileHover', 'whileTap', 'whileDrag', 'transition', 'variants'].includes(k)));
                return React.createElement(typeof prop === 'string' ? prop : 'div', filtered, children);
            };
        }
    });
    return {
        motion,
        AnimatePresence: ({ children }) => React.createElement(React.Fragment, null, children),
        useAnimation: () => ({ start: vi.fn(), stop: vi.fn() }),
    };
});
// Stub requestAnimationFrame to run synchronously during tests.
// Some components (framer-motion) use RAF and cause act warnings if RAF is not stubbed.
const rafBackup = globalThis.requestAnimationFrame;
beforeEach(() => {
    // stub RAF to call immediately (framer-motion uses RAF internally)
    // @ts-ignore
    globalThis.requestAnimationFrame = (cb) => setTimeout(() => cb(Date.now()), 0);
});
afterEach(() => {
    // @ts-ignore
    globalThis.requestAnimationFrame = rafBackup;
    vi.restoreAllMocks();
});
