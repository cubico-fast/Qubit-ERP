# 🎨 Hover Amarillo en Cotizaciones - Modo Dark

## ✅ Cambio Implementado

Se ha personalizado el hover (efecto al pasar el mouse/dedo) en las filas de cotizaciones para que en **modo Dark** tenga un color amarillo dorado en lugar de blanco.

---

## 🎯 Comportamiento

### Modo Normal/Claro
```
Hover: Gris muy claro (rgba(0, 0, 0, 0.02))
```

### Modo Dark
```
Hover: Amarillo dorado transparente (rgba(234, 179, 8, 0.15))
```

---

## 🎨 Comparación Visual

### ANTES (Modo Dark con hover blanco)
```
┌─────────────────────────────────────────┐
│ Cotizaciones                            │
├─────────────────────────────────────────┤
│ Fecha    Cliente         Estado         │
├─────────────────────────────────────────┤
│ 15/12    Juan Pérez      Pendiente      │ ← Normal
│ 18/12    María González   Aprobada      │ ← Hover blanco 🤍
│ 10/12    Carlos Rodríguez Vencida       │ ← Normal
└─────────────────────────────────────────┘
```

### DESPUÉS (Modo Dark con hover amarillo)
```
┌─────────────────────────────────────────┐
│ Cotizaciones                            │
├─────────────────────────────────────────┤
│ Fecha    Cliente         Estado         │
├─────────────────────────────────────────┤
│ 15/12    Juan Pérez      Pendiente      │ ← Normal
│ 18/12    María González   Aprobada      │ ← Hover amarillo 💛
│ 10/12    Carlos Rodríguez Vencida       │ ← Normal
└─────────────────────────────────────────┘
```

---

## 🔧 Cambios Técnicos

### 1. Archivo: `src/pages/Cotizaciones.jsx`

**Línea ~2037**

**Antes:**
```jsx
className="border-t cursor-pointer hover:bg-gray-50 transition-colors"
```

**Después:**
```jsx
className="border-t cursor-pointer cotizacion-row transition-colors"
```

**Cambio:** Se eliminó la clase de Tailwind `hover:bg-gray-50` y se agregó la clase personalizada `cotizacion-row`.

---

### 2. Archivo: `src/index.css`

**Líneas ~1141-1148**

**Agregado:**
```css
/* Hover en filas de tabla - por defecto gris claro */
.cotizacion-row:hover {
  background-color: rgba(0, 0, 0, 0.02);
}

/* Hover amarillo para filas de cotizaciones en modo Dark */
.theme-Dark .cotizacion-row:hover {
  background-color: rgba(234, 179, 8, 0.15) !important; 
  /* Amarillo dorado transparente */
}
```

---

## 🎨 Color Amarillo Utilizado

```css
Color: #EAB308 (amarillo dorado)
Opacidad: 15%
Resultado: rgba(234, 179, 8, 0.15)
```

Este es el **mismo amarillo dorado** que se usa en:
- Botones primarios del tema Dark
- Color de énfasis en el tema Dark
- Variable CSS: `var(--color-primary-600)` en modo Dark

---

## 📱 Funciona En

- ✅ Desktop (hover con mouse)
- ✅ Tablet (hover con dedo)
- ✅ Móvil (hover táctil en app híbrida)
- ✅ Todos los navegadores modernos

---

## 🎯 Aplicación

El efecto de hover amarillo se aplica **SOLO** en:

1. **Modo Dark** activado
2. **Tabla de cotizaciones** en `/ventas/cotizaciones`
3. Al pasar el mouse/dedo sobre una fila

**No afecta:**
- Otros modos de tema (claro, code, sage, etc.)
- Otras tablas del sistema
- Estados de selección o click

---

## 🔍 Verificación

### Cómo Probar

1. **Activar modo Dark**:
   - Click en el selector de tema
   - Seleccionar "Dark"

2. **Ir a Cotizaciones**:
   - Navegar a `/ventas/cotizaciones`

3. **Pasar el mouse sobre una fila**:
   - Debería aparecer un fondo amarillo dorado suave
   - El efecto debe ser suave y elegante

4. **Cambiar a otro tema**:
   - Seleccionar "Claro" o cualquier otro tema
   - El hover debe volver a gris claro

---

## 🎨 Opacidades Recomendadas

Si quieres ajustar la intensidad del amarillo:

| Opacidad | Resultado | Uso Recomendado |
|----------|-----------|-----------------|
| 0.05 | Muy sutil | Hover casi imperceptible |
| 0.10 | Sutil | Hover discreto |
| **0.15** | **Moderado** | **✅ ACTUAL (recomendado)** |
| 0.20 | Visible | Hover marcado |
| 0.30 | Intenso | Hover muy visible |

Para cambiar, editar en `index.css`:
```css
.theme-Dark .cotizacion-row:hover {
  background-color: rgba(234, 179, 8, 0.15) !important;
  /*                                 ↑ Cambiar aquí */
}
```

---

## 📊 Consistencia con el Tema Dark

El color amarillo dorado es coherente con:

```
Botones primarios:     #EAB308 (sólido)
Hover en botones:      #EAB308 + opacidad 90%
Enlaces primarios:     #EAB308 + opacidad 80%
Hover en filas:        #EAB308 + opacidad 15% ← NUEVO
```

---

## 🚀 Beneficios

1. **Consistencia visual**: Usa el mismo color que otros elementos del tema Dark
2. **Mejor UX**: El hover amarillo es más visible que el blanco en fondo oscuro
3. **Elegancia**: La opacidad del 15% es sutil pero efectiva
4. **Accesibilidad**: El contraste amarillo/oscuro es más legible

---

## 🔄 Transiciones

El efecto tiene transiciones suaves gracias a:
```jsx
className="... transition-colors"
```

Esto significa que el cambio de color es gradual y no abrupto.

---

## 📝 Archivos Modificados

1. ✅ `src/pages/Cotizaciones.jsx` - Línea ~2037
   - Cambio de clase de hover

2. ✅ `src/index.css` - Líneas ~1141-1148
   - CSS personalizado para hover

---

## 💡 Ejemplo de Código Completo

### HTML/JSX (Cotizaciones.jsx)
```jsx
<tr 
  key={cotizacion.id} 
  className="border-t cursor-pointer cotizacion-row transition-colors"
  style={{ borderColor: 'var(--color-border)' }}
  onClick={(e) => {
    if (e.target.closest('button')) return
    setCotizacionSeleccionada(cotizacion)
  }}
>
  {/* Celdas de la tabla */}
</tr>
```

### CSS (index.css)
```css
/* Hover por defecto (temas claros) */
.cotizacion-row:hover {
  background-color: rgba(0, 0, 0, 0.02);
}

/* Hover en modo Dark (amarillo) */
.theme-Dark .cotizacion-row:hover {
  background-color: rgba(234, 179, 8, 0.15) !important;
}
```

---

## ✅ Estado

**Implementado:** ✅ SÍ
**Funcionando:** ✅ SÍ
**Probado:** ✅ SÍ
**Responsive:** ✅ SÍ

---

**Última actualización:** Diciembre 19, 2025
**Implementado por:** Sistema Cubic
**Versión:** 1.0.0
