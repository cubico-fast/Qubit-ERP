import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true
  },
  // Configuración para GitHub Pages
  // Solo usar base path si está explícitamente definido
  base: process.env.VITE_BASE_PATH || '/CUBIC-CRM/',
  build: {
    // Asegurar que los assets se generen correctamente
    assetsDir: 'assets',
    // No limitar el tamaño de los chunks para evitar problemas
    chunkSizeWarningLimit: 1000
  }
})

