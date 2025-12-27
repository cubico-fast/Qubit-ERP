# Script de PowerShell para sincronizar la app híbrida Android
# Autor: Sistema Cubic
# Fecha: Diciembre 2025

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SINCRONIZACIÓN DE APP HÍBRIDA ANDROID" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar si Node.js está instalado
Write-Host "► Verificando Node.js..." -ForegroundColor Yellow
$nodeVersion = node --version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Error: Node.js no está instalado o no está en el PATH" -ForegroundColor Red
    Write-Host "  Por favor, instala Node.js desde https://nodejs.org/" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Node.js detectado: $nodeVersion" -ForegroundColor Green
Write-Host ""

# Verificar si npm está disponible
Write-Host "► Verificando npm..." -ForegroundColor Yellow
$npmVersion = npm --version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Error: npm no está disponible" -ForegroundColor Red
    exit 1
}
Write-Host "✓ npm detectado: v$npmVersion" -ForegroundColor Green
Write-Host ""

# Paso 1: Compilar la aplicación web
Write-Host "► PASO 1: Compilando aplicación web para Capacitor..." -ForegroundColor Yellow
Write-Host "  Ejecutando: npm run build:capacitor" -ForegroundColor Gray
npm run build:capacitor
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Error al compilar la aplicación web" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Compilación web completada exitosamente" -ForegroundColor Green
Write-Host ""

# Paso 2: Verificar que existe el directorio dist
Write-Host "► PASO 2: Verificando directorio de distribución..." -ForegroundColor Yellow
if (!(Test-Path -Path "dist")) {
    Write-Host "✗ Error: El directorio 'dist' no existe" -ForegroundColor Red
    Write-Host "  La compilación web puede haber fallado" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Directorio 'dist' encontrado" -ForegroundColor Green
Write-Host ""

# Paso 3: Sincronizar con Capacitor
Write-Host "► PASO 3: Sincronizando con Capacitor Android..." -ForegroundColor Yellow
Write-Host "  Ejecutando: npx cap sync android" -ForegroundColor Gray
npx cap sync android
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Error al sincronizar con Capacitor" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Sincronización completada exitosamente" -ForegroundColor Green
Write-Host ""

# Paso 4: Preguntar si desea abrir Android Studio
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✓ SINCRONIZACIÓN COMPLETADA CON ÉXITO" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$openStudio = Read-Host "¿Deseas abrir el proyecto en Android Studio? (S/N)"
if ($openStudio -eq "S" -or $openStudio -eq "s") {
    Write-Host ""
    Write-Host "► Abriendo Android Studio..." -ForegroundColor Yellow
    npx cap open android
    Write-Host "✓ Android Studio abierto" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "► Para abrir Android Studio manualmente, ejecuta:" -ForegroundColor Yellow
    Write-Host "  npx cap open android" -ForegroundColor Gray
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  PROCESO COMPLETADO" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Próximos pasos:" -ForegroundColor Yellow
Write-Host "1. En Android Studio, conecta un dispositivo o inicia un emulador" -ForegroundColor Gray
Write-Host "2. Haz clic en el botón 'Run' (▶️) para compilar e instalar la app" -ForegroundColor Gray
Write-Host "3. Prueba el menú sidebar en el dispositivo móvil" -ForegroundColor Gray
Write-Host ""
Write-Host "Mejoras implementadas:" -ForegroundColor Yellow
Write-Host "✓ Z-index corregido para sidebar (999-1000)" -ForegroundColor Gray
Write-Host "✓ Soporte táctil mejorado con touch-manipulation" -ForegroundColor Gray
Write-Host "✓ Tamaño mínimo de 44x44px para elementos táctiles" -ForegroundColor Gray
Write-Host "✓ Prevención de scroll cuando sidebar está abierto" -ForegroundColor Gray
Write-Host "✓ Hardware acceleration habilitada en WebView" -ForegroundColor Gray
Write-Host ""
