import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Ensure proper base path for SPA routing
  base: '/',
  build: {
    // Generate source maps for better debugging
    sourcemap: true,
    // Optimize build output
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          supabase: ['@supabase/supabase-js']
        }
      }
    }
  },
  // Development server configuration
  server: {
    // Ensure SPA routing works in development
    historyApiFallback: true,
    port: 3000,
    open: true
  }
})
