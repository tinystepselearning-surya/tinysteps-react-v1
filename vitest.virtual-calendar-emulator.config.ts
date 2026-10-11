import {defineConfig} from 'vitest/config';

/** Intentionally separate from the production-project enrollment emulator suite. */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/tests/emulator/virtualCalendarAttendance.emulator.spec.ts'],
    testTimeout: 90_000,
    hookTimeout: 90_000,
    fileParallelism: false,
    maxWorkers: 1,
    minWorkers: 1,
  },
});
