from rest_framework import serializers
from .models import Voluntario


class VoluntarioSerializer(serializers.ModelSerializer):
    """Serializer para el modelo Voluntario"""

    # Campos calculados (read-only)
    nombre_completo = serializers.ReadOnlyField()
    edad = serializers.ReadOnlyField()
    antiguedad_anos = serializers.ReadOnlyField()
    antiguedad_detallada = serializers.ReadOnlyField()
    categoria_bombero = serializers.ReadOnlyField()

    class Meta:
        model = Voluntario
        fields = '__all__'
        read_only_fields = ['fecha_creacion', 'fecha_actualizacion']

    def validate_rut(self, value):
        """Valida el formato y dígito verificador del RUT"""
        from .utils import ValidacionesUtils

        if not ValidacionesUtils.validar_run(value):
            raise serializers.ValidationError('RUT inválido')

        return value

    def validate_email(self, value):
        """Valida el formato del email"""
        from .utils import ValidacionesUtils

        if value and not ValidacionesUtils.validar_email(value):
            raise serializers.ValidationError('Email inválido')

        return value

    def validate_telefono(self, value):
        """Valida el formato del teléfono"""
        from .utils import ValidacionesUtils

        if not ValidacionesUtils.validar_telefono(value):
            raise serializers.ValidationError('Teléfono inválido')

        return value


class VoluntarioListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listados"""

    nombre_completo = serializers.ReadOnlyField()
    categoria_bombero = serializers.ReadOnlyField()
    antiguedad_anos = serializers.ReadOnlyField()

    class Meta:
        model = Voluntario
        fields = [
            'id', 'nombre_completo', 'rut', 'compania',
            'estado_bombero', 'categoria_bombero', 'antiguedad_anos',
            'fecha_ingreso', 'telefono', 'email'
        ]


class VoluntarioBasicSerializer(serializers.ModelSerializer):
    """Serializer básico para relaciones FK"""

    nombre_completo = serializers.ReadOnlyField()

    class Meta:
        model = Voluntario
        fields = ['id', 'nombre_completo', 'rut', 'compania']
