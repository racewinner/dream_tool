import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',  // Listen on all network interfaces
    strictPort: true, // Fail if port is already in use
    port: 5173,       // Specify the port explicitly
    cors: true,       // Enable CORS for all origins
    hmr: {
      // Stabilize HMR to prevent frequent restarts
      overlay: false, // Disable the error overlay which can cause issues
      timeout: 120000, // Increase timeout to 2 minutes
      clientPort: 5173 // Ensure consistent HMR port
    },
    watch: {
      // Reduce file system watching overhead
      usePolling: false,
      interval: 1000,
      binaryInterval: 3000
    }
  },
  // Increase memory limit for large builds
  build: {
    chunkSizeWarningLimit: 2500, // Increase chunk size warning limit
    commonjsOptions: {
      transformMixedEsModules: true // Better compatibility
    }
  }
})
