# 📋 INSTRUCCIONES: Agregar Horas a Todos los Tipos de Asistencia

## ✅ **COMPLETADOS:**
- ✅ **Directorio de Cía** → `registro-directorio.html`
- ✅ **Emergencias** → `registro-asistencia.html` (campos agregados en HTML)

---

## ⏳ **PENDIENTES (Mismo patrón para todos):**

### **Archivos a modificar:**
1. `registro-asamblea.html`
2. `registro-ejercicios.html`
3. `registro-citaciones.html`
4. `registro-otras.html`

---

## 🔧 **PASO 1: Agregar campos en HTML**

Buscar el formulario donde está el campo de fecha y agregar estos dos campos:

```html
<div class="form-group">
    <label for="horaInicio">Hora de Inicio <span class="required">*</span></label>
    <input type="time" id="horaInicio" required>
</div>

<div class="form-group">
    <label for="horaTermino">Hora de Término <span class="required">*</span></label>
    <input type="time" id="horaTermino" required>
</div>
```

---

## 🔧 **PASO 2: Actualizar JavaScript de guardado**

### **A. En cada archivo JS (asistencia-*.js):**

Buscar la función `guardarAsistencia()` y:

#### **2.1 Capturar los valores:**
```javascript
const horaInicio = document.getElementById('horaInicio').value;
const horaTermino = document.getElementById('horaTermino').value;
```

#### **2.2 Validar:**
```javascript
if (!horaInicio || !horaTermino) {
    Utils.mostrarNotificacion('Debe ingresar hora de inicio y término', 'error');
    return;
}

if (horaTermino <= horaInicio) {
    Utils.mostrarNotificacion('La hora de término debe ser posterior a la hora de inicio', 'error');
    return;
}
```

#### **2.3 Agregar al objeto de registro:**
```javascript
const registro = {
    id: Date.now(),
    tipo: '...', // emergencia, asamblea, ejercicios, etc.
    fecha: fechaXXX,
    horaInicio: horaInicio,  // ⭐ NUEVO
    horaTermino: horaTermino, // ⭐ NUEVO
    // ... resto de campos
};
```

---

## 📝 **EJEMPLO COMPLETO (Asamblea):**

### **HTML (`registro-asamblea.html`):**
```html
<div class="form-grid">
    <div class="form-group">
        <label for="fechaAsamblea">Fecha <span class="required">*</span></label>
        <input type="date" id="fechaAsamblea" required>
    </div>
    
    <div class="form-group">
        <label for="horaInicio">Hora de Inicio <span class="required">*</span></label>
        <input type="time" id="horaInicio" required>
    </div>
    
    <div class="form-group">
        <label for="horaTermino">Hora de Término <span class="required">*</span></label>
        <input type="time" id="horaTermino" required>
    </div>
</div>
```

### **JavaScript (`js/asistencia-asamblea.js`):**
```javascript
async guardarAsistencia() {
    try {
        // Validar datos
        const fechaAsamblea = document.getElementById('fechaAsamblea').value;
        const horaInicio = document.getElementById('horaInicio').value;
        const horaTermino = document.getElementById('horaTermino').value;
        const tipoAsamblea = document.getElementById('tipoAsamblea').value;
        const descripcionAsamblea = document.getElementById('descripcionAsamblea').value;

        if (!fechaAsamblea) {
            Utils.mostrarNotificacion('Debe ingresar la fecha de la asamblea', 'error');
            return;
        }
        
        if (!horaInicio || !horaTermino) {
            Utils.mostrarNotificacion('Debe ingresar hora de inicio y término', 'error');
            return;
        }

        if (horaTermino <= horaInicio) {
            Utils.mostrarNotificacion('La hora de término debe ser posterior a la hora de inicio', 'error');
            return;
        }

        if (!tipoAsamblea) {
            Utils.mostrarNotificacion('Debe seleccionar el tipo de asamblea', 'error');
            return;
        }

        // ... resto del código para obtener asistentes ...

        // Crear registro
        const registro = {
            id: Date.now(),
            tipo: 'asamblea',
            tipoAsamblea: tipoAsamblea,
            fecha: fechaAsamblea,
            horaInicio: horaInicio,  // ⭐ NUEVO
            horaTermino: horaTermino, // ⭐ NUEVO
            descripcion: descripcionAsamblea || 'Sin descripción',
            // ... resto de campos ...
        };

        // ... resto del código de guardado ...
    } catch (error) {
        console.error('Error al guardar asistencia:', error);
        Utils.mostrarNotificacion('Error al guardar la asistencia', 'error');
    }
}
```

---

## 🎯 **RESUMEN DE CAMBIOS POR ARCHIVO:**

### ✅ **Emergencias** (YA HECHO EN HTML)
- **Archivo HTML:** `registro-asistencia.html` ✅
- **Archivo JS:** `js/asistencias.js` o script inline ⏳
- **Campos:** `horaInicio`, `horaTermino` ✅

### ⏳ **Asamblea**
- **Archivo HTML:** `registro-asamblea.html`
- **Archivo JS:** `js/asistencia-asamblea.js`
- **Función:** `guardarAsistencia()`

### ⏳ **Ejercicios**
- **Archivo HTML:** `registro-ejercicios.html`
- **Archivo JS:** `js/asistencia-ejercicios.js`
- **Función:** `guardarAsistencia()`

### ⏳ **Citaciones**
- **Archivo HTML:** `registro-citaciones.html`
- **Archivo JS:** `js/asistencia-citaciones.js`
- **Función:** `guardarAsistencia()`

### ⏳ **Otras**
- **Archivo HTML:** `registro-otras.html`
- **Archivo JS:** `js/asistencia-otras.js`
- **Función:** `guardarAsistencia()`

---

## 🔍 **CÓMO ENCONTRAR LAS FUNCIONES:**

### **1. En cada HTML:**
Buscar:
```html
<label for="fecha
```

Agregar los campos de hora justo después.

### **2. En cada JS:**
Buscar:
```javascript
async guardarAsistencia() {
```

Dentro de esa función:
- Buscar donde se captura la fecha: `const fecha...`
- Agregar captura de horas ahí mismo
- Buscar donde se crea el `registro =`
- Agregar `horaInicio` y `horaTermino`

---

## ✅ **CHECKLIST DE IMPLEMENTACIÓN:**

### **Asamblea:**
- [ ] HTML: Agregar campos `horaInicio` y `horaTermino`
- [ ] JS: Capturar valores
- [ ] JS: Validar valores
- [ ] JS: Agregar al objeto `registro`

### **Ejercicios:**
- [ ] HTML: Agregar campos `horaInicio` y `horaTermino`
- [ ] JS: Capturar valores
- [ ] JS: Validar valores
- [ ] JS: Agregar al objeto `registro`

### **Citaciones:**
- [ ] HTML: Agregar campos `horaInicio` y `horaTermino`
- [ ] JS: Capturar valores
- [ ] JS: Validar valores
- [ ] JS: Agregar al objeto `registro`

### **Otras:**
- [ ] HTML: Agregar campos `horaInicio` y `horaTermino`
- [ ] JS: Capturar valores
- [ ] JS: Validar valores
- [ ] JS: Agregar al objeto `registro`

---

## 🚀 **SIGUIENTE PASO: Mostrar horas en historial**

Una vez agregadas las horas a todos los tipos, actualizar `historial-asistencias.html` para mostrarlas:

```javascript
// En la función que renderiza la tabla:
<td>${asistencia.fecha}</td>
<td>${asistencia.horaInicio || 'N/A'} - ${asistencia.horaTermino || 'N/A'}</td>
```

---

**¿Necesitas que implemente alguno de estos archivos específicamente?** 🚀
