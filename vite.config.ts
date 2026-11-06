import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'supabase',
              test: /node_modules[\\/](?:@supabase|@standard-schema)[\\/]/,
              priority: 3,
            },
            {
              name: 'charts',
              test: /node_modules[\\/](recharts|d3-[^\\/]+)/,
              priority: 2,
            },
            {
              name: 'vendor',
              test: /node_modules[\\/](?!@supabase[\\/]|@standard-schema[\\/])/,
              priority: 1,
            },
          ],
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    restoreMocks: true,
  },
})
