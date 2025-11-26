# 📚 DOCUMENTACIÓN DEL SISTEMA DE PERSISTENCIA

## 📋 ÍNDICE
1. [Estructura de Datos](#estructura-de-datos)
2. [Sistema de Asistencias](#sistema-de-asistencias)
3. [Sistema de Ranking](#sistema-de-ranking)
4. [Catálogo de Externos](#catálogo-de-externos)
5. [Verificación de Integridad](#verificación-de-integridad)
6. [Migración a Django/MySQL](#migración-a-djangomysql)

---

## 🗄️ ESTRUCTURA DE DATOS

### LocalStorage Keys

```javascript
{
  // DATOS PRINCIPALES
  "asistencias": [],           // Todas las asistencias registradas
  "rankingAsistencias": {},    // Ranking anual de asistencias
  "catalogoExternos": {},      // Catálogo de voluntarios externos
  "bomberos": [],              // Lista de bomberos
  "cargos": [],                // Historial de cargos
  "beneficios": [],            // Beneficios registrados
  "usuarios": [],              // Usuarios del sistema
  
  // AUTH
  "currentUser": {},           // Usuario actual en sesión
  
  // LEGACY (mantener por compatibilidad)
  "asistenciasEmergencias": [] // Asistencias antiguas de emergencias
}
```

---

## 🚨 SISTEMA DE ASISTENCIAS

### Formato Estándar de Registro

Todos los tipos de asistencias (Emergencias, Asambleas, Ejercicios, Citaciones, Otras) siguen este formato:

```javascript
{
  // IDENTIFICACIÓN
  "id": 1699999999999,              // Timestamp único
  "tipo": "emergencia",             // emergencia|asamblea|ejercicios|citaciones|otras
  "fecha": "2025-11-05",            // Fecha de la asistencia
  "fechaRegistro": "2025-11-05T04:30:00.000Z", // Timestamp de registro
  
  // DESCRIPCIÓN
  "descripcion": "Incendio en...",  // Descripción de la actividad
  
  // CAMPOS ESPECÍFICOS POR TIPO
  "claveEmergencia": "EMG-001",     // Solo emergencias
  "direccion": "Calle 123",         // Solo emergencias
  "tipoAsamblea": "ordinaria",      // Solo asambleas: ordinaria|extraordinaria
  "tipoEjercicio": "compañia",      // Solo ejercicios: compañia|cuerpo
  "nombreCitacion": "Reunión...",   // Solo citaciones
  "motivo": "Capacitación",         // Solo otras
  
  // ASISTENTES (ARRAY DE OBJETOS)
  "asistentes": [
    // VOLUNTARIO REGULAR
    {
      "bomberoId": 1,
      "nombre": "Juan Pérez López",
      "claveBombero": "B-001",
      "categoria": "Oficial de Comandancia",  // O: "Oficial de Compañía", "Cargo de Confianza", "Voluntario", etc.
      "cargo": "Superintendente",
      "añoCargo": 2025
    },
    // VOLUNTARIO EXTERNO - PARTICIPANTE
    {
      "bomberoId": null,
      "nombre": "Pedro Externo",
      "externoId": "EXT-P-001",
      "claveBombero": null,
      "categoria": "Voluntario Participante",
      "cargo": null,
      "esExterno": true,
      "tipoExterno": "participante"
    },
    // VOLUNTARIO EXTERNO - CANJE
    {
      "bomberoId": null,
      "nombre": "María Canje",
      "externoId": "EXT-C-001",
      "claveBombero": null,
      "categoria": "Voluntario Canje",
      "cargo": null,
      "esExterno": true,
      "tipoExterno": "canje"
    }
  ],
  
  // ESTADÍSTICAS
  "totalAsistentes": 15,
  "oficialesComandancia": 2,
  "oficialesCompania": 3,
  "totalOficiales": 5,
  "cargosConfianza": 1,
  "voluntarios": 9,
  "participantes": 2,               // Voluntarios externos participantes
  "canjes": 1,                      // Voluntarios externos canjes
  "porcentajeAsistencia": 65,
  
  // METADATA
  "registradoPor": "admin"
}
```

### Tipos de Asistencias

#### 1. **EMERGENCIAS** (`tipo: "emergencia"`)
- `claveEmergencia`: Código de la emergencia
- `direccion`: Dirección del incidente
- `hora`: Hora de la emergencia
- `observaciones`: Notas adicionales

#### 2. **ASAMBLEAS** (`tipo: "asamblea"`)
- `tipoAsamblea`: "ordinaria" | "extraordinaria"

#### 3. **EJERCICIOS** (`tipo: "ejercicios"`)
- `tipoEjercicio`: "compañia" | "cuerpo"

#### 4. **CITACIONES** (`tipo: "citaciones"`)
- `nombreCitacion`: Nombre de la citación

#### 5. **OTRAS ACTIVIDADES** (`tipo: "otras"`)
- `motivo`: Motivo de la actividad

---

## 🏆 SISTEMA DE RANKING

### Estructura del Ranking

```javascript
{
  "2025": {
    // VOLUNTARIOS REGULARES (key = bomberoId)
    "1": {
      "nombre": "Juan Pérez López",
      "claveBombero": "B-001",
      "total": 45,              // Total de asistencias
      "emergencias": 20,        // Asistencias a emergencias
      "asambleas": 10,          // Asistencias a asambleas
      "ejercicios": 8,          // Asistencias a ejercicios
      "citaciones": 5,          // Asistencias a citaciones
      "otras": 2                // Asistencias a otras
    },
    
    // VOLUNTARIOS EXTERNOS - PARTICIPANTES
    "externos_participantes": {
      "EXT-P-001": {
        "nombre": "Pedro Externo",
        "total": 5
      }
    },
    
    // VOLUNTARIOS EXTERNOS - CANJES
    "externos_canjes": {
      "EXT-C-001": {
        "nombre": "María Canje",
        "total": 3
      }
    }
  }
}
```

### Actualización del Ranking

El ranking se actualiza automáticamente cada vez que se registra una asistencia:

```javascript
// En cada archivo de asistencia (asistencias.js, asistencia-*.js)
this.actualizarRankingAsistencias(asistentes, 'tipo_asistencia');
```

---

## 👥 CATÁLOGO DE EXTERNOS

### Estructura

```javascript
{
  "participantes": {
    "EXT-P-001": {
      "id": "EXT-P-001",
      "nombre": "Pedro Externo",
      "totalAsistencias": 5,
      "fechaPrimeraAsistencia": "2025-01-15",
      "fechaUltimaAsistencia": "2025-11-05"
    }
  },
  "canjes": {
    "EXT-C-001": {
      "id": "EXT-C-001",
      "nombre": "María Canje",
      "totalAsistencias": 3,
      "fechaPrimeraAsistencia": "2025-02-10",
      "fechaUltimaAsistencia": "2025-10-20"
    }
  }
}
```

### Generación de IDs

Los IDs se generan automáticamente:
- **Participantes**: `EXT-P-XXX` (donde XXX es secuencial)
- **Canjes**: `EXT-C-XXX` (donde XXX es secuencial)

---

## ✅ VERIFICACIÓN DE INTEGRIDAD

### Verificador Automático

El sistema incluye un verificador automático que se ejecuta al cargar el historial:

```javascript
// Uso manual
verificadorDatos.verificarTodo();           // Verificar todo
verificadorDatos.reconstruirRanking();      // Reconstruir ranking desde asistencias
verificadorDatos.exportarTodosLosDatos();   // Exportar backup completo
```

### Qué Verifica

1. **Asistencias**:
   - ✅ ID único
   - ✅ Tipo de asistencia
   - ✅ Descripción
   - ✅ Estadísticas completas
   - ✅ Contadores de externos
   - ✅ Fecha de registro

2. **Ranking**:
   - ✅ Estructura por año
   - ✅ Categorías de externos
   - ✅ Contadores correctos

3. **Catálogo de Externos**:
   - ✅ Participantes
   - ✅ Canjes
   - ✅ IDs únicos

4. **Bomberos**:
   - ✅ Estados válidos
   - ✅ Conteo de activos/inactivos

### Auto-Corrección

El verificador corrige automáticamente:
- IDs faltantes
- Tipos no asignados
- Descripciones vacías
- Estadísticas incompletas
- Contadores de externos

---

## 🔄 MIGRACIÓN A DJANGO/MYSQL

### Preparación de Datos

1. **Exportar Backup Completo**:
```javascript
verificadorDatos.exportarTodosLosDatos();
```

Esto genera un archivo JSON con toda la información.

### Estructura de Tablas Sugerida

#### Tabla: `asistencias`
```sql
CREATE TABLE asistencias (
    id BIGINT PRIMARY KEY,
    tipo VARCHAR(50) NOT NULL,
    fecha DATE NOT NULL,
    descripcion TEXT,
    fecha_registro DATETIME NOT NULL,
    
    -- Campos específicos
    clave_emergencia VARCHAR(50),
    direccion TEXT,
    tipo_asamblea VARCHAR(50),
    tipo_ejercicio VARCHAR(50),
    nombre_citacion VARCHAR(200),
    motivo VARCHAR(200),
    
    -- Estadísticas
    total_asistentes INT,
    oficiales_comandancia INT,
    oficiales_compania INT,
    total_oficiales INT,
    cargos_confianza INT,
    voluntarios INT,
    participantes INT,
    canjes INT,
    porcentaje_asistencia DECIMAL(5,2),
    
    -- Metadata
    registrado_por VARCHAR(100),
    
    INDEX idx_tipo (tipo),
    INDEX idx_fecha (fecha)
);
```

#### Tabla: `asistencias_detalle`
```sql
CREATE TABLE asistencias_detalle (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    asistencia_id BIGINT NOT NULL,
    bombero_id INT,
    externo_id VARCHAR(50),
    nombre VARCHAR(200) NOT NULL,
    clave_bombero VARCHAR(50),
    categoria VARCHAR(100),
    cargo VARCHAR(100),
    ano_cargo INT,
    es_externo BOOLEAN DEFAULT FALSE,
    tipo_externo VARCHAR(50),
    
    FOREIGN KEY (asistencia_id) REFERENCES asistencias(id),
    INDEX idx_bombero (bombero_id),
    INDEX idx_externo (externo_id)
);
```

#### Tabla: `ranking_asistencias`
```sql
CREATE TABLE ranking_asistencias (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    ano INT NOT NULL,
    bombero_id INT,
    externo_id VARCHAR(50),
    nombre VARCHAR(200) NOT NULL,
    clave_bombero VARCHAR(50),
    total INT DEFAULT 0,
    emergencias INT DEFAULT 0,
    asambleas INT DEFAULT 0,
    ejercicios INT DEFAULT 0,
    citaciones INT DEFAULT 0,
    otras INT DEFAULT 0,
    es_externo BOOLEAN DEFAULT FALSE,
    tipo_externo VARCHAR(50),
    
    INDEX idx_ano (ano),
    INDEX idx_bombero (bombero_id),
    INDEX idx_total (total DESC)
);
```

#### Tabla: `catalogo_externos`
```sql
CREATE TABLE catalogo_externos (
    id VARCHAR(50) PRIMARY KEY,
    nombre VARCHAR(200) NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    total_asistencias INT DEFAULT 0,
    fecha_primera_asistencia DATE,
    fecha_ultima_asistencia DATE,
    
    INDEX idx_tipo (tipo),
    INDEX idx_nombre (nombre)
);
```

### Script de Migración (Python/Django)

```python
import json
from datetime import datetime
from django.db import transaction

def migrar_datos_localstorage(json_file):
    with open(json_file, 'r', encoding='utf-8') as f:
        datos = json.load(f)
    
    with transaction.atomic():
        # Migrar asistencias
        for asist in datos['asistencias']:
            asistencia = Asistencia.objects.create(
                id=asist['id'],
                tipo=asist['tipo'],
                fecha=asist['fecha'],
                descripcion=asist.get('descripcion', ''),
                fecha_registro=asist.get('fechaRegistro'),
                # ... otros campos
            )
            
            # Migrar detalle de asistentes
            for asistente in asist.get('asistentes', []):
                AsistenciaDetalle.objects.create(
                    asistencia=asistencia,
                    bombero_id=asistente.get('bomberoId'),
                    externo_id=asistente.get('externoId'),
                    nombre=asistente['nombre'],
                    # ... otros campos
                )
        
        # Migrar ranking
        for ano, datos_ano in datos['ranking'].items():
            for id_voluntario, stats in datos_ano.items():
                if not id_voluntario.startswith('externos_'):
                    RankingAsistencia.objects.create(
                        ano=int(ano),
                        bombero_id=int(id_voluntario),
                        nombre=stats['nombre'],
                        total=stats['total'],
                        # ... otros campos
                    )
        
        # Migrar catálogo de externos
        for tipo in ['participantes', 'canjes']:
            for id_ext, datos_ext in datos['catalogoExternos'][tipo].items():
                CatalogoExterno.objects.create(
                    id=id_ext,
                    nombre=datos_ext['nombre'],
                    tipo=tipo,
                    total_asistencias=datos_ext.get('totalAsistencias', 0),
                    # ... otros campos
                )
```

---

## 📊 ESTADÍSTICAS Y REPORTES

### Consultas Útiles

#### Total de Asistencias por Tipo
```javascript
const asistencias = JSON.parse(localStorage.getItem('asistencias'));
const porTipo = asistencias.reduce((acc, a) => {
    acc[a.tipo] = (acc[a.tipo] || 0) + 1;
    return acc;
}, {});
```

#### Top 10 Voluntarios del Año
```javascript
const ranking = JSON.parse(localStorage.getItem('rankingAsistencias'));
const ano = 2025;
const top10 = Object.entries(ranking[ano])
    .filter(([k]) => !k.startsWith('externos_'))
    .map(([id, v]) => v)
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);
```

#### Asistencias por Mes
```javascript
const asistencias = JSON.parse(localStorage.getItem('asistencias'));
const porMes = asistencias.reduce((acc, a) => {
    const mes = new Date(a.fecha).getMonth();
    acc[mes] = (acc[mes] || 0) + 1;
    return acc;
}, {});
```

---

## 🔧 MANTENIMIENTO

### Backup Regular

```javascript
// Exportar backup semanal
setInterval(() => {
    verificadorDatos.exportarTodosLosDatos();
}, 7 * 24 * 60 * 60 * 1000); // Cada 7 días
```

### Limpieza de Datos Antiguos

```javascript
// Eliminar asistencias de más de 5 años
function limpiarDatosAntiguos() {
    const asistencias = JSON.parse(localStorage.getItem('asistencias'));
    const hace5Anos = new Date();
    hace5Anos.setFullYear(hace5Anos.getFullYear() - 5);
    
    const actualizadas = asistencias.filter(a => 
        new Date(a.fecha) > hace5Anos
    );
    
    localStorage.setItem('asistencias', JSON.stringify(actualizadas));
}
```

---

## 🚀 MEJORES PRÁCTICAS

1. **Siempre verificar datos antes de migrar**
   ```javascript
   verificadorDatos.verificarTodo();
   ```

2. **Exportar backup antes de cambios importantes**
   ```javascript
   verificadorDatos.exportarTodosLosDatos();
   ```

3. **Usar IDs únicos para asistencias**
   ```javascript
   const id = Date.now();
   ```

4. **Mantener formato estándar en todos los tipos**
   - Siempre incluir `tipo`, `descripcion`, estadísticas

5. **Actualizar ranking automáticamente**
   ```javascript
   this.actualizarRankingAsistencias(asistentes, tipo);
   ```

---

## 📞 SOPORTE

Para cualquier duda sobre el sistema de persistencia:
- Revisar console.log() durante operaciones
- Usar `verificadorDatos.verificarTodo()` para diagnóstico
- Consultar esta documentación

---

**Versión**: 1.0  
**Última Actualización**: 2025-11-05  
**Sistema**: P6P - Sistema de Gestión de Bomberos
