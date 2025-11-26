# 📋 GUÍA DE FORMULARIOS UNIFICADOS

## 🎯 ESTRUCTURA COMÚN PARA TODOS

Todos los formularios de asistencias ahora tienen **LA MISMA ESTRUCTURA**:

```
1. Header (con botón volver)
2. 📋 DATOS ESPECÍFICOS ← SOLO ESTO CAMBIA
3. 📊 Estadísticas (3 cards)
4. 👥 8 Categorías de Voluntarios
5. 🤝 Voluntarios Externos
6. 📊 Resumen Detallado
7. 💾 Botones de Acción
```

---

## 🔄 SECCIONES ESPECÍFICAS POR TIPO

### 1️⃣ EMERGENCIAS (registro-asistencia.html)

**Título:** `🔥 REGISTRO DE ASISTENCIAS A EMERGENCIAS`  
**Color:** `#c41e3a` (Rojo)

**Campos:**
```html
<div class="form-grid">
    <div class="form-group">
        <label for="fechaEmergencia">Fecha <span class="required">*</span></label>
        <input type="date" id="fechaEmergencia" required>
    </div>

    <div class="form-group">
        <label for="horaEmergencia">Hora <span class="required">*</span></label>
        <input type="time" id="horaEmergencia" required>
    </div>

    <div class="form-group">
        <label for="claveEmergencia">Clave de Emergencia</label>
        <input type="text" id="claveEmergencia" placeholder="Ej: Incendio Estructural">
    </div>

    <div class="form-group full-width">
        <label for="direccionEmergencia">Dirección <span class="required">*</span></label>
        <input type="text" id="direccionEmergencia" placeholder="Dirección completa" required>
    </div>

    <div class="form-group full-width">
        <label for="observaciones">Observaciones</label>
        <textarea id="observaciones" rows="3" placeholder="Observaciones..."></textarea>
    </div>
</div>
```

**JS:** `asistencias.js` (variable global: `asistencias`)

---

### 2️⃣ ASAMBLEAS (registro-asamblea.html)

**Título:** `🏛️ REGISTRO DE ASISTENCIA A ASAMBLEA`  
**Color:** `#1976d2` (Azul)

**Campos:**
```html
<div class="form-grid">
    <div class="form-group">
        <label for="fechaAsamblea">Fecha <span class="required">*</span></label>
        <input type="date" id="fechaAsamblea" required>
    </div>

    <div class="form-group">
        <label for="tipoAsamblea">Tipo de Asamblea <span class="required">*</span></label>
        <select id="tipoAsamblea" required>
            <option value="">Seleccione tipo</option>
            <option value="ordinaria">📋 Ordinaria</option>
            <option value="extraordinaria">⚡ Extraordinaria</option>
        </select>
    </div>

    <div class="form-group full-width">
        <label for="descripcionAsamblea">Descripción</label>
        <textarea id="descripcionAsamblea" rows="3" placeholder="Descripción de la asamblea..."></textarea>
    </div>
</div>
```

**JS:** `asistencia-asamblea.js` (variable global: `asambleaSistema`)

---

### 3️⃣ EJERCICIOS (registro-ejercicios.html)

**Título:** `💪 REGISTRO DE ASISTENCIA A EJERCICIOS`  
**Color:** `#ff9800` (Naranja)

**Campos:**
```html
<div class="form-grid">
    <div class="form-group">
        <label for="fechaEjercicio">Fecha <span class="required">*</span></label>
        <input type="date" id="fechaEjercicio" required>
    </div>

    <div class="form-group">
        <label for="tipoEjercicio">Tipo de Ejercicio <span class="required">*</span></label>
        <select id="tipoEjercicio" required>
            <option value="">Seleccione tipo</option>
            <option value="compañia">🏢 Ejercicio de Compañía</option>
            <option value="cuerpo">🏛️ Ejercicio de Cuerpo</option>
        </select>
    </div>

    <div class="form-group full-width">
        <label for="descripcionEjercicio">Descripción</label>
        <textarea id="descripcionEjercicio" rows="3" placeholder="Descripción del ejercicio..."></textarea>
    </div>
</div>
```

**JS:** `asistencia-ejercicios.js` (variable global: `ejerciciosSistema`)

---

### 4️⃣ CITACIONES (registro-citaciones.html)

**Título:** `📞 REGISTRO DE ASISTENCIA A CITACIONES`  
**Color:** `#9c27b0` (Púrpura)

**Campos:**
```html
<div class="form-grid">
    <div class="form-group">
        <label for="fechaCitacion">Fecha <span class="required">*</span></label>
        <input type="date" id="fechaCitacion" required>
    </div>

    <div class="form-group">
        <label for="nombreCitacion">Nombre de la Citación <span class="required">*</span></label>
        <input type="text" id="nombreCitacion" placeholder="Ej: Reunión de emergencia" required>
    </div>

    <div class="form-group full-width">
        <label for="descripcionCitacion">Descripción</label>
        <textarea id="descripcionCitacion" rows="3" placeholder="Descripción de la citación..."></textarea>
    </div>
</div>
```

**JS:** `asistencia-citaciones.js` (variable global: `citacionesSistema`)

---

### 5️⃣ OTRAS (registro-otras.html)

**Título:** `📋 REGISTRO DE OTRAS ASISTENCIAS`  
**Color:** `#607d8b` (Gris Azulado)

**Campos:**
```html
<div class="form-grid">
    <div class="form-group">
        <label for="fechaOtra">Fecha <span class="required">*</span></label>
        <input type="date" id="fechaOtra" required>
    </div>

    <div class="form-group">
        <label for="motivoOtra">Motivo <span class="required">*</span></label>
        <input type="text" id="motivoOtra" placeholder="Ej: Capacitación, Aniversario" required>
    </div>

    <div class="form-group full-width">
        <label for="descripcionOtra">Descripción</label>
        <textarea id="descripcionOtra" rows="3" placeholder="Descripción de la actividad..."></textarea>
    </div>
</div>
```

**JS:** `asistencia-otras.js` (variable global: `otrasSistema`)

---

## ✅ LO QUE ES IGUAL EN TODOS

### Estadísticas
- Total de Personas
- Asistentes Seleccionados
- Porcentaje de Asistencia

### 8 Categorías de Voluntarios
1. 🕊️ Voluntarios Mártires
2. ⭐ Oficiales de Comandancia
3. 👔 Oficiales de Compañía
4. 🔧 Cargos de Confianza
5. 🏆 Voluntarios Insignes
6. 🎖️ V.H. del Cuerpo
7. 🏅 V.H. de Compañía
8. 🔰 Voluntarios

### Voluntarios Externos
- 🤝 Participantes
- 🔄 Canjes

### Resumen Detallado
- Total Asistentes
- Oficiales Total
- Of. Comandancia
- Of. Compañía
- Cargos de Confianza
- Voluntarios

### Botones
- 💾 Guardar Asistencia
- ← Cancelar

---

## 🎨 COLORES POR TIPO

| Tipo | Color Hex | Uso |
|------|-----------|-----|
| Emergencias | `#c41e3a` | Rojo intenso |
| Asambleas | `#1976d2` | Azul |
| Ejercicios | `#ff9800` | Naranja |
| Citaciones | `#9c27b0` | Púrpura |
| Otras | `#607d8b` | Gris azulado |

---

## 📂 ARCHIVOS Y VARIABLES

| HTML | JS | Variable Global | Función Guardar |
|------|----|----|----------------|
| `registro-asistencia.html` | `asistencias.js` | `asistencias` | `asistencias.guardarRegistro()` |
| `registro-asamblea.html` | `asistencia-asamblea.js` | `asambleaSistema` | `asambleaSistema.guardarAsistencia()` |
| `registro-ejercicios.html` | `asistencia-ejercicios.js` | `ejerciciosSistema` | `ejerciciosSistema.guardarAsistencia()` |
| `registro-citaciones.html` | `asistencia-citaciones.js` | `citacionesSistema` | `citacionesSistema.guardarAsistencia()` |
| `registro-otras.html` | `asistencia-otras.js` | `otrasSistema` | `otrasSistema.guardarAsistencia()` |

---

## 🔧 PRÓXIMOS PASOS

1. ✅ Usar registro-asamblea.html como plantilla base
2. ⏳ Actualizar cada HTML con su sección específica
3. ⏳ Verificar que los JS funcionen con los IDs correctos
4. ⏳ Probar cada formulario

---

**Estado:** En Progreso  
**Última actualización:** 2025-11-05
