# 📅 SISTEMA DE CICLOS DE ASISTENCIAS

## 🎯 ¿QUÉ ES?

Un sistema que permite gestionar **períodos personalizados** para contar asistencias, en lugar de usar el año calendario tradicional (enero-diciembre).

---

## 🔥 PROBLEMA QUE RESUELVE

### **ANTES:**
- ❌ Asistencias contadas por año calendario (ene-dic)
- ❌ No coincide con su año operativo real
- ❌ Difícil entregar premios en la fecha correcta

### **AHORA:**
- ✅ Ciclos personalizados (ej: 12 oct → 11 oct)
- ✅ Se puede "cerrar" un ciclo para premiar
- ✅ Se puede "abrir" un nuevo ciclo
- ✅ Historial de ciclos anteriores

---

## 📋 CARACTERÍSTICAS

### **1. Ciclos Personalizados**
```
Ciclo 2024-2025
├─ Inicio: 12 octubre 2024
├─ Fin: 11 octubre 2025
├─ Estado: Activo
└─ Duración: 365 días
```

### **2. Estados de Ciclo**
- **🔥 ACTIVO** → Contando asistencias actuales
- **🔒 CERRADO** → Terminado, listo para premios

### **3. Gestión Completa**
- ✅ Crear nuevo ciclo
- ✅ Cerrar ciclo actual
- ✅ Reabrir ciclo anterior
- ✅ Eliminar ciclo cerrado
- ✅ Ver estadísticas por ciclo
- ✅ Exportar ranking de cualquier ciclo

---

## 🎯 FLUJO DE USO

### **📅 Año 1 (2024-2025)**

```
12 oct 2024 ────────────────────────────── 11 oct 2025
   │                                            │
   ├─ CREAR CICLO                              ├─ CERRAR CICLO
   ├─ Contar asistencias                       ├─ Entregar premios
   └─ Ver ranking en tiempo real               └─ Exportar Excel
```

### **📅 Año 2 (2025-2026)**

```
12 oct 2025 ────────────────────────────── 11 oct 2026
   │                                            │
   ├─ CREAR NUEVO CICLO                        ├─ CERRAR CICLO
   │  (cierra automáticamente el anterior)     └─ Premios año 2
   └─ Empezar conteo desde 0
```

---

## 🖥️ INTERFAZ DE ADMINISTRACIÓN

### **Archivo:** `admin-ciclos.html`

```
┌──────────────────────────────────────────────┐
│  📅 ADMINISTRACIÓN DE CICLOS                │
├──────────────────────────────────────────────┤
│  ➕ Crear Nuevo Ciclo                        │
│     • Nombre: Ciclo 2024-2025               │
│     • Inicio: 12/10/2024                    │
│     • Fin: 11/10/2025                       │
│     [Crear Ciclo]                           │
├──────────────────────────────────────────────┤
│  🔥 CICLO ACTIVO                            │
│  ┌─────────────────────────────────────┐   │
│  │ Ciclo 2024-2025         [ACTIVO]    │   │
│  │ 12 oct 2024 → 11 oct 2025           │   │
│  │ 365 días | 45 asist. | 20 vol.      │   │
│  │ [🔒 Cerrar] [📊 Ranking] [📥 Excel] │   │
│  └─────────────────────────────────────┘   │
├──────────────────────────────────────────────┤
│  📋 CICLOS ANTERIORES                       │
│  ┌─────────────────────────────────────┐   │
│  │ Ciclo 2023-2024       [CERRADO]     │   │
│  │ 12 oct 2023 → 11 oct 2024           │   │
│  │ [🔓 Reabrir] [📥 Excel] [🗑️ Borrar] │   │
│  └─────────────────────────────────────┘   │
└──────────────────────────────────────────────┘
```

---

## 💾 ALMACENAMIENTO

### **localStorage Key:** `ciclosAsistencias`

```javascript
[
  {
    id: "ciclo_1730783920000",
    nombre: "Ciclo 2024-2025",
    fechaInicio: "2024-10-12",
    fechaFin: "2025-10-11",
    estado: "activo",
    fechaCreacion: "2024-11-05T08:32:00.000Z",
    fechaCierre: null,
    descripcion: "Ciclo de asistencias..."
  },
  {
    id: "ciclo_1699247920000",
    nombre: "Ciclo 2023-2024",
    fechaInicio: "2023-10-12",
    fechaFin: "2024-10-11",
    estado: "cerrado",
    fechaCreacion: "2023-11-06T08:32:00.000Z",
    fechaCierre: "2024-10-12T10:00:00.000Z",
    descripcion: "Ciclo anterior"
  }
]
```

---

## 🔧 API / FUNCIONES

### **Crear Ciclo**
```javascript
ciclosAsistencias.crearNuevoCiclo(
    '2024-10-12',  // fechaInicio
    '2025-10-11',  // fechaFin
    'Ciclo 2024-2025',  // nombre
    'Descripción...'    // descripcion (opcional)
)
```

### **Cerrar Ciclo**
```javascript
ciclosAsistencias.cerrarCiclo(cicloId)
```

### **Obtener Ciclo Activo**
```javascript
const cicloActivo = ciclosAsistencias.obtenerCicloActivo()
console.log(cicloActivo.nombre) // "Ciclo 2024-2025"
```

### **Obtener Ranking de un Ciclo**
```javascript
const ranking = ciclosAsistencias.obtenerRankingCiclo(cicloId)
// Retorna: { bomberoId: { nombre, total, emergencias, asambleas, ... } }
```

### **Obtener Estadísticas de un Ciclo**
```javascript
const stats = ciclosAsistencias.obtenerEstadisticasCiclo(cicloId)
// Retorna:
// {
//   totalAsistencias: 45,
//   asistenciasPorTipo: { emergencia: 20, asamblea: 15, ... },
//   totalVoluntarios: 18,
//   ranking: { ... }
// }
```

---

## 🧪 CASOS DE USO

### **Caso 1: Inicio de Año Operativo**
```
12 de octubre 2024
└─ Crear nuevo ciclo
   └─ Cierra automáticamente el ciclo anterior
   └─ Empieza conteo desde 0
```

### **Caso 2: Día de Premios**
```
11 de octubre 2025
└─ Cerrar ciclo actual
   └─ Ver ranking final
   └─ Exportar a Excel
   └─ Entregar premios
```

### **Caso 3: Revisar Año Anterior**
```
En cualquier momento
└─ Ver ciclos cerrados
   └─ Exportar ranking de ese año
   └─ Comparar con años anteriores
```

---

## 🔗 INTEGRACIÓN CON HISTORIAL

### **PRÓXIMO PASO (Pendiente):**

Modificar `historial-asistencias.js` para que use ciclos en lugar de años:

```javascript
// ANTES
filtroAño: 2024, 2025, 2026...

// DESPUÉS
filtroCiclo: "Ciclo 2024-2025", "Ciclo 2023-2024"...
```

---

## 📁 ARCHIVOS CREADOS

| Archivo | Propósito |
|---------|-----------|
| `js/ciclos-asistencias.js` | Lógica del sistema de ciclos |
| `admin-ciclos.html` | Interfaz de administración |
| `SISTEMA_CICLOS_README.md` | Esta documentación |

---

## ✅ VENTAJAS DEL SISTEMA

### **Para la Organización:**
- ✅ Fechas personalizadas que coinciden con su operación
- ✅ Fácil entregar premios en la fecha correcta
- ✅ Historial de todos los ciclos anteriores
- ✅ Comparación entre años operativos

### **Para los Voluntarios:**
- ✅ Saben cuándo empieza y termina el conteo
- ✅ Ven el ranking en tiempo real
- ✅ Transparencia en el proceso

### **Para los Administradores:**
- ✅ Control total de los períodos
- ✅ Puede reabrir si hay error
- ✅ Puede eliminar ciclos de prueba
- ✅ Exportación fácil a Excel

---

## 🚀 CÓMO USAR

### **Paso 1: Acceder a la Administración**
```
1. Abre: admin-ciclos.html
2. Verás el ciclo activo actual (o crearlo si no hay)
```

### **Paso 2: Crear Primer Ciclo**
```
1. Llenar formulario:
   • Nombre: Ciclo 2024-2025
   • Inicio: 12/10/2024
   • Fin: 11/10/2025
   • Descripción: (opcional)

2. Click: "Crear Ciclo"
3. ¡Listo! Ya puedes empezar a contar asistencias
```

### **Paso 3: Durante el Año**
```
• Registra asistencias normalmente
• Ve el ranking en historial-asistencias.html
• Todo se cuenta dentro del ciclo activo
```

### **Paso 4: Fin del Ciclo**
```
1. Click: "🔒 Cerrar Ciclo"
2. Exporta ranking a Excel
3. Entrega premios
4. Crea nuevo ciclo para el siguiente año
```

---

## 🔄 MIGRACIÓN DESDE SISTEMA ANTERIOR

Si ya tienes asistencias registradas:

```javascript
// Las asistencias existentes se asignan automáticamente
// al ciclo que corresponda según su fecha

Asistencia del 15/12/2024
├─ Fecha en rango: 12/10/2024 - 11/10/2025
└─ Se cuenta en: Ciclo 2024-2025 ✓
```

---

## 🎉 RESULTADO FINAL

```
AÑO OPERATIVO REAL          PREMIOS CORRECTOS
12 oct → 11 oct            Entregados a tiempo
     │                            │
     ├─ Conteo automático        ├─ Ranking del ciclo
     ├─ Ranking en tiempo real   ├─ Excel exportado
     └─ Ciclo cerrado            └─ ¡Listos para premiar!
```

---

## 📞 SOPORTE

Si tienes dudas sobre el sistema:
1. Revisa esta documentación
2. Prueba en `admin-ciclos.html`
3. Los ciclos de prueba se pueden eliminar

---

**¡El sistema está listo para gestionar tus ciclos de asistencias!** 🎉

**Última actualización:** 2025-11-05  
**Versión:** 1.0.0
