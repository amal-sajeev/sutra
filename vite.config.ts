import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/sutra/',
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-editor': ['@tiptap/react', '@tiptap/starter-kit'],
          'vendor-motion': ['framer-motion'],
          'vendor-data': ['dexie', 'zustand'],
          'vendor-d3': ['d3-force'],
        },
      },
    },
  },
})
