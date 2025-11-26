# 📋 SISTEMA DE UNIFORMES P6P - ESPECIFICACIONES PARA DJANGO
## PARTE 3: GENERACIÓN DE PDF

---

## 📄 1. ESTRUCTURA DEL PDF

### 1.1 Elementos del Documento

**HEADER:**
- Logo de compañía (izquierda, 28x28px)
- Título centrado: "REGISTRO DE UNIFORMES ASIGNADOS"
- Línea decorativa gruesa (1px) con color del uniforme
- Línea decorativa delgada (0.3px) con color del uniforme

**DATOS DEL VOLUNTARIO:**
- Recuadro con fondo color claro (color uniforme + 90% blanco)
- Borde color del uniforme (0.5px)
- Título: "DATOS DEL VOLUNTARIO"
- Campos:
  * Nombre Completo
  * Clave Bombero
  * RUN
  * Compañía
  * Antigüedad (años, meses)

**SECCIÓN UNIFORME:**
- Título: "UNIFORME ENTREGADO"
- Barra de color con nombre del tipo (8px altura)
  * Fondo: Color del uniforme
  * Texto: Blanco, negrita (ej: "UNIFORME ESTRUCTURAL")
- ID del uniforme (fuente 8px, gris)

**LISTA DE PIEZAS:**
Para cada pieza activa:
- Recuadro independiente (28px altura)
  * Fondo: Gris muy claro (#FAFAFA)
  * Borde: Gris claro (#DCDCDC, 0.3px)
- Contenido:
  * Línea 1: Número y nombre del componente (color del uniforme, negrita)
  * Línea 2: Marca | Serie | Talla
  * Línea 3: Condición | Estado | Fecha Entrega (fuente 8px, gris)

**OBSERVACIONES:**
- Si existen, mostrar después de las piezas
- Formato: "Observaciones: {texto}"

**DECLARACIÓN:**
- Recuadro con fondo amarillo claro (#FFF8E1)
- Borde amarillo (#FFC107, 0.5px)
- Título: "DECLARACIÓN:" (color del uniforme)
- Texto: "Declaro haber recibido los uniformes detallados anteriormente en buen estado, comprometiéndome a su correcto uso y conservación."

**SECCIÓN DE FIRMAS:**
- Título centrado: "FIRMAS Y AUTORIZACIONES"
- Dos columnas:
  * **Izquierda:** Línea de firma → "Firma del Voluntario" → Nombre → RUN
  * **Derecha:** Línea de firma → "Firma y Timbre" → "Capitanía / Autoridad" → "Fecha: __________"

**FOOTER (en todas las páginas):**
- Línea horizontal con color del uniforme (0.3px)
- Izquierda: "Documento generado el {fecha}"
- Derecha: "Página {n} de {total}"
- Centro (fuente 6px): "Sistema de Registro de Uniformes - Proyecto SEIS"

---

## 🎨 2. COLORES POR TIPO DE UNIFORME

```python
COLORES_PDF = {
    'estructural': {'r': 255, 'g': 152, 'b': 0, 'nombre': 'Naranja'},
    'forestal': {'r': 76, 'g': 175, 'b': 80, 'nombre': 'Verde'},
    'rescate': {'r': 244, 'g': 67, 'b': 54, 'nombre': 'Rojo'},
    'hazmat': {'r': 255, 'g': 235, 'b': 59, 'nombre': 'Amarillo'},
    'tenidaCuartel': {'r': 33, 'g': 150, 'b': 243, 'nombre': 'Azul'},
    'accesorios': {'r': 156, 'g': 39, 'b': 176, 'nombre': 'Morado'},
    'parada': {'r': 63, 'g': 81, 'b': 181, 'nombre': 'Índigo'},
    'usar': {'r': 255, 'g': 87, 'b': 34, 'nombre': 'Naranja Oscuro'},
    'agreste': {'r': 139, 'g': 195, 'b': 74, 'nombre': 'Verde Oliva'},
    'um6': {'r': 0, 'g': 150, 'b': 199, 'nombre': 'Azul Marítimo'},
    'gersa': {'r': 0, 'g': 188, 'b': 212, 'nombre': 'Cyan'}
}
```

---

## 📐 3. COORDENADAS Y MEDIDAS

### Tamaño de Página
- **Formato:** A4 (210mm x 297mm)
- **Margen izquierdo:** 15mm
- **Margen derecho:** 15mm
- **Ancho útil:** 180mm

### Posiciones Y (desde arriba)
- Logo: 8mm
- Título: 22mm
- Línea decorativa 1: 40mm
- Línea decorativa 2: 42mm
- Datos voluntario: 50mm (recuadro 40mm altura)
- Título uniforme: 105mm
- Inicio piezas: 120mm
- Cada pieza: 28mm altura + 5mm separación

### Paginación
- Si y > 200mm, crear nueva página
- Salto de página automático antes de firmas si es necesario

---

## 🛠️ 4. IMPLEMENTACIÓN EN DJANGO

### 4.1 Usando ReportLab

```python
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas
from reportlab.lib.colors import Color

def generar_pdf_uniforme(uniforme_id):
    uniforme = Uniforme.objects.get(id=uniforme_id)
    bombero = uniforme.bombero
    
    # Configurar PDF
    buffer = BytesIO()
    p = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4
    
    # Obtener color del tipo
    color_config = COLORES_PDF.get(uniforme.tipo_uniforme, {'r': 128, 'g': 128, 'b': 128})
    color = Color(color_config['r']/255, color_config['g']/255, color_config['b']/255)
    
    # Logo (si existe)
    logo_path = bombero.compania.logo.path if hasattr(bombero.compania, 'logo') else None
    if logo_path:
        p.drawImage(logo_path, 15*mm, height - 36*mm, width=28*mm, height=28*mm)
    
    # Título
    p.setFont('Helvetica-Bold', 18)
    p.setFillColor(color)
    p.drawCentredString(width/2, height - 22*mm, 'REGISTRO DE UNIFORMES ASIGNADOS')
    
    # Líneas decorativas
    p.setStrokeColor(color)
    p.setLineWidth(1)
    p.line(15*mm, height - 40*mm, width - 15*mm, height - 40*mm)
    p.setLineWidth(0.3)
    p.line(15*mm, height - 42*mm, width - 15*mm, height - 42*mm)
    
    # Datos del Voluntario (recuadro)
    y = height - 50*mm
    
    # Fondo del recuadro
    fondo_color = Color(
        color_config['r']/255 * 0.1 + 0.9,
        color_config['g']/255 * 0.1 + 0.9,
        color_config['b']/255 * 0.1 + 0.9
    )
    p.setFillColor(fondo_color)
    p.roundRect(15*mm, y - 40*mm, 180*mm, 40*mm, 3*mm, fill=1, stroke=0)
    
    # Borde del recuadro
    p.setStrokeColor(color)
    p.setLineWidth(0.5)
    p.roundRect(15*mm, y - 40*mm, 180*mm, 40*mm, 3*mm, fill=0, stroke=1)
    
    # Título sección
    p.setFont('Helvetica-Bold', 11)
    p.setFillColor(color)
    p.drawString(20*mm, y - 5*mm, 'DATOS DEL VOLUNTARIO')
    
    # Datos
    p.setFont('Helvetica', 10)
    p.setFillColor(black)
    y_data = y - 12*mm
    
    p.setFont('Helvetica-Bold', 10)
    p.drawString(20*mm, y_data, 'Nombre:')
    p.setFont('Helvetica', 10)
    p.drawString(42*mm, y_data, bombero.nombre_completo)
    y_data -= 7*mm
    
    # ... continuar con otros campos ...
    
    # PIEZAS
    y = y - 55*mm
    p.setFont('Helvetica-Bold', 13)
    p.setFillColor(color)
    p.drawString(15*mm, y, 'UNIFORME ENTREGADO')
    y -= 10*mm
    
    # Barra de color con tipo
    p.setFillColor(color)
    p.roundRect(15*mm, y, 180*mm, 8*mm, 2*mm, fill=1, stroke=0)
    p.setFillColor(white)
    p.setFont('Helvetica-Bold', 10)
    nombre_tipo = dict(Uniforme.TIPO_CHOICES).get(uniforme.tipo_uniforme, 'UNIFORME')
    p.drawString(20*mm, y + 5.5*mm, nombre_tipo.upper())
    
    y -= 6*mm
    p.setFont('Helvetica', 8)
    p.setFillColor(gray)
    p.drawString(20*mm, y, f'ID Uniforme: {uniforme.id}')
    y -= 6*mm
    
    # Renderizar cada pieza
    for idx, pieza in enumerate(uniforme.piezas.filter(estado_pieza='activo'), 1):
        if y < 50*mm:  # Nueva página si es necesario
            p.showPage()
            y = height - 20*mm
        
        # Recuadro pieza
        p.setFillColor(Color(0.98, 0.98, 0.98))
        p.roundRect(15*mm, y - 28*mm, 180*mm, 28*mm, 2*mm, fill=1, stroke=0)
        p.setStrokeColor(Color(0.86, 0.86, 0.86))
        p.setLineWidth(0.3)
        p.roundRect(15*mm, y - 28*mm, 180*mm, 28*mm, 2*mm, fill=0, stroke=1)
        
        y -= 5*mm
        
        # Nombre componente
        nombre_componente = pieza.nombre_personalizado or pieza.componente.replace('_', ' ').title()
        p.setFont('Helvetica-Bold', 9)
        p.setFillColor(color)
        p.drawString(20*mm, y, f'{idx}. {nombre_componente}')
        
        y -= 5*mm
        p.setFont('Helvetica', 9)
        p.setFillColor(black)
        texto_linea = f"Marca: {pieza.marca or 'N/A'}"
        if pieza.serie:
            texto_linea += f" | Serie: {pieza.serie}"
        if pieza.talla:
            texto_linea += f" | Talla: {pieza.talla}"
        p.drawString(20*mm, y, texto_linea)
        
        y -= 5*mm
        p.setFont('Helvetica', 8)
        p.setFillColor(gray)
        condicion_map = {'nuevo': 'Nuevo', 'semi-nuevo': 'Semi-Nuevo', 'usado': 'Usado'}
        estado_map = {'bueno': 'Bueno', 'regular': 'Regular', 'malo': 'Malo'}
        texto_estado = f"Condición: {condicion_map.get(pieza.condicion, pieza.condicion)} | "
        texto_estado += f"Estado: {estado_map.get(pieza.estado_fisico, pieza.estado_fisico)} | "
        texto_estado += f"F. Entrega: {pieza.fecha_entrega.strftime('%d/%m/%Y')}"
        p.drawString(20*mm, y, texto_estado)
        
        y -= 23*mm
    
    # DECLARACIÓN, FIRMAS, FOOTER...
    # (similar al código JavaScript original)
    
    p.showPage()
    p.save()
    
    buffer.seek(0)
    return buffer
```

### 4.2 View para Generar PDF

```python
from django.http import HttpResponse

class GenerarPDFUniformeView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, pk):
        try:
            pdf_buffer = generar_pdf_uniforme(pk)
            response = HttpResponse(pdf_buffer, content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="Comprobante_Uniforme_{pk}.pdf"'
            return response
        except Uniforme.DoesNotExist:
            return Response({'error': 'Uniforme no encontrado'}, status=404)
```

---

## 📋 5. FORMATO DE MAPEO DE DATOS

```python
# Mapeo de nombres para mostrar en PDF
NOMBRES_COMPONENTES = {
    'jardinera': 'Jardinera',
    'chaqueta': 'Chaqueta',
    'guantes': 'Guantes',
    'botas': 'Botas',
    'casco': 'Casco',
    'esclavina': 'Esclavina',
    'casaca_multi_rol': 'Casaca Multi Rol',
    'pantalon_multi_rol': 'Pantalón Multi Rol',
    'polera_institucional_cia': 'Polera Institucional de Cía.',
    'poleron_institucional_cia': 'Polerón Institucional de Cía.',
    'casaca_institucional_cia': 'Casaca Institucional de Cía.',
    'pantalon_institucional_cia': 'Pantalón Institucional de Cía.',
    'radio_portatil': 'Radio Portátil',
    'cargador': 'Cargador',
    'bateria_adicional': 'Batería Adicional',
    'linterna': 'Linterna',
    'pantalon_negro': 'Pantalón Negro',
    'pantalon_blanco': 'Pantalón Blanco',
    'cinturon_negro': 'Cinturón Negro',
    'cinturon_blanco': 'Cinturón Blanco',
    'traje_buceo': 'Traje de Buceo',
    'aletas': 'Aletas',
    'mascara': 'Máscara',
    'regulador': 'Regulador',
    'tanque_oxigeno': 'Tanque de Oxígeno',
    'chaleco_compensador': 'Chaleco Compensador',
    'chaleco_salvavidas': 'Chaleco Salvavidas'
}

def obtener_nombre_display(pieza):
    if pieza.nombre_personalizado:
        return pieza.nombre_personalizado
    return NOMBRES_COMPONENTES.get(pieza.componente, pieza.componente.replace('_', ' ').title())
```

---

## ✅ 6. CHECKLIST DE IMPLEMENTACIÓN PDF

- [ ] Instalar ReportLab: `pip install reportlab`
- [ ] Crear función `generar_pdf_uniforme(uniforme_id)`
- [ ] Implementar colores por tipo de uniforme
- [ ] Agregar logo de compañía
- [ ] Renderizar datos del voluntario en recuadro
- [ ] Renderizar barra de color con tipo de uniforme
- [ ] Listar todas las piezas activas con formato
- [ ] Agregar observaciones si existen
- [ ] Agregar sección de declaración
- [ ] Agregar sección de firmas
- [ ] Implementar footer en todas las páginas
- [ ] Manejar paginación automática
- [ ] Crear endpoint `/api/uniformes/{id}/generar_pdf/`
- [ ] Configurar response con Content-Disposition
- [ ] Testear con diferentes tipos de uniformes
- [ ] Verificar colores sean correctos
- [ ] Validar formato de fechas (DD/MM/YYYY)

