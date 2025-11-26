from django.db import models
from apps.voluntarios.models import Voluntario


class Cargo(models.Model):
    """
    Modelo de Cargos de Bomberos
    Migrado desde cargosData en localStorage
    """

    CATEGORIA_CHOICES = [
        ('Oficiales de Comandancia', 'Oficiales de Comandancia'),
        ('Oficiales de Compañía', 'Oficiales de Compañía'),
        ('Cargos de Confianza', 'Cargos de Confianza'),
        ('Directorio General', 'Directorio General'),
        ('Directorio Compañía', 'Directorio Compañía'),
        ('Otros Consejos', 'Otros Consejos'),
    ]

    voluntario = models.ForeignKey(
        Voluntario,
        on_delete=models.CASCADE,
        related_name='cargos',
        verbose_name='Voluntario'
    )
    cargo = models.CharField('Cargo', max_length=200)
    categoria = models.CharField('Categoría', max_length=100, choices=CATEGORIA_CHOICES)
    ano_cargo = models.IntegerField('Año del Cargo', null=True, blank=True)
    fecha_inicio_cargo = models.DateField('Fecha Inicio', null=True, blank=True)
    fecha_fin_cargo = models.DateField('Fecha Fin', null=True, blank=True)
    compania_consejo = models.CharField('Compañía/Consejo', max_length=200, blank=True)

    # Auditoría
    fecha_creacion = models.DateTimeField('Fecha de Creación', auto_now_add=True)
    fecha_actualizacion = models.DateTimeField('Última Actualización', auto_now=True)

    class Meta:
        verbose_name = 'Cargo'
        verbose_name_plural = 'Cargos'
        db_table = 'cargos'
        ordering = ['-ano_cargo', '-fecha_inicio_cargo']

    def __str__(self):
        return f"{self.voluntario.nombre_completo} - {self.cargo} ({self.ano_cargo or 'Sin año'})"

    @property
    def esta_vigente(self):
        """Verifica si el cargo está vigente"""
        from datetime import date
        hoy = date.today()

        # Si tiene año, verificar si es el año actual
        if self.ano_cargo:
            return self.ano_cargo == hoy.year

        # Si tiene fechas, verificar si está en el rango
        if self.fecha_inicio_cargo and self.fecha_fin_cargo:
            return self.fecha_inicio_cargo <= hoy <= self.fecha_fin_cargo
        elif self.fecha_inicio_cargo:
            return self.fecha_inicio_cargo <= hoy

        return False


class Felicitacion(models.Model):
    """
    Modelo de Felicitaciones
    Migrado desde felicitacionesData en localStorage
    """

    voluntario = models.ForeignKey(
        Voluntario,
        on_delete=models.CASCADE,
        related_name='felicitaciones',
        verbose_name='Voluntario'
    )
    motivo = models.CharField('Motivo', max_length=200)
    descripcion = models.TextField('Descripción')
    fecha_felicitacion = models.DateField('Fecha de Felicitación')
    otorgado_por = models.CharField('Otorgado Por', max_length=200)

    # Auditoría
    fecha_creacion = models.DateTimeField('Fecha de Creación', auto_now_add=True)
    fecha_actualizacion = models.DateTimeField('Última Actualización', auto_now=True)

    class Meta:
        verbose_name = 'Felicitación'
        verbose_name_plural = 'Felicitaciones'
        db_table = 'felicitaciones'
        ordering = ['-fecha_felicitacion']

    def __str__(self):
        return f"{self.voluntario.nombre_completo} - {self.motivo}"
