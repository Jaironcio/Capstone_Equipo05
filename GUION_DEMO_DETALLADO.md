# 🎬 GUION DETALLADO - DEMOSTRACIÓN EN VIVO
## Sistema P6P - Presentación Final (7 minutos de demo)

---

## ⏱️ CRONOGRAMA DE DEMOSTRACIÓN

| Tiempo | Módulo | Duración |
|--------|--------|----------|
| 10:00-11:00 | Login y Dashboard | 1 min |
| 11:00-12:00 | Voluntarios | 1 min |
| 12:00-13:00 | Cargos | 1 min |
| 13:00-14:00 | Asistencias | 1 min |
| 14:00-15:30 | Beneficios | 1.5 min |
| 15:30-16:30 | Tesorería/Cuotas | 1 min |
| 16:30-17:00 | PDFs | 0.5 min |

---

## 🎯 PREPARACIÓN PREVIA (ANTES DE LA PRESENTACIÓN)

### **Checklist Técnico:**
- [ ] Servidor Django corriendo en http://127.0.0.1:8000
- [ ] Base de datos con datos de prueba cargados
- [ ] Navegador abierto en pestaña de login
- [ ] Credenciales de acceso anotadas
- [ ] Screenshots de respaldo en carpeta
- [ ] Conexión a internet estable (si es necesario)
- [ ] Zoom/proyector configurado correctamente
- [ ] Audio del computador silenciado (notificaciones)

### **Datos de Prueba Recomendados:**
```python
# Usuario admin para demo
username: admin
password: admin123

# Voluntarios de ejemplo:
- Juan Pérez (Clave: 001) - Capitán
- María González (Clave: 015) - Voluntario
- Carlos Rojas (Clave: 030) - Director
- Ana Torres (Clave: 045) - Miembro Junta Calificadora
```

### **Scripts de Carga de Datos (ejecutar ANTES):**
```bash
# Navegar a la carpeta del proyecto
cd Fase_3/bomberos_django

# Activar entorno virtual
.\venv\Scripts\activate

# Ejecutar scripts de datos de ejemplo
python crear_voluntarios_ejemplo.py
python asignar_cargos_ejemplo.py
python activar_ciclo_2025.py
```

---

## 📋 GUION PASO A PASO

---

### **MINUTO 10:00-11:00 → LOGIN Y DASHBOARD** (1 min)

**🎤 Qué decir:**
> "Comencemos viendo el sistema en acción. Aquí tenemos la pantalla de inicio con autenticación segura."

**👆 Acciones:**
1. **Mostrar pantalla de login**
   - URL: http://127.0.0.1:8000
   - Destacar diseño limpio y profesional

2. **Ingresar credenciales**
   ```
   Usuario: admin
   Password: admin123
   ```

3. **Clic en "INICIAR SESIÓN"**

4. **Mostrar Dashboard principal**
   - Señalar barra de navegación superior
   - Mencionar: "Menú con acceso a todos los módulos"
   - Destacar: nombre de usuario logueado

**🎤 Qué decir:**
> "Una vez autenticados, accedemos al panel principal donde encontramos todos los módulos del sistema: Voluntarios, Cargos, Asistencias, Beneficios, Finanzas, y más."

**⏱️ Checkpoint: 11:00**

---

### **MINUTO 11:00-12:00 → MÓDULO VOLUNTARIOS** (1 min)

**🎤 Qué decir:**
> "El módulo de Voluntarios es el corazón del sistema. Aquí centralizamos toda la información de los bomberos."

**👆 Acciones:**
1. **Clic en menú "Voluntarios"** o navegar a `/voluntarios/`

2. **Mostrar listado completo**
   - Señalar la tabla con columnas: Clave, Nombre, Compañía, Estado, Antigüedad
   - Mencionar: "Filtros disponibles por estado, compañía, etc."

3. **Buscar voluntario específico**
   - Usar barra de búsqueda o filtro
   - Ejemplo: buscar "Juan Pérez" o Clave "001"

4. **Abrir detalle del voluntario** (clic en nombre o botón "Ver")

5. **Mostrar ficha completa**
   - Datos personales (RUT, nombre, dirección)
   - Fecha de ingreso
   - **Antigüedad calculada automáticamente** ← ENFATIZAR
   - Estado (Activo/Inactivo/Mártir)
   - Compañía asignada
   - Documento si es estudiante

**🎤 Qué decir:**
> "Noten cómo el sistema calcula automáticamente la antigüedad. Por ejemplo, este voluntario ingresó en 1998, por lo tanto tiene 27 años de servicio, clasificándose como 'Voluntario Honorario del Cuerpo'."

**⏱️ Checkpoint: 12:00**

---

### **MINUTO 12:00-13:00 → SISTEMA DE CARGOS** (1 min)

**🎤 Qué decir:**
> "El sistema de cargos es uno de los más complejos, ya que debe manejar diferentes jerarquías y reglas específicas de los bomberos."

**👆 Acciones:**
1. **Navegar a "Cargos"** → `/cargos/`

2. **Mostrar listado de cargos existentes**
   - Filtrar por año: 2025
   - Señalar las 4 categorías:
     - 🎖️ Comandancia (Superintendente, Comandantes)
     - 👔 Compañía (Capitán, Director, Tenientes)
     - 🏛️ Consejo (Junta Calificadora, Revisora)
     - 🔧 Técnicos (Jefe de Máquinas, Maquinistas)

3. **Seleccionar un cargo ejemplo** (ej: "Capitán" de Juan Pérez)
   - Mostrar datos:
     - Voluntario asignado
     - Tipo de cargo
     - Año de vigencia
     - Fecha inicio y fin (opcional)

4. **Crear nuevo cargo rápido** (opcional si hay tiempo)
   - Clic en "Nuevo Cargo"
   - Seleccionar voluntario
   - Elegir tipo: "Compañía" → "Teniente Primero"
   - Año: 2025
   - Guardar

**🎤 Qué decir:**
> "Los cargos tienen reglas especiales. Por ejemplo, los cargos de Consejo no se muestran en las asistencias; en su lugar, se muestra el grado por antigüedad del voluntario. Además, solo los Directores pueden asistir a reuniones de Directorio."

**⏱️ Checkpoint: 13:00**

---

### **MINUTO 13:00-14:00 → CONTROL DE ASISTENCIAS** (1 min)

**🎤 Qué decir:**
> "El sistema de asistencias automatiza el registro y cálculo del ranking, una tarea que antes se hacía manualmente en planillas Excel."

**👆 Acciones:**
1. **Ir a "Asistencias"** → `/asistencias/`

2. **Mostrar eventos existentes**
   - Tabla con: Fecha, Tipo, Descripción, Total Asistentes

3. **Crear nuevo evento de asistencia**
   - Clic en "Registrar Asistencia"
   - Seleccionar tipo: **"Emergencia"**
   - Ingresar datos:
     - Fecha: hoy
     - Clave: "Incendio Calle Principal 123"
     - Dirección: "Av. Principal 123"
     - Hora: "14:30"

4. **Seleccionar asistentes**
   - Marcar 3-5 voluntarios del listado
   - Mostrar cómo aparecen con sus categorías automáticas:
     - "Juan Pérez - Oficial de Compañía (Capitán)"
     - "María González - Voluntaria"
     - "Carlos Rojas - Oficial de Compañía (Director)"

5. **Guardar evento**

6. **Ver ranking actualizado**
   - Navegar a pestaña "Ranking" o vista de ranking
   - Mostrar tabla ordenada por total de asistencias
   - Señalar contadores por tipo (emergencias, asambleas, etc.)

**🎤 Qué decir:**
> "Noten que el sistema asigna automáticamente la categoría correcta según el cargo vigente de cada bombero. Y lo importante: las asistencias a Directorios NO suman al ranking individual, solo se registran para control."

**⏱️ Checkpoint: 14:00**

---

### **MINUTO 14:00-15:30 → GESTIÓN DE BENEFICIOS** (1.5 min)

**🎤 Qué decir:**
> "Los bomberos reciben beneficios económicos por diferentes conceptos: fallecimientos, nacimientos, cumpleaños, etc. Este módulo automatiza todo el proceso."

**👆 Acciones:**
1. **Navegar a "Beneficios"** → `/beneficios/`

2. **Mostrar listado de beneficios configurados**
   - Ejemplo: "Beneficio por Nacimiento - $50,000"
   - "Beneficio por Cumpleaños - $20,000"

3. **Crear nuevo beneficio**
   - Clic en "Nuevo Beneficio"
   - Datos:
     - Nombre: "Beneficio por Fallecimiento Familiar"
     - Monto: $100,000
     - Categoría: "Social"
     - Descripción: "Apoyo por fallecimiento de familiar directo"
   - Guardar

4. **Asignar beneficio a voluntario**
   - Seleccionar beneficio creado
   - Elegir voluntario: "María González"
   - Ingresar motivo/observación
   - Estado: "Aprobado"
   - Guardar

5. **Procesar pago del beneficio**
   - Ir a "Beneficios Pendientes de Pago"
   - Seleccionar el de María González
   - Clic en "Pagar Beneficio"
   - Confirmar

6. **Mostrar movimiento financiero generado**
   - Ir a "Movimientos Financieros" o "Tesorería"
   - Buscar último movimiento
   - Mostrar:
     - Tipo: "Egreso - Pago Beneficio"
     - Monto: $100,000
     - Beneficiario: María González
     - Fecha y hora
     - Saldo actualizado

**🎤 Qué decir:**
> "Todo el flujo queda registrado: desde la solicitud hasta el pago, con trazabilidad completa. Además, se actualiza automáticamente el balance de tesorería."

**⏱️ Checkpoint: 15:30**

---

### **MINUTO 15:30-16:30 → TESORERÍA Y CUOTAS** (1 min)

**🎤 Qué decir:**
> "La gestión de cuotas mensuales es fundamental para el financiamiento de la compañía. Aquí automatizamos todo el ciclo."

**👆 Acciones:**
1. **Ir a "Finanzas"** o **"Cuotas"** → `/finanzas/`

2. **Mostrar configuración de ciclos**
   - Navegar a "Ciclos de Cuotas"
   - Mostrar ciclo activo: "Ciclo 2025"
   - Señalar:
     - Monto mensual: $5,000
     - Meses activos: Enero-Diciembre
     - Total voluntarios activos

3. **Ver estado de cuotas de un voluntario**
   - Buscar voluntario: "Juan Pérez"
   - Mostrar tabla de cuotas:
     - Meses: Ene, Feb, Mar... Dic
     - Estado: Pagado ✅ / Pendiente ⏳
     - Saldo acumulado

4. **Registrar pago de cuota**
   - Seleccionar mes pendiente (ej: Noviembre)
   - Clic en "Pagar Cuota"
   - Datos:
     - Monto: $5,000
     - Forma de pago: "Transferencia"
     - Fecha: hoy
   - Guardar

5. **Ver actualización en tiempo real**
   - Estado cambia a "Pagado ✅"
   - Saldo se actualiza
   - Se genera movimiento de ingreso en tesorería

**🎤 Qué decir:**
> "El sistema permite configurar ciclos anuales, montos diferenciados, y llevar control detallado mes a mes. Todo se sincroniza automáticamente con la tesorería general."

**⏱️ Checkpoint: 16:30**

---

### **MINUTO 16:30-17:00 → GENERACIÓN DE PDFs** (0.5 min)

**🎤 Qué decir:**
> "Finalmente, el sistema genera documentos PDF automáticos para diferentes propósitos."

**👆 Acciones:**
1. **Ir a sección de Reportes/PDFs**
   - O desde el detalle de un voluntario, clic en "Generar PDF de Cuotas"

2. **Generar PDF de cuotas**
   - Seleccionar voluntario: "Juan Pérez"
   - Año: 2025
   - Clic en "Generar PDF"

3. **Mostrar PDF descargado**
   - Abrir el archivo
   - Señalar elementos:
     - Logo de la compañía (si existe)
     - Datos del voluntario
     - Tabla de cuotas con estado
     - Total pagado y saldo pendiente
     - Fecha de generación

4. **Mencionar otros PDFs disponibles**
   - "Certificados de uniformes"
   - "Reportes de beneficios"
   - "Listados de asistencias"

**🎤 Qué decir:**
> "Los PDFs se generan con formato profesional e incluyen todos los datos relevantes. Esto elimina la necesidad de crear documentos manualmente en Word o Excel."

**⏱️ Checkpoint: 17:00**

---

## 🎯 MENSAJES CLAVE DURANTE LA DEMO

### **Frases para Enfatizar:**
1. ✅ **Automatización:** "Lo que antes tomaba horas, ahora se hace en segundos."
2. ✅ **Precisión:** "Eliminamos errores de cálculo manual."
3. ✅ **Trazabilidad:** "Cada acción queda registrada con fecha y usuario."
4. ✅ **Integración:** "Todos los módulos están conectados y sincronizados."
5. ✅ **Escalabilidad:** "Sistema preparado para crecer con la compañía."

### **Conectores Entre Módulos:**
- Voluntarios → Cargos: "Ahora que vimos los voluntarios, veamos cómo se les asignan cargos..."
- Cargos → Asistencias: "Los cargos determinan cómo aparecen en las asistencias..."
- Asistencias → Beneficios: "Las asistencias se vinculan con beneficios por antigüedad..."
- Beneficios → Tesorería: "Los beneficios impactan directamente en la tesorería..."
- Tesorería → PDFs: "Todo esto se documenta en reportes PDF profesionales..."

---

## ⚠️ PLAN DE CONTINGENCIA

### **Si algo falla:**

#### **Problema: Servidor no responde**
- **Solución 1:** Refrescar página (F5)
- **Solución 2:** Reiniciar servidor Django rápidamente
- **Solución 3:** Usar screenshots de respaldo y narrar la demo

#### **Problema: Base de datos vacía**
- **Solución:** Tener script de carga rápida:
  ```bash
  python crear_voluntarios_ejemplo.py
  ```

#### **Problema: Error en navegador**
- **Solución:** Tener pestaña de respaldo abierta en otro navegador

#### **Problema: Se acabó el tiempo**
- **Prioridades:**
  1. Login ✅
  2. Voluntarios ✅
  3. Asistencias ✅
  4. Saltar a PDFs directamente

---

## 📝 NOTAS FINALES PARA EL PRESENTADOR

### **Consejos de Presentación:**
1. 🗣️ **Habla claro y pausado** - La audiencia debe entender cada función
2. 🖱️ **Movimientos lentos** - No clicar muy rápido, dar tiempo a procesar
3. 👀 **Mira a la audiencia** - No solo a la pantalla
4. 😊 **Muestra entusiasmo** - Es TU proyecto, demuestra orgullo
5. ⏱️ **Monitorea el tiempo** - Tener reloj/celular visible
6. 🎯 **Destaca lo importante** - No te pierdas en detalles menores

### **Errores Comunes a Evitar:**
- ❌ Ir demasiado rápido en la demo
- ❌ No explicar QUÉ estás haciendo
- ❌ Quedarte en silencio mientras cargan páginas
- ❌ Disculparse demasiado si algo falla
- ❌ Leer las diapositivas textualmente

### **Si Te Preguntan Durante la Demo:**
- ✅ Si es pregunta corta: responde brevemente
- ⏸️ Si es pregunta larga: "Excelente pregunta, la retomo al final"
- 🔄 No pierdas el hilo de la demostración

---

## ✅ CHECKLIST FINAL PRE-DEMO

**30 minutos antes:**
- [ ] Servidor Django funcionando
- [ ] Datos de prueba cargados
- [ ] Navegador abierto en login
- [ ] Proyector/pantalla compartida configurada
- [ ] Micrófono funcionando
- [ ] Agua cerca (para nervios)

**5 minutos antes:**
- [ ] Cerrar otras aplicaciones
- [ ] Silenciar notificaciones
- [ ] Abrir cronómetro
- [ ] Respirar profundo
- [ ] Sonreír 😊

---

## 🚀 ¡ADELANTE, LO VAS A HACER GENIAL!

**Recuerda:** Has construido algo increíble. Solo muestra con confianza el fruto de tu trabajo.

---

**Última revisión:** Noviembre 2025  
**Estado:** ✅ Listo para presentar
