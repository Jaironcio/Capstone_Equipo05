from django.db import models
from django.core.validators import RegexValidator
from datetime import date
from dateutil.relativedelta import relativedelta


class Voluntario(models.Model):
    """
    Modelo de Voluntario (Bombero)
    Migrado desde bomberosData en localStorage
    """

    ESTADO_CHOICES = [
        ('activo', 'Activo'),
        ('renunciado', 'Renunciado'),
        ('separado', 'Separado'),
        ('expulsado', 'Expulsado'),
        ('mártir', 'Mártir'),
        ('fallecido', 'Fallecido'),
    ]

    TIPO_CUOTA_CHOICES = [
        ('Regular', 'Regular'),
        ('Estudiante', 'Estudiante'),
        ('Exento', 'Exento'),
    ]

    # Información básica
    primer_nombre = models.CharField('Primer Nombre', max_length=100)
    segundo_nombre = models.CharField('Segundo Nombre', max_length=100, blank=True)
    tercer_nombre = models.CharField('Tercer Nombre', max_length=100, blank=True)
    primer_apellido = models.CharField('Primer Apellido', max_length=100)
    segundo_apellido = models.CharField('Segundo Apellido', max_length=100, blank=True)

    # RUT con validación
    rut_validator = RegexValidator(
        regex=r'^\d{7,8}-[\dkK]$',
        message='El RUT debe tener el formato: 12345678-9'
    )
    rut = models.CharField(
        'RUT',
        max_length=12,
        unique=True,
        validators=[rut_validator]
    )

    # Fechas importantes
    fecha_nacimiento = models.DateField('Fecha de Nacimiento')
    fecha_ingreso = models.DateField('Fecha de Ingreso')

    # Compañía
    compania = models.CharField('Compañía', max_length=100)

    # Estado
    estado_bombero = models.CharField(
        'Estado',
        max_length=20,
        choices=ESTADO_CHOICES,
        default='activo'
    )
    motivo_estado = models.TextField('Motivo del Estado', blank=True)
    fecha_cambio_estado = models.DateField('Fecha Cambio de Estado', null=True, blank=True)

    # Contacto
    telefono = models.CharField('Teléfono', max_length=20)
    email = models.EmailField('Email', blank=True)
    direccion = models.TextField('Dirección')

    # Información familiar
    primer_nombre_padrino = models.CharField('Primer Nombre Padrino', max_length=100, blank=True)
    primer_apellido_padrino = models.CharField('Primer Apellido Padrino', max_length=100, blank=True)
    primer_nombre_madrina = models.CharField('Primer Nombre Madrina', max_length=100, blank=True)
    primer_apellido_madrina = models.CharField('Primer Apellido Madrina', max_length=100, blank=True)
    primer_nombre_apoderado = models.CharField('Primer Nombre Apoderado', max_length=100, blank=True)
    primer_apellido_apoderado = models.CharField('Primer Apellido Apoderado', max_length=100, blank=True)

    # Foto
    foto = models.ImageField('Foto', upload_to='voluntarios/', blank=True, null=True)

    # Tipo de cuota
    tipo_cuota = models.CharField(
        'Tipo de Cuota',
        max_length=20,
        choices=TIPO_CUOTA_CHOICES,
        default='Regular'
    )

    # Auditoría
    fecha_creacion = models.DateTimeField('Fecha de Creación', auto_now_add=True)
    fecha_actualizacion = models.DateTimeField('Última Actualización', auto_now=True)

    class Meta:
        verbose_name = 'Voluntario'
        verbose_name_plural = 'Voluntarios'
        db_table = 'voluntarios'
        ordering = ['fecha_ingreso']

    def __str__(self):
        return self.nombre_completo

    @property
    def nombre_completo(self):
        """Retorna el nombre completo del voluntario"""
        nombres = [self.primer_nombre, self.segundo_nombre, self.tercer_nombre]
        apellidos = [self.primer_apellido, self.segundo_apellido]
        nombres_str = ' '.join([n for n in nombres if n])
        apellidos_str = ' '.join([a for a in apellidos if a])
        return f"{nombres_str} {apellidos_str}".strip()

    @property
    def edad(self):
        """Calcula la edad actual"""
        if not self.fecha_nacimiento:
            return None
        hoy = date.today()
        edad = hoy.year - self.fecha_nacimiento.year
        if hoy.month < self.fecha_nacimiento.month or \
           (hoy.month == self.fecha_nacimiento.month and hoy.day < self.fecha_nacimiento.day):
            edad -= 1
        return edad

    @property
    def antiguedad_anos(self):
        """Calcula los años de antigüedad"""
        if not self.fecha_ingreso:
            return 0
        hoy = date.today()
        delta = relativedelta(hoy, self.fecha_ingreso)
        return delta.years

    @property
    def antiguedad_detallada(self):
        """Retorna la antigüedad en formato detallado (años, meses, días)"""
        if not self.fecha_ingreso:
            return {'anos': 0, 'meses': 0, 'dias': 0}
        hoy = date.today()
        delta = relativedelta(hoy, self.fecha_ingreso)
        return {
            'anos': delta.years,
            'meses': delta.months,
            'dias': delta.days
        }

    @property
    def categoria_bombero(self):
        """
        Calcula la categoría del bombero según antigüedad:
        - Menos de 20 años: Voluntario
        - 20-24 años: Voluntario Honorario de Compañía
        - 25-49 años: Voluntario Honorario del Cuerpo
        - 50+ años: Voluntario Insigne de Chile
        """
        anos = self.antiguedad_anos
        if anos < 20:
            return 'Voluntario'
        elif 20 <= anos < 25:
            return 'Voluntario Honorario de Compañía'
        elif 25 <= anos < 50:
            return 'Voluntario Honorario del Cuerpo'
        else:
            return 'Voluntario Insigne de Chile'

    def puede_pagar_cuotas(self):
        """Verifica si el voluntario puede pagar cuotas"""
        # Exentos: Honorarios e Insignes
        if self.antiguedad_anos >= 20:
            return False
        # Solo activos pueden pagar cuotas
        return self.estado_bombero == 'activo'

    def puede_recibir_uniformes(self):
        """Verifica si puede recibir uniformes (solo activos)"""
        return self.estado_bombero == 'activo'

    def puede_ser_sancionado(self):
        """Verifica si puede ser sancionado (activos y suspendidos)"""
        return self.estado_bombero in ['activo']

    def puede_registrar_asistencia(self):
        """Verifica si puede registrar asistencias (solo activos)"""
        return self.estado_bombero == 'activo'

    def puede_recibir_cargos_felicitaciones(self):
        """Verifica si puede recibir cargos o felicitaciones"""
        return self.estado_bombero == 'activo'

    def participa_en_ranking(self):
        """Verifica si participa en el ranking de asistencias"""
        return self.estado_bombero == 'activo'

    def puede_reintegrarse(self):
        """Verifica si puede ser reintegrado"""
        return self.estado_bombero in ['renunciado', 'separado']

    def get_badge_estado(self):
        """Retorna una etiqueta con estilo para el estado"""
        badges = {
            'activo': {'text': 'Activo', 'class': 'badge-success'},
            'renunciado': {'text': 'Renunciado', 'class': 'badge-warning'},
            'separado': {'text': 'Separado', 'class': 'badge-danger'},
            'expulsado': {'text': 'Expulsado', 'class': 'badge-dark'},
            'mártir': {'text': 'Mártir', 'class': 'badge-primary'},
            'fallecido': {'text': 'Fallecido', 'class': 'badge-secondary'},
        }
        return badges.get(self.estado_bombero, {'text': self.estado_bombero, 'class': 'badge-light'})
