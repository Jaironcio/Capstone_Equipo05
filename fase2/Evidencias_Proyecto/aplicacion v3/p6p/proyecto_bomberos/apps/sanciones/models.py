from django.db import models
from apps.voluntarios.models import Voluntario
from datetime import date


class Sancion(models.Model):
    """
    Modelo de Sanciones
    Migrado desde sancionesData en localStorage
    """

    TIPO_CHOICES = [
        ('Amonestación', 'Amonestación'),
        ('Suspensión', 'Suspensión'),
        ('Separación', 'Separación'),
        ('Expulsión', 'Expulsión'),
    ]

    AUTORIDAD_CHOICES = [
        ('Compañía', 'Compañía'),
        ('Capitanía', 'Capitanía'),
        ('Directorio', 'Directorio'),
        ('Cuerpo', 'Cuerpo'),
    ]

    voluntario = models.ForeignKey(
        Voluntario,
        on_delete=models.CASCADE,
        related_name='sanciones',
        verbose_name='Voluntario'
    )
    tipo = models.CharField('Tipo de Sanción', max_length=50, choices=TIPO_CHOICES)
    motivo = models.TextField('Motivo')
    autoridad_sancionatoria = models.CharField(
        'Autoridad Sancionatoria',
        max_length=50,
        choices=AUTORIDAD_CHOICES
    )
    compania_autoridad = models.CharField('Compañía/Autoridad', max_length=200, blank=True)
    fecha_sancion = models.DateField('Fecha de Sanción')
    fecha_inicio = models.DateField('Fecha Inicio', null=True, blank=True)
    fecha_fin = models.DateField('Fecha Fin', null=True, blank=True)
    observaciones = models.TextField('Observaciones', blank=True)

    # Auditoría
    fecha_creacion = models.DateTimeField('Fecha de Creación', auto_now_add=True)
    fecha_actualizacion = models.DateTimeField('Última Actualización', auto_now=True)

    class Meta:
        verbose_name = 'Sanción'
        verbose_name_plural = 'Sanciones'
        db_table = 'sanciones'
        ordering = ['-fecha_sancion']

    def __str__(self):
        return f"{self.voluntario.nombre_completo} - {self.tipo} ({self.fecha_sancion})"

    @property
    def esta_vigente(self):
        """Verifica si la sanción está vigente (para suspensiones)"""
        if self.tipo != 'Suspensión':
            return False
        if not self.fecha_inicio or not self.fecha_fin:
            return False
        hoy = date.today()
        return self.fecha_inicio <= hoy <= self.fecha_fin

    def clean(self):
        """Validaciones personalizadas"""
        from django.core.exceptions import ValidationError

        # Suspensiones deben tener fechas de inicio y fin
        if self.tipo == 'Suspensión':
            if not self.fecha_inicio or not self.fecha_fin:
                raise ValidationError('Las suspensiones deben tener fechas de inicio y fin')
            if self.fecha_fin < self.fecha_inicio:
                raise ValidationError('La fecha de fin no puede ser anterior a la fecha de inicio')

        # Separación y Expulsión cambian el estado del voluntario
        if self.tipo in ['Separación', 'Expulsión']:
            # Esto se manejará en el save() del modelo o en la vista
            pass
