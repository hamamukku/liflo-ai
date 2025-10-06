import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

// Vite configuration for the Liflo frontend.
// The dev server runs on port 5173 by default.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
});