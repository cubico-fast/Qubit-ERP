import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

// Detectar el entorno - Vercel siempre tiene VERCEL=1
const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV
const isNetlify = process.env.NETLIFY === 'true'
const isGitHubPages = process.env.GITHUB_PAGES === 'true' || process.env.GITHUB_ACTIONS || process.env.CI
const isCapacitor = process.env.CAPACITOR_BUILD === 'true'

// Determinar el base path
let basePath = '/'
if (process.env.VITE_BASE_PATH) {
  basePath = process.env.VITE_BASE_PATH
} else if (isCapacitor) {
  // Para Capacitor siempre usar raíz
  basePath = '/'
} else if (isVercel || isNetlify) {
  // Vercel y Netlify usan raíz
  basePath = '/'
} else if (isGitHubPages) {
  // GitHub Pages usa el nombre del repositorio
  basePath = '/CUBIC-CRM/'
} else {
  // Por defecto para desarrollo local
  basePath = '/'
}

console.log('🔧 Build config:', {
  isVercel,
  isNetlify,
  isGitHubPages,
  isCapacitor,
  basePath,
  VERCEL: process.env.VERCEL,
  VERCEL_ENV: process.env.VERCEL_ENV,
  CAPACITOR_BUILD: process.env.CAPACITOR_BUILD
})

export default defineConfig({
  plugins: [
    react(),
    // Plugin para ajustar rutas en index.html y crear 404.html después del build
    {
      name: 'fix-paths',
      closeBundle() {
        // Saltar ajustes de rutas si es un build para Capacitor
        if (isCapacitor) {
          console.log('📱 Build para Capacitor - omitiendo ajustes de rutas web')
          return
        }
        
        const distPath = join(process.cwd(), 'dist')
        const indexPath = join(distPath, 'index.html')
        const notFoundPath = join(distPath, '404.html')
        
        try {
          let indexContent = readFileSync(indexPath, 'utf-8')
          
          // Ajustar las rutas de los assets para que funcionen desde cualquier ruta
          // Reemplazar rutas absolutas que empiezan con /assets/ o /favicon.svg para que sean relativas o con basePath
          const repoName = '/CUBIC-CRM'
          
          // Función para ajustar rutas
          const fixPaths = (content) => {
            return content.replace(
              /(src|href)="\/(assets\/[^"]+|favicon\.svg|vite\.svg)"/g,
              (match, attr, path) => {
                // Si el basePath incluye el repo, usar ruta absoluta con el prefijo
                if (basePath.includes('CUBIC-CRM')) {
                  return `${attr}="${basePath}${path.substring(1)}"`
                }
                // Si no, usar ruta relativa
                return `${attr}="${path.substring(1)}"`
              }
            )
          }
          
          // Ajustar rutas en index.html si es para GitHub Pages
          if (basePath.includes('CUBIC-CRM')) {
            indexContent = fixPaths(indexContent)
            writeFileSync(indexPath, indexContent, 'utf-8')
            console.log('✅ Rutas ajustadas en index.html para GitHub Pages')
          }
          
          // Crear 404.html con rutas ajustadas
          let contentFor404 = readFileSync(indexPath, 'utf-8')
          
          // Para 404.html, usar rutas relativas para que funcionen desde cualquier ruta
          contentFor404 = contentFor404.replace(
            /(src|href)="(\/CUBIC-CRM\/)?(assets\/[^"]+|favicon\.svg|vite\.svg)"/g,
            (match, attr, base, path) => {
              return `${attr}="${path}"`
            }
          )
          
          // Agregar el script de ajuste de URL INMEDIATAMENTE después de <head> para que se ejecute primero
          // Este script debe ejecutarse de forma síncrona antes de cualquier otro script
          const urlFixScript = `
    <script>
      // Ajustar la URL INMEDIATAMENTE antes de que se cargue cualquier cosa
      // Este script debe ejecutarse de forma síncrona y bloqueante
      (function() {
        var path = window.location.pathname;
        var search = window.location.search;
        var hash = window.location.hash;
        var originalPath = path;
        
        // Detectar si estamos en GitHub Pages
        var isGitHubPages = window.location.hostname.includes('github.io');
        var repoName = '/CUBIC-CRM';
        var basePath = isGitHubPages ? repoName + '/' : '/';
        
        // Solo ajustar la URL si estamos en una página 404
        // No hacer nada si estamos cargando index.html normalmente
        if (path.includes('404.html')) {
          // Intentar obtener la ruta guardada en sessionStorage
          var savedPath = sessionStorage.getItem('ghp_404_redirect');
          if (savedPath) {
            path = savedPath;
            sessionStorage.removeItem('ghp_404_redirect');
          } else {
            // Si no hay ruta guardada, remover 404.html y usar la raíz
            path = path.replace('/404.html', '');
            if (!path || path === repoName || path === repoName + '/') {
              path = basePath;
            }
          }
          
          // Construir la nueva URL completa
          var newPath = path + search + hash;
          
          // Usar history.replaceState para cambiar la URL sin recargar
          if (window.history && window.history.replaceState) {
            try {
              if (originalPath !== newPath) {
                window.history.replaceState(null, '', newPath);
              }
            } catch (e) {
              console.warn('Error al ajustar URL:', e);
            }
          }
        } else {
          // Si no estamos en 404.html, guardar la ruta actual en sessionStorage
          // para que esté disponible si se carga un 404
          if (isGitHubPages && path && !path.includes('index.html') && !path.includes('404.html')) {
            try {
              sessionStorage.setItem('ghp_404_redirect', path);
            } catch (e) {
              // Si sessionStorage no está disponible, ignorar
            }
          }
        }
      })();
    </script>`
          
          // Insertar el script INMEDIATAMENTE después de <head> para máxima prioridad
          indexContent = indexContent.replace(
            /(<head[^>]*>)/,
            '$1' + urlFixScript
          )
          
          // Escribir el archivo 404.html
          writeFileSync(notFoundPath, indexContent, 'utf-8')
          console.log('✅ 404.html creado exitosamente')
        } catch (error) {
          console.error('❌ Error al crear 404.html:', error)
        }
      }
    }
  ],
  server: {
    port: 3000,
    open: true
  },
  base: basePath,
  build: {
    // Asegurar que los assets se generen correctamente
    assetsDir: 'assets',
    // No limitar el tamaño de los chunks para evitar problemas
    chunkSizeWarningLimit: 1000,
    // Asegurar que los assets se sirvan correctamente
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name].[ext]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js'
      }
    }
  }
})

