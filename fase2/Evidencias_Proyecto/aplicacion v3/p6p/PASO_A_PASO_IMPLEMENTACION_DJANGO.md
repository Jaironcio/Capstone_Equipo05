# 🚀 PASO A PASO - IMPLEMENTACIÓN SISTEMA UNIFORMES EN DJANGO

## PASO 1: CREAR MODELOS (models.py)

```python
# voluntarios/models.py

class ContadorUniformes(models.Model):
    """Singleton para contadores independientes por tipo"""
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
    
    @classmethod
    def obtener_siguiente_id(cls, tipo_uniforme):
        contador, _ = cls.objects.get_or_create(pk=1)
        campo = f'id_{tipo_uniforme.lower()}'
        valor = getattr(contador, campo)
        setattr(contador, campo, valor + 1)
        contador.save()
        return valor

class Uniforme(models.Model):
    TIPO_CHOICES = [
        ('estructural', 'Estructural'), ('forestal', 'Forestal'),
        ('rescate', 'Rescate'), ('hazmat', 'Hazmat'),
        ('tenidaCuartel', 'Tenida de Cuartel'), ('accesorios', 'Accesorios'),
        ('parada', 'Parada'), ('usar', 'USAR'), ('agreste', 'AGRESTE'),
        ('um6', 'UM-6'), ('gersa', 'GERSA')
    ]
    ESTADO_CHOICES = [('activo', 'Activo'), ('devuelto', 'Devuelto')]
    
    id = models.CharField(max_length=20, primary_key=True)  # TIPO-NNN
    bombero = models.ForeignKey('Bombero', on_delete=models.CASCADE)
    tipo_uniforme = models.CharField(max_length=20, choices=TIPO_CHOICES)
    fecha_registro = models.DateTimeField(auto_now_add=True)
    registrado_por = models.CharField(max_length=100)
    observaciones = models.TextField(blank=True, null=True)
    estado = models.CharField(max_length=10, choices=ESTADO_CHOICES, default='activo')
    fecha_devolucion = models.DateTimeField(blank=True, null=True)
    devuelto_por = models.CharField(max_length=100, blank=True, null=True)

class PiezaUniforme(models.Model):
    uniforme = models.ForeignKey(Uniforme, on_delete=models.CASCADE, related_name='piezas')
    componente = models.CharField(max_length=100)
    nombre_personalizado = models.CharField(max_length=200, blank=True, null=True)
    marca = models.CharField(max_length=100, blank=True, null=True)
    serie = models.CharField(max_length=100, blank=True, null=True)
    talla = models.CharField(max_length=20, blank=True, null=True)
    condicion = models.CharField(max_length=20)  # nuevo, semi-nuevo, usado
    estado_fisico = models.CharField(max_length=20)  # bueno, regular, malo
    unidad = models.IntegerField(default=1)
    par_simple = models.CharField(max_length=10, default='Simple')
    fecha_entrega = models.DateField()
    estado_pieza = models.CharField(max_length=10, default='activo')
    fecha_devolucion = models.DateTimeField(blank=True, null=True)
    devuelto_por = models.CharField(max_length=100, blank=True, null=True)
    estado_devolucion = models.CharField(max_length=20, blank=True, null=True)
    condicion_devolucion = models.CharField(max_length=20, blank=True, null=True)
    observaciones_devolucion = models.TextField(blank=True, null=True)
    ultima_modificacion = models.JSONField(blank=True, null=True)
    historial_cambios = models.JSONField(default=list, blank=True)
```

**Ejecutar:**
```bash
python manage.py makemigrations
python manage.py migrate
```

---

## PASO 2: CREAR UTILIDADES (utils.py)

```python
# voluntarios/utils.py

def generar_id_uniforme(tipo_uniforme):
    prefijos = {
        'estructural': 'ESTR', 'forestal': 'FOR', 'rescate': 'RESC',
        'hazmat': 'HAZ', 'tenidaCuartel': 'TCU', 'accesorios': 'ACC',
        'parada': 'PAR', 'usar': 'USAR', 'agreste': 'AGR',
        'um6': 'UM6', 'gersa': 'GERSA'
    }
    contador = ContadorUniformes.obtener_siguiente_id(tipo_uniforme)
    return f"{prefijos[tipo_uniforme]}-{str(contador).zfill(3)}"

def detectar_par_simple(componente):
    if componente.lower() in ['guantes', 'botas', 'aletas']:
        return {'unidad': 2, 'par_simple': 'Par'}
    return {'unidad': 1, 'par_simple': 'Simple'}

def puede_recibir_uniformes(voluntario):
    bloqueados = ['renunciado', 'separado', 'expulsado', 'fallecido']
    if voluntario.estado_bombero in bloqueados:
        return {'puede': False, 'mensaje': f'Estado {voluntario.estado_bombero} no puede recibir'}
    return {'puede': True, 'mensaje': ''}
```

---

## PASO 3: CREAR SERIALIZERS (serializers.py)

```python
# voluntarios/serializers.py

class PiezaUniformeSerializer(serializers.ModelSerializer):
    nombre_display = serializers.SerializerMethodField()
    
    class Meta:
        model = PiezaUniforme
        fields = '__all__'
    
    def get_nombre_display(self, obj):
        return obj.nombre_personalizado or obj.componente.replace('_', ' ').title()

class UniformeSerializer(serializers.ModelSerializer):
    piezas = PiezaUniformeSerializer(many=True, read_only=True)
    
    class Meta:
        model = Uniforme
        fields = '__all__'

class CrearUniformeSerializer(serializers.Serializer):
    tipo_uniforme = serializers.ChoiceField(choices=Uniforme.TIPO_CHOICES)
    bombero_id = serializers.IntegerField()
    observaciones = serializers.CharField(required=False, allow_blank=True)
    piezas = serializers.ListField(child=serializers.DictField())
    
    def validate_piezas(self, value):
        if len(value) < 1:
            raise serializers.ValidationError('Mínimo 1 pieza requerida')
        for pieza in value:
            if pieza.get('componente') == 'otro' and not pieza.get('nombre_personalizado'):
                raise serializers.ValidationError('Nombre personalizado requerido para "otro"')
        return value
    
    def create(self, validated_data):
        from django.db import transaction
        
        piezas_data = validated_data.pop('piezas')
        bombero = Bombero.objects.get(id=validated_data['bombero_id'])
        
        # Validar voluntario
        validacion = puede_recibir_uniformes(bombero)
        if not validacion['puede']:
            raise serializers.ValidationError(validacion['mensaje'])
        
        with transaction.atomic():
            # Crear uniforme
            id_uniforme = generar_id_uniforme(validated_data['tipo_uniforme'])
            uniforme = Uniforme.objects.create(
                id=id_uniforme,
                bombero=bombero,
                tipo_uniforme=validated_data['tipo_uniforme'],
                observaciones=validated_data.get('observaciones', ''),
                registrado_por=self.context['request'].user.username
            )
            
            # Crear piezas
            for pieza_data in piezas_data:
                info_unidad = detectar_par_simple(pieza_data['componente'])
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
                    par_simple=info_unidad['par_simple']
                )
        
        return uniforme
```

---

## PASO 4: CREAR PERMISOS (permissions.py)

```python
# voluntarios/permissions.py

class PuedeVerUniformes(BasePermission):
    def has_permission(self, request, view):
        roles_permitidos = ['Ayudante', 'Capitán', 'Secretario', 
                           'Tesorero', 'Director', 'Super Administrador']
        return request.user.role in roles_permitidos

class PuedeEditarUniformeCompleto(BasePermission):
    def has_permission(self, request, view):
        if view.action == 'update':  # Edición completa
            return request.user.role == 'Super Administrador'
        return True
```

---

## PASO 5: CREAR VIEWS (views.py)

```python
# voluntarios/views.py

class UniformeViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, PuedeVerUniformes, PuedeEditarUniformeCompleto]
    serializer_class = UniformeSerializer
    
    def get_queryset(self):
        user = self.request.user
        qs = Uniforme.objects.all()
        
        # Filtrar por rol
        if user.role == 'Tesorero':
            qs = qs.filter(tipo_uniforme__in=['accesorios', 'tenidaCuartel'])
        elif user.role == 'Director':
            qs = qs.filter(tipo_uniforme='parada')
        elif user.role in ['Capitán', 'Ayudante']:
            tipos = ['estructural', 'forestal', 'rescate', 'hazmat',
                    'usar', 'agreste', 'um6', 'gersa']
            qs = qs.filter(tipo_uniforme__in=tipos)
        
        return qs.select_related('bombero').prefetch_related('piezas')
    
    def get_serializer_class(self):
        if self.action == 'create':
            return CrearUniformeSerializer
        return UniformeSerializer
    
    @action(detail=True, methods=['post'])
    def devolver_pieza(self, request, pk=None):
        pieza_id = request.data.get('pieza_id')
        pieza = PiezaUniforme.objects.get(id=pieza_id, uniforme_id=pk)
        
        # Actualizar pieza
        pieza.estado_pieza = 'devuelto'
        pieza.fecha_devolucion = timezone.now()
        pieza.devuelto_por = request.user.username
        pieza.estado_devolucion = request.data['estado_devolucion']
        pieza.condicion_devolucion = request.data['condicion_devolucion']
        pieza.observaciones_devolucion = request.data.get('observaciones_devolucion', '')
        pieza.save()
        
        # Verificar si todas devueltas
        uniforme = pieza.uniforme
        if not uniforme.piezas.filter(estado_pieza='activo').exists():
            uniforme.estado = 'devuelto'
            uniforme.fecha_devolucion = timezone.now()
            uniforme.devuelto_por = request.user.username
            uniforme.save()
        
        return Response({'status': 'Pieza devuelta'})
    
    @action(detail=True, methods=['patch'])
    def actualizar_pieza(self, request, pk=None):
        pieza_id = request.data.get('pieza_id')
        campo = request.data.get('campo')  # 'estado_fisico' o 'condicion'
        nuevo_valor = request.data.get('valor')
        
        pieza = PiezaUniforme.objects.get(id=pieza_id, uniforme_id=pk)
        
        # Guardar en historial
        if not pieza.historial_cambios:
            pieza.historial_cambios = []
        pieza.historial_cambios.append({
            'campo': campo,
            'valor_anterior': getattr(pieza, campo),
            'valor_nuevo': nuevo_valor,
            'modificado_por': request.user.username,
            'fecha_modificacion': timezone.now().isoformat()
        })
        
        # Actualizar
        setattr(pieza, campo, nuevo_valor)
        pieza.ultima_modificacion = {
            'usuario': request.user.username,
            'fecha': timezone.now().isoformat(),
            'campo': campo
        }
        pieza.save()
        
        return Response({'status': 'Pieza actualizada'})
```

---

## PASO 6: CONFIGURAR URLS (urls.py)

```python
# voluntarios/urls.py

router = routers.DefaultRouter()
router.register(r'uniformes', UniformeViewSet, basename='uniforme')

urlpatterns = [
    path('api/', include(router.urls)),
]
```

---

## PASO 7: CREAR FIXTURE INICIAL

```bash
python manage.py shell
```

```python
from voluntarios.models import ContadorUniformes
ContadorUniformes.objects.create(pk=1)
exit()
```

---

## PASO 8: TESTING

```python
# voluntarios/tests.py

def test_crear_uniforme():
    # Test creación básica
    pass

def test_filtrado_por_rol():
    # Test Tesorero solo ve accesorios+tenida
    pass

def test_devolucion_pieza():
    # Test devolución individual
    pass

def test_devolucion_completa_automatica():
    # Test uniforme completo se marca devuelto
    pass

def test_historial_cambios():
    # Test registro en JSON
    pass
```

**Ejecutar:**
```bash
python manage.py test voluntarios
```

---

## ✅ CHECKLIST FINAL

- [ ] Modelos creados y migrados
- [ ] ContadorUniformes inicializado
- [ ] Utilidades funcionando
- [ ] Serializers con validaciones
- [ ] Views con filtrado por rol
- [ ] Permisos configurados
- [ ] URLs registradas
- [ ] Devolver pieza funciona
- [ ] Actualizar pieza funciona
- [ ] Devolución completa automática
- [ ] Historial JSON guardando
- [ ] Tests pasando
- [ ] Implementar PDF (opcional: siguiente fase)

---

## 🎯 RESULTADO ESPERADO

**Endpoints funcionales:**
- POST `/api/uniformes/` → Crear uniforme + piezas
- GET `/api/uniformes/` → Listar (filtrado automático por rol)
- GET `/api/uniformes/{id}/` → Ver detalle
- POST `/api/uniformes/{id}/devolver_pieza/` → Devolver individual
- PATCH `/api/uniformes/{id}/actualizar_pieza/` → Actualizar estado/condición
- PUT `/api/uniformes/{id}/` → Editar completo (solo Super Admin)
