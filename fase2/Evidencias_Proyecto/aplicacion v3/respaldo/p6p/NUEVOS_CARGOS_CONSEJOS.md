# ✅ NUEVOS CARGOS: CONSEJOS DE COMPAÑÍA

**Fecha:** 12 de Noviembre, 2025 - 1:58 AM  
**Archivos modificados:** 3

---

## 📋 RESUMEN DE CAMBIOS

### **1. Nueva categoría de cargos: "Consejos de Compañía" ⚖️**

Se agregaron 3 nuevos cargos en una categoría separada:

```
⚖️ Consejos de Compañía:
├── Miembro Consejo de Disciplina de Cía
├── Miembro Junta Calificadora
└── Miembro Junta Revisora de Cuentas
```

---

## 🎯 CARACTERÍSTICAS ESPECIALES

### **1. Columna independiente:**
Los "Consejos de Compañía" tienen su **propia sección** en el formulario de cargos, separados de:
- ⭐ Cargos de Comandancia
- 👔 Cargos de Compañía
- 🔧 Cargos de Confianza

### **2. NO tienen grupo de asistencia:**
**IMPORTANTE:** A diferencia de otros cargos (Oficiales de Compañía, Oficiales de Comandancia), estos cargos **NO** forman parte de los grupos de asistencia.

- ❌ **NO son** "Oficiales de Compañía" para efectos de asistencia
- ❌ **NO son** "Oficiales de Comandancia" para efectos de asistencia
- ✅ Se registran como cargos normales en el historial
- ✅ Aparecen en PDFs de cargos del voluntario
- ✅ Se contabilizan como cualquier otro cargo

---

## 📂 ARCHIVOS MODIFICADOS

### **1. sanciones.js**
**Cambio:** Label de adjuntar documento en Renuncia

**Antes:**
```javascript
labelDoc.textContent = '📎 Adjuntar Carta de Renuncia';
```

**Ahora:**
```javascript
labelDoc.textContent = '📎 Adjuntar Oficio y Carta de Renuncia';
```

---

### **2. cargos.html**
**Cambio:** Agregada nueva sección de select

**Código agregado:**
```html
<div class="form-group full-width">
    <label class="opcional">⚖️ Consejos de Compañía</label>
    <select id="cargoConsejo" name="cargoConsejo" onchange="cargosSistema.seleccionarCargo('consejo')">
        <option value="">Seleccione cargo de consejo</option>
        <option value="Miembro Consejo de Disciplina de Cía">Miembro Consejo de Disciplina de Cía</option>
        <option value="Miembro Junta Calificadora">Miembro Junta Calificadora</option>
        <option value="Miembro Junta Revisora de Cuentas">Miembro Junta Revisora de Cuentas</option>
    </select>
</div>
```

**Ubicación:** Entre "Cargos de Compañía" y "Cargos de Confianza"

---

### **3. cargos.js**
**Cambios múltiples:**

#### **A. Función `seleccionarCargo(tipo)`**
Agregado manejo del nuevo tipo 'consejo':

```javascript
else if (tipo === 'consejo') {
    cargoComandancia.value = '';
    cargoCompania.value = '';
    cargoTecnico.value = '';
    tipoCargo.value = cargoConsejo.value;
}
```

#### **B. Función `editarCargo(cargoId)`**
Agregado array de cargosConsejo y lógica:

```javascript
const cargosConsejo = ['Miembro Consejo de Disciplina de Cía', 
                       'Miembro Junta Calificadora', 
                       'Miembro Junta Revisora de Cuentas'];

// ... después en el if-else:
else if (cargosConsejo.includes(cargo.tipoCargo)) {
    document.getElementById('cargoComandancia').value = '';
    document.getElementById('cargoCompania').value = '';
    document.getElementById('cargoConsejo').value = cargo.tipoCargo;
    document.getElementById('cargoTecnico').value = '';
}
```

#### **C. Función `limpiarFormulario()`**
Agregado limpieza del nuevo campo:

```javascript
document.getElementById('cargoConsejo').value = '';
```

---

## 🎨 ESTRUCTURA VISUAL DEL FORMULARIO

```
┌─────────────────────────────────────────────┐
│ 📋 Registro de Cargo                        │
├─────────────────────────────────────────────┤
│ Año: [2024]                                 │
│                                             │
│ ⭐ Cargos de Comandancia                    │
│ [Seleccione cargo de comandancia ▼]        │
│                                             │
│ 👔 Cargos de Compañía                       │
│ [Seleccione cargo de compañía ▼]           │
│                                             │
│ ⚖️ Consejos de Compañía              ✨ NEW │
│ [Seleccione cargo de consejo ▼]            │
│ • Miembro Consejo de Disciplina de Cía     │
│ • Miembro Junta Calificadora               │
│ • Miembro Junta Revisora de Cuentas        │
│                                             │
│ 🔧 Cargos de Confianza                      │
│ [Seleccione cargo de confianza ▼]          │
│                                             │
│ Desde: [____]  Hasta: [____]               │
│ Observaciones: [________________]           │
└─────────────────────────────────────────────┘
```

---

## 🔄 FLUJO DE USO

### **Registrar un cargo de Consejo:**

1. **Seleccionar voluntario** desde el sistema
2. **Ir a módulo de Cargos**
3. **Seleccionar año** (ej: 2024)
4. **Seleccionar cargo** en "⚖️ Consejos de Compañía"
   - Ejemplo: "Miembro Junta Calificadora"
5. **Completar fechas** (opcional):
   - Desde: 01/01/2024
   - Hasta: 31/12/2024
6. **Agregar observaciones** (opcional)
7. **Registrar Cargo**

### **Características del registro:**
- ✅ Se guarda en historial de cargos del voluntario
- ✅ Aparece en PDF de cargos
- ✅ Funciona igual que otros cargos
- ❌ **NO** crea grupo de asistencia
- ❌ **NO** afecta categorización de oficiales

---

## 📊 DIFERENCIAS CON OTROS CARGOS

| Característica | Comandancia | Compañía | **Consejos** ✨ | Confianza |
|----------------|-------------|----------|-----------------|-----------|
| **Tiene selector propio** | ✅ | ✅ | ✅ | ✅ |
| **Aparece en historial** | ✅ | ✅ | ✅ | ✅ |
| **Genera PDF** | ✅ | ✅ | ✅ | ✅ |
| **Grupo de asistencia** | ✅ | ✅ | ❌ | ❌ |
| **Categoría especial** | Oficial Comandancia | Oficial Compañía | **Ninguna** | Ninguna |

---

## 🎯 DIFERENCIAS CLAVE: CONSEJOS vs COMPAÑÍA

### **Cargos de Compañía (👔):**
```
Capitán, Director, Secretario, etc.
├── ✅ Tienen grupo de asistencia
├── ✅ Son "Oficiales de Compañía"
└── ✅ Registros especiales en asistencia
```

### **Consejos de Compañía (⚖️):**
```
Miembro Consejo de Disciplina, Juntas, etc.
├── ❌ NO tienen grupo de asistencia
├── ❌ NO son "Oficiales"
└── ✅ Solo registro en historial de cargos
```

---

## 🔍 EJEMPLOS DE USO

### **Ejemplo 1: Miembro Consejo de Disciplina**
```
Año: 2024
Cargo: Miembro Consejo de Disciplina de Cía
Desde: 01/01/2024
Hasta: 31/12/2024
Observaciones: Designado por la asamblea general
```

**Resultado:**
- ✅ Se registra en historial de cargos
- ✅ Aparece en PDF del voluntario
- ❌ NO aparece en registros de asistencia de oficiales

---

### **Ejemplo 2: Miembro Junta Calificadora**
```
Año: 2024
Cargo: Miembro Junta Calificadora
Desde: 01/06/2024
Hasta: 31/12/2024
Observaciones: Reemplazo por renuncia de miembro anterior
```

**Resultado:**
- ✅ Igual que el anterior
- ❌ NO genera categoría de "Oficial"

---

## 📝 NOTAS TÉCNICAS

### **1. Identificación de tipo de cargo:**
Los cargos de consejo se identifican por el array:
```javascript
const cargosConsejo = [
    'Miembro Consejo de Disciplina de Cía', 
    'Miembro Junta Calificadora', 
    'Miembro Junta Revisora de Cuentas'
];
```

### **2. Almacenamiento:**
Se guardan en localStorage como cualquier otro cargo:
```javascript
{
    id: 456,
    bomberoId: 123,
    tipoCargo: "Miembro Junta Calificadora",
    añoCargo: 2024,
    fechaInicioCargo: "2024-01-01",
    fechaFinCargo: "2024-12-31",
    observacionesCargo: "..."
}
```

### **3. NO tienen grupo de asistencia:**
A diferencia de Comandancia y Compañía, estos cargos:
- NO se usan en módulos de asistencia
- NO crean grupos especiales
- NO afectan permisos de asistencia
- Solo son registro histórico

---

## ✅ VALIDACIONES

- ✅ Solo se puede seleccionar UN tipo de cargo a la vez
- ✅ Al seleccionar "Consejo", se limpian los demás selectores
- ✅ Al limpiar formulario, se limpia el selector de "Consejo"
- ✅ Al editar un cargo de "Consejo", se carga correctamente
- ✅ Compatible con sistema existente de cargos

---

## 🎉 BENEFICIOS

1. **Organización:** Separación clara de cargos administrativos vs consejos
2. **Claridad:** No confundir con oficiales de compañía
3. **Registro:** Historial completo de participación en consejos
4. **Flexibilidad:** Fácil agregar más cargos de consejo en el futuro

---

## 🚀 PARA AGREGAR MÁS CARGOS DE CONSEJO EN EL FUTURO

### **1. Agregar en HTML (cargos.html):**
```html
<option value="Nuevo Cargo Consejo">Nuevo Cargo Consejo</option>
```

### **2. Agregar en JS (cargos.js):**
```javascript
const cargosConsejo = [
    'Miembro Consejo de Disciplina de Cía', 
    'Miembro Junta Calificadora', 
    'Miembro Junta Revisora de Cuentas',
    'Nuevo Cargo Consejo'  // ← Agregar aquí
];
```

---

## 📄 CAMBIO ADICIONAL: RENUNCIA

Como bonus, se actualizó el label del adjunto en renuncia:

**Antes:** `📎 Adjuntar Carta de Renuncia`  
**Ahora:** `📎 Adjuntar Oficio y Carta de Renuncia`

Esto permite adjuntar ambos documentos necesarios.

---

**Implementación completada y lista para usar.** ✅

Los nuevos cargos de "Consejos de Compañía" funcionan correctamente y están separados de los grupos de asistencia.
