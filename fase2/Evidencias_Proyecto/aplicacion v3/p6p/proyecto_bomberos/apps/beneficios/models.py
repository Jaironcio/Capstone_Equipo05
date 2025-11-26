from django.db import models
from django.core.validators import MinValueValidator
from django.contrib.auth import get_user_model
from apps.voluntarios.models import Voluntario


User = get_user_model()


class Beneficio(models.Model):
    """
    Modelo para gestionar eventos/beneficios (bingos, rifas, etc.)
    Migrado desde beneficios en localStorage
    """
    TIPO_CHOICES = [
        ('bingo', 'Bingo'),
        ('rifa', 'Rifa'),
        ('gala', 'Gala'),
        ('cena', 'Cena'),
        ('show', 'Show'),
        ('otro', 'Otro'),
    ]

    ESTADO_CHOICES = [
        ('activo', 'Activo'),
        ('cerrado', 'Cerrado'),
        ('cancelado', 'Cancelado'),
    ]

    # Información básica
    nombre = models.CharField('Nombre del Beneficio', max_length=200)
    tipo = models.CharField('Tipo', max_length=50, choices=TIPO_CHOICES)
    descripcion = models.TextField('Descripción', blank=True)

    # Fechas
    fecha_evento = models.DateField('Fecha del Evento')
    fecha_limite_rendicion = models.DateField(
        'Fecha Límite de Rendición',
        help_text='Fecha límite para entregar el dinero de las tarjetas vendidas'
    )

    # Precio y tarjetas
    precio_tarjeta = models.DecimalField(
        'Precio por Tarjeta',
        max_digits=10,
        decimal_places=0,
        validators=[MinValueValidator(0)]
    )

    # Tarjetas por categoría de bombero
    tarjetas_voluntarios = models.PositiveIntegerField(
        'Tarjetas para Voluntarios (< 20 años)',
        default=8,
        validators=[MinValueValidator(0)]
    )
    tarjetas_honorarios_cia = models.PositiveIntegerField(
        'Tarjetas para Hon. Compañía (20-24 años)',
        default=5,
        validators=[MinValueValidator(0)]
    )
    tarjetas_honorarios_cuerpo = models.PositiveIntegerField(
        'Tarjetas para Hon. Cuerpo (25-49 años)',
        default=3,
        validators=[MinValueValidator(0)]
    )
    tarjetas_insignes = models.PositiveIntegerField(
        'Tarjetas para Insignes (50+ años)',
        default=2,
        validators=[MinValueValidator(0)]
    )

    # Estado
    estado = models.CharField(
        'Estado',
        max_length=20,
        choices=ESTADO_CHOICES,
        default='activo'
    )
    fecha_cierre = models.DateTimeField('Fecha de Cierre', null=True, blank=True)

    # Auditoría
    creado_por = models.CharField('Creado Por', max_length=150)
    fecha_creacion = models.DateTimeField('Fecha de Creación', auto_now_add=True)
    fecha_actualizacion = models.DateTimeField('Última Actualización', auto_now=True)

    class Meta:
        verbose_name = 'Beneficio'
        verbose_name_plural = 'Beneficios'
        db_table = 'beneficios'
        ordering = ['-fecha_evento']
        indexes = [
            models.Index(fields=['estado', 'fecha_evento']),
            models.Index(fields=['fecha_limite_rendicion']),
        ]

    def __str__(self):
        return f"{self.nombre} ({self.get_tipo_display()}) - {self.fecha_evento}"

    @property
    def esta_vencido(self):
        """Verifica si el beneficio está vencido (pasó la fecha límite)"""
        from django.utils import timezone
        return (
            self.estado == 'activo' and
            self.fecha_limite_rendicion < timezone.now().date()
        )

    @property
    def total_tarjetas_por_categoria(self):
        """Retorna un diccionario con las tarjetas por categoría"""
        return {
            'voluntarios': self.tarjetas_voluntarios,
            'honorariosCia': self.tarjetas_honorarios_cia,
            'honorariosCuerpo': self.tarjetas_honorarios_cuerpo,
            'insignes': self.tarjetas_insignes
        }

    @property
    def total_asignaciones(self):
        """Retorna el total de asignaciones realizadas"""
        return self.asignaciones.count()

    @property
    def total_esperado(self):
        """Calcula el total esperado de todas las asignaciones"""
        return self.asignaciones.aggregate(
            total=models.Sum('monto_esperado')
        )['total'] or 0

    @property
    def total_recaudado(self):
        """Calcula el total recaudado de todas las asignaciones"""
        return self.asignaciones.aggregate(
            total=models.Sum('monto_pagado')
        )['total'] or 0

    @property
    def eficiencia_cobro(self):
        """Calcula el porcentaje de eficiencia de cobro"""
        if self.total_esperado > 0:
            return (self.total_recaudado / self.total_esperado) * 100
        return 0

    @property
    def total_deudores(self):
        """Cuenta el total de deudores"""
        return self.asignaciones.filter(
            estado_pago__in=['pendiente', 'parcial']
        ).count()


class AsignacionBeneficio(models.Model):
    """
    Modelo para asignar tarjetas de beneficios a voluntarios
    Migrado desde asignacionesBeneficios en localStorage
    """
    CATEGORIA_CHOICES = [
        ('voluntarios', 'Voluntario'),
        ('honorariosCia', 'Honorario de Compañía'),
        ('honorariosCuerpo', 'Honorario del Cuerpo'),
        ('insignes', 'Insigne de Chile'),
    ]

    ESTADO_PAGO_CHOICES = [
        ('pendiente', 'Pendiente'),
        ('parcial', 'Parcial'),
        ('pagado', 'Pagado'),
    ]

    # Relaciones
    beneficio = models.ForeignKey(
        Beneficio,
        on_delete=models.CASCADE,
        related_name='asignaciones',
        verbose_name='Beneficio'
    )
    voluntario = models.ForeignKey(
        Voluntario,
        on_delete=models.CASCADE,
        related_name='asignaciones_beneficios',
        verbose_name='Voluntario'
    )

    # Información del voluntario (denormalizado para historial)
    nombre_voluntario = models.CharField('Nombre Completo', max_length=300)
    clave_bombero = models.CharField('Clave Bombero', max_length=50)
    categoria = models.CharField('Categoría', max_length=30, choices=CATEGORIA_CHOICES)

    # Tarjetas
    tarjetas_asignadas = models.PositiveIntegerField(
        'Tarjetas Asignadas',
        validators=[MinValueValidator(0)]
    )
    tarjetas_vendidas = models.PositiveIntegerField(
        'Tarjetas Vendidas',
        default=0,
        validators=[MinValueValidator(0)]
    )

    # Montos
    monto_esperado = models.DecimalField(
        'Monto Esperado',
        max_digits=10,
        decimal_places=0,
        validators=[MinValueValidator(0)]
    )
    monto_pagado = models.DecimalField(
        'Monto Pagado',
        max_digits=10,
        decimal_places=0,
        default=0,
        validators=[MinValueValidator(0)]
    )

    # Estado del pago
    estado_pago = models.CharField(
        'Estado del Pago',
        max_length=20,
        choices=ESTADO_PAGO_CHOICES,
        default='pendiente'
    )

    # Auditoría
    fecha_asignacion = models.DateTimeField('Fecha de Asignación', auto_now_add=True)
    fecha_actualizacion = models.DateTimeField('Última Actualización', auto_now=True)

    class Meta:
        verbose_name = 'Asignación de Beneficio'
        verbose_name_plural = 'Asignaciones de Beneficios'
        db_table = 'beneficios_asignaciones'
        ordering = ['-fecha_asignacion']
        unique_together = [['beneficio', 'voluntario']]
        indexes = [
            models.Index(fields=['beneficio', 'estado_pago']),
            models.Index(fields=['voluntario', 'estado_pago']),
        ]

    def __str__(self):
        return f"{self.nombre_voluntario} - {self.beneficio.nombre}"

    @property
    def saldo_pendiente(self):
        """Calcula el saldo pendiente de pago"""
        return self.monto_esperado - self.monto_pagado

    @property
    def porcentaje_pagado(self):
        """Calcula el porcentaje pagado"""
        if self.monto_esperado > 0:
            return (self.monto_pagado / self.monto_esperado) * 100
        return 0

    @property
    def esta_al_dia(self):
        """Verifica si está al día con el pago"""
        return self.estado_pago == 'pagado'

    def actualizar_estado_pago(self):
        """Actualiza el estado del pago según el monto pagado"""
        if self.monto_pagado >= self.monto_esperado:
            self.estado_pago = 'pagado'
        elif self.monto_pagado > 0:
            self.estado_pago = 'parcial'
        else:
            self.estado_pago = 'pendiente'


class PagoBeneficio(models.Model):
    """
    Modelo para registrar pagos de beneficios
    Migrado desde pagosBeneficios en localStorage
    """
    FORMA_PAGO_CHOICES = [
        ('efectivo', 'Efectivo'),
        ('transferencia', 'Transferencia'),
        ('tarjeta', 'Tarjeta de Débito/Crédito'),
        ('cheque', 'Cheque'),
    ]

    # Relaciones
    asignacion = models.ForeignKey(
        AsignacionBeneficio,
        on_delete=models.CASCADE,
        related_name='pagos',
        verbose_name='Asignación'
    )
    beneficio = models.ForeignKey(
        Beneficio,
        on_delete=models.CASCADE,
        related_name='pagos',
        verbose_name='Beneficio'
    )
    voluntario = models.ForeignKey(
        Voluntario,
        on_delete=models.CASCADE,
        related_name='pagos_beneficios',
        verbose_name='Voluntario'
    )

    # Información del pago
    monto_pagado = models.DecimalField(
        'Monto Pagado',
        max_digits=10,
        decimal_places=0,
        validators=[MinValueValidator(0)]
    )
    tarjetas_vendidas = models.PositiveIntegerField(
        'Tarjetas Vendidas',
        default=0,
        validators=[MinValueValidator(0)]
    )
    fecha_pago = models.DateField('Fecha de Pago')
    forma_pago = models.CharField(
        'Forma de Pago',
        max_length=20,
        choices=FORMA_PAGO_CHOICES
    )

    # Comprobante
    comprobante = models.FileField(
        'Comprobante',
        upload_to='beneficios/comprobantes/%Y/%m/',
        blank=True,
        null=True,
        help_text='Imagen o PDF del comprobante de pago'
    )
    nombre_comprobante_original = models.CharField(
        'Nombre Original del Comprobante',
        max_length=255,
        blank=True
    )

    # Observaciones
    observaciones = models.TextField('Observaciones', blank=True)

    # Tipo de pago
    es_venta_extra = models.BooleanField(
        'Es Venta Extra',
        default=False,
        help_text='Indica si es una venta extra adicional a la asignación original'
    )

    # Auditoría
    registrado_por = models.CharField('Registrado Por', max_length=150)
    fecha_registro = models.DateTimeField('Fecha de Registro', auto_now_add=True)
    fecha_actualizacion = models.DateTimeField('Última Actualización', auto_now=True)

    class Meta:
        verbose_name = 'Pago de Beneficio'
        verbose_name_plural = 'Pagos de Beneficios'
        db_table = 'beneficios_pagos'
        ordering = ['-fecha_pago']
        indexes = [
            models.Index(fields=['beneficio', 'fecha_pago']),
            models.Index(fields=['voluntario', 'fecha_pago']),
            models.Index(fields=['asignacion', 'es_venta_extra']),
        ]

    def __str__(self):
        tipo = "Venta Extra" if self.es_venta_extra else "Pago Principal"
        return f"{self.voluntario.nombre_completo} - {self.beneficio.nombre} ({tipo})"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # Actualizar el estado de la asignación después de guardar
        self.actualizar_asignacion()

    def actualizar_asignacion(self):
        """Actualiza la asignación con el monto pagado"""
        # Calcular total pagado en esta asignación
        total_pagado = self.asignacion.pagos.aggregate(
            total=models.Sum('monto_pagado')
        )['total'] or 0

        self.asignacion.monto_pagado = total_pagado
        self.asignacion.actualizar_estado_pago()
        self.asignacion.save()


class VentaExtra(models.Model):
    """
    Modelo para registrar ventas extra de tarjetas
    Cuando un voluntario vende más tarjetas de las asignadas originalmente
    """
    ESTADO_CHOICES = [
        ('pendiente', 'Pendiente'),
        ('pagado', 'Pagado'),
    ]

    # Relaciones
    asignacion = models.ForeignKey(
        AsignacionBeneficio,
        on_delete=models.CASCADE,
        related_name='ventas_extras',
        verbose_name='Asignación'
    )
    beneficio = models.ForeignKey(
        Beneficio,
        on_delete=models.CASCADE,
        related_name='ventas_extras',
        verbose_name='Beneficio'
    )
    voluntario = models.ForeignKey(
        Voluntario,
        on_delete=models.CASCADE,
        related_name='ventas_extras',
        verbose_name='Voluntario'
    )

    # Información de la venta
    cantidad_tarjetas = models.PositiveIntegerField(
        'Cantidad de Tarjetas',
        validators=[MinValueValidator(1)]
    )
    valor_unitario = models.DecimalField(
        'Valor Unitario',
        max_digits=10,
        decimal_places=0,
        validators=[MinValueValidator(0)]
    )
    total = models.DecimalField(
        'Total',
        max_digits=10,
        decimal_places=0,
        validators=[MinValueValidator(0)]
    )

    # Estado
    estado = models.CharField(
        'Estado',
        max_length=20,
        choices=ESTADO_CHOICES,
        default='pendiente'
    )

    # Pago
    fecha_pago = models.DateField('Fecha de Pago', null=True, blank=True)
    pagado_por = models.CharField('Pagado Por', max_length=150, blank=True)

    # Nota obligatoria para auditoría
    nota = models.TextField(
        'Nota/Observación',
        help_text='Obligatorio: Debe justificar la venta extra para auditoría'
    )

    # Auditoría
    fecha_registro = models.DateTimeField('Fecha de Registro', auto_now_add=True)
    registrado_por = models.CharField('Registrado Por', max_length=150)
    fecha_actualizacion = models.DateTimeField('Última Actualización', auto_now=True)

    class Meta:
        verbose_name = 'Venta Extra'
        verbose_name_plural = 'Ventas Extras'
        db_table = 'beneficios_ventas_extras'
        ordering = ['-fecha_registro']
        indexes = [
            models.Index(fields=['beneficio', 'estado']),
            models.Index(fields=['voluntario', 'estado']),
            models.Index(fields=['asignacion']),
        ]

    def __str__(self):
        return f"Venta Extra: {self.voluntario.nombre_completo} - {self.cantidad_tarjetas} tarjetas"

    def save(self, *args, **kwargs):
        # Calcular total automáticamente
        self.total = self.cantidad_tarjetas * self.valor_unitario
        super().save(*args, **kwargs)

    @property
    def esta_pagado(self):
        """Verifica si está pagado"""
        return self.estado == 'pagado'

    def marcar_como_pagado(self, usuario):
        """Marca la venta extra como pagada"""
        from django.utils import timezone
        self.estado = 'pagado'
        self.fecha_pago = timezone.now().date()
        self.pagado_por = usuario
        self.save()

        # Crear pago de beneficio asociado
        PagoBeneficio.objects.create(
            asignacion=self.asignacion,
            beneficio=self.beneficio,
            voluntario=self.voluntario,
            monto_pagado=self.total,
            tarjetas_vendidas=self.cantidad_tarjetas,
            fecha_pago=self.fecha_pago,
            forma_pago='efectivo',  # Por defecto
            observaciones=f"Pago de venta extra: {self.nota}",
            es_venta_extra=True,
            registrado_por=usuario
        )
