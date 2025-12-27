# Instrucciones para Actualizar la App Híbrida Android

## Cambios Implementados

Se han actualizado los siguientes archivos para mejorar el soporte táctil del menú sidebar en dispositivos móviles:

### 1. Archivos Web (React)
- ✅ `src/components/Sidebar.jsx` - Mejoras en z-index, soporte táctil y prevención de scroll
- ✅ `src/components/Layout.jsx` - Ajustes en z-index del botón de apertura
- ✅ `src/index.css` - Nuevos estilos CSS para móvil y soporte táctil mejorado

### 2. Archivos Android (Capacitor)
- ✅ `android/app/src/main/java/com/CubicOne/app/MainActivity.java` - Configuración de WebView optimizada
- ✅ `android/app/src/main/AndroidManifest.xml` - Hardware acceleration y configuraciones táctiles
- ✅ `capacitor.config.json` - Configuración de plugins y servidor
- ✅ `package.json` - Nuevos scripts de sincronización

## Cómo Sincronizar los Cambios con la App Android

### Opción 1: Sincronización Completa (Recomendada)

```bash
# 1. Compilar la aplicación web para Capacitor
npm run build:capacitor

# 2. Sincronizar con Android
npx cap sync android

# 3. Abrir en Android Studio
npx cap open android
```

### Opción 2: Usar el Script Simplificado

```bash
# Todo en un comando
npm run cap:sync:android

# Para abrir Android Studio después
npm run cap:open:android
```

### Opción 3: Compilar y Ejecutar Directamente

```bash
# Compila, sincroniza y ejecuta en dispositivo conectado
npm run cap:run:android
```

## Compilar APK/AAB desde Android Studio

1. Abre el proyecto en Android Studio:
   ```bash
   npm run cap:open:android
   ```

2. En Android Studio:
   - Para APK de debug: `Build > Build Bundle(s) / APK(s) > Build APK(s)`
   - Para AAB de release: `Build > Generate Signed Bundle / APK`

3. Ubicación de los archivos generados:
   - APK: `android/app/build/outputs/apk/debug/app-debug.apk`
   - AAB: `android/app/build/outputs/bundle/release/app-release.aab`

## Mejoras Implementadas en la App Híbrida

### WebView Optimizations
- ✅ Hardware acceleration habilitada
- ✅ DOM storage y database habilitados
- ✅ Viewport configurado para mejor responsive
- ✅ Text autosizing para mejor legibilidad

### Soporte Táctil Mejorado
- ✅ Z-index corregido para sidebar y overlay (999-1000)
- ✅ Touch manipulation en todos los elementos interactivos
- ✅ Tamaño mínimo de 44x44px para elementos táctiles
- ✅ Prevención de scroll del body cuando sidebar está abierto
- ✅ Smooth scrolling en el sidebar

### Configuración de AndroidManifest
- ✅ `hardwareAccelerated="true"` - Mejor rendimiento gráfico
- ✅ `largeHeap="true"` - Más memoria disponible
- ✅ `windowSoftInputMode="adjustResize"` - Mejor manejo del teclado

### Capacitor Config
- ✅ Android scheme HTTPS configurado
- ✅ SplashScreen personalizada con color primario
- ✅ Keyboard resize configurado
- ✅ Debug habilitado para desarrollo

## Verificar que Todo Funciona

1. **Compilar y sincronizar:**
   ```bash
   npm run cap:sync:android
   ```

2. **Verificar en el emulador o dispositivo:**
   - El menú sidebar debe abrir y cerrar correctamente
   - Los toques en los elementos del menú deben responder instantáneamente
   - El overlay oscuro debe cerrar el menú al tocarlo
   - No debe haber scroll del contenido cuando el menú está abierto

3. **Si hay problemas:**
   - Limpiar cache de Android Studio: `Build > Clean Project`
   - Invalidar caches: `File > Invalidate Caches / Restart`
   - Recompilar: `Build > Rebuild Project`

## Dependencias Necesarias

Asegúrate de tener instalado:

- ✅ Node.js (v16 o superior)
- ✅ npm o yarn
- ✅ Android Studio
- ✅ SDK de Android (API 24 o superior)
- ✅ Java JDK 11 o superior

## Solución de Problemas Comunes

### Error: "Capacitor not found"
```bash
npm install @capacitor/core @capacitor/cli --save
```

### Error: "Android SDK not found"
Configura la variable de entorno `ANDROID_HOME` apuntando a tu SDK de Android.

### Error: "Build failed"
1. Abre Android Studio
2. Limpia el proyecto: `Build > Clean Project`
3. Sincroniza Gradle: `File > Sync Project with Gradle Files`

### El menú no funciona en la app
1. Verifica que ejecutaste `npm run cap:sync:android`
2. Asegúrate de que la compilación web se completó: verifica que existe `dist/index.html`
3. Limpia y reconstruye la app en Android Studio

## Notas Adicionales

- Los cambios en archivos `.jsx` o `.css` requieren recompilar con `npm run build:capacitor`
- Los cambios en archivos `.java` o `.xml` solo requieren recompilar en Android Studio
- Después de cada cambio significativo, ejecuta `npx cap sync android`

## Contacto y Soporte

Si encuentras problemas, revisa:
1. Los logs de Android Studio (Logcat)
2. La consola del navegador dentro de la WebView (Chrome DevTools)
3. Los logs de compilación de Vite

---

**Última actualización:** Diciembre 2025
**Versión de la app:** 1.0.0
