# Qubit CRM

Sistema CRM completo desarrollado con React, Vite y Firebase. Incluye gestión de productos, clientes, ventas, marketing digital y más.

## 🚀 Características

### Módulos Principales
- **Dashboard**: Panel de control con métricas y gráficos
- **Productos**: Gestión completa de inventario con imágenes y presentaciones
- **Clientes**: Base de datos de clientes con información detallada
- **Ventas**: Registro y seguimiento de ventas con facturación electrónica
- **Marketing**: Integración con Meta API (Facebook/Instagram) para métricas reales
- **Correo**: Sistema de correo integrado
- **Tareas**: Gestión de tareas y actividades
- **Reportes**: Análisis y reportes detallados

### Características Técnicas
- ⚡ **React 18** con Vite para desarrollo rápido
- 🔥 **Firebase** para backend y almacenamiento
- 🎨 **Tailwind CSS** para estilos
- 📊 **Recharts** para visualización de datos
- 🎭 **Sistema de Temas** (Profesional, Hacker, Cálido, Oscuro, Minimalista)
- 🌐 **Multi-moneda** (USD/PEN)
- 📅 **Sincronización de tiempo** con API de red
- 📱 **Diseño Responsive**

## 📋 Requisitos Previos

- Node.js 18+ 
- npm o yarn
- Cuenta de Firebase
- (Opcional) Cuenta de Meta Developers para integración de Marketing

## 🛠️ Instalación

1. **Clonar el repositorio**
```bash
git clone https://github.com/tu-usuario/qubit-crm.git
cd qubit-crm
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
Crea un archivo `.env` en la raíz del proyecto:
```env
VITE_FIREBASE_API_KEY=tu_api_key
VITE_FIREBASE_AUTH_DOMAIN=tu_auth_domain
VITE_FIREBASE_PROJECT_ID=tu_project_id
VITE_FIREBASE_STORAGE_BUCKET=tu_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=tu_messaging_sender_id
VITE_FIREBASE_APP_ID=tu_app_id

# Opcional: Para integración con Meta (Facebook/Instagram)
VITE_META_APP_ID=tu_meta_app_id
VITE_META_APP_SECRET=tu_meta_app_secret
VITE_META_REDIRECT_URI=http://localhost:3000/api/marketing/callback
VITE_API_URL=http://localhost:3000/api
```

4. **Iniciar servidor de desarrollo**
```bash
npm run dev
```

5. **Abrir en el navegador**
```
http://localhost:5173
```

## 🏗️ Estructura del Proyecto

```
cubic-crm/
├── src/
│   ├── components/      # Componentes reutilizables
│   │   ├── Header.jsx
│   │   ├── Sidebar.jsx
│   │   ├── Layout.jsx
│   │   └── ThemeSelector.jsx
│   ├── contexts/        # Contextos de React
│   │   ├── CurrencyContext.jsx
│   │   └── ThemeContext.jsx
│   ├── pages/           # Páginas principales
│   │   ├── Dashboard.jsx
│   │   ├── Productos.jsx
│   │   ├── Clientes.jsx
│   │   ├── Ventas.jsx
│   │   ├── Marketing.jsx
│   │   └── ...
│   ├── utils/           # Utilidades
│   │   ├── firebaseUtils.js
│   │   ├── dateUtils.js
│   │   └── metaApi.js
│   ├── config/          # Configuración
│   │   └── firebase.js
│   └── App.jsx
├── backend/             # Backend para Meta API
│   ├── routes/
│   │   └── marketing.js
│   └── server.js
├── public/              # Archivos estáticos
└── package.json
```

## 🎨 Temas Disponibles

El sistema incluye 5 temas predefinidos:

1. **Profesional** - Estilo corporativo limpio (por defecto)
2. **Hacker** - Estilo terminal con líneas verdes sobre negro
3. **Cálido** - Colores cálidos y acogedores
4. **Oscuro** - Modo oscuro profesional
5. **Minimalista** - Diseño limpio y minimalista

Cambia el tema desde el selector en el Header.

## 📦 Build para Producción

```bash
npm run build
```

Los archivos optimizados se generarán en la carpeta `dist/`.

## 🔧 Configuración de Firebase

1. Crea un proyecto en [Firebase Console](https://console.firebase.google.com/)
2. Habilita Firestore Database
3. Configura las reglas de seguridad
4. Copia las credenciales a tu archivo `.env`

## 📱 Integración con Meta (Facebook/Instagram)

Para usar las métricas reales de redes sociales:

1. Crea una app en [Facebook for Developers](https://developers.facebook.com/)
2. Agrega los productos "Instagram Graph API" y "Facebook Login"
3. Configura la URL de redirección
4. Agrega las variables de entorno en `.env`
5. Inicia el backend: `cd backend && npm install && npm start`
6. Conecta tus cuentas desde Marketing → Configuración

## 🚀 Despliegue

### Vercel / Netlify
```bash
npm run build
# Sube la carpeta dist/ a tu plataforma de hosting
```

### Firebase Hosting
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
npm run build
firebase deploy
```

## 📝 Licencia

Este proyecto es privado y de uso exclusivo.

## 👨‍💻 Autor

**Jeampier**
- Email: jeampier@niuspace-com.net

## 🙏 Agradecimientos

- React Team
- Firebase
- Tailwind CSS
- Recharts
- Lucide Icons

---

Desarrollado con ❤️ usando React y Vite
"# CUBIC-CRM" 
