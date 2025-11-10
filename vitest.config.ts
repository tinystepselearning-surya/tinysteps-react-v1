import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@components': path.resolve(__dirname, 'src/components'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/tests/setupTests.ts',
  },
})
