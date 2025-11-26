from django.db import models
from django.core.validators import MinValueValidator
from django.contrib.auth import get_user_model
from apps.voluntarios.models import Voluntario


User = get_user_model()


class CicloAnual(models.Model):
    """
    Modelo para gestionar ciclos anuales de cuotas sociales
    Permite cerrar y bloquear años para auditoría
    """
    ESTADO_CHOICES = [
        ('activo', 'Activo'),
        ('cerrado', 'Cerrado'),
    ]

    anio = models.PositiveIntegerField(
        'Año',
        unique=True,
        validators=[MinValueValidator(2020)]
    )
    estado = models.CharField(
        'Estado',
        max_length=10,
        choices=ESTADO_CHOICES,
        default='activo'
    )
    bloqueado = models.BooleanField(
        'Bloqueado para Auditoría',
        default=False,
        help_text='Si está bloqueado, solo Super Admin puede modificarlo'
    )

    # Información de cierre
    fecha_cierre = models.DateTimeField('Fecha de Cierre', null=True, blank=True)
    cerrado_por = models.CharField('Cerrado Por', max_length=150, blank=True)
    motivo_cierre = models.TextField('Motivo del Cierre', blank=True)

    # Información de desbloqueo
    fecha_desbloqueo = models.DateTimeField('Fecha de Desbloqueo', null=True, blank=True)
    desbloqueado_por = models.CharField('Desbloqueado Por', max_length=150, blank=True)
    motivo_desbloqueo = models.TextField('Motivo del Desbloqueo', blank=True)

    # Auditoría
    fecha_creacion = models.DateTimeField('Fecha de Creación', auto_now_add=True)
    fecha_actualizacion = models.DateTimeField('Última Actualización', auto_now=True)

    class Meta:
        verbose_name = 'Ciclo Anual'
        verbose_name_plural = 'Ciclos Anuales'
        db_table = 'cuotas_ciclos_anuales'
        ordering = ['-anio']

    def __str__(self):
        estado_texto = f" ({self.get_estado_display()})"
        if self.bloqueado:
            estado_texto += " - BLOQUEADO"
        return f"Año {self.anio}{estado_texto}"

    @property
    def puede_modificarse(self):
        """Verifica si el ciclo puede ser modificado"""
        return self.estado == 'activo' and not self.bloqueado

    @property
    def total_esperado(self):
        """Calcula el total esperado para este año"""
        # Implementar lógica basada en los pagos
        return self.pagos.aggregate(
            total=models.Sum('monto')
        )['total'] or 0


class PagoCuota(models.Model):
    """
    Modelo para registrar pagos de cuotas sociales mensuales
    Migrado desde pagosCuotas en localStorage
    """
    TIPO_CUOTA_CHOICES = [
        ('regular', 'Cuota Regular'),
        ('estudiante', 'Cuota Estudiante'),
    ]

    MES_CHOICES = [
        (1, 'Enero'),
        (2, 'Febrero'),
        (3, 'Marzo'),
        (4, 'Abril'),
        (5, 'Mayo'),
        (6, 'Junio'),
        (7, 'Julio'),
        (8, 'Agosto'),
        (9, 'Septiembre'),
        (10, 'Octubre'),
        (11, 'Noviembre'),
        (12, 'Diciembre'),
    ]

    FORMA_PAGO_CHOICES = [
        ('efectivo', 'Efectivo'),
        ('transferencia', 'Transferencia'),
        ('tarjeta', 'Tarjeta de Débito/Crédito'),
        ('cheque', 'Cheque'),
    ]

    # Relaciones
    voluntario = models.ForeignKey(
        Voluntario,
        on_delete=models.CASCADE,
        related_name='pagos_cuotas',
        verbose_name='Voluntario'
    )
    ciclo = models.ForeignKey(
        CicloAnual,
        on_delete=models.PROTECT,
        related_name='pagos',
        verbose_name='Ciclo Anual',
        null=True,
        blank=True
    )

    # Información del pago
    tipo_cuota = models.CharField(
        'Tipo de Cuota',
        max_length=20,
        choices=TIPO_CUOTA_CHOICES
    )
    mes = models.PositiveSmallIntegerField(
        'Mes',
        choices=MES_CHOICES,
        validators=[MinValueValidator(1)]
    )
    anio = models.PositiveIntegerField(
        'Año',
        validators=[MinValueValidator(2020)]
    )
    monto = models.DecimalField(
        'Monto Pagado',
        max_digits=10,
        decimal_places=0,
        validators=[MinValueValidator(0)]
    )

    # Detalles de pago
    fecha_pago = models.DateField('Fecha de Pago')
    forma_pago = models.CharField(
        'Forma de Pago',
        max_length=20,
        choices=FORMA_PAGO_CHOICES
    )

    # Comprobante
    comprobante = models.FileField(
        'Comprobante',
        upload_to='cuotas/comprobantes/%Y/%m/',
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

    # Auditoría
    registrado_por = models.CharField('Registrado Por', max_length=150)
    fecha_registro = models.DateTimeField('Fecha de Registro', auto_now_add=True)
    fecha_actualizacion = models.DateTimeField('Última Actualización', auto_now=True)

    class Meta:
        verbose_name = 'Pago de Cuota'
        verbose_name_plural = 'Pagos de Cuotas'
        db_table = 'cuotas_pagos'
        ordering = ['-anio', '-mes', '-fecha_pago']
        unique_together = [['voluntario', 'mes', 'anio']]
        indexes = [
            models.Index(fields=['voluntario', 'anio']),
            models.Index(fields=['mes', 'anio']),
            models.Index(fields=['fecha_pago']),
        ]

    def __str__(self):
        return f"{self.voluntario.nombre_completo} - {self.get_mes_display()} {self.anio}"

    @property
    def nombre_mes(self):
        """Retorna el nombre del mes"""
        return self.get_mes_display()

    @property
    def estado_pago(self):
        """Retorna el estado del pago"""
        return 'Pagado'

    def save(self, *args, **kwargs):
        # Asignar ciclo automáticamente si no existe
        if not self.ciclo:
            ciclo, created = CicloAnual.objects.get_or_create(
                anio=self.anio,
                defaults={'estado': 'activo'}
            )
            self.ciclo = ciclo
        super().save(*args, **kwargs)

    def clean(self):
        from django.core.exceptions import ValidationError

        # Validar que el mes esté entre 1 y 12
        if not 1 <= self.mes <= 12:
            raise ValidationError({'mes': 'El mes debe estar entre 1 y 12'})

        # Validar que el año del ciclo coincida con el año del pago
        if self.ciclo and self.ciclo.anio != self.anio:
            raise ValidationError({
                'ciclo': 'El año del ciclo debe coincidir con el año del pago'
            })

    @property
    def puede_eliminarse(self):
        """Verifica si el pago puede ser eliminado"""
        if self.ciclo:
            return self.ciclo.puede_modificarse
        return True


class ConfiguracionCuota(models.Model):
    """
    Modelo para configurar los precios de las cuotas sociales
    """
    precio_regular = models.DecimalField(
        'Precio Cuota Regular',
        max_digits=10,
        decimal_places=0,
        default=5000,
        validators=[MinValueValidator(0)]
    )
    precio_estudiante = models.DecimalField(
        'Precio Cuota Estudiante',
        max_digits=10,
        decimal_places=0,
        default=3000,
        validators=[MinValueValidator(0)]
    )

    # Auditoría
    fecha_creacion = models.DateTimeField('Fecha de Creación', auto_now_add=True)
    fecha_actualizacion = models.DateTimeField('Última Actualización', auto_now=True)
    actualizado_por = models.CharField('Actualizado Por', max_length=150, blank=True)

    class Meta:
        verbose_name = 'Configuración de Cuotas'
        verbose_name_plural = 'Configuración de Cuotas'
        db_table = 'cuotas_configuracion'

    def __str__(self):
        return f"Regular: ${self.precio_regular} - Estudiante: ${self.precio_estudiante}"

    @classmethod
    def get_configuracion_actual(cls):
        """Obtiene o crea la configuración actual"""
        config, created = cls.objects.get_or_create(pk=1)
        return config
