from rest_framework import serializers
from .models import Cargo, Felicitacion


class CargoSerializer(serializers.ModelSerializer):
    """Serializer para el modelo Cargo"""

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

    class Meta:
        model = Cargo
        fields = '__all__'
        read_only_fields = ['fecha_creacion', 'fecha_actualizacion']

    def validate(self, data):
        """Validaciones personalizadas"""
        fecha_inicio = data.get('fecha_inicio_cargo')
        fecha_fin = data.get('fecha_fin_cargo')
        ano_cargo = data.get('ano_cargo')

        # Si tiene fechas de inicio y fin, validar que sean coherentes
        if fecha_inicio and fecha_fin:
            if fecha_fin < fecha_inicio:
                raise serializers.ValidationError(
                    {'fecha_fin_cargo': 'La fecha de fin no puede ser anterior a la fecha de inicio'}
                )

        # Al menos debe tener año o fecha de inicio
        if not ano_cargo and not fecha_inicio:
            raise serializers.ValidationError(
                'Debe especificar al menos el año del cargo o la fecha de inicio'
            )

        return data


class CargoListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listados de cargos"""

    voluntario_nombre = serializers.CharField(
        source='voluntario.nombre_completo',
        read_only=True
    )
    esta_vigente = serializers.ReadOnlyField()

    class Meta:
        model = Cargo
        fields = [
            'id', 'voluntario', 'voluntario_nombre', 'cargo',
            'categoria', 'ano_cargo', 'fecha_inicio_cargo',
            'fecha_fin_cargo', 'esta_vigente', 'compania_consejo'
        ]


class FelicitacionSerializer(serializers.ModelSerializer):
    """Serializer para el modelo Felicitacion"""

    # Información del voluntario relacionado
    voluntario_nombre = serializers.CharField(
        source='voluntario.nombre_completo',
        read_only=True
    )
    voluntario_rut = serializers.CharField(
        source='voluntario.rut',
        read_only=True
    )

    class Meta:
        model = Felicitacion
        fields = '__all__'
        read_only_fields = ['fecha_creacion', 'fecha_actualizacion']

    def validate_fecha_felicitacion(self, value):
        """Valida que la fecha de felicitación no sea futura"""
        from datetime import date

        if value > date.today():
            raise serializers.ValidationError(
                'La fecha de felicitación no puede ser futura'
            )

        return value


class FelicitacionListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listados de felicitaciones"""

    voluntario_nombre = serializers.CharField(
        source='voluntario.nombre_completo',
        read_only=True
    )

    class Meta:
        model = Felicitacion
        fields = [
            'id', 'voluntario', 'voluntario_nombre', 'motivo',
            'fecha_felicitacion', 'otorgado_por'
        ]
