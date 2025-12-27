# 🚀 Inicio Rápido - App Híbrida Android

## ⚡ Sincronización en 3 Pasos

### Windows (PowerShell)
```powershell
.\sync-android.ps1
```

### Windows (CMD)
```cmd
sync-android.bat
```

### Linux/Mac o Manual
```bash
npm run cap:sync:android
npm run cap:open:android
```

---

## 📱 Probar en Dispositivo

### 1. Conectar dispositivo Android por USB
- Activar "Opciones de desarrollador" en el dispositivo
- Activar "Depuración USB"
- Conectar por USB y autorizar la computadora

### 2. En Android Studio
- Esperar a que Gradle termine de sincronizar
- Seleccionar el dispositivo en la barra superior
- Click en el botón **Run** (▶️)

### 3. En el Emulador
- En Android Studio: `Tools > Device Manager`
- Crear un AVD (Android Virtual Device) si no existe
- Iniciar el emulador
- Click en el botón **Run** (▶️)

---

## ✅ Qué Esperar

Después de instalar la app, deberías ver:
- ✅ Menú sidebar que se abre/cierra con el botón hamburguesa
- ✅ Overlay oscuro que cierra el menú al tocarlo
- ✅ Elementos del menú táctiles y responsivos
- ✅ Sin scroll del contenido cuando el menú está abierto
- ✅ Transiciones suaves y rápidas

---

## 🔧 Comandos Útiles

```bash
# Ver logs en tiempo real
npm run cap:run:android

# Solo sincronizar sin abrir Android Studio
npm run cap:sync:android

# Abrir Android Studio
npm run cap:open:android

# Compilar solo la web
npm run build:capacitor
```

---

## ❓ Problemas Comunes

**Error: "Capacitor not found"**
```bash
npm install
```

**Error: "Build failed"**
1. Abrir Android Studio
2. `Build > Clean Project`
3. `Build > Rebuild Project`

**El menú no funciona**
1. Asegúrate de haber ejecutado `npm run cap:sync:android`
2. Limpia y reconstruye en Android Studio

---

## 📖 Documentación Completa

Para más detalles, consulta:
- `INSTRUCCIONES_APP_HIBRIDA.md` - Guía completa
- `CAMBIOS_MENU_MOVIL.md` - Lista de todos los cambios

---

**¿Listo? Ejecuta** `.\sync-android.ps1` **y prueba la app! 🚀**
