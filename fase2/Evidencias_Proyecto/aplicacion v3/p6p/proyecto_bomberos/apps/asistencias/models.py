from django.db import models
from django.core.validators import MinValueValidator
from django.contrib.auth import get_user_model
from apps.voluntarios.models import Voluntario


User = get_user_model()


class Asistencia(models.Model):
    """
    Modelo para registrar asistencias
    Tipos: emergencias, asambleas, ejercicios, citaciones, otras
    Migrado desde emergencias/asistencias en localStorage
    """
    TIPO_ASISTENCIA_CHOICES = [
        ('emergencia', 'Emergencia'),
        ('asamblea', 'Asamblea'),
        ('ejercicio', 'Ejercicio'),
        ('citacion', 'Citación'),
        ('otra', 'Otra'),
    ]

    # Tipo de asistencia
    tipo_asistencia = models.CharField(
        'Tipo de Asistencia',
        max_length=20,
        choices=TIPO_ASISTENCIA_CHOICES
    )

    # Información general
    fecha = models.DateField('Fecha')
    hora_inicio = models.TimeField('Hora de Inicio', null=True, blank=True)
    hora_termino = models.TimeField('Hora de Término', null=True, blank=True)

    # Detalles específicos por tipo
    # Para emergencias
    direccion = models.TextField('Dirección', blank=True)
    tipo_emergencia = models.CharField('Tipo de Emergencia', max_length=200, blank=True)
    clave_radial = models.CharField('Clave Radial', max_length=50, blank=True)

    # Para asambleas, ejercicios, citaciones, otras
    motivo = models.TextField('Motivo/Descripción', blank=True)
    lugar = models.CharField('Lugar', max_length=300, blank=True)

    # Observaciones generales
    observaciones = models.TextField('Observaciones', blank=True)

    # Auditoría
    registrado_por = models.CharField('Registrado Por', max_length=150)
    fecha_registro = models.DateTimeField('Fecha de Registro', auto_now_add=True)
    fecha_actualizacion = models.DateTimeField('Última Actualización', auto_now=True)

    class Meta:
        verbose_name = 'Asistencia'
        verbose_name_plural = 'Asistencias'
        db_table = 'asistencias'
        ordering = ['-fecha', '-hora_inicio']
        indexes = [
            models.Index(fields=['tipo_asistencia', 'fecha']),
            models.Index(fields=['fecha']),
            models.Index(fields=['clave_radial']),
        ]

    def __str__(self):
        if self.tipo_asistencia == 'emergencia':
            return f"{self.get_tipo_asistencia_display()} - {self.tipo_emergencia} ({self.fecha})"
        else:
            return f"{self.get_tipo_asistencia_display()} - {self.fecha}"

    @property
    def es_emergencia(self):
        """Verifica si es una emergencia"""
        return self.tipo_asistencia == 'emergencia'

    @property
    def total_asistentes(self):
        """Retorna el total de asistentes (internos + externos)"""
        return self.detalles.count()

    @property
    def total_internos(self):
        """Retorna el total de voluntarios internos"""
        return self.detalles.filter(es_externo=False).count()

    @property
    def total_externos(self):
        """Retorna el total de voluntarios externos"""
        return self.detalles.filter(es_externo=True).count()

    @property
    def duracion_horas(self):
        """Calcula la duración en horas si tiene hora de inicio y término"""
        if self.hora_inicio and self.hora_termino:
            from datetime import datetime, timedelta
            inicio = datetime.combine(self.fecha, self.hora_inicio)
            termino = datetime.combine(self.fecha, self.hora_termino)

            # Si terminó después de medianoche
            if termino < inicio:
                termino += timedelta(days=1)

            duracion = termino - inicio
            return round(duracion.total_seconds() / 3600, 2)
        return None

    @property
    def resumen_asistentes(self):
        """Retorna un resumen de asistentes por categoría"""
        detalles = self.detalles.filter(es_externo=False)

        comandancia = detalles.filter(categoria_cargo='comandancia').count()
        compania = detalles.filter(categoria_cargo='compania').count()
        confianza = detalles.filter(categoria_cargo='confianza').count()
        voluntarios = detalles.filter(categoria_cargo='voluntario').count()

        return {
            'comandancia': comandancia,
            'compania': compania,
            'confianza': confianza,
            'voluntarios': voluntarios,
            'externos': self.total_externos,
            'total': self.total_asistentes
        }


class DetalleAsistencia(models.Model):
    """
    Modelo para registrar los asistentes a cada asistencia
    Incluye tanto voluntarios internos como externos
    """
    CATEGORIA_CARGO_CHOICES = [
        ('comandancia', 'Oficial de Comandancia'),
        ('compania', 'Oficial de Compañía'),
        ('confianza', 'Cargo de Confianza'),
        ('voluntario', 'Voluntario'),
        ('externo_participante', 'Participante Externo'),
        ('externo_canje', 'Canje Externo'),
    ]

    # Relación
    asistencia = models.ForeignKey(
        Asistencia,
        on_delete=models.CASCADE,
        related_name='detalles',
        verbose_name='Asistencia'
    )

    # Voluntario interno (puede ser null si es externo)
    voluntario = models.ForeignKey(
        Voluntario,
        on_delete=models.CASCADE,
        related_name='asistencias',
        verbose_name='Voluntario',
        null=True,
        blank=True
    )

    # Voluntario externo (puede ser null si es interno)
    voluntario_externo = models.ForeignKey(
        'VoluntarioExterno',
        on_delete=models.CASCADE,
        related_name='asistencias',
        verbose_name='Voluntario Externo',
        null=True,
        blank=True
    )

    # Información denormalizada para historial
    nombre_completo = models.CharField('Nombre Completo', max_length=300)
    clave_bombero = models.CharField('Clave Bombero', max_length=50, blank=True)
    compania = models.CharField('Compañía', max_length=100, blank=True)

    # Categoría del cargo en el momento de la asistencia
    categoria_cargo = models.CharField(
        'Categoría del Cargo',
        max_length=30,
        choices=CATEGORIA_CARGO_CHOICES,
        default='voluntario'
    )
    cargo_especifico = models.CharField('Cargo Específico', max_length=100, blank=True)

    # Tipo de voluntario
    es_externo = models.BooleanField('Es Externo', default=False)
    tipo_externo = models.CharField(
        'Tipo Externo',
        max_length=20,
        blank=True,
        help_text='participante o canje'
    )

    # Observaciones específicas del asistente
    observaciones = models.TextField('Observaciones', blank=True)

    # Auditoría
    fecha_registro = models.DateTimeField('Fecha de Registro', auto_now_add=True)

    class Meta:
        verbose_name = 'Detalle de Asistencia'
        verbose_name_plural = 'Detalles de Asistencias'
        db_table = 'asistencias_detalles'
        ordering = ['nombre_completo']
        unique_together = [['asistencia', 'voluntario'], ['asistencia', 'voluntario_externo']]
        indexes = [
            models.Index(fields=['asistencia', 'es_externo']),
            models.Index(fields=['voluntario', 'asistencia']),
            models.Index(fields=['categoria_cargo']),
        ]

    def __str__(self):
        tipo = "Externo" if self.es_externo else "Interno"
        return f"{self.nombre_completo} ({tipo}) - {self.asistencia}"

    def clean(self):
        from django.core.exceptions import ValidationError

        # Validar que tenga un voluntario (interno o externo) pero no ambos
        if self.voluntario and self.voluntario_externo:
            raise ValidationError(
                'No puede tener tanto voluntario interno como externo'
            )

        if not self.voluntario and not self.voluntario_externo:
            raise ValidationError(
                'Debe tener un voluntario interno o externo'
            )

    @property
    def es_oficial_comandancia(self):
        """Verifica si es oficial de comandancia"""
        return self.categoria_cargo == 'comandancia'

    @property
    def es_oficial_compania(self):
        """Verifica si es oficial de compañía"""
        return self.categoria_cargo == 'compania'

    @property
    def es_cargo_confianza(self):
        """Verifica si tiene cargo de confianza"""
        return self.categoria_cargo == 'confianza'

    @property
    def es_voluntario_regular(self):
        """Verifica si es voluntario sin cargo"""
        return self.categoria_cargo == 'voluntario'


class VoluntarioExterno(models.Model):
    """
    Catálogo de voluntarios externos (participantes y canjes)
    Migrado desde catalogoExternos en localStorage
    """
    TIPO_CHOICES = [
        ('participante', 'Participante'),
        ('canje', 'Canje'),
    ]

    # Identificación
    nombre = models.CharField('Nombre', max_length=300)
    tipo = models.CharField('Tipo', max_length=20, choices=TIPO_CHOICES)
    compania_origen = models.CharField(
        'Compañía de Origen',
        max_length=100,
        blank=True,
        help_text='Solo para canjes'
    )

    # Estadísticas
    total_asistencias = models.PositiveIntegerField('Total Asistencias', default=0)

    # Auditoría
    fecha_registro = models.DateTimeField('Fecha de Registro', auto_now_add=True)
    fecha_actualizacion = models.DateTimeField('Última Actualización', auto_now=True)

    class Meta:
        verbose_name = 'Voluntario Externo'
        verbose_name_plural = 'Voluntarios Externos'
        db_table = 'asistencias_voluntarios_externos'
        ordering = ['nombre']
        indexes = [
            models.Index(fields=['tipo', 'nombre']),
            models.Index(fields=['nombre']),
        ]

    def __str__(self):
        if self.tipo == 'canje' and self.compania_origen:
            return f"{self.nombre} ({self.compania_origen})"
        return self.nombre

    @property
    def es_participante(self):
        """Verifica si es participante"""
        return self.tipo == 'participante'

    @property
    def es_canje(self):
        """Verifica si es canje"""
        return self.tipo == 'canje'

    def actualizar_total_asistencias(self):
        """Actualiza el contador de asistencias"""
        self.total_asistencias = self.asistencias.count()
        self.save(update_fields=['total_asistencias'])


class RankingAsistencia(models.Model):
    """
    Modelo para almacenar el ranking anual de asistencias
    Migrado desde rankingAsistencias en localStorage
    Solo incluye voluntarios internos activos (excluye mártires y externos)
    """
    # Identificación
    anio = models.PositiveIntegerField('Año', validators=[MinValueValidator(2020)])
    voluntario = models.ForeignKey(
        Voluntario,
        on_delete=models.CASCADE,
        related_name='rankings',
        verbose_name='Voluntario'
    )

    # Información denormalizada
    nombre_completo = models.CharField('Nombre Completo', max_length=300)
    clave_bombero = models.CharField('Clave Bombero', max_length=50)

    # Contadores por tipo
    total_asistencias = models.PositiveIntegerField('Total Asistencias', default=0)
    total_emergencias = models.PositiveIntegerField('Emergencias', default=0)
    total_asambleas = models.PositiveIntegerField('Asambleas', default=0)
    total_ejercicios = models.PositiveIntegerField('Ejercicios', default=0)
    total_citaciones = models.PositiveIntegerField('Citaciones', default=0)
    total_otras = models.PositiveIntegerField('Otras', default=0)

    # Ranking
    posicion = models.PositiveIntegerField('Posición en Ranking', null=True, blank=True)

    # Auditoría
    fecha_actualizacion = models.DateTimeField('Última Actualización', auto_now=True)

    class Meta:
        verbose_name = 'Ranking de Asistencias'
        verbose_name_plural = 'Rankings de Asistencias'
        db_table = 'asistencias_ranking'
        ordering = ['-anio', '-total_asistencias', 'nombre_completo']
        unique_together = [['anio', 'voluntario']]
        indexes = [
            models.Index(fields=['anio', '-total_asistencias']),
            models.Index(fields=['voluntario', 'anio']),
        ]

    def __str__(self):
        return f"{self.nombre_completo} - {self.anio} ({self.total_asistencias} asistencias)"

    @property
    def porcentaje_emergencias(self):
        """Calcula el porcentaje de emergencias"""
        if self.total_asistencias > 0:
            return (self.total_emergencias / self.total_asistencias) * 100
        return 0

    @property
    def porcentaje_asambleas(self):
        """Calcula el porcentaje de asambleas"""
        if self.total_asistencias > 0:
            return (self.total_asambleas / self.total_asistencias) * 100
        return 0

    @property
    def porcentaje_ejercicios(self):
        """Calcula el porcentaje de ejercicios"""
        if self.total_asistencias > 0:
            return (self.total_ejercicios / self.total_asistencias) * 100
        return 0

    @property
    def distribucion_asistencias(self):
        """Retorna un diccionario con la distribución de asistencias"""
        return {
            'emergencias': self.total_emergencias,
            'asambleas': self.total_asambleas,
            'ejercicios': self.total_ejercicios,
            'citaciones': self.total_citaciones,
            'otras': self.total_otras,
            'total': self.total_asistencias
        }

    def actualizar_totales(self):
        """Actualiza los totales desde las asistencias registradas"""
        from django.db.models import Count, Q

        # Contar asistencias por tipo para este voluntario en este año
        detalles = DetalleAsistencia.objects.filter(
            voluntario=self.voluntario,
            asistencia__fecha__year=self.anio,
            es_externo=False  # Solo contar asistencias como voluntario interno
        )

        self.total_emergencias = detalles.filter(
            asistencia__tipo_asistencia='emergencia'
        ).count()

        self.total_asambleas = detalles.filter(
            asistencia__tipo_asistencia='asamblea'
        ).count()

        self.total_ejercicios = detalles.filter(
            asistencia__tipo_asistencia='ejercicio'
        ).count()

        self.total_citaciones = detalles.filter(
            asistencia__tipo_asistencia='citacion'
        ).count()

        self.total_otras = detalles.filter(
            asistencia__tipo_asistencia='otra'
        ).count()

        self.total_asistencias = (
            self.total_emergencias +
            self.total_asambleas +
            self.total_ejercicios +
            self.total_citaciones +
            self.total_otras
        )

        self.save()

    @classmethod
    def actualizar_ranking_anio(cls, anio):
        """
        Actualiza el ranking completo para un año específico
        Excluye mártires del ranking
        """
        # Obtener todos los rankings del año ordenados por total
        rankings = cls.objects.filter(anio=anio).order_by('-total_asistencias', 'nombre_completo')

        # Asignar posiciones
        for posicion, ranking in enumerate(rankings, start=1):
            ranking.posicion = posicion
            ranking.save(update_fields=['posicion'])

        return rankings.count()

    @classmethod
    def obtener_o_crear_ranking(cls, voluntario, anio):
        """Obtiene o crea un ranking para un voluntario en un año específico"""
        ranking, created = cls.objects.get_or_create(
            voluntario=voluntario,
            anio=anio,
            defaults={
                'nombre_completo': voluntario.nombre_completo,
                'clave_bombero': voluntario.rut,  # Usar RUT como clave
            }
        )

        if not created:
            # Actualizar información denormalizada
            ranking.nombre_completo = voluntario.nombre_completo
            ranking.clave_bombero = voluntario.rut
            ranking.save()

        return ranking

    @classmethod
    def top_asistentes(cls, anio, limite=10):
        """Retorna el top N de asistentes del año"""
        return cls.objects.filter(anio=anio).order_by('-total_asistencias')[:limite]
