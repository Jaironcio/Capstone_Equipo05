from django.db import models
from django.core.validators import MinValueValidator
from django.contrib.auth import get_user_model
from apps.voluntarios.models import Voluntario


User = get_user_model()


class Uniforme(models.Model):
    """
    Modelo para gestionar entrega de uniformes a voluntarios
    Migrado desde uniformesData en localStorage

    Tipos de uniformes soportados:
    - Estructural: Chaquetón, pantalón, casco, botas, guantes, capucha
    - Forestal: Chaquetón, pantalón, casco, botas, guantes, antiparras
    - Rescate: Overol, casco, botas, guantes, arnés, mosquetones
    - HAZMAT: Traje HAZMAT, botas químicas, guantes, máscara
    - Tenida de Cuartel: Camisa, pantalón, cinturón, zapatos
    - Accesorios: Linterna, silbato, cuchillo, radio
    - Parada: Chaqueta de parada, pantalón, camisa, corbata, zapatos
    - USAR: Casco USAR, botas, guantes técnicos, chaleco
    - Agreste: Camisa agreste, pantalón, botas, gorro
    - UM6: Overol UM6, casco, botas, guantes, chaleco
    - GERSA: Traje GERSA, botas, guantes, casco
    """

    TIPO_UNIFORME_CHOICES = [
        ('estructural', 'Estructural'),
        ('forestal', 'Forestal'),
        ('rescate', 'Rescate'),
        ('hazmat', 'HAZMAT'),
        ('tenida_cuartel', 'Tenida de Cuartel'),
        ('accesorios', 'Accesorios'),
        ('parada', 'Parada'),
        ('usar', 'USAR'),
        ('agreste', 'Agreste'),
        ('um6', 'UM6'),
        ('gersa', 'GERSA'),
    ]

    ESTADO_CHOICES = [
        ('entregado', 'Entregado'),
        ('devuelto', 'Devuelto'),
        ('perdido', 'Perdido'),
        ('danado', 'Dañado'),
    ]

    # Relación
    voluntario = models.ForeignKey(
        Voluntario,
        on_delete=models.CASCADE,
        related_name='uniformes',
        verbose_name='Voluntario'
    )

    # Tipo de uniforme
    tipo_uniforme = models.CharField(
        'Tipo de Uniforme',
        max_length=30,
        choices=TIPO_UNIFORME_CHOICES
    )

    # Información de entrega
    fecha_entrega = models.DateField('Fecha de Entrega')
    cantidad = models.PositiveIntegerField(
        'Cantidad',
        default=1,
        validators=[MinValueValidator(1)],
        help_text='Cantidad de piezas entregadas'
    )

    # Tallas (depende del tipo de uniforme)
    talla_chaqueton = models.CharField('Talla Chaquetón', max_length=10, blank=True)
    talla_pantalon = models.CharField('Talla Pantalón', max_length=10, blank=True)
    talla_casco = models.CharField('Talla Casco', max_length=10, blank=True)
    talla_botas = models.CharField('Talla Botas', max_length=10, blank=True)
    talla_guantes = models.CharField('Talla Guantes', max_length=10, blank=True)
    talla_capucha = models.CharField('Talla Capucha', max_length=10, blank=True)

    # Para forestal
    tiene_antiparras = models.BooleanField('Antiparras', default=False)

    # Para rescate
    talla_overol = models.CharField('Talla Overol', max_length=10, blank=True)
    tiene_arnes = models.BooleanField('Arnés', default=False)
    cantidad_mosquetones = models.PositiveIntegerField('Mosquetones', default=0)

    # Para HAZMAT
    talla_traje_hazmat = models.CharField('Talla Traje HAZMAT', max_length=10, blank=True)
    tiene_botas_quimicas = models.BooleanField('Botas Químicas', default=False)
    tiene_mascara = models.BooleanField('Máscara', default=False)

    # Para tenida de cuartel
    talla_camisa = models.CharField('Talla Camisa', max_length=10, blank=True)
    tiene_cinturon = models.BooleanField('Cinturón', default=False)
    talla_zapatos = models.CharField('Talla Zapatos', max_length=10, blank=True)

    # Para accesorios
    tiene_linterna = models.BooleanField('Linterna', default=False)
    tiene_silbato = models.BooleanField('Silbato', default=False)
    tiene_cuchillo = models.BooleanField('Cuchillo', default=False)
    tiene_radio = models.BooleanField('Radio', default=False)

    # Para parada
    talla_chaqueta_parada = models.CharField('Talla Chaqueta Parada', max_length=10, blank=True)
    tiene_corbata = models.BooleanField('Corbata', default=False)

    # Para USAR
    talla_casco_usar = models.CharField('Talla Casco USAR', max_length=10, blank=True)
    tiene_guantes_tecnicos = models.BooleanField('Guantes Técnicos', default=False)
    tiene_chaleco = models.BooleanField('Chaleco', default=False)

    # Para agreste
    talla_camisa_agreste = models.CharField('Talla Camisa Agreste', max_length=10, blank=True)
    tiene_gorro = models.BooleanField('Gorro', default=False)

    # Para UM6
    talla_overol_um6 = models.CharField('Talla Overol UM6', max_length=10, blank=True)
    tiene_chaleco_um6 = models.BooleanField('Chaleco UM6', default=False)

    # Para GERSA
    talla_traje_gersa = models.CharField('Talla Traje GERSA', max_length=10, blank=True)

    # Estado del uniforme
    estado = models.CharField(
        'Estado',
        max_length=20,
        choices=ESTADO_CHOICES,
        default='entregado'
    )
    fecha_devolucion = models.DateField('Fecha de Devolución', null=True, blank=True)

    # Observaciones
    observaciones = models.TextField('Observaciones', blank=True)
    motivo_devolucion = models.TextField('Motivo de Devolución', blank=True)

    # Auditoría
    entregado_por = models.CharField('Entregado Por', max_length=150)
    fecha_registro = models.DateTimeField('Fecha de Registro', auto_now_add=True)
    fecha_actualizacion = models.DateTimeField('Última Actualización', auto_now=True)

    class Meta:
        verbose_name = 'Uniforme'
        verbose_name_plural = 'Uniformes'
        db_table = 'uniformes'
        ordering = ['-fecha_entrega']
        indexes = [
            models.Index(fields=['voluntario', 'tipo_uniforme']),
            models.Index(fields=['tipo_uniforme', 'estado']),
            models.Index(fields=['fecha_entrega']),
        ]

    def __str__(self):
        return f"{self.voluntario.nombre_completo} - {self.get_tipo_uniforme_display()} ({self.fecha_entrega})"

    @property
    def esta_activo(self):
        """Verifica si el uniforme está actualmente en poder del voluntario"""
        return self.estado == 'entregado'

    @property
    def nombre_tipo_uniforme(self):
        """Retorna el nombre legible del tipo de uniforme"""
        return self.get_tipo_uniforme_display()

    @property
    def piezas_incluidas(self):
        """
        Retorna una lista de las piezas incluidas según el tipo de uniforme
        y los campos booleanos activados
        """
        piezas = []

        if self.tipo_uniforme == 'estructural':
            if self.talla_chaqueton:
                piezas.append(f"Chaquetón (talla {self.talla_chaqueton})")
            if self.talla_pantalon:
                piezas.append(f"Pantalón (talla {self.talla_pantalon})")
            if self.talla_casco:
                piezas.append(f"Casco (talla {self.talla_casco})")
            if self.talla_botas:
                piezas.append(f"Botas (talla {self.talla_botas})")
            if self.talla_guantes:
                piezas.append(f"Guantes (talla {self.talla_guantes})")
            if self.talla_capucha:
                piezas.append(f"Capucha (talla {self.talla_capucha})")

        elif self.tipo_uniforme == 'forestal':
            if self.talla_chaqueton:
                piezas.append(f"Chaquetón (talla {self.talla_chaqueton})")
            if self.talla_pantalon:
                piezas.append(f"Pantalón (talla {self.talla_pantalon})")
            if self.talla_casco:
                piezas.append(f"Casco (talla {self.talla_casco})")
            if self.talla_botas:
                piezas.append(f"Botas (talla {self.talla_botas})")
            if self.talla_guantes:
                piezas.append(f"Guantes (talla {self.talla_guantes})")
            if self.tiene_antiparras:
                piezas.append("Antiparras")

        elif self.tipo_uniforme == 'rescate':
            if self.talla_overol:
                piezas.append(f"Overol (talla {self.talla_overol})")
            if self.talla_casco:
                piezas.append(f"Casco (talla {self.talla_casco})")
            if self.talla_botas:
                piezas.append(f"Botas (talla {self.talla_botas})")
            if self.talla_guantes:
                piezas.append(f"Guantes (talla {self.talla_guantes})")
            if self.tiene_arnes:
                piezas.append("Arnés")
            if self.cantidad_mosquetones > 0:
                piezas.append(f"{self.cantidad_mosquetones} mosquetones")

        elif self.tipo_uniforme == 'hazmat':
            if self.talla_traje_hazmat:
                piezas.append(f"Traje HAZMAT (talla {self.talla_traje_hazmat})")
            if self.tiene_botas_quimicas:
                piezas.append("Botas Químicas")
            if self.talla_guantes:
                piezas.append(f"Guantes (talla {self.talla_guantes})")
            if self.tiene_mascara:
                piezas.append("Máscara")

        elif self.tipo_uniforme == 'tenida_cuartel':
            if self.talla_camisa:
                piezas.append(f"Camisa (talla {self.talla_camisa})")
            if self.talla_pantalon:
                piezas.append(f"Pantalón (talla {self.talla_pantalon})")
            if self.tiene_cinturon:
                piezas.append("Cinturón")
            if self.talla_zapatos:
                piezas.append(f"Zapatos (talla {self.talla_zapatos})")

        elif self.tipo_uniforme == 'accesorios':
            if self.tiene_linterna:
                piezas.append("Linterna")
            if self.tiene_silbato:
                piezas.append("Silbato")
            if self.tiene_cuchillo:
                piezas.append("Cuchillo")
            if self.tiene_radio:
                piezas.append("Radio")

        elif self.tipo_uniforme == 'parada':
            if self.talla_chaqueta_parada:
                piezas.append(f"Chaqueta de Parada (talla {self.talla_chaqueta_parada})")
            if self.talla_pantalon:
                piezas.append(f"Pantalón (talla {self.talla_pantalon})")
            if self.talla_camisa:
                piezas.append(f"Camisa (talla {self.talla_camisa})")
            if self.tiene_corbata:
                piezas.append("Corbata")
            if self.talla_zapatos:
                piezas.append(f"Zapatos (talla {self.talla_zapatos})")

        elif self.tipo_uniforme == 'usar':
            if self.talla_casco_usar:
                piezas.append(f"Casco USAR (talla {self.talla_casco_usar})")
            if self.talla_botas:
                piezas.append(f"Botas (talla {self.talla_botas})")
            if self.tiene_guantes_tecnicos:
                piezas.append("Guantes Técnicos")
            if self.tiene_chaleco:
                piezas.append("Chaleco")

        elif self.tipo_uniforme == 'agreste':
            if self.talla_camisa_agreste:
                piezas.append(f"Camisa Agreste (talla {self.talla_camisa_agreste})")
            if self.talla_pantalon:
                piezas.append(f"Pantalón (talla {self.talla_pantalon})")
            if self.talla_botas:
                piezas.append(f"Botas (talla {self.talla_botas})")
            if self.tiene_gorro:
                piezas.append("Gorro")

        elif self.tipo_uniforme == 'um6':
            if self.talla_overol_um6:
                piezas.append(f"Overol UM6 (talla {self.talla_overol_um6})")
            if self.talla_casco:
                piezas.append(f"Casco (talla {self.talla_casco})")
            if self.talla_botas:
                piezas.append(f"Botas (talla {self.talla_botas})")
            if self.talla_guantes:
                piezas.append(f"Guantes (talla {self.talla_guantes})")
            if self.tiene_chaleco_um6:
                piezas.append("Chaleco UM6")

        elif self.tipo_uniforme == 'gersa':
            if self.talla_traje_gersa:
                piezas.append(f"Traje GERSA (talla {self.talla_traje_gersa})")
            if self.talla_botas:
                piezas.append(f"Botas (talla {self.talla_botas})")
            if self.talla_guantes:
                piezas.append(f"Guantes (talla {self.talla_guantes})")
            if self.talla_casco:
                piezas.append(f"Casco (talla {self.talla_casco})")

        return piezas

    @property
    def resumen_piezas(self):
        """Retorna un resumen en texto de las piezas incluidas"""
        piezas = self.piezas_incluidas
        if piezas:
            return ", ".join(piezas)
        return "Sin detalles"

    def marcar_como_devuelto(self, fecha, motivo=''):
        """Marca el uniforme como devuelto"""
        self.estado = 'devuelto'
        self.fecha_devolucion = fecha
        self.motivo_devolucion = motivo
        self.save()

    def marcar_como_perdido(self, motivo=''):
        """Marca el uniforme como perdido"""
        self.estado = 'perdido'
        self.motivo_devolucion = motivo
        self.save()

    def marcar_como_danado(self, motivo=''):
        """Marca el uniforme como dañado"""
        self.estado = 'danado'
        self.motivo_devolucion = motivo
        self.save()

    @classmethod
    def tipos_disponibles(cls):
        """Retorna todos los tipos de uniformes disponibles"""
        return [choice[0] for choice in cls.TIPO_UNIFORME_CHOICES]

    @classmethod
    def uniformes_por_tipo(cls, tipo_uniforme):
        """Retorna todos los uniformes de un tipo específico"""
        return cls.objects.filter(tipo_uniforme=tipo_uniforme)

    @classmethod
    def uniformes_activos_voluntario(cls, voluntario):
        """Retorna todos los uniformes activos de un voluntario"""
        return cls.objects.filter(
            voluntario=voluntario,
            estado='entregado'
        )
