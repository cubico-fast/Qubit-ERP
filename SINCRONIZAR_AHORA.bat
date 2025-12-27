@echo off
chcp 65001 >nul
color 0E

echo ============================================
echo   CORRECCIÓN URGENTE - MENÚ CLICKEABLE
echo ============================================
echo.
echo [►] Aplicando corrección del overlay...
echo.

echo [1/3] Compilando aplicación web...
call npm run build:capacitor
if errorlevel 1 (
    color 0C
    echo [✗] Error en compilación
    pause
    exit /b 1
)
echo [✓] Compilación completada
echo.

echo [2/3] Sincronizando con Android...
call npx cap sync android
if errorlevel 1 (
    color 0C
    echo [✗] Error en sincronización
    pause
    exit /b 1
)
echo [✓] Sincronización completada
echo.

echo [3/3] Abriendo Android Studio...
call npx cap open android
echo.

color 0A
echo ============================================
echo [✓] CORRECCIÓN APLICADA EXITOSAMENTE
echo ============================================
echo.
echo CAMBIOS REALIZADOS:
echo [✓] Overlay ahora solo cubre el área derecha (deja libre el sidebar)
echo [✓] Todos los elementos del sidebar son clickeables
echo [✓] Z-index correcto: Sidebar (1000), Overlay (999)
echo.
echo PRÓXIMO PASO:
echo En Android Studio, presiona el botón Run (▶️)
echo para probar el menú corregido en tu dispositivo.
echo.
pause
