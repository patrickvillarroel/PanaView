import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// CRM de administración de PanaView.
// El backend Express corre por defecto en http://localhost:3000
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    open: true,
  },
});
