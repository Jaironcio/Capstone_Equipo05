# 📋 SISTEMA DE ESTADOS DE VOLUNTARIOS - DOCUMENTACIÓN COMPLETA

## ✅ IMPLEMENTADO (40% COMPLETADO)

### 1. **FORMULARIOS ACTUALIZADOS**

**Archivos modificados:**
- ✅ `crear-bombero.html`
- ✅ `editar-bombero.html`

**Estados disponibles:**
```
✅ Activo           - En servicio normal
🔄 Renunciado       - Puede reintegrarse
⏸️ Separado         - Por periodo determinado (1-10 años)
❌ Expulsado        - Permanente
🕊️ Mártir          - Fallecido en acto de servicio
☠️ Fallecido       - Fallecido (no en servicio)
```

**Campos condicionales implementados:**
- Mártir: Fecha, lugar, circunstancias
- Fallecido: Fecha, causa
- Separado: Fecha, años (auto-calcula fecha fin)
- Renunciado: Fecha, motivo
- Expulsado: Fecha, motivo

**JavaScript implementado:**
- `mostrarCamposEstado()` - Show/hide dinámico
- `calcularFechaFinSeparacion()` - Cálculo automático
- Validación required dinámica

---

### 2. **FUNCIONES AUXILIARES (utils.js)**

**Archivo modificado:**
- ✅ `js/utils.js`

**Funciones agregadas:**
```javascript
✅ Utils.puedePagarCuotas(bombero)
✅ Utils.puedeRecibirUniformes(bombero)
✅ Utils.puedeSerSancionado(bombero)
✅ Utils.puedeRegistrarAsistencia(bombero)
✅ Utils.puedeRecibirCargosOFelicitaciones(bombero)
✅ Utils.participaEnRanking(bombero)
✅ Utils.sumaAntiguedad(bombero)
✅ Utils.puedeReintegrarse(bombero)
✅ Utils.obtenerBadgeEstado(estado)
```

Todas retornan: `{puede: boolean, mensaje: string}`

---

### 3. **MÓDULOS CON BLOQUEOS IMPLEMENTADOS**

#### **A) UNIFORMES (✅ COMPLETADO)**
**Archivo:** `js/uniformes-nuevo.js`

**Cambios:**
- Validación al cargar voluntario
- Mensaje de error si no puede recibir uniformes
- Deshabilita botones de tipo de uniforme
- Muestra estado del voluntario

**Estados bloqueados:** Renunciado, Separado, Expulsado, Mártir, Fallecido

---

#### **B) CUOTAS (✅ COMPLETADO)**
**Archivo:** `js/cuotas-beneficios.js`

**Cambios:**
- Validación por categoría (Honorario, Insigne 25 años)
- Validación por estado usando `Utils.puedePagarCuotas()`
- Pantalla completa de bloqueo con mensaje claro

**Estados bloqueados:** Renunciado, Separado, Expulsado, Mártir, Fallecido

---

#### **C) BENEFICIOS (✅ COMPLETADO)**
**Archivo:** `js/pagar-beneficio.js`

**Cambios:**
- Validación usando `Utils.puedePagarCuotas()`
- Pantalla completa de bloqueo
- Muestra estado y badge visual

**Estados bloqueados:** Renunciado, Separado, Expulsado, Mártir, Fallecido

---

#### **D) SANCIONES (✅ COMPLETADO + CAMBIO AUTOMÁTICO DE ESTADO)**
**Archivo:** `js/sanciones.js`

**Cambios:**
1. Validación usando `Utils.puedeSerSancionado()`
2. Deshabilita formulario si no puede ser sancionado
3. **FUNCIÓN CRÍTICA:** `actualizarEstadoBomberoSegunSancion()`

**Lógica de cambio automático de estado:**
```javascript
// RENUNCIA → Estado "Renunciado"
case 'renuncia':
    bombero.estadoBombero = 'renunciado'
    bombero.fechaRenuncia = fechaSancion
    bombero.motivoRenuncia = motivo
    
// SEPARACIÓN → Estado "Separado"
case 'separacion':
    bombero.estadoBombero = 'separado'
    bombero.fechaSeparacion = fechaSancion
    bombero.aniosSeparacion = años calculados
    bombero.fechaFinSeparacion = fecha calculada
    
// EXPULSIÓN → Estado "Expulsado"
case 'expulsion':
    bombero.estadoBombero = 'expulsado'
    bombero.fechaExpulsion = fechaSancion
    bombero.motivoExpulsion = motivo

// SUSPENSIÓN → NO cambia estado
case 'suspension':
    // Solo registra la sanción
```

**Características adicionales:**
- Historial de cambios de estado
- Congelamiento de antigüedad automático
- Notificación al usuario del cambio de estado

**Estados que pueden ser sancionados:** Activo, Renunciado, Separado
**Estados bloqueados:** Expulsado, Mártir, Fallecido

---

## ⏳ PENDIENTE (60% RESTANTE)

### 4. **CARGOS Y FELICITACIONES (PENDIENTE)**

**Archivos a modificar:**
- ⏳ `js/cargos.js`
- ⏳ `js/felicitaciones.js`

**Cambios necesarios:**
```javascript
// En cargarBomberoActual() o mostrarInfoBombero():

const validacion = Utils.puedeRecibirCargosOFelicitaciones(this.bomberoActual);
if (!validacion.puede) {
    // Mostrar mensaje de error
    // Deshabilitar formulario
    return;
}
```

**Estados bloqueados:** Renunciado, Separado, Expulsado, Mártir, Fallecido
**Solo permitido:** Activo

---

### 5. **ASISTENCIAS (PENDIENTE - 4 ARCHIVOS)**

**Archivos a modificar:**
- ⏳ `js/registro-asistencia.js`
- ⏳ `js/asistencia-ejercicios.js`
- ⏳ `js/asistencia-citaciones.js`
- ⏳ `js/asistencia-asamblea.js`

**Cambios necesarios:**
```javascript
// Al renderizar lista de voluntarios:

bomberos.forEach(bombero => {
    const validacion = Utils.puedeRegistrarAsistencia(bombero);
    if (!validacion.puede) {
        // Deshabilitar checkbox
        // Agregar indicador visual (badge)
        // Tooltip con mensaje
    }
});
```

**Lógica especial:**
- ✅ ACTIVOS: Pueden registrar asistencia
- ✅ MÁRTIRES: Pueden registrar asistencia (histórica)
- ❌ Resto: No pueden registrar asistencia

**IMPORTANTE:** Los mártires NO participan en ranking aunque registren asistencia.

---

### 6. **SISTEMA.JS - CÁLCULOS (PENDIENTE)**

**Archivo:** `js/sistema.js`

**A) Actualizar cálculo de deudores:**
```javascript
// En calcularYMostrarDeudores():

bomberos.forEach(bombero => {
    // Excluir de cálculo de deudas:
    const validacion = Utils.puedePagarCuotas(bombero);
    if (!validacion.puede) {
        return; // Saltar este voluntario
    }
    
    // Continuar con cálculo normal...
});
```

**Excluir de deudas:**
- Honorarios
- Insignes de 25 años
- Renunciados
- Separados
- Expulsados
- Mártires
- Fallecidos

---

**B) Actualizar cálculo de antigüedad:**
```javascript
// En Utils.calcularAntiguedadDetallada():

static calcularAntiguedadDetallada(fechaIngreso, bombero = null) {
    if (bombero && !Utils.sumaAntiguedad(bombero)) {
        // Antigüedad congelada
        if (bombero.fechaCongelamiento) {
            // Calcular hasta fecha de congelamiento
            return calcularHasta(fechaIngreso, bombero.fechaCongelamiento);
        }
    }
    
    // Calcular normal hasta hoy
    return calcularHasta(fechaIngreso, new Date());
}
```

---

**C) Excluir de ranking:**
```javascript
// En cualquier cálculo de ranking:

bomberos = bomberos.filter(b => Utils.participaEnRanking(b));
// Solo mantiene ACTIVOS
```

---

### 7. **CREAR/EDITAR BOMBERO .JS (PENDIENTE)**

**Archivos:** 
- ⏳ `js/crear-bombero.js`
- ⏳ `js/editar-bombero.js`

**Cambios necesarios:**

**A) crear-bombero.js - Guardar nuevos campos:**
```javascript
// En manejarSubmit():

const bomberoData = {
    // ... campos existentes ...
    estadoBombero: formData.get('estadoBombero'),
    
    // Campos condicionales de Mártir
    fechaMartirio: formData.get('fechaMartirio') || null,
    lugarMartirio: formData.get('lugarMartirio') || null,
    circunstanciasMartirio: formData.get('circunstanciasMartirio') || null,
    
    // Campos condicionales de Fallecido
    fechaFallecimiento: formData.get('fechaFallecimiento') || null,
    causaFallecimiento: formData.get('causaFallecimiento') || null,
    
    // Campos condicionales de Separado
    fechaSeparacion: formData.get('fechaSeparacion') || null,
    aniosSeparacion: formData.get('aniosSeparacion') || null,
    fechaFinSeparacion: formData.get('fechaFinSeparacion') || null,
    
    // Campos condicionales de Renunciado
    fechaRenuncia: formData.get('fechaRenuncia') || null,
    motivoRenuncia: formData.get('motivoRenuncia') || null,
    
    // Campos condicionales de Expulsado
    fechaExpulsion: formData.get('fechaExpulsion') || null,
    motivoExpulsion: formData.get('motivoExpulsion') || null,
    
    // Control de antigüedad
    antiguedadCongelada: ['renunciado', 'separado', 'expulsado', 'martir', 'fallecido'].includes(formData.get('estadoBombero')),
    fechaCongelamiento: ['renunciado', 'separado', 'expulsado', 'martir', 'fallecido'].includes(formData.get('estadoBombero')) ? 
        (formData.get('fechaRenuncia') || formData.get('fechaSeparacion') || formData.get('fechaExpulsion') || formData.get('fechaMartirio') || formData.get('fechaFallecimiento')) : null,
    
    // Historial
    historialEstados: [{
        estadoAnterior: null,
        estadoNuevo: formData.get('estadoBombero'),
        fecha: new Date().toISOString(),
        motivo: 'Registro inicial',
        registradoPor: currentUser.username
    }]
};
```

---

**B) editar-bombero.js - Cargar y guardar campos:**
```javascript
// En cargarBombero():

document.getElementById('estadoBombero').value = bombero.estadoBombero || 'activo';
mostrarCamposEstado(); // Mostrar campos según estado

// Cargar campos condicionales
if (bombero.estadoBombero === 'martir') {
    document.getElementById('fechaMartirio').value = bombero.fechaMartirio || '';
    document.getElementById('lugarMartirio').value = bombero.lugarMartirio || '';
    document.getElementById('circunstanciasMartirio').value = bombero.circunstanciasMartirio || '';
}
// ... similar para otros estados ...

// En manejarSubmit():
// Detectar cambio de estado
const estadoAnterior = bombero.estadoBombero;
const estadoNuevo = formData.get('estadoBombero');

if (estadoAnterior !== estadoNuevo) {
    // Agregar al historial
    if (!bombero.historialEstados) bombero.historialEstados = [];
    bombero.historialEstados.push({
        estadoAnterior: estadoAnterior,
        estadoNuevo: estadoNuevo,
        fecha: new Date().toISOString(),
        motivo: 'Cambio manual desde edición',
        registradoPor: currentUser.username
    });
    
    // Congelar/descongelar antigüedad según el nuevo estado
    if (estadoNuevo === 'activo') {
        bombero.antiguedadCongelada = false;
        bombero.fechaCongelamiento = null;
    } else {
        bombero.antiguedadCongelada = true;
        bombero.fechaCongelamiento = new Date().toISOString().split('T')[0];
    }
}

// Guardar todos los campos nuevos (similar a crear)
```

---

### 8. **SISTEMA DE REINTEGRACIÓN (PENDIENTE - NUEVO)**

**Archivos a crear:**
- ⏳ `reintegracion-voluntario.html`
- ⏳ `js/reintegracion.js`
- ⏳ `css/reintegracion.css` (opcional)

**Funcionalidad:**

**A) reintegracion-voluntario.html:**
```html
<!DOCTYPE html>
<html lang="es">
<head>
    <title>Reintegración de Voluntario</title>
    <link rel="stylesheet" href="css/global-profesional.css">
    <link rel="stylesheet" href="css/form-voluntario-profesional.css">
</head>
<body>
    <div class="main-system">
        <div class="container">
            <header class="main-header">
                <h1>🔄 Reintegración de Voluntario</h1>
            </header>
            
            <div class="form-container">
                <!-- Info del voluntario -->
                <div id="bomberoInfo"></div>
                
                <!-- Validación de reintegración -->
                <div id="estadoReintegracion"></div>
                
                <!-- Formulario -->
                <form id="formReintegracion">
                    <input type="hidden" id="bomberoId">
                    
                    <div class="form-group">
                        <label>Fecha de Reintegración <span class="required">*</span></label>
                        <input type="date" id="fechaReintegracion" required>
                    </div>
                    
                    <div class="form-group">
                        <label>Motivo de Reintegración <span class="required">*</span></label>
                        <textarea id="motivoReintegracion" rows="4" required></textarea>
                    </div>
                    
                    <div class="form-grid form-grid-2">
                        <div class="form-group">
                            <label>Padrino 1 que avala <span class="required">*</span></label>
                            <input type="text" id="padrino1" required>
                        </div>
                        <div class="form-group">
                            <label>Padrino 2 que avala <span class="required">*</span></label>
                            <input type="text" id="padrino2" required>
                        </div>
                    </div>
                    
                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary">← Volver</button>
                        <button type="submit" class="btn btn-primary">✓ Reintegrar Voluntario</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
    
    <script src="js/auth.js"></script>
    <script src="js/storage.js"></script>
    <script src="js/utils.js"></script>
    <script src="js/reintegracion.js"></script>
</body>
</html>
```

---

**B) js/reintegracion.js:**
```javascript
class SistemaReintegracion {
    constructor() {
        this.bomberoActual = null;
        this.init();
    }
    
    async init() {
        if (!checkAuth()) {
            window.location.href = 'index.html';
            return;
        }
        
        await this.cargarBombero();
        this.configurarFormulario();
    }
    
    async cargarBombero() {
        const bomberoId = localStorage.getItem('bomberoReintegracionActual');
        if (!bomberoId) {
            Utils.mostrarNotificacion('No se ha seleccionado un voluntario', 'error');
            setTimeout(() => this.volver(), 2000);
            return;
        }
        
        const bomberos = storage.getBomberos();
        this.bomberoActual = bomberos.find(b => b.id === parseInt(bomberoId));
        
        if (!this.bomberoActual) {
            Utils.mostrarNotificacion('Voluntario no encontrado', 'error');
            setTimeout(() => this.volver(), 2000);
            return;
        }
        
        this.mostrarInfo();
        this.validarReintegracion();
    }
    
    mostrarInfo() {
        const contenedor = document.getElementById('bomberoInfo');
        const estadoBadge = Utils.obtenerBadgeEstado(this.bomberoActual.estadoBombero);
        
        contenedor.innerHTML = `
            <div style="background: #e3f2fd; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
                <h3>Información del Voluntario</h3>
                <div><strong>Nombre:</strong> ${Utils.obtenerNombreCompleto(this.bomberoActual)}</div>
                <div><strong>Clave:</strong> ${this.bomberoActual.claveBombero}</div>
                <div><strong>Estado actual:</strong> ${estadoBadge}</div>
            </div>
        `;
    }
    
    validarReintegracion() {
        const validacion = Utils.puedeReintegrarse(this.bomberoActual);
        const contenedor = document.getElementById('estadoReintegracion');
        
        if (!validacion.puede) {
            contenedor.innerHTML = `
                <div style="background: #fee2e2; border-left: 4px solid #dc2626; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <h3 style="color: #dc2626; margin-top: 0;">❌ No puede reintegrarse</h3>
                    <p style="color: #991b1b; font-size: 16px;">${validacion.mensaje}</p>
                </div>
            `;
            
            // Deshabilitar formulario
            document.getElementById('formReintegracion').style.display = 'none';
        } else {
            contenedor.innerHTML = `
                <div style="background: #d1fae5; border-left: 4px solid #10b981; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <h3 style="color: #065f46; margin-top: 0;">✅ Puede reintegrarse</h3>
                    <p style="color: #047857; font-size: 16px;">${validacion.mensaje}</p>
                </div>
            `;
        }
    }
    
    configurarFormulario() {
        document.getElementById('formReintegracion').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.procesarReintegracion();
        });
    }
    
    async procesarReintegracion() {
        const formData = new FormData(document.getElementById('formReintegracion'));
        
        // Actualizar estado a ACTIVO
        const bomberos = storage.getBomberos();
        const bomberoIndex = bomberos.findIndex(b => b.id === this.bomberoActual.id);
        
        if (bomberoIndex === -1) {
            Utils.mostrarNotificacion('Error: Voluntario no encontrado', 'error');
            return;
        }
        
        const bombero = bomberos[bomberoIndex];
        const estadoAnterior = bombero.estadoBombero;
        
        // Cambiar a ACTIVO
        bombero.estadoBombero = 'activo';
        
        // Guardar reintegración en historial
        if (!bombero.historialReintegraciones) {
            bombero.historialReintegraciones = [];
        }
        
        bombero.historialReintegraciones.push({
            estadoAnterior: estadoAnterior,
            fechaReintegracion: formData.get('fechaReintegracion'),
            motivoReintegracion: formData.get('motivoReintegracion'),
            padrino1: formData.get('padrino1'),
            padrino2: formData.get('padrino2'),
            registradoPor: JSON.parse(localStorage.getItem('currentUser')).username,
            fechaRegistro: new Date().toISOString()
        });
        
        // Agregar al historial de estados
        if (!bombero.historialEstados) {
            bombero.historialEstados = [];
        }
        
        bombero.historialEstados.push({
            estadoAnterior: estadoAnterior,
            estadoNuevo: 'activo',
            fecha: new Date().toISOString(),
            motivo: 'Reintegración aprobada',
            registradoPor: JSON.parse(localStorage.getItem('currentUser')).username
        });
        
        // Descongelar antigüedad
        bombero.antiguedadCongelada = false;
        bombero.fechaCongelamiento = null;
        
        // Guardar
        storage.saveBomberos(bomberos);
        
        Utils.mostrarNotificacion('✅ Voluntario reintegrado exitosamente', 'success');
        setTimeout(() => window.location.href = 'sistema.html', 2000);
    }
    
    volver() {
        localStorage.removeItem('bomberoReintegracionActual');
        window.location.href = 'sistema.html';
    }
}

const sistemaReintegracion = new SistemaReintegracion();
```

---

**C) Agregar botón en sistema.js:**
```javascript
// En la tarjeta de cada voluntario, agregar:

if (bombero.estadoBombero === 'renunciado' || bombero.estadoBombero === 'separado') {
    const validacion = Utils.puedeReintegrarse(bombero);
    if (validacion.puede) {
        // Agregar botón de reintegración
        html += `
            <button class="btn btn-success" onclick="iniciarReintegracion(${bombero.id})">
                🔄 Reintegrar
            </button>
        `;
    }
}

// Función global:
function iniciarReintegracion(bomberoId) {
    localStorage.setItem('bomberoReintegracionActual', bomberoId);
    window.location.href = 'reintegracion-voluntario.html';
}
```

---

## 📊 TABLA COMPLETA DE PERMISOS (REFERENCIA)

| Acción | ✅ Activo | 🔄 Renunciado | ⏸️ Separado | ❌ Expulsado | 🕊️ Mártir | ☠️ Fallecido |
|--------|----------|--------------|------------|-------------|-----------|-------------|
| **Pagar cuotas** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Pagar beneficios** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Registrar asistencia** | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| **Asignar uniformes** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Registrar sanciones** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Asignar cargos** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Registrar felicitaciones** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Ver historial/PDFs** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Suma antigüedad** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Participa en ranking** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Puede reintegrarse** | - | ✅ | ✅* | ❌ | ❌ | ❌ |

*Separado: Solo después de cumplir el periodo

---

## 🎯 PRIORIDADES PARA COMPLETAR

**ALTA PRIORIDAD:**
1. ⏳ crear-bombero.js - Guardar campos nuevos
2. ⏳ editar-bombero.js - Cargar/guardar campos nuevos  
3. ⏳ sistema.js - Excluir de deudores y ranking

**MEDIA PRIORIDAD:**
4. ⏳ cargos.js - Bloqueo para no-activos
5. ⏳ felicitaciones.js - Bloqueo para no-activos
6. ⏳ Asistencias (4 archivos) - Permitir activos y mártires

**BAJA PRIORIDAD (FUNCIONAL PERO NO CRÍTICO):**
7. ⏳ Sistema de reintegración completo

---

## 📁 ARCHIVOS MODIFICADOS HASTA AHORA

```
✅ crear-bombero.html
✅ editar-bombero.html
✅ js/utils.js
✅ js/uniformes-nuevo.js
✅ js/cuotas-beneficios.js
✅ js/pagar-beneficio.js
✅ js/sanciones.js
✅ css/form-voluntario-profesional.css (nuevo)
```

**Archivos de respaldo:**
```
📦 crear-bombero-old.html
📦 editar-bombero-old.html
```

---

## 🚀 PARA CONTINUAR LA IMPLEMENTACIÓN

1. Implementar los archivos de alta prioridad primero
2. Probar con datos de prueba
3. Implementar media prioridad
4. Sistema de reintegración al final

**Tiempo estimado restante:** 3-4 horas de trabajo

---

## ✨ VENTAJAS DEL SISTEMA

1. ✅ Validación centralizada y reutilizable
2. ✅ Mensajes claros para el usuario
3. ✅ Cambio automático de estado en sanciones
4. ✅ Historial completo de cambios de estado
5. ✅ Congelamiento automático de antigüedad
6. ✅ Sistema preparado para reintegración
7. ✅ Escalable y mantenible

---

**Fecha de implementación:** 12 de Noviembre, 2025  
**Estado:** 40% completado
