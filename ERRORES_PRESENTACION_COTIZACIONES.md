# ERRORES EN LA SECCIÓN DE PRESENTACIÓN - COTIZACIONES

## Error Principal: "Rendered fewer hooks than expected"

Este error ocurre porque se están usando hooks (`useMemo`) dentro del JSX y dentro de condiciones, lo cual viola las reglas de hooks de React.

---

## ERROR 1: useMemo dentro de condición en JSX (Línea 3564)

**Ubicación:** `src/pages/Cotizaciones.jsx` - Línea 3564

**Código problemático:**
```jsx
{mostrarRegla && config.margen > 0 && !isZooming && (
  <>
    {/* Regla horizontal (arriba) - fuera del canvas */}
    <div>
      {/* Marcas de milímetros en la regla horizontal - memoizado */}
      {useMemo(() => {  // ❌ ERROR: useMemo dentro de condición JSX
        const margen = config.margen || 15
        return Array.from({ length: Math.floor(210 / 10) + 1 }, (_, i) => {
          // ... código del array
        })
      }, [escala, config.margen])}
    </div>
  </>
)}
```

**Problema:** `useMemo` es un hook y NO puede estar dentro de una condición en el JSX. Los hooks deben ejecutarse siempre en el mismo orden.

**Solución:** Mover el `useMemo` fuera del JSX, antes del return del componente, y usar el valor memoizado en el JSX.

**Código corregido:**
```jsx
// Dentro del componente ModalConfiguracionPDF, ANTES del return (después de todos los otros hooks)
// Agregar estos useMemo al nivel del componente:

const reglasHorizontalesMemo = useMemo(() => {
  if (!mostrarRegla || config.margen <= 0 || isZooming) return []
  const margen = config.margen || 15
  return Array.from({ length: Math.floor(210 / 10) + 1 }, (_, i) => {
    const mm = i * 10
    const x = mm * escala
    const esMargen = mm === margen || mm === (210 - margen)
    return {
      mm,
      x,
      esMargen
    }
  })
}, [mostrarRegla, config.margen, isZooming, escala])

// Luego en el JSX (línea 3564), reemplazar:
{mostrarRegla && config.margen > 0 && !isZooming && (
  <>
    <div>
      {reglasHorizontalesMemo.map(({ mm, x, esMargen }) => (
        <div
          key={`h-${mm}`}
          className="absolute"
          style={{
            left: `${x}px`,
            top: '0',
            width: '1px',
            height: `${esMargen ? 30 * escala : 15 * escala}px`,
            backgroundColor: esMargen ? '#ef4444' : '#666',
            zIndex: 51
          }}
        >
          {mm % 50 === 0 && (
            <span 
              className="absolute -top-4 left-0 text-xs font-medium"
              style={{ 
                color: '#333',
                transform: 'translateX(-50%)',
                fontSize: `${7 * escala}px`
              }}
            >
              {mm}
            </span>
          )}
        </div>
      ))}
    </div>
  </>
)}
```

---

## ERROR 2: useMemo dentro de condición en JSX (Línea 3635)

**Ubicación:** `src/pages/Cotizaciones.jsx` - Línea 3635

**Código problemático:**
```jsx
{mostrarRegla && config.margen > 0 && !isZooming && (
  <>
    {/* Regla vertical (izquierda) - fuera del canvas */}
    <div>
      {/* Marcas de milímetros en la regla vertical - memoizado */}
      {useMemo(() => {  // ❌ ERROR: useMemo dentro de condición JSX
        const margen = config.margen || 15
        return Array.from({ length: Math.floor(297 / 10) + 1 }, (_, i) => {
          // ... código del array
        })
      }, [escala, config.margen])}
    </div>
  </>
)}
```

**Problema:** Mismo problema que el Error 1. `useMemo` no puede estar dentro de una condición en el JSX.

**Solución:** Mover el `useMemo` fuera del JSX, antes del return del componente.

**Código corregido:**
```jsx
// Dentro del componente ModalConfiguracionPDF, ANTES del return (después de todos los otros hooks)
// Agregar este useMemo al nivel del componente:

const reglasVerticalesMemo = useMemo(() => {
  if (!mostrarRegla || config.margen <= 0 || isZooming) return []
  const margen = config.margen || 15
  return Array.from({ length: Math.floor(297 / 10) + 1 }, (_, i) => {
    const mm = i * 10
    const y = mm * escala
    const esMargen = mm === margen || mm === (297 - margen)
    return {
      mm,
      y,
      esMargen
    }
  })
}, [mostrarRegla, config.margen, isZooming, escala])

// Luego en el JSX (línea 3635), reemplazar:
{mostrarRegla && config.margen > 0 && !isZooming && (
  <>
    <div>
      {reglasVerticalesMemo.map(({ mm, y, esMargen }) => (
        <div
          key={`v-${mm}`}
          className="absolute"
          style={{
            top: `${y}px`,
            left: '0',
            height: '1px',
            width: `${esMargen ? 30 * escala : 15 * escala}px`,
            backgroundColor: esMargen ? '#ef4444' : '#666',
            zIndex: 51
          }}
        >
          {mm % 50 === 0 && (
            <span 
              className="absolute -left-6 top-0 text-xs font-medium"
              style={{ 
                color: '#333',
                transform: 'rotate(-90deg)',
                transformOrigin: 'center',
                fontSize: `${7 * escala}px`
              }}
            >
              {mm}
            </span>
          )}
        </div>
      ))}
    </div>
  </>
)}
```

---

## RESUMEN DE CORRECCIONES NECESARIAS

1. **Línea ~3564:** Mover `useMemo` de reglas horizontales fuera del JSX
2. **Línea ~3635:** Mover `useMemo` de reglas verticales fuera del JSX

**Regla de oro:** Todos los hooks (`useState`, `useEffect`, `useMemo`, `useCallback`, etc.) deben estar:
- Al nivel superior del componente
- ANTES del return
- NUNCA dentro de condiciones, loops, o funciones anidadas
- NUNCA dentro del JSX

---

## UBICACIÓN EXACTA EN EL ARCHIVO

- **Archivo:** `src/pages/Cotizaciones.jsx`
- **Componente:** `ModalConfiguracionPDF` (línea 2370)
- **Errores en líneas:** 3564 y 3635

---

## NOTA IMPORTANTE

Los hooks `reglasHorizontales` y `reglasVerticales` que ya existen en las líneas 2530-2544 están bien definidos, pero NO se están usando. Los `useMemo` problemáticos están dentro del JSX y deben ser reemplazados por los hooks existentes o crear nuevos hooks que se ejecuten siempre (no condicionalmente).

