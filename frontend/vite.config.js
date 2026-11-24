import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    // Utility tests run in plain Node (some of them change the time zone). Component and page tests
    // opt in to a browser-like DOM with a "// @vitest-environment jsdom" comment on their first line.
    environment: 'node',
    setupFiles: ['./src/test/setup.js'],
    include: ['src/**/*.test.{js,jsx}'],
  },
})
