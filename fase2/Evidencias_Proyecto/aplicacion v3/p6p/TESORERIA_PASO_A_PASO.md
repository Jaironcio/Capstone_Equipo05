# 🚀 SISTEMA DE TESORERÍA - IMPLEMENTACIÓN PASO A PASO EN DJANGO (COMPLETO)

---

## � IMPORTANTE: MIGRACIÓN DESDE PLANTILLA P6P

⚠️ **P6P es una plantilla HTML/CSS/JavaScript SIN backend** (usa localStorage)

**OBJETIVO:** Migrar lógica a Django manteniendo estética EXACTA

### Archivos de la plantilla a respetar:
- `cuotas-beneficios.html` → Mantener estructura y clases CSS
- `beneficios.html` → Mantener dashboard y gráficos
- `configurar-cuotas.html` → Mantener formulario
- `css/styles.css` → NO modificar estilos
- `js/*.js` → Convertir lógica a Django/Python

**Ver:** `TESORERIA_INSTRUCCIONES_MIGRACION.md` para detalles completos

---

## �🆕 FUNCIONALIDADES AGREGADAS EN ESTA VERSIÓN

1. ✅ **Configurar Cuotas** - Formulario para cambiar precios
2. ✅ **Saldo de Compañía** - Widget con saldo total
3. ✅ **Notificación Deudores** - Badge con cantidad
4. ✅ **Activar Estudiante** - Botón + formulario
5. ✅ **Desactivar Cuotas** - Para Honorarios/Insignes (no aparecen como deudores)

---

## PASO 1: CREAR MODELOS

### Crear archivo: voluntarios/models_tesoreria.py

```python
from django.db import models
from django.core.exceptions import ValidationError
from django.utils import timezone

# ==================== CONFIGURACIÓN ====================
class ConfiguracionCuotas(models.Model):
    """Singleton - Solo existe 1 registro"""
    precio_regular = models.IntegerField(default=5000)
    precio_estudiante = models.IntegerField(default=3000)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    actualizado_por = models.CharField(max_length=100)
    
    class Meta:
        verbose_name = 'Configuración de Cuotas'
        verbose_name_plural = 'Configuración de Cuotas'
    
    def save(self, *args, **kwargs):
        self.pk = 1
        super().save(*args, **kwargs)
    
    @classmethod
    def obtener(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj
    
    def __str__(self):
        return f"Regular: ${self.precio_regular} | Estudiante: ${self.precio_estudiante}"

# ==================== ESTADO DE CUOTAS POR BOMBERO (NUEVO) ====================
class EstadoCuotasBombero(models.Model):
    """
    Control de cuotas individuales
    - es_estudiante: Cobra precio estudiante
    - cuotas_desactivadas: NO aparece como deudor
    """
    bombero = models.OneToOneField('Bombero', on_delete=models.CASCADE, related_name='estado_cuotas')
    
    # ESTUDIANTE
    es_estudiante = models.BooleanField(default=False)
    fecha_activacion_estudiante = models.DateField(blank=True, null=True)
    observaciones_estudiante = models.TextField(blank=True, null=True)
    
    # DESACTIVACIÓN DE CUOTAS (Honorarios/Insignes)
    cuotas_desactivadas = models.BooleanField(default=False)
    motivo_desactivacion = models.CharField(max_length=200, blank=True, null=True)
    fecha_desactivacion = models.DateTimeField(blank=True, null=True)
    desactivado_por = models.CharField(max_length=100, blank=True, null=True)
    
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    ultima_actualizacion = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Estado de Cuotas'
        verbose_name_plural = 'Estados de Cuotas'
    
    def __str__(self):
        return f"{self.bombero.nombre_completo()} - Est: {self.es_estudiante} - Desact: {self.cuotas_desactivadas}"

# ==================== CUOTAS ====================
class PagoCuota(models.Model):
    TIPO_CHOICES = [
        ('regular', 'Regular'),
        ('estudiante', 'Estudiante')
    ]
    
    MES_CHOICES = [
        (1, 'Enero'), (2, 'Febrero'), (3, 'Marzo'), (4, 'Abril'),
        (5, 'Mayo'), (6, 'Junio'), (7, 'Julio'), (8, 'Agosto'),
        (9, 'Septiembre'), (10, 'Octubre'), (11, 'Noviembre'), (12, 'Diciembre')
    ]
    
    bombero = models.ForeignKey('Bombero', on_delete=models.CASCADE, related_name='pagos_cuotas')
    tipo_cuota = models.CharField(max_length=20, choices=TIPO_CHOICES)
    monto = models.DecimalField(max_digits=10, decimal_places=0)
    mes = models.IntegerField(choices=MES_CHOICES)
    anio = models.IntegerField()
    fecha_pago = models.DateField()
    observaciones = models.TextField(blank=True, null=True)
    registrado_por = models.CharField(max_length=100)
    fecha_registro = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['bombero', 'mes', 'anio']
        ordering = ['-anio', '-mes']
        verbose_name = 'Pago de Cuota'
        verbose_name_plural = 'Pagos de Cuotas'
        indexes = [
            models.Index(fields=['bombero', 'anio']),
            models.Index(fields=['fecha_pago']),
        ]
    
    def __str__(self):
        return f"{self.bombero.nombre_completo()} - {self.get_mes_display()} {self.anio}"

# ==================== BENEFICIOS ====================
class Beneficio(models.Model):
    TIPO_CHOICES = [
        ('rifa', 'Rifa'),
        ('bingo', 'Bingo'),
        ('cena', 'Cena Bailable'),
        ('baile', 'Baile'),
        ('otro', 'Otro')
    ]
    
    ESTADO_CHOICES = [
        ('activo', 'Activo'),
        ('cerrado', 'Cerrado')
    ]
    
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES)
    nombre = models.CharField(max_length=200)
    descripcion = models.TextField(blank=True, null=True)
    fecha_evento = models.DateField()
    fecha_limite_rendicion = models.DateField()
    precio_tarjeta = models.DecimalField(max_digits=10, decimal_places=0)
    tarjetas_por_categoria = models.JSONField(default=dict)
    estado = models.CharField(max_length=10, choices=ESTADO_CHOICES, default='activo')
    fecha_cierre = models.DateTimeField(blank=True, null=True)
    creado_por = models.CharField(max_length=100)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-fecha_evento']
        verbose_name = 'Beneficio'
        verbose_name_plural = 'Beneficios'
    
    def clean(self):
        if self.fecha_limite_rendicion < self.fecha_evento:
            raise ValidationError('Fecha límite debe ser posterior a fecha del evento')
        if not any(self.tarjetas_por_categoria.values()):
            raise ValidationError('Debe asignar tarjetas a al menos una categoría')
    
    def __str__(self):
        return f"{self.nombre} - {self.fecha_evento}"

class AsignacionBeneficio(models.Model):
    ESTADO_CHOICES = [
        ('pendiente', 'Pendiente'),
        ('parcial', 'Parcial'),
        ('pagado', 'Pagado'),
        ('liberado', 'Liberado')
    ]
    
    CATEGORIA_CHOICES = [
        ('voluntarios', 'Voluntarios'),
        ('honorariosCia', 'Honorarios Compañía'),
        ('honorariosCuerpo', 'Honorarios Cuerpo'),
        ('insignes', 'Insignes')
    ]
    
    beneficio = models.ForeignKey(Beneficio, on_delete=models.CASCADE, related_name='asignaciones')
    bombero = models.ForeignKey('Bombero', on_delete=models.CASCADE, related_name='asignaciones_beneficios')
    nombre_bombero = models.CharField(max_length=200)
    clave_bombero = models.CharField(max_length=20)
    categoria = models.CharField(max_length=30, choices=CATEGORIA_CHOICES)
    tarjetas_asignadas = models.IntegerField()
    tarjetas_vendidas = models.IntegerField(default=0)
    tarjetas_extras_vendidas = models.IntegerField(default=0)
    monto_esperado = models.DecimalField(max_digits=10, decimal_places=0)
    monto_pagado = models.DecimalField(max_digits=10, decimal_places=0, default=0)
    monto_extras_vendidas = models.DecimalField(max_digits=10, decimal_places=0, default=0)
    estado_pago = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='pendiente')
    historial_liberaciones = models.JSONField(default=list, blank=True)
    fecha_liberacion = models.DateTimeField(blank=True, null=True)
    fecha_asignacion = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['beneficio', 'bombero']
        indexes = [
            models.Index(fields=['beneficio', 'estado_pago']),
        ]
    
    def actualizar_estado_pago(self):
        if self.monto_pagado >= self.monto_esperado:
            self.estado_pago = 'pagado'
        elif self.monto_pagado > 0:
            self.estado_pago = 'parcial'
        else:
            self.estado_pago = 'pendiente'
        self.save()

class PagoBeneficio(models.Model):
    TIPO_CHOICES = [
        ('normal', 'Pago Normal'),
        ('extra', 'Venta Extra')
    ]
    
    asignacion = models.ForeignKey(AsignacionBeneficio, on_delete=models.CASCADE, related_name='pagos')
    beneficio = models.ForeignKey(Beneficio, on_delete=models.CASCADE, related_name='pagos')
    bombero = models.ForeignKey('Bombero', on_delete=models.CASCADE, related_name='pagos_beneficios')
    tipo = models.CharField(max_length=10, choices=TIPO_CHOICES, default='normal')
    tarjetas_vendidas = models.IntegerField()
    monto_pagado = models.DecimalField(max_digits=10, decimal_places=0)
    fecha_pago = models.DateField()
    observaciones = models.TextField(blank=True, null=True)
    registrado_por = models.CharField(max_length=100, blank=True, null=True)
    fecha_registro = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-fecha_pago']

# ==================== MOVIMIENTOS FINANCIEROS ====================
class MovimientoFinanciero(models.Model):
    TIPO_CHOICES = [('ingreso', 'Ingreso'), ('egreso', 'Egreso')]
    CATEGORIA_CHOICES = [
        ('Cuota Mensual', 'Cuota Mensual'),
        ('Beneficio', 'Pago de Beneficio'),
        ('Pago de Beneficio Extra', 'Pago de Beneficio Extra'),
        ('Otro', 'Otro')
    ]
    
    tipo = models.CharField(max_length=10, choices=TIPO_CHOICES)
    categoria = models.CharField(max_length=50, choices=CATEGORIA_CHOICES)
    monto = models.DecimalField(max_digits=12, decimal_places=0)
    descripcion = models.TextField()
    fecha = models.DateField()
    bombero = models.ForeignKey('Bombero', on_delete=models.SET_NULL, blank=True, null=True)
    beneficio = models.ForeignKey(Beneficio, on_delete=models.SET_NULL, blank=True, null=True)
    origen = models.CharField(max_length=50, blank=True, null=True)
    registrado_por = models.CharField(max_length=100, blank=True, null=True)
    fecha_registro = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-fecha', '-fecha_registro']
        indexes = [
            models.Index(fields=['tipo', 'fecha']),
        ]
```

**Ejecutar:**
```bash
python manage.py makemigrations
python manage.py migrate
```

---

## PASO 2: CREAR SERVICIOS (voluntarios/services/tesoreria.py)

```python
from django.db import transaction
from django.core.exceptions import ValidationError
from django.utils import timezone
from voluntarios.models import Bombero
from voluntarios.models_tesoreria import *
from voluntarios.utils import (
    puede_pagar_cuotas,
    obtener_categoria_beneficio,
    calcular_antiguedad_detallada
)

# ==================== CUOTAS ====================
@transaction.atomic
def registrar_pago_cuota(datos, usuario):
    voluntario = Bombero.objects.get(id=datos['bombero_id'])
    
    # Validar
    validacion = puede_pagar_cuotas(voluntario)
    if not validacion['puede']:
        raise ValidationError(validacion['mensaje'])
    
    # Verificar duplicado
    if PagoCuota.objects.filter(
        bombero=voluntario, mes=datos['mes'], anio=datos['anio']
    ).exists():
        raise ValidationError('Ya existe un pago para este mes y año')
    
    # Crear pago
    pago = PagoCuota.objects.create(
        bombero=voluntario,
        tipo_cuota=datos['tipo_cuota'],
        monto=datos['monto'],
        mes=datos['mes'],
        anio=datos['anio'],
        fecha_pago=datos['fecha_pago'],
        observaciones=datos.get('observaciones', ''),
        registrado_por=usuario.username
    )
    
    # Movimiento financiero
    MovimientoFinanciero.objects.create(
        tipo='ingreso',
        categoria='Cuota Mensual',
        monto=datos['monto'],
        descripcion=f"Cuota {datos['tipo_cuota']} - {voluntario.nombre_completo()} ({pago.get_mes_display()}/{datos['anio']})",
        fecha=datos['fecha_pago'],
        bombero=voluntario,
        origen='cuotas',
        registrado_por=usuario.username
    )
    
    return pago

# ==================== ACTIVAR ESTUDIANTE (NUEVO) ====================
@transaction.atomic
def activar_estudiante(bombero_id, datos, usuario):
    """Activa modo estudiante para un voluntario"""
    voluntario = Bombero.objects.get(id=bombero_id)
    estado, _ = EstadoCuotasBombero.objects.get_or_create(bombero=voluntario)
    
    estado.es_estudiante = True
    estado.fecha_activacion_estudiante = datos.get('fecha_activacion', timezone.now().date())
    estado.observaciones_estudiante = datos.get('observaciones', '')
    estado.save()
    
    return estado

@transaction.atomic
def desactivar_estudiante(bombero_id):
    """Desactiva modo estudiante"""
    try:
        estado = EstadoCuotasBombero.objects.get(bombero_id=bombero_id)
        estado.es_estudiante = False
        estado.fecha_activacion_estudiante = None
        estado.observaciones_estudiante = None
        estado.save()
        return estado
    except EstadoCuotasBombero.DoesNotExist:
        return None

# ==================== DESACTIVAR CUOTAS (NUEVO) ====================
@transaction.atomic
def desactivar_cuotas_voluntario(bombero_id, motivo, usuario):
    """
    Desactiva cuotas de un voluntario (Honorarios/Insignes)
    NO aparecerá como deudor en reportes
    """
    voluntario = Bombero.objects.get(id=bombero_id)
    estado, _ = EstadoCuotasBombero.objects.get_or_create(bombero=voluntario)
    
    estado.cuotas_desactivadas = True
    estado.motivo_desactivacion = motivo
    estado.fecha_desactivacion = timezone.now()
    estado.desactivado_por = usuario.username
    estado.save()
    
    return estado

@transaction.atomic
def reactivar_cuotas_voluntario(bombero_id):
    """Reactiva cuotas de un voluntario"""
    try:
        estado = EstadoCuotasBombero.objects.get(bombero_id=bombero_id)
        estado.cuotas_desactivadas = False
        estado.motivo_desactivacion = None
        estado.fecha_desactivacion = None
        estado.desactivado_por = None
        estado.save()
        return estado
    except EstadoCuotasBombero.DoesNotExist:
        return None

# ==================== SALDO Y DEUDORES (NUEVO) ====================
def calcular_saldo_compania():
    """Calcula saldo total de la compañía"""
    from django.db.models import Sum
    
    ingresos = MovimientoFinanciero.objects.filter(
        tipo='ingreso'
    ).aggregate(Sum('monto'))['monto__sum'] or 0
    
    egresos = MovimientoFinanciero.objects.filter(
        tipo='egreso'
    ).aggregate(Sum('monto'))['monto__sum'] or 0
    
    return {
        'saldo': ingresos - egresos,
        'ingresos': ingresos,
        'egresos': egresos
    }

def calcular_deudores_cuotas(anio=None):
    """
    Calcula deudores de cuotas
    EXCLUYE: Exentos, bloqueados, cuotas_desactivadas=True
    """
    if anio is None:
        anio = timezone.now().year
    
    deudores = []
    voluntarios = Bombero.objects.filter(estado_bombero__in=['activo', 'inactivo'])
    
    for v in voluntarios:
        validacion = puede_pagar_cuotas(v)
        if not validacion['puede']:
            continue  # Saltar
        
        deuda = calcular_deuda_cuotas(v, anio)
        if deuda['monto'] > 0:
            deudores.append({
                'voluntario': v,
                'monto': deuda['monto'],
                'meses_pendientes': deuda['meses_pendientes']
            })
    
    return deudores

# ==================== BENEFICIOS ====================
@transaction.atomic
def crear_beneficio_con_asignaciones(datos, usuario):
    beneficio = Beneficio.objects.create(
        tipo=datos['tipo'],
        nombre=datos['nombre'],
        descripcion=datos.get('descripcion', ''),
        fecha_evento=datos['fecha_evento'],
        fecha_limite_rendicion=datos['fecha_limite_rendicion'],
        precio_tarjeta=datos['precio_tarjeta'],
        tarjetas_por_categoria=datos['tarjetas_por_categoria'],
        estado='activo',
        creado_por=usuario.username
    )
    
    voluntarios = Bombero.objects.all()
    for voluntario in voluntarios:
        categoria = obtener_categoria_beneficio(voluntario)
        tarjetas = beneficio.tarjetas_por_categoria.get(categoria, 0)
        
        if tarjetas > 0:
            AsignacionBeneficio.objects.create(
                beneficio=beneficio,
                bombero=voluntario,
                nombre_bombero=voluntario.nombre_completo(),
                clave_bombero=voluntario.clave_bombero,
                categoria=categoria,
                tarjetas_asignadas=tarjetas,
                monto_esperado=tarjetas * beneficio.precio_tarjeta,
                estado_pago='pendiente'
            )
    
    return beneficio

@transaction.atomic
def registrar_pago_beneficio(datos, usuario):
    asignacion = AsignacionBeneficio.objects.get(id=datos['asignacion_id'])
    
    pago = PagoBeneficio.objects.create(
        asignacion=asignacion,
        beneficio=asignacion.beneficio,
        bombero=asignacion.bombero,
        tipo='normal',
        tarjetas_vendidas=datos['tarjetas_vendidas'],
        monto_pagado=datos['monto_pagado'],
        fecha_pago=datos['fecha_pago'],
        observaciones=datos.get('observaciones', ''),
        registrado_por=usuario.username
    )
    
    asignacion.tarjetas_vendidas += datos['tarjetas_vendidas']
    asignacion.monto_pagado += datos['monto_pagado']
    asignacion.actualizar_estado_pago()
    
    MovimientoFinanciero.objects.create(
        tipo='ingreso',
        categoria='Beneficio',
        monto=datos['monto_pagado'],
        descripcion=f"Beneficio: {asignacion.beneficio.nombre} - {asignacion.nombre_bombero} ({datos['tarjetas_vendidas']} tarjetas)",
        fecha=datos['fecha_pago'],
        bombero=asignacion.bombero,
        beneficio=asignacion.beneficio,
        origen='beneficios',
        registrado_por=usuario.username
    )
    
    return pago

@transaction.atomic
def registrar_venta_extra(datos, usuario):
    asignacion = AsignacionBeneficio.objects.get(id=datos['asignacion_id'])
    
    pago = PagoBeneficio.objects.create(
        asignacion=asignacion,
        beneficio=asignacion.beneficio,
        bombero=asignacion.bombero,
        tipo='extra',
        tarjetas_vendidas=datos['cantidad_extras'],
        monto_pagado=datos['monto_extra'],
        fecha_pago=datos['fecha_pago'],
        observaciones=datos.get('observaciones', 'Venta extra'),
        registrado_por=usuario.username
    )
    
    asignacion.tarjetas_extras_vendidas += datos['cantidad_extras']
    asignacion.monto_extras_vendidas += datos['monto_extra']
    asignacion.monto_pagado += datos['monto_extra']
    asignacion.actualizar_estado_pago()
    
    MovimientoFinanciero.objects.create(
        tipo='ingreso',
        categoria='Pago de Beneficio Extra',
        monto=datos['monto_extra'],
        descripcion=f"Venta Extra: {asignacion.beneficio.nombre} - {asignacion.nombre_bombero} ({datos['cantidad_extras']} tarjetas)",
        fecha=datos['fecha_pago'],
        bombero=asignacion.bombero,
        beneficio=asignacion.beneficio,
        origen='beneficios_extra',
        registrado_por=usuario.username
    )
    
    return pago

@transaction.atomic
def liberar_tarjetas(datos, usuario):
    asignacion = AsignacionBeneficio.objects.get(id=datos['asignacion_id'])
    cantidad = datos['cantidad']
    
    if cantidad > asignacion.tarjetas_asignadas:
        raise ValidationError('No puede liberar más tarjetas de las asignadas')
    
    tarjetas_anteriores = asignacion.tarjetas_asignadas
    tarjetas_nuevas = tarjetas_anteriores - cantidad
    
    asignacion.tarjetas_asignadas = tarjetas_nuevas
    asignacion.monto_esperado = tarjetas_nuevas * asignacion.beneficio.precio_tarjeta
    
    asignacion.historial_liberaciones.append({
        'fecha': timezone.now().isoformat(),
        'cantidad_liberada': cantidad,
        'motivo': datos.get('motivo', ''),
        'tipo': datos['tipo'],
        'tarjetas_anteriores': tarjetas_anteriores,
        'tarjetas_nuevas': tarjetas_nuevas
    })
    
    if tarjetas_nuevas == 0:
        asignacion.estado_pago = 'liberado'
        asignacion.fecha_liberacion = timezone.now()
    else:
        asignacion.actualizar_estado_pago()
    
    asignacion.save()
    return asignacion

@transaction.atomic
def cerrar_beneficio(beneficio_id, usuario):
    beneficio = Beneficio.objects.get(id=beneficio_id)
    
    deudores = AsignacionBeneficio.objects.filter(
        beneficio=beneficio,
        estado_pago__in=['pendiente', 'parcial']
    )
    
    if deudores.exists():
        raise ValidationError(f'No se puede cerrar. Hay {deudores.count()} deudor(es)')
    
    beneficio.estado = 'cerrado'
    beneficio.fecha_cierre = timezone.now()
    beneficio.save()
    
    return beneficio
```

---

## PASO 3: CREAR SERIALIZERS

```python
# voluntarios/serializers_tesoreria.py

from rest_framework import serializers
from voluntarios.models_tesoreria import *

class PagoCuotaSerializer(serializers.ModelSerializer):
    mes_nombre = serializers.CharField(source='get_mes_display', read_only=True)
    bombero_nombre = serializers.CharField(source='bombero.nombre_completo', read_only=True)
    
    class Meta:
        model = PagoCuota
        fields = '__all__'

class BeneficioSerializer(serializers.ModelSerializer):
    total_asignados = serializers.SerializerMethodField()
    total_pagados = serializers.SerializerMethodField()
    total_deudores = serializers.SerializerMethodField()
    
    class Meta:
        model = Beneficio
        fields = '__all__'
    
    def get_total_asignados(self, obj):
        return obj.asignaciones.count()
    
    def get_total_pagados(self, obj):
        return obj.asignaciones.filter(estado_pago='pagado').count()
    
    def get_total_deudores(self, obj):
        return obj.asignaciones.filter(estado_pago__in=['pendiente', 'parcial']).count()

class AsignacionBeneficioSerializer(serializers.ModelSerializer):
    beneficio_nombre = serializers.CharField(source='beneficio.nombre', read_only=True)
    
    class Meta:
        model = AsignacionBeneficio
        fields = '__all__'

class PagoBeneficioSerializer(serializers.ModelSerializer):
    class Meta:
        model = PagoBeneficio
        fields = '__all__'
```

---

## PASO 4: CREAR VIEWS/VIEWSETS

```python
# voluntarios/views_tesoreria.py

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from voluntarios.services.tesoreria import *
from voluntarios.serializers_tesoreria import *

class PagoCuotaViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = PagoCuotaSerializer
    
    def get_queryset(self):
        return PagoCuota.objects.all()
    
    def create(self, request):
        try:
            pago = registrar_pago_cuota(request.data, request.user)
            serializer = self.get_serializer(pago)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def por_voluntario(self, request):
        voluntario_id = request.query_params.get('voluntario_id')
        anio = request.query_params.get('anio', timezone.now().year)
        pagos = PagoCuota.objects.filter(bombero_id=voluntario_id, anio=anio)
        serializer = self.get_serializer(pagos, many=True)
        return Response(serializer.data)

class BeneficioViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = BeneficioSerializer
    
    def get_queryset(self):
        return Beneficio.objects.all()
    
    def create(self, request):
        try:
            beneficio = crear_beneficio_con_asignaciones(request.data, request.user)
            serializer = self.get_serializer(beneficio)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def cerrar(self, request, pk=None):
        try:
            beneficio = cerrar_beneficio(pk, request.user)
            return Response({'status': 'Beneficio cerrado'})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class AsignacionBeneficioViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = AsignacionBeneficioSerializer
    
    def get_queryset(self):
        return AsignacionBeneficio.objects.all()
    
    @action(detail=True, methods=['post'])
    def pagar(self, request, pk=None):
        try:
            datos = {**request.data, 'asignacion_id': pk}
            pago = registrar_pago_beneficio(datos, request.user)
            return Response({'status': 'Pago registrado'})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def venta_extra(self, request, pk=None):
        try:
            datos = {**request.data, 'asignacion_id': pk}
            pago = registrar_venta_extra(datos, request.user)
            return Response({'status': 'Venta extra registrada'})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def liberar(self, request, pk=None):
        try:
            datos = {**request.data, 'asignacion_id': pk}
            asignacion = liberar_tarjetas(datos, request.user)
            return Response({'status': 'Tarjetas liberadas'})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
```

---

## PASO 5: CONFIGURAR URLS

```python
# voluntarios/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from voluntarios.views_tesoreria import *

router = DefaultRouter()
router.register(r'pagos-cuotas', PagoCuotaViewSet, basename='pago-cuota')
router.register(r'beneficios', BeneficioViewSet, basename='beneficio')
router.register(r'asignaciones', AsignacionBeneficioViewSet, basename='asignacion')

urlpatterns = [
    path('api/', include(router.urls)),
]
```

---

## PASO 6: ADMIN PANEL

```python
# voluntarios/admin.py

from django.contrib import admin
from voluntarios.models_tesoreria import *

@admin.register(ConfiguracionCuotas)
class ConfiguracionCuotasAdmin(admin.ModelAdmin):
    list_display = ['precio_regular', 'precio_estudiante', 'fecha_actualizacion']

@admin.register(PagoCuota)
class PagoCuotaAdmin(admin.ModelAdmin):
    list_display = ['bombero', 'mes', 'anio', 'monto', 'tipo_cuota', 'fecha_pago']
    list_filter = ['anio', 'mes', 'tipo_cuota']
    search_fields = ['bombero__nombre', 'bombero__apellido_paterno']

@admin.register(Beneficio)
class BeneficioAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'tipo', 'fecha_evento', 'estado']
    list_filter = ['estado', 'tipo']

@admin.register(AsignacionBeneficio)
class AsignacionBeneficioAdmin(admin.ModelAdmin):
    list_display = ['beneficio', 'nombre_bombero', 'categoria', 'estado_pago']
    list_filter = ['estado_pago', 'categoria']
```

---

## ✅ CHECKLIST FINAL

### Modelos (7):
- [ ] ConfiguracionCuotas (Singleton)
- [ ] EstadoCuotasBombero (NUEVO) ← es_estudiante + cuotas_desactivadas
- [ ] PagoCuota
- [ ] Beneficio
- [ ] AsignacionBeneficio
- [ ] PagoBeneficio
- [ ] MovimientoFinanciero

### Servicios/Funciones:
- [ ] puede_pagar_cuotas() - actualizada con cuotas_desactivadas
- [ ] activar_estudiante() (NUEVO)
- [ ] desactivar_estudiante() (NUEVO)
- [ ] desactivar_cuotas_voluntario() (NUEVO)
- [ ] reactivar_cuotas_voluntario() (NUEVO)
- [ ] calcular_saldo_compania() (NUEVO)
- [ ] calcular_deudores_cuotas() - actualizada
- [ ] registrar_pago_cuota()
- [ ] crear_beneficio_con_asignaciones()
- [ ] registrar_pago_beneficio()
- [ ] registrar_venta_extra()
- [ ] liberar_tarjetas()
- [ ] cerrar_beneficio()

### API Endpoints:
- [ ] GET/PUT /api/configuracion-cuotas/ (NUEVO)
- [ ] POST /api/estado-cuotas/activar-estudiante/{id}/ (NUEVO)
- [ ] POST /api/estado-cuotas/desactivar-cuotas/{id}/ (NUEVO)
- [ ] GET /api/finanzas/saldo_compania/ (NUEVO)
- [ ] GET /api/finanzas/deudores/ (NUEVO)
- [ ] POST /api/pagos-cuotas/
- [ ] POST /api/beneficios/
- [ ] POST /api/beneficios/{id}/cerrar/
- [ ] POST /api/asignaciones/{id}/pagar/
- [ ] POST /api/asignaciones/{id}/venta_extra/
- [ ] POST /api/asignaciones/{id}/liberar/

### Frontend (Widgets/Botones):
- [ ] Botón "⚙️ Configurar Cuotas" + Modal (NUEVO)
- [ ] Widget "SALDO COMPAÑÍA $0" (NUEVO)
- [ ] Badge "🔔 Notificación Deudores [●12]" (NUEVO)
- [ ] Botón "➕ ACTIVAR ESTUDIANTE" + Modal (NUEVO)
- [ ] Botón "🔕 Desactivar Cuotas" para Honorarios/Insignes (NUEVO)
- [ ] Grid 12 meses para cuotas
- [ ] Dashboard de beneficios
- [ ] Modal venta extra
- [ ] Modal liberar tarjetas

### Validaciones:
- [ ] Exenciones automáticas (Honorarios, Insignes, Mártires)
- [ ] Desactivación manual de cuotas (NO aparecen como deudores)
- [ ] Estados bloqueados no pueden pagar
- [ ] No duplicar pagos cuotas (unique mes+año)
- [ ] No cerrar beneficio con deudores
- [ ] Registro automático en MovimientoFinanciero

### Admin Panel:
- [ ] ConfiguracionCuotas admin
- [ ] EstadoCuotasBombero admin (NUEVO)
- [ ] PagoCuota admin
- [ ] Beneficio admin
- [ ] AsignacionBeneficio admin
- [ ] MovimientoFinanciero admin

---

## 🎯 RESULTADO ESPERADO

**Endpoints funcionales:**
- POST `/api/pagos-cuotas/` → Registrar pago de cuota
- GET `/api/pagos-cuotas/por_voluntario/?voluntario_id=X&anio=2024` → Pagos del año
- POST `/api/beneficios/` → Crear beneficio (+ asignaciones automáticas)
- POST `/api/beneficios/{id}/cerrar/` → Cerrar beneficio
- POST `/api/asignaciones/{id}/pagar/` → Pago normal
- POST `/api/asignaciones/{id}/venta_extra/` → Venta extra
- POST `/api/asignaciones/{id}/liberar/` → Liberar tarjetas
