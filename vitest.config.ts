import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'
import { realpathSync } from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
// Resolve symlink to real path for Windows Junction support
const realDirname = realpathSync(__dirname)

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: [path.resolve(realDirname, '__tests__/setup.ts')],
    include: ['__tests__/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: [
        'node_modules/',
        '__tests__/',
        '**/*.d.ts',
        '**/*.config.*',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(realDirname, './'),
    },
  },
  // Allow access to symlink target path (Windows Junction support)
  server: {
    fs: {
      allow: [
        // Allow access to both symlink path and real path
        __dirname,
        realDirname,
        // Allow workspace paths for symlink resolution
        path.dirname(realDirname),
        path.dirname(__dirname),
      ],
    },
  },
})