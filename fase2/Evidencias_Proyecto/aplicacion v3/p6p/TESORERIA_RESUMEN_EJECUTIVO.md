# 💰 SISTEMA DE TESORERÍA P6P - RESUMEN EJECUTIVO

## 🎯 COMPONENTES

### 1. CUOTAS SOCIALES MENSUALES
- **Regular:** $5.000/mes
- **Estudiante:** $3.000/mes
- **Configurables** por Tesorero
- **Exentos:** Honorarios 20+, Insignes 25+, Mártires
- **Grid 12 meses:** Visual de pagos por año

### 2. BENEFICIOS (Venta de Tarjetas)
- **Tipos:** Rifa, Bingo, Cena, Baile, Otro
- **Asignación automática** a todos los voluntarios
- **4 categorías** de tarjetas según antigüedad:
  * Voluntarios (0-19 años): 5 tarjetas
  * Honorarios Cía (20-24): 3 tarjetas
  * Honorarios Cuerpo (25-49): 3 tarjetas
  * Insignes (50+): 2 tarjetas
- **Ventas extras** permitidas
- **Liberación de tarjetas** (total/parcial)

### 3. MOVIMIENTOS FINANCIEROS
- Registro automático de TODOS los ingresos
- Categorización: Cuota Mensual, Beneficio, Extra
- Integración con sistema de finanzas global

---

## 🗄️ 6 MODELOS DE BD

```
1. ConfiguracionCuotas (Singleton)
   └── precio_regular, precio_estudiante

2. PagoCuota
   └── bombero, mes, anio, monto, tipo_cuota
   └── UNIQUE(bombero, mes, anio)

3. Beneficio
   └── nombre, fecha_evento, fecha_limite
   └── tarjetas_por_categoria (JSON)

4. AsignacionBeneficio
   └── beneficio, bombero, categoria
   └── tarjetas_asignadas, vendidas, extras
   └── monto_esperado, pagado
   └── historial_liberaciones (JSON)

5. PagoBeneficio
   └── asignacion, tipo (normal/extra)
   └── tarjetas_vendidas, monto

6. MovimientoFinanciero
   └── tipo (ingreso/egreso), categoria, monto
   └── bombero, beneficio (opcional)
```

---

## ⚡ OPERACIONES PRINCIPALES

### CUOTAS
- `POST /api/cuotas/` → Registrar pago
- `GET /api/cuotas/voluntario/{id}/?anio=2024` → Pagos del año
- `GET /api/cuotas/grid/{id}/?anio=2024` → Grid 12 meses
- `PUT /api/configuracion-cuotas/` → Actualizar precios

### BENEFICIOS
- `POST /api/beneficios/` → Crear (+ asignaciones automáticas)
- `GET /api/beneficios/` → Listar (filtros: activo/cerrado/vencido)
- `GET /api/beneficios/{id}/dashboard/` → Estadísticas completas
- `GET /api/beneficios/{id}/deudores/` → Lista de deudores
- `POST /api/beneficios/{id}/cerrar/` → Cerrar (valida sin deudores)

### ASIGNACIONES
- `GET /api/asignaciones/voluntario/{id}/` → Mis asignaciones
- `POST /api/asignaciones/{id}/pagar/` → Pago normal
- `POST /api/asignaciones/{id}/venta-extra/` → Venta extra
- `POST /api/asignaciones/{id}/liberar/` → Liberar tarjetas

---

## ✅ REGLAS CRÍTICAS

### EXENCIONES
```python
NO pagan cuotas:
- Honorarios (20+ años)
- Insignes (25+ años)  
- Mártires (estado)

NO pueden pagar (bloqueados):
- Renunciados
- Separados
- Expulsados
- Fallecidos
```

### VALIDACIONES
- ❌ No duplicar pagos (mes/año único)
- ❌ No cerrar beneficio con deudores
- ✅ Fecha límite > Fecha evento
- ✅ Al menos 1 categoría con tarjetas
- ✅ Ventas extras ilimitadas
- ✅ Liberación recalcula monto esperado

---

## 🔄 FLUJOS AUTOMÁTICOS

### Al crear Beneficio:
1. Se crea el beneficio
2. Se asignan tarjetas a TODOS los voluntarios según categoría
3. Se calcula monto_esperado por cada uno

### Al registrar Pago (Cuota o Beneficio):
1. Se crea el registro de pago
2. Se actualiza monto_pagado
3. Se recalcula estado_pago (pendiente/parcial/pagado)
4. Se crea MovimientoFinanciero automáticamente

### Al liberar Tarjetas:
1. Se reduce tarjetas_asignadas
2. Se recalcula monto_esperado
3. Se guarda en historial_liberaciones (JSON)
4. Se actualiza estado_pago

---

## 📊 DASHBOARD DE BENEFICIO

- Total asignados / Pagados / Deudores
- Monto esperado / Recaudado / Pendiente
- Eficiencia (%)
- Distribución por categoría
- Tabla completa con todos los voluntarios
- Filtros y exportación

---

## 🎨 ARCHIVOS DEL SISTEMA ACTUAL

### JavaScript:
```
js/cuotas-beneficios.js (1014 líneas)
  ├── Clase SistemaCuotasBeneficios
  ├── Tabs: Cuotas, Beneficios, Deudas
  ├── Grid de 12 meses
  └── Registro automático en finanzas

js/beneficios.js (1630 líneas)
  ├── Clase SistemaBeneficios
  ├── Dashboard interactivo
  ├── Gráficos Chart.js
  └── Modales para deudores

js/pagar-beneficio.js (1053 líneas)
  ├── Clase SistemaPagarBeneficio
  ├── Pago normal
  ├── Venta extra
  └── Liberar tarjetas

js/configurar-cuotas.js (121 líneas)
  └── Configuración de precios
```

### HTML:
```
cuotas-beneficios.html
beneficios.html
pagar-beneficio.html
configurar-cuotas.html
```

---

## 🚀 MIGRACIÓN A DJANGO

### Prioridad 1: Modelos
- ConfiguracionCuotas
- PagoCuota (unique_together)
- Beneficio + AsignacionBeneficio
- PagoBeneficio
- MovimientoFinanciero

### Prioridad 2: Servicios
- puede_pagar_cuotas()
- obtener_categoria_beneficio()
- crear_beneficio_con_asignaciones()
- registrar_pago_cuota()
- registrar_pago_beneficio()
- registrar_venta_extra()
- liberar_tarjetas()
- cerrar_beneficio()

### Prioridad 3: API Endpoints
- ViewSets con permisos por rol
- Serializers anidados
- Acciones custom (@action)
- Filtros y búsquedas

### Prioridad 4: Frontend
- Templates con Grid 12 meses
- AJAX para pagos
- Modales React/Vue
- Gráficos Chart.js

---

## 📝 ARCHIVOS DE DOCUMENTACIÓN

Ver detalles completos en:
- `TESORERIA_DJANGO_MODELOS.md` → Modelos completos
- `TESORERIA_DJANGO_SERVICIOS.md` → Lógica de negocio
- `TESORERIA_DJANGO_API.md` → Endpoints y serializers
- `TESORERIA_PASO_A_PASO.md` → Implementación guiada
