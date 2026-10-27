import { defineConfig } from 'vitest/config'

export default defineConfig({
  envDir: false,
  test: {
    env: {
      VITE_PATH_TO_SERVER: 'https://example.test/',
      VITE_PATH_TO_API: 'api/',
    },
    include: ['src/**/*.test.{ts,tsx}'],
    environment: 'node',
    clearMocks: true,
  },
})
