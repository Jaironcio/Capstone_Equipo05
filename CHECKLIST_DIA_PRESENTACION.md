# ✅ CHECKLIST COMPLETO - DÍA DE LA PRESENTACIÓN
## Sistema P6P - Defensa Proyecto Capstone

---

## 📅 PREPARACIÓN PREVIA (1-2 DÍAS ANTES)

### **Validación Técnica:**
- [ ] Servidor Django funcionando sin errores
- [ ] Base de datos con datos de prueba realistas cargados
- [ ] Todos los módulos testeados y operativos
- [ ] PDFs generándose correctamente
- [ ] Navegador actualizado y sin extensiones problemáticas
- [ ] Screenshots de respaldo en carpeta accesible

### **Preparación de Datos:**
```bash
# Ejecutar estos scripts para cargar datos de demo
cd Fase_3/bomberos_django
.\venv\Scripts\activate

python crear_voluntarios_ejemplo.py
python asignar_cargos_ejemplo.py
python activar_ciclo_2025.py
```

**Voluntarios de prueba creados:**
- [ ] Voluntarios con diferentes antigüedades
- [ ] Cargos asignados (Comandancia, Compañía, Consejo, Técnicos)
- [ ] Eventos de asistencia registrados
- [ ] Beneficios configurados
- [ ] Ciclo de cuotas 2025 activo
- [ ] Al menos 2-3 cuotas pagadas por voluntario

### **Material de Presentación:**
- [ ] Diapositivas en formato accesible (PowerPoint, PDF, Google Slides)
- [ ] PRESENTACION_FINAL.md revisado
- [ ] GUION_DEMO_DETALLADO.md impreso o en tablet
- [ ] PUNTOS_CLAVE_Y_PREGUNTAS.md leído y memorizado
- [ ] Credenciales de acceso anotadas (usuario/contraseña)

### **Logística:**
- [ ] Laptop/computadora cargada al 100%
- [ ] Cargador de respaldo
- [ ] Cable HDMI/adaptador para proyector
- [ ] Mouse externo (opcional, para demo más precisa)
- [ ] Conexión a internet verificada (si es necesaria)
- [ ] Plan B: hotspot del celular si falla WiFi

---

## 🕐 EL DÍA DE LA PRESENTACIÓN

### **2 HORAS ANTES:**

#### **Setup Técnico:**
- [ ] Encender laptop y esperar a que cargue completamente
- [ ] Conectar a corriente (no confiar solo en batería)
- [ ] Verificar configuración de pantalla (resolución, duplicar/extender)

#### **Iniciar Sistema:**
```bash
# 1. Abrir terminal en carpeta del proyecto
cd C:\Users\jairo\OneDrive\Escritorio\p6p\Capstone_Equipo05\Fase_3\bomberos_django

# 2. Activar entorno virtual
.\venv\Scripts\activate

# 3. Iniciar servidor
python manage.py runserver
```

- [ ] Servidor Django corriendo sin errores
- [ ] Consola mostrando: "Starting development server at http://127.0.0.1:8000/"
- [ ] NO cerrar esta terminal durante la presentación

#### **Validación Rápida:**
- [ ] Abrir http://127.0.0.1:8000 en navegador
- [ ] Login funciona correctamente
- [ ] Dashboard carga sin errores
- [ ] Navegar rápidamente por cada módulo:
  - [ ] Voluntarios → listado carga
  - [ ] Cargos → datos visibles
  - [ ] Asistencias → ranking visible
  - [ ] Beneficios → listado carga
  - [ ] Finanzas → ciclos y cuotas visibles
  - [ ] Generar un PDF de prueba → descarga correctamente

#### **Preparar Navegador:**
- [ ] Cerrar todas las pestañas innecesarias
- [ ] Dejar solo 2 pestañas abiertas:
  1. Login del sistema (http://127.0.0.1:8000)
  2. Pestaña de respaldo en otro navegador (Firefox, Edge)
- [ ] Limpiar historial de navegación (Ctrl+Shift+Del)
- [ ] Zoom del navegador al 100% (Ctrl+0)
- [ ] Modo pantalla completa listo (F11) para la demo

#### **Limpieza del Sistema:**
- [ ] Cerrar aplicaciones no necesarias:
  - [ ] Spotify, YouTube, redes sociales
  - [ ] Clientes de email
  - [ ] Chat (WhatsApp, Discord, etc.)
  - [ ] Otras IDEs o editores
- [ ] Silenciar todas las notificaciones:
  - [ ] Windows: Modo "No molestar" activado
  - [ ] Cerrar bandeja del sistema
- [ ] Poner celular en silencio y boca abajo

---

### **30 MINUTOS ANTES:**

#### **Llegada al Lugar:**
- [ ] Llegar al menos 30 min antes (mejor 45 min)
- [ ] Ubicar la sala de presentación
- [ ] Identificar contacto técnico (si hay problemas)

#### **Setup en Sala:**
- [ ] Conectar laptop al proyector/pantalla
- [ ] Verificar que se ve correctamente
- [ ] Configurar pantalla (duplicar o extender según convenga)
- [ ] Probar audio si hay video o sonidos (NO APLICA en este proyecto)
- [ ] Identificar dónde estarás parado y si alcanzas el mouse/teclado

#### **Prueba Final de Proyección:**
- [ ] Abrir navegador y verificar que se proyecta bien
- [ ] Tamaño de fuente legible desde atrás de la sala
- [ ] Colores se ven bien (no lavados)
- [ ] Cursor del mouse visible y grande si es necesario

#### **Coordinar con Equipo:**
- [ ] Definir quién presenta cada parte (si son varios)
- [ ] Repasar señales/transitions entre presentadores
- [ ] Verificar que todos tienen material de respaldo
- [ ] Dar palabras de ánimo 💪

---

### **10 MINUTOS ANTES:**

#### **Estado del Sistema:**
- [ ] Servidor Django corriendo (verificar en terminal)
- [ ] Navegador abierto en pantalla de login
- [ ] Credenciales listas para copiar/pegar o escribir

#### **Material Físico:**
- [ ] Tarjetas de notas a mano (GUION_DEMO_DETALLADO)
- [ ] Reloj visible para controlar tiempo
- [ ] Agua cerca (para nervios/voz seca)
- [ ] Puntero o mouse preparado

#### **Estado Mental:**
- [ ] Ir al baño (eliminar nervios físicos)
- [ ] Respiraciones profundas: 4-7-8 (inhala 4 seg, retén 7, exhala 8)
- [ ] Visualizar éxito: imagina la presentación fluyendo perfectamente
- [ ] Leer mantra personal:
  > "Conozco mi proyecto. Estoy preparado. Lo haré bien."

---

### **MINUTO 0 → INICIO DE PRESENTACIÓN:**

#### **Cuando te llamen:**
- [ ] Respirar profundo
- [ ] Sonreír genuinamente
- [ ] Caminar con confianza
- [ ] Contacto visual con el jurado

#### **Primeras palabras:**
> "Buenos días/tardes. Somos el Equipo 05 y presentamos nuestro proyecto Capstone: Sistema de Gestión P6P para la 6ta Compañía de Bomberos."

#### **Iniciar cronómetro:**
- [ ] Cronómetro en celular o reloj
- [ ] O pedir a un compañero que controle tiempo
- [ ] Avisos sutiles a los 10 min y 15 min

---

## 🎬 DURANTE LA PRESENTACIÓN

### **Checklist de Actitud:**
- [ ] Hablar claro y pausado (no apresurarse)
- [ ] Mirar al jurado, no solo a la pantalla
- [ ] Usar las manos para enfatizar (natural, no excesivo)
- [ ] Sonreír cuando sea apropiado
- [ ] Pausas breves entre secciones para que procesen

### **Transiciones Suaves:**
- [ ] Usar conectores verbales:
  - "Ahora que vimos X, pasemos a Y..."
  - "Para entender esto mejor, veamos la demo..."
  - "Un aspecto clave es..."

### **Durante la Demo (Min 10-17):**
- [ ] Narrar TODO lo que haces:
  - "Voy a hacer clic en Voluntarios..."
  - "Aquí vemos la lista completa..."
  - "Noten cómo se calcula la antigüedad..."
- [ ] Movimientos lentos de mouse (no clickar muy rápido)
- [ ] Dar tiempo para que lean pantalla (cuenta mental 1-2-3)
- [ ] Si algo carga, llenar el silencio:
  - "El sistema está cargando los datos..."
  - "Aquí procesamos la información de la base de datos..."

### **Manejo de Tiempo:**
| Minuto | Checkpoint | Acción si... |
|--------|-----------|--------------|
| 5 | Objetivos presentados | Vas adelantado: respira más, explica mejor |
| | | Vas atrasado: resume lecciones aprendidas |
| 10 | Demo empieza | Vas adelantado: amplía explicaciones en demo |
| | | Vas atrasado: combina módulos (voluntarios + cargos rápido) |
| 15 | Demo termina | Vas adelantado: detalla más en conclusiones |
| | | Vas atrasado: salta directo a conclusiones clave |
| 17 | Conclusiones | Vas adelantado: expande trabajo futuro |
| | | Vas atrasado: resume en 2-3 frases clave |

---

## ❓ SESIÓN DE PREGUNTAS

### **Cuando Abran Preguntas:**
- [ ] Agradecer por la atención
- [ ] Decir: "Con gusto responderemos sus preguntas"
- [ ] Postura abierta y receptiva

### **Al Responder:**
- [ ] Escuchar la pregunta completa (no interrumpir)
- [ ] Repetir/parafrasear si no está clara:
  - "Si entiendo correctamente, pregunta sobre..."
- [ ] Respuesta estructurada:
  1. Respuesta directa (10-15 seg)
  2. Justificación/ejemplo (20-30 seg)
  3. Cierre: "¿Responde su pregunta?"

### **Si No Sabes la Respuesta:**
- [ ] SER HONESTO: "Excelente pregunta. No tengo la respuesta exacta en este momento..."
- [ ] Ofrecer alternativa:
  - "...pero puedo investigarlo y enviarles la información"
  - "...mi compañero [Nombre] trabajó más en ese módulo"
- [ ] NO inventar o especular
- [ ] El jurado valora honestidad > respuestas inventadas

### **Tipos de Preguntas Comunes:**
- [ ] Técnicas → usar vocabulario preciso, ejemplos del código
- [ ] Metodológicas → hablar de proceso, sprints, git
- [ ] Negocio → impacto, ROI, escalabilidad
- [ ] Aprendizaje → lecciones, desafíos, crecimiento personal

---

## ✅ DESPUÉS DE PRESENTAR

### **Inmediatamente Después:**
- [ ] Agradecer al jurado
- [ ] Cerrar navegador y terminal (para próximo grupo)
- [ ] Desconectar laptop del proyector
- [ ] Recoger material y salir ordenadamente

### **En Sala de Espera:**
- [ ] Respirar y relajarse
- [ ] NO analizar cada detalle ("¿me vieron nervioso?")
- [ ] Celebrar con el equipo: ¡LO LOGRARON!

### **Feedback:**
- [ ] Anotar preguntas que no pudiste responder
- [ ] Registrar comentarios del jurado
- [ ] Identificar qué salió muy bien (para repetir)
- [ ] Identificar qué mejorar (para futuras presentaciones)

---

## 🚨 PLANES DE CONTINGENCIA

### **Problema: Servidor Django se cae durante demo**
**Solución:**
1. No entrar en pánico
2. Decir: "Permítanme reiniciar el servicio rápidamente"
3. Ir a terminal, Ctrl+C para detener
4. `python manage.py runserver` para reiniciar
5. Mientras carga (30 seg), continuar narrando:
   - "Como ven, el sistema usa Django que permite..."
   - "En estos segundos está inicializando la aplicación..."

**Si no se soluciona en 1 minuto:**
- Usar screenshots de respaldo
- Narrar la demo en vez de mostrarla en vivo
- Decir: "Les mostraré con estas capturas el flujo completo..."

---

### **Problema: Proyector no funciona**
**Solución:**
1. Pedir ayuda técnica INMEDIATO
2. Mientras solucionan, empezar presentación oral (intro, problema, objetivos)
3. Si toma >3 min, ofrecer:
   - "Puedo enviarles las diapositivas y hacer demo en sus laptops individuales después"
   - O continuar de forma oral, describiendo todo

---

### **Problema: Internet necesario y WiFi falla**
**Solución:**
1. Usar hotspot del celular
2. O confirmar: "¿El sistema funciona en localhost sin internet?" (SÍ en tu caso)
3. Explicar: "El sistema corre localmente, no requiere internet para funcionar"

---

### **Problema: Te quedas en blanco**
**Solución:**
1. Pausa de 2-3 segundos (sentirás que es eterno, pero es normal)
2. Respirar profundo
3. Mirar tus notas rápidamente
4. O decir: "Permítanme consultar mis notas..."
5. Retomar desde último punto claro

---

### **Problema: Te pasas de tiempo (minuto 19 y aún no terminas)**
**Solución:**
1. Ir directo a conclusión clave:
   - "Para resumir: logramos los objetivos, el sistema funciona, y estamos listos para producción"
2. Saltar trabajo futuro
3. Abrir a preguntas
4. MEJOR TERMINAR EN 19 MIN que en 21 MIN

---

## 📝 NOTAS MOTIVACIONALES FINALES

### **Recuerda:**
- ✅ Has trabajado duro en este proyecto
- ✅ Conoces el sistema mejor que nadie
- ✅ Tienes material profesional y completo
- ✅ Estás preparado técnica y mentalmente
- ✅ El jurado QUIERE que te vaya bien
- ✅ Errores menores son normales y esperados
- ✅ Tu pasión por el proyecto se notará y valorará

### **Mantra Final:**
> "Soy competente. Estoy preparado. Confío en mi trabajo.  
> Voy a comunicar con claridad el valor de este proyecto.  
> Respiraré, sonreiré, y daré lo mejor de mí.  
> ¡VAMOS A BRILLAR!" 🌟

---

## 🏆 ÚLTIMA VERIFICACIÓN (5 MIN ANTES)

```
✅ Servidor corriendo
✅ Navegador en login
✅ Proyector funciona
✅ Cronómetro listo
✅ Agua cerca
✅ Respiraciones profundas
✅ Sonrisa preparada
✅ Confianza al 100%
```

---

# ¡ES TU MOMENTO! 🚀

**Ahora sal y demuestra todo lo que has logrado.**

**MUCHA SUERTE Y ÉXITO** 🎉🎊

---

**Documento creado:** Noviembre 2025  
**Revisado:** Pre-presentación  
**Estado:** ✅✅✅ LISTO PARA TRIUNFAR ✅✅✅
