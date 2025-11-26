from rest_framework import serializers
from .models import MovimientoFinanciero


class MovimientoFinancieroSerializer(serializers.ModelSerializer):
    """Serializer para el modelo MovimientoFinanciero"""

    # Campos adicionales para mostrar nombres legibles
    tipo_display = serializers.CharField(
        source='get_tipo_display',
        read_only=True
    )

    class Meta:
        model = MovimientoFinanciero
        fields = '__all__'
        read_only_fields = ['fecha_creacion']

    def validate(self, data):
        """Validaciones personalizadas"""
        tipo = data.get('tipo')
        categoria = data.get('categoria')
        monto = data.get('monto')

        # Validar que el monto sea positivo
        if monto and monto <= 0:
            raise serializers.ValidationError(
                {'monto': 'El monto debe ser mayor a cero'}
            )

        # Validar que la categoría corresponda al tipo
        if tipo == 'ingreso':
            categorias_validas = [choice[0] for choice in MovimientoFinanciero.CATEGORIA_INGRESO_CHOICES]
            if categoria not in categorias_validas:
                raise serializers.ValidationError(
                    {'categoria': f'Categoría inválida para ingresos. Debe ser una de: {", ".join(categorias_validas)}'}
                )

        elif tipo == 'egreso':
            categorias_validas = [choice[0] for choice in MovimientoFinanciero.CATEGORIA_EGRESO_CHOICES]
            if categoria not in categorias_validas:
                raise serializers.ValidationError(
                    {'categoria': f'Categoría inválida para egresos. Debe ser una de: {", ".join(categorias_validas)}'}
                )

        # Validar fecha
        fecha = data.get('fecha')
        if fecha:
            from datetime import date
            if fecha > date.today():
                raise serializers.ValidationError(
                    {'fecha': 'La fecha no puede ser futura'}
                )

        return data


class MovimientoFinancieroListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listados de movimientos"""

    tipo_display = serializers.CharField(
        source='get_tipo_display',
        read_only=True
    )

    class Meta:
        model = MovimientoFinanciero
        fields = [
            'id', 'tipo', 'tipo_display', 'categoria',
            'monto', 'fecha', 'descripcion'
        ]


class ResumenFinancieroSerializer(serializers.Serializer):
    """Serializer para resumen financiero"""

    total_ingresos = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_egresos = serializers.DecimalField(max_digits=12, decimal_places=2)
    balance = serializers.DecimalField(max_digits=12, decimal_places=2)
    cantidad_ingresos = serializers.IntegerField()
    cantidad_egresos = serializers.IntegerField()
    fecha_desde = serializers.DateField(required=False)
    fecha_hasta = serializers.DateField(required=False)
