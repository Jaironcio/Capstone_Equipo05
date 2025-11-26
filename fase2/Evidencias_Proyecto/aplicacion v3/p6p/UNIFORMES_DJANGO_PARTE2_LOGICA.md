# 📋 SISTEMA DE UNIFORMES P6P - ESPECIFICACIONES PARA DJANGO
## PARTE 2: LÓGICA DE NEGOCIO Y OPERACIONES

---

## ✅ 1. REGLAS DE VALIDACIÓN

### 1.1 Campos Obligatorios por Pieza

```python
CAMPOS_OBLIGATORIOS_PIEZA = {
    'componente': True,
    'condicion': True,  # nuevo, semi-nuevo, usado
    'estado_fisico': True,  # bueno, regular, malo
    'fecha_entrega': True,
    'marca': False,  # Opcional pero recomendado
    'serie': False,
    'talla': lambda tipo: tipo not in ['accesorios', 'tenidaCuartel']  # No aplica en estos
}
```

### 1.2 Validación de "Otro" Componente

```python
def validar_componente_personalizado(datos_pieza):
    if datos_pieza['componente'] == 'otro':
        if not datos_pieza.get('nombre_personalizado'):
            raise ValidationError('Debe especificar el nombre del artículo personalizado')
```

### 1.3 Mínimo de Piezas

```python
def validar_minimo_piezas(piezas):
    if len(piezas) < 1:
        raise ValidationError('Debe registrar al menos un artículo')
```

---

## 🔄 2. FLUJOS DE OPERACIÓN

### 2.1 Crear Uniforme con Piezas

```python
from django.db import transaction

@transaction.atomic
def crear_uniforme(datos_uniforme, piezas_data, usuario):
    # 1. Validar voluntario
    voluntario = Bombero.objects.get(id=datos_uniforme['bombero_id'])
    validacion = puede_recibir_uniformes(voluntario)
    if not validacion['puede']:
        raise ValidationError(validacion['mensaje'])
    
    # 2. Generar ID único
    id_uniforme = generar_id_uniforme(datos_uniforme['tipo_uniforme'])
    
    # 3. Crear uniforme
    uniforme = Uniforme.objects.create(
        id=id_uniforme,
        bombero=voluntario,
        tipo_uniforme=datos_uniforme['tipo_uniforme'],
        observaciones=datos_uniforme.get('observaciones', ''),
        registrado_por=usuario.username,
        estado='activo'
    )
    
    # 4. Crear piezas
    for pieza_data in piezas_data:
        # Detectar par/simple
        info_unidad = detectar_par_simple(pieza_data['componente'])
        
        # Validar componente personalizado
        validar_componente_personalizado(pieza_data)
        
        PiezaUniforme.objects.create(
            uniforme=uniforme,
            componente=pieza_data['componente'],
            nombre_personalizado=pieza_data.get('nombre_personalizado'),
            marca=pieza_data.get('marca'),
            serie=pieza_data.get('serie'),
            talla=pieza_data.get('talla'),
            condicion=pieza_data['condicion'],
            estado_fisico=pieza_data['estado_fisico'],
            fecha_entrega=pieza_data['fecha_entrega'],
            unidad=info_unidad['unidad'],
            par_simple=info_unidad['par_simple'],
            estado_pieza='activo'
        )
    
    return uniforme
```

### 2.2 Actualizar Estado/Condición de Pieza

```python
def actualizar_pieza(pieza_id, campo, nuevo_valor, usuario):
    pieza = PiezaUniforme.objects.get(id=pieza_id)
    
    # Guardar en historial
    if not pieza.historial_cambios:
        pieza.historial_cambios = []
    
    pieza.historial_cambios.append({
        'campo': campo,
        'valor_anterior': getattr(pieza, campo),
        'valor_nuevo': nuevo_valor,
        'modificado_por': usuario.username,
        'fecha_modificacion': timezone.now().isoformat()
    })
    
    # Actualizar campo
    setattr(pieza, campo, nuevo_valor)
    
    # Actualizar última modificación
    pieza.ultima_modificacion = {
        'usuario': usuario.username,
        'fecha': timezone.now().isoformat(),
        'campo': campo
    }
    
    pieza.save()
    return pieza
```

### 2.3 Devolver Pieza

```python
@transaction.atomic
def devolver_pieza(pieza_id, datos_devolucion, usuario):
    pieza = PiezaUniforme.objects.get(id=pieza_id)
    
    # Validar campos obligatorios
    if not datos_devolucion.get('estado_devolucion'):
        raise ValidationError('Estado de devolución es obligatorio')
    if not datos_devolucion.get('condicion_devolucion'):
        raise ValidationError('Condición de devolución es obligatoria')
    
    # Actualizar pieza
    pieza.estado_pieza = 'devuelto'
    pieza.fecha_devolucion = timezone.now()
    pieza.devuelto_por = usuario.username
    pieza.estado_devolucion = datos_devolucion['estado_devolucion']
    pieza.condicion_devolucion = datos_devolucion['condicion_devolucion']
    pieza.observaciones_devolucion = datos_devolucion.get('observaciones_devolucion', '')
    pieza.save()
    
    # Verificar si todas las piezas están devueltas
    uniforme = pieza.uniforme
    todas_devueltas = not uniforme.piezas.filter(estado_pieza='activo').exists()
    
    if todas_devueltas:
        uniforme.estado = 'devuelto'
        uniforme.fecha_devolucion = timezone.now()
        uniforme.devuelto_por = usuario.username
        uniforme.save()
    
    return pieza
```

### 2.4 Editar Uniforme (Solo Super Admin)

```python
@transaction.atomic
def editar_uniforme_completo(uniforme_id, datos_uniforme, piezas_data, usuario):
    # Verificar permisos
    if usuario.role != 'Super Administrador':
        raise PermissionDenied('Solo el Super Administrador puede editar uniformes')
    
    uniforme = Uniforme.objects.get(id=uniforme_id)
    
    # Actualizar observaciones generales
    uniforme.observaciones = datos_uniforme.get('observaciones', '')
    uniforme.save()
    
    # Actualizar cada pieza
    for pieza_data in piezas_data:
        pieza = PiezaUniforme.objects.get(id=pieza_data['id'])
        pieza.marca = pieza_data.get('marca')
        pieza.serie = pieza_data.get('serie')
        pieza.talla = pieza_data.get('talla')
        pieza.condicion = pieza_data.get('condicion')
        pieza.estado_fisico = pieza_data.get('estado_fisico')
        pieza.fecha_entrega = pieza_data.get('fecha_entrega')
        pieza.save()
    
    return uniforme
```

---

## 📊 3. CONSULTAS Y FILTROS

### 3.1 Uniformes Activos del Voluntario

```python
def obtener_uniformes_activos(bombero_id):
    return Uniforme.objects.filter(
        bombero_id=bombero_id,
        estado='activo'
    ).prefetch_related(
        Prefetch('piezas', queryset=PiezaUniforme.objects.filter(estado_pieza='activo'))
    )
```

### 3.2 Historial de Devoluciones

```python
def obtener_historial_devoluciones(bombero_id):
    return PiezaUniforme.objects.filter(
        uniforme__bombero_id=bombero_id,
        estado_pieza='devuelto',
        fecha_devolucion__isnull=False
    ).select_related('uniforme').order_by('-fecha_devolucion')
```

### 3.3 Uniformes por Tipo

```python
def obtener_uniformes_por_tipo(tipo_uniforme):
    return Uniforme.objects.filter(
        tipo_uniforme=tipo_uniforme,
        estado='activo'
    ).select_related('bombero').prefetch_related('piezas')
```

---

## 🎨 4. SERIALIZERS (Django REST Framework)

### 4.1 PiezaUniformeSerializer

```python
class PiezaUniformeSerializer(serializers.ModelSerializer):
    nombre_display = serializers.SerializerMethodField()
    
    class Meta:
        model = PiezaUniforme
        fields = '__all__'
    
    def get_nombre_display(self, obj):
        if obj.nombre_personalizado:
            return obj.nombre_personalizado
        return obj.componente.replace('_', ' ').title()
```

### 4.2 UniformeSerializer

```python
class UniformeSerializer(serializers.ModelSerializer):
    piezas = PiezaUniformeSerializer(many=True, read_only=True)
    bombero_nombre = serializers.CharField(source='bombero.nombre_completo', read_only=True)
    tipo_display = serializers.CharField(source='get_tipo_uniforme_display', read_only=True)
    
    class Meta:
        model = Uniforme
        fields = '__all__'
```

### 4.3 CrearUniformeSerializer

```python
class CrearUniformeSerializer(serializers.Serializer):
    tipo_uniforme = serializers.ChoiceField(choices=Uniforme.TIPO_CHOICES)
    bombero_id = serializers.IntegerField()
    observaciones = serializers.CharField(required=False, allow_blank=True)
    piezas = serializers.ListField(child=serializers.DictField())
    
    def validate_piezas(self, value):
        if len(value) < 1:
            raise serializers.ValidationError('Debe registrar al menos un artículo')
        return value
    
    def create(self, validated_data):
        piezas_data = validated_data.pop('piezas')
        usuario = self.context['request'].user
        return crear_uniforme(validated_data, piezas_data, usuario)
```

---

## 🔒 5. PERMISOS EN VIEWS

### 5.1 Permission Classes

```python
class EsSecretarioOSuperior(BasePermission):
    def has_permission(self, request, view):
        return request.user.role in ['Secretario', 'Director', 'Super Administrador']

class PuedeVerUniformes(BasePermission):
    def has_permission(self, request, view):
        permisos_role = {
            'Ayudante': True,
            'Capitán': True,
            'Secretario': True,
            'Tesorero': True,
            'Director': True,
            'Super Administrador': True
        }
        return permisos_role.get(request.user.role, False)

class PuedeEditarUniformes(BasePermission):
    def has_permission(self, request, view):
        if view.action == 'update':  # Edición completa
            return request.user.role == 'Super Administrador'
        return True  # Otros pueden crear y devolver
```

### 5.2 Filtro por Rol en ViewSet

```python
class UniformeViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, PuedeVerUniformes]
    
    def get_queryset(self):
        user = self.request.user
        queryset = Uniforme.objects.all()
        
        # Filtrar por tipo según rol
        if user.role == 'Tesorero':
            queryset = queryset.filter(tipo_uniforme__in=['accesorios', 'tenidaCuartel'])
        elif user.role == 'Director':
            queryset = queryset.filter(tipo_uniforme='parada')
        elif user.role in ['Capitán', 'Ayudante']:
            tipos_permitidos = ['estructural', 'forestal', 'rescate', 'hazmat',
                               'usar', 'agreste', 'um6', 'gersa']
            queryset = queryset.filter(tipo_uniforme__in=tipos_permitidos)
        
        return queryset.select_related('bombero').prefetch_related('piezas')
```

---

## 🚀 6. ENDPOINTS API

```python
# urls.py
router = routers.DefaultRouter()
router.register(r'uniformes', UniformeViewSet, basename='uniforme')
router.register(r'piezas', PiezaUniformeViewSet, basename='pieza')

urlpatterns = [
    path('api/', include(router.urls)),
    path('api/uniformes/<str:pk>/devolver_pieza/<int:pieza_id>/', 
         DevolverPiezaView.as_view()),
    path('api/uniformes/<str:pk>/actualizar_pieza/<int:pieza_id>/', 
         ActualizarPiezaView.as_view()),
    path('api/uniformes/<str:pk>/generar_pdf/', 
         GenerarPDFUniformeView.as_view()),
]
```

### Endpoints Principales:
- `GET /api/uniformes/` - Listar uniformes (filtrados por rol)
- `POST /api/uniformes/` - Crear uniforme con piezas
- `GET /api/uniformes/{id}/` - Detalle de uniforme
- `PUT /api/uniformes/{id}/` - Editar uniforme (solo Super Admin)
- `POST /api/uniformes/{id}/devolver_pieza/{pieza_id}/` - Devolver pieza
- `PATCH /api/uniformes/{id}/actualizar_pieza/{pieza_id}/` - Actualizar estado/condición
- `GET /api/uniformes/{id}/generar_pdf/` - Generar PDF comprobante

