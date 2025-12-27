@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

color 0B
echo ========================================
echo   SINCRONIZACIÓN DE APP HÍBRIDA ANDROID
echo ========================================
echo.

REM Verificar si Node.js está instalado
echo [►] Verificando Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    color 0C
    echo [✗] Error: Node.js no está instalado o no está en el PATH
    echo     Por favor, instala Node.js desde https://nodejs.org/
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo [✓] Node.js detectado: %NODE_VERSION%
echo.

REM Verificar si npm está disponible
echo [►] Verificando npm...
npm --version >nul 2>&1
if errorlevel 1 (
    color 0C
    echo [✗] Error: npm no está disponible
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo [✓] npm detectado: v%NPM_VERSION%
echo.

REM Paso 1: Compilar la aplicación web
echo [►] PASO 1: Compilando aplicación web para Capacitor...
echo     Ejecutando: npm run build:capacitor
call npm run build:capacitor
if errorlevel 1 (
    color 0C
    echo [✗] Error al compilar la aplicación web
    pause
    exit /b 1
)
echo [✓] Compilación web completada exitosamente
echo.

REM Paso 2: Verificar que existe el directorio dist
echo [►] PASO 2: Verificando directorio de distribución...
if not exist "dist" (
    color 0C
    echo [✗] Error: El directorio 'dist' no existe
    echo     La compilación web puede haber fallado
    pause
    exit /b 1
)
echo [✓] Directorio 'dist' encontrado
echo.

REM Paso 3: Sincronizar con Capacitor
echo [►] PASO 3: Sincronizando con Capacitor Android...
echo     Ejecutando: npx cap sync android
call npx cap sync android
if errorlevel 1 (
    color 0C
    echo [✗] Error al sincronizar con Capacitor
    pause
    exit /b 1
)
echo [✓] Sincronización completada exitosamente
echo.

REM Mensaje de éxito
color 0A
echo ========================================
echo [✓] SINCRONIZACIÓN COMPLETADA CON ÉXITO
echo ========================================
echo.

REM Preguntar si desea abrir Android Studio
set /p OPEN_STUDIO="¿Deseas abrir el proyecto en Android Studio? (S/N): "
if /i "%OPEN_STUDIO%"=="S" (
    echo.
    echo [►] Abriendo Android Studio...
    call npx cap open android
    echo [✓] Android Studio abierto
) else (
    echo.
    echo [►] Para abrir Android Studio manualmente, ejecuta:
    echo     npx cap open android
)

echo.
echo ========================================
echo   PROCESO COMPLETADO
echo ========================================
echo.
echo Próximos pasos:
echo 1. En Android Studio, conecta un dispositivo o inicia un emulador
echo 2. Haz clic en el botón 'Run' (▶️) para compilar e instalar la app
echo 3. Prueba el menú sidebar en el dispositivo móvil
echo.
echo Mejoras implementadas:
echo [✓] Z-index corregido para sidebar (999-1000)
echo [✓] Soporte táctil mejorado con touch-manipulation
echo [✓] Tamaño mínimo de 44x44px para elementos táctiles
echo [✓] Prevención de scroll cuando sidebar está abierto
echo [✓] Hardware acceleration habilitada en WebView
echo.
pause
