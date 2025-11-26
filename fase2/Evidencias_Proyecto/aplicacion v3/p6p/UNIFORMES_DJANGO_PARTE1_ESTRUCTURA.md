# 📋 SISTEMA DE UNIFORMES P6P - ESPECIFICACIONES PARA DJANGO
## PARTE 1: ESTRUCTURA Y MODELOS

---

## 🔐 1. PERMISOS POR ROL

| Rol | Acceso | Tipos Disponibles |
|-----|--------|------------------|
| Ayudante | ✅ Ver/Editar | Básicos + USAR, AGRESTE, UM-6, GERSA |
| Capitán | ✅ Ver/Editar | Básicos + USAR, AGRESTE, UM-6, GERSA |
| Secretario | ✅ Ver/Editar | Básicos + Hazmat |
| Tesorero | ✅ Ver/Editar | **SOLO** Accesorios + Tenida Cuartel |
| Director | ✅ Ver/Editar | **SOLO** Parada |
| Super Admin | ✅ Ver/Editar/**EDICIÓN TOTAL** | **TODOS** |

**Básicos:** Estructural, Forestal, Rescate, Hazmat

---

## 📦 2. TIPOS DE UNIFORMES (11 TIPOS)

### Códigos y Colores RGB

```python
TIPOS_UNIFORMES = {
    'estructural': {'codigo': 'ESTR', 'color': (255, 152, 0)},    # Naranja
    'forestal': {'codigo': 'FOR', 'color': (76, 175, 80)},        # Verde
    'rescate': {'codigo': 'RESC', 'color': (244, 67, 54)},        # Rojo
    'hazmat': {'codigo': 'HAZ', 'color': (255, 235, 59)},         # Amarillo
    'tenidaCuartel': {'codigo': 'TCU', 'color': (33, 150, 243)},  # Azul
    'accesorios': {'codigo': 'ACC', 'color': (156, 39, 176)},     # Morado
    'parada': {'codigo': 'PAR', 'color': (63, 81, 181)},          # Índigo
    'usar': {'codigo': 'USAR', 'color': (255, 87, 34)},           # Naranja Oscuro
    'agreste': {'codigo': 'AGR', 'color': (139, 195, 74)},        # Verde Oliva
    'um6': {'codigo': 'UM6', 'color': (0, 150, 199)},             # Azul Marítimo
    'gersa': {'codigo': 'GERSA', 'color': (0, 188, 212)}          # Cyan
}
```

### Componentes por Tipo

**Estructural, Forestal, Rescate:**
- Jardinera, Chaqueta, Guantes (Par), Botas (Par), Casco, Esclavina, Otro

**Hazmat:**
- Casaca Multi Rol, Pantalón Multi Rol, Botas (Par), Casco, Guantes (Par), Esclavina, Otro

**Tenida Cuartel (NO talla):**
- Polera Institucional Cía., Polerón Institucional Cía., Casaca Institucional Cía., Pantalón Institucional Cía., Otro

**Accesorios (NO talla):**
- Radio Portátil, Cargador, Batería Adicional, Linterna, Otro

**Parada:**
- Casaca, Pantalón Negro, Pantalón Blanco, Cinturón Negro, Cinturón Blanco, Otro

**USAR, AGRESTE:**
- Casaca Multi Rol, Pantalón Multi Rol, Botas (Par), Casco, Guantes (Par), Otro

**UM-6:**
- Casaca Multi Rol, Pantalón Multi Rol, Botas (Par), Casco, Guantes (Par), Chaleco Salvavidas, Otro

**GERSA:**
- Traje Buceo, Aletas (Par), Máscara, Regulador, Tanque Oxígeno, Chaleco Compensador, Otro

---

## 🗄️ 3. MODELOS DE BASE DE DATOS

### 3.1 Modelo Uniforme

```python
class Uniforme(models.Model):
    TIPO_CHOICES = [
        ('estructural', 'Estructural'),
        ('forestal', 'Forestal'),
        ('rescate', 'Rescate'),
        ('hazmat', 'Hazmat'),
        ('tenidaCuartel', 'Tenida de Cuartel'),
        ('accesorios', 'Accesorios'),
        ('parada', 'Parada'),
        ('usar', 'USAR'),
        ('agreste', 'AGRESTE'),
        ('um6', 'UM-6'),
        ('gersa', 'GERSA')
    ]
    
    ESTADO_CHOICES = [
        ('activo', 'Activo'),
        ('devuelto', 'Devuelto')
    ]
    
    # Identificación
    id = models.CharField(max_length=20, primary_key=True)  # TIPO-NNN
    bombero = models.ForeignKey('Bombero', on_delete=models.CASCADE)
    tipo_uniforme = models.CharField(max_length=20, choices=TIPO_CHOICES)
    
    # Metadatos
    fecha_registro = models.DateTimeField(auto_now_add=True)
    registrado_por = models.CharField(max_length=100)
    observaciones = models.TextField(blank=True, null=True)
    
    # Estado
    estado = models.CharField(max_length=10, choices=ESTADO_CHOICES, default='activo')
    fecha_devolucion = models.DateTimeField(blank=True, null=True)
    devuelto_por = models.CharField(max_length=100, blank=True, null=True)
    
    class Meta:
        ordering = ['-fecha_registro']
        verbose_name = 'Uniforme'
        verbose_name_plural = 'Uniformes'
```

### 3.2 Modelo PiezaUniforme

```python
class PiezaUniforme(models.Model):
    CONDICION_CHOICES = [
        ('nuevo', 'Nuevo'),
        ('semi-nuevo', 'Semi-Nuevo'),
        ('usado', 'Usado')
    ]
    
    ESTADO_FISICO_CHOICES = [
        ('bueno', 'Bueno'),
        ('regular', 'Regular'),
        ('malo', 'Malo')
    ]
    
    ESTADO_PIEZA_CHOICES = [
        ('activo', 'Activo'),
        ('devuelto', 'Devuelto')
    ]
    
    PAR_SIMPLE_CHOICES = [
        ('Simple', 'Simple'),
        ('Par', 'Par')
    ]
    
    CONDICION_DEVOLUCION_CHOICES = [
        ('nuevo', 'Como Nuevo'),
        ('semi-nuevo', 'Semi-Nuevo'),
        ('usado', 'Usado'),
        ('muy_usado', 'Muy Usado')
    ]
    
    ESTADO_DEVOLUCION_CHOICES = [
        ('bueno', 'Bueno'),
        ('regular', 'Regular'),
        ('malo', 'Malo'),
        ('deteriorado', 'Muy Deteriorado')
    ]
    
    # Relación
    uniforme = models.ForeignKey(Uniforme, on_delete=models.CASCADE, related_name='piezas')
    
    # Información del artículo
    componente = models.CharField(max_length=100)
    nombre_personalizado = models.CharField(max_length=200, blank=True, null=True)
    marca = models.CharField(max_length=100, blank=True, null=True)
    serie = models.CharField(max_length=100, blank=True, null=True)
    talla = models.CharField(max_length=20, blank=True, null=True)
    
    # Estado y Condición
    condicion = models.CharField(max_length=20, choices=CONDICION_CHOICES)
    estado_fisico = models.CharField(max_length=20, choices=ESTADO_FISICO_CHOICES)
    
    # Control de unidades
    unidad = models.IntegerField(default=1)  # 1=Simple, 2=Par
    par_simple = models.CharField(max_length=10, choices=PAR_SIMPLE_CHOICES, default='Simple')
    
    # Fechas
    fecha_entrega = models.DateField()
    
    # Estado
    estado_pieza = models.CharField(max_length=10, choices=ESTADO_PIEZA_CHOICES, default='activo')
    
    # Devolución
    fecha_devolucion = models.DateTimeField(blank=True, null=True)
    devuelto_por = models.CharField(max_length=100, blank=True, null=True)
    estado_devolucion = models.CharField(max_length=20, choices=ESTADO_DEVOLUCION_CHOICES, blank=True, null=True)
    condicion_devolucion = models.CharField(max_length=20, choices=CONDICION_DEVOLUCION_CHOICES, blank=True, null=True)
    observaciones_devolucion = models.TextField(blank=True, null=True)
    
    # Control de modificaciones
    ultima_modificacion = models.JSONField(blank=True, null=True)
    historial_cambios = models.JSONField(default=list, blank=True)
    
    class Meta:
        ordering = ['id']
        verbose_name = 'Pieza de Uniforme'
        verbose_name_plural = 'Piezas de Uniformes'
```

### 3.3 Modelo ContadorUniformes

```python
class ContadorUniformes(models.Model):
    id_estructural = models.IntegerField(default=1)
    id_forestal = models.IntegerField(default=1)
    id_rescate = models.IntegerField(default=1)
    id_hazmat = models.IntegerField(default=1)
    id_tenida_cuartel = models.IntegerField(default=1)
    id_accesorios = models.IntegerField(default=1)
    id_parada = models.IntegerField(default=1)
    id_usar = models.IntegerField(default=1)
    id_agreste = models.IntegerField(default=1)
    id_um6 = models.IntegerField(default=1)
    id_gersa = models.IntegerField(default=1)
    
    class Meta:
        verbose_name = 'Contador de Uniformes'
        verbose_name_plural = 'Contadores de Uniformes'
    
    @classmethod
    def obtener_siguiente_id(cls, tipo_uniforme):
        contador, created = cls.objects.get_or_create(pk=1)
        campo_contador = f'id_{tipo_uniforme.lower().replace("-", "_")}'
        valor_actual = getattr(contador, campo_contador)
        setattr(contador, campo_contador, valor_actual + 1)
        contador.save()
        return valor_actual
```

---

## 🔧 4. UTILIDADES Y FUNCIONES

### 4.1 Generar ID de Uniforme

```python
def generar_id_uniforme(tipo_uniforme):
    prefijos = {
        'estructural': 'ESTR',
        'forestal': 'FOR',
        'rescate': 'RESC',
        'hazmat': 'HAZ',
        'tenidaCuartel': 'TCU',
        'accesorios': 'ACC',
        'parada': 'PAR',
        'usar': 'USAR',
        'agreste': 'AGR',
        'um6': 'UM6',
        'gersa': 'GERSA'
    }
    
    contador = ContadorUniformes.obtener_siguiente_id(tipo_uniforme)
    prefijo = prefijos.get(tipo_uniforme, 'UNI')
    return f"{prefijo}-{str(contador).zfill(3)}"
```

### 4.2 Detectar Par/Simple

```python
def detectar_par_simple(componente):
    componentes_par = ['guantes', 'botas', 'aletas']
    if componente.lower() in componentes_par:
        return {'unidad': 2, 'par_simple': 'Par'}
    return {'unidad': 1, 'par_simple': 'Simple'}
```

### 4.3 Validar Voluntario

```python
def puede_recibir_uniformes(voluntario):
    estados_bloqueados = ['renunciado', 'separado', 'expulsado', 'fallecido']
    
    if voluntario.estado_bombero in estados_bloqueados:
        return {
            'puede': False,
            'mensaje': f'No se pueden asignar uniformes a voluntarios con estado "{voluntario.estado_bombero}"'
        }
    
    return {'puede': True, 'mensaje': ''}
```

