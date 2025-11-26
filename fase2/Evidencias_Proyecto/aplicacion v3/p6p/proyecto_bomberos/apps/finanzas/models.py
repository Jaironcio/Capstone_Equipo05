from django.db import models


class MovimientoFinanciero(models.Model):
    """Modelo de Movimientos Financieros (Ingresos y Egresos)"""

    TIPO_CHOICES = [
        ('ingreso', 'Ingreso'),
        ('egreso', 'Egreso'),
    ]

    CATEGORIA_INGRESO_CHOICES = [
        ('Cuotas sociales', 'Cuotas sociales'),
        ('Beneficios', 'Beneficios'),
        ('Donaciones', 'Donaciones'),
        ('Subvenciones', 'Subvenciones'),
        ('Otros ingresos', 'Otros ingresos'),
    ]

    CATEGORIA_EGRESO_CHOICES = [
        ('Mantención equipos', 'Mantención equipos'),
        ('Servicios básicos', 'Servicios básicos'),
        ('Combustible', 'Combustible'),
        ('Capacitación', 'Capacitación'),
        ('Eventos', 'Eventos'),
        ('Otros egresos', 'Otros egresos'),
    ]

    tipo = models.CharField('Tipo', max_length=20, choices=TIPO_CHOICES)
    categoria = models.CharField('Categoría', max_length=100)
    monto = models.DecimalField('Monto', max_digits=12, decimal_places=2)
    descripcion = models.TextField('Descripción')
    fecha = models.DateField('Fecha')
    fecha_creacion = models.DateTimeField('Fecha de Creación', auto_now_add=True)

    class Meta:
        verbose_name = 'Movimiento Financiero'
        verbose_name_plural = 'Movimientos Financieros'
        db_table = 'movimientos_financieros'
        ordering = ['-fecha']

    def __str__(self):
        return f"{self.tipo.upper()} - {self.categoria}: ${self.monto} ({self.fecha})"
