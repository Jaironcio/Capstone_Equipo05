from rest_framework import serializers
from .models import Sancion


class SancionSerializer(serializers.ModelSerializer):
    """Serializer para el modelo Sancion"""

    # Campos calculados (read-only)
    esta_vigente = serializers.ReadOnlyField()

    # Información del voluntario relacionado
    voluntario_nombre = serializers.CharField(
        source='voluntario.nombre_completo',
        read_only=True
    )
    voluntario_rut = serializers.CharField(
        source='voluntario.rut',
        read_only=True
    )
    voluntario_estado = serializers.CharField(
        source='voluntario.estado_bombero',
        read_only=True
    )

    class Meta:
        model = Sancion
        fields = '__all__'
        read_only_fields = ['fecha_creacion', 'fecha_actualizacion']

    def validate(self, data):
        """Validaciones personalizadas"""
        tipo = data.get('tipo')
        fecha_inicio = data.get('fecha_inicio')
        fecha_fin = data.get('fecha_fin')

        # Validar que las suspensiones tengan fechas de inicio y fin
        if tipo == 'Suspensión':
            if not fecha_inicio or not fecha_fin:
                raise serializers.ValidationError(
                    {'tipo': 'Las suspensiones deben tener fechas de inicio y fin'}
                )

            if fecha_fin < fecha_inicio:
                raise serializers.ValidationError(
                    {'fecha_fin': 'La fecha de fin no puede ser anterior a la fecha de inicio'}
                )

        # Validar fecha de sanción
        fecha_sancion = data.get('fecha_sancion')
        if fecha_sancion:
            from datetime import date
            if fecha_sancion > date.today():
                raise serializers.ValidationError(
                    {'fecha_sancion': 'La fecha de sanción no puede ser futura'}
                )

        return data


class SancionListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listados de sanciones"""

    voluntario_nombre = serializers.CharField(
        source='voluntario.nombre_completo',
        read_only=True
    )
    voluntario_compania = serializers.CharField(
        source='voluntario.compania',
        read_only=True
    )
    esta_vigente = serializers.ReadOnlyField()

    class Meta:
        model = Sancion
        fields = [
            'id', 'voluntario', 'voluntario_nombre', 'voluntario_compania',
            'tipo', 'motivo', 'fecha_sancion', 'fecha_inicio',
            'fecha_fin', 'esta_vigente', 'autoridad_sancionatoria'
        ]


class SancionBasicSerializer(serializers.ModelSerializer):
    """Serializer básico para relaciones FK"""

    voluntario_nombre = serializers.CharField(
        source='voluntario.nombre_completo',
        read_only=True
    )

    class Meta:
        model = Sancion
        fields = ['id', 'voluntario_nombre', 'tipo', 'fecha_sancion']
