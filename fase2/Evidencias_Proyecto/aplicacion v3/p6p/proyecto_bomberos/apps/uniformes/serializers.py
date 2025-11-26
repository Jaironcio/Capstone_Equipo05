from rest_framework import serializers
from .models import Uniforme


class UniformeSerializer(serializers.ModelSerializer):
    """Serializer para el modelo Uniforme"""

    # Campos calculados (read-only)
    esta_activo = serializers.ReadOnlyField()
    nombre_tipo_uniforme = serializers.ReadOnlyField()
    piezas_incluidas = serializers.ReadOnlyField()
    resumen_piezas = serializers.ReadOnlyField()

    # Información del voluntario relacionado
    voluntario_nombre = serializers.CharField(
        source='voluntario.nombre_completo',
        read_only=True
    )
    voluntario_rut = serializers.CharField(
        source='voluntario.rut',
        read_only=True
    )
    voluntario_compania = serializers.CharField(
        source='voluntario.compania',
        read_only=True
    )

    # Campos display
    tipo_uniforme_display = serializers.CharField(
        source='get_tipo_uniforme_display',
        read_only=True
    )
    estado_display = serializers.CharField(
        source='get_estado_display',
        read_only=True
    )

    class Meta:
        model = Uniforme
        fields = '__all__'
        read_only_fields = ['fecha_registro', 'fecha_actualizacion']

    def validate(self, data):
        """Validaciones personalizadas"""
        cantidad = data.get('cantidad')
        fecha_entrega = data.get('fecha_entrega')
        fecha_devolucion = data.get('fecha_devolucion')
        estado = data.get('estado')
        tipo_uniforme = data.get('tipo_uniforme')

        # Validar cantidad positiva
        if cantidad and cantidad < 1:
            raise serializers.ValidationError(
                {'cantidad': 'La cantidad debe ser al menos 1'}
            )

        # Validar fecha de entrega
        if fecha_entrega:
            from datetime import date
            if fecha_entrega > date.today():
                raise serializers.ValidationError(
                    {'fecha_entrega': 'La fecha de entrega no puede ser futura'}
                )

        # Validar fecha de devolución
        if fecha_devolucion:
            if not fecha_entrega:
                raise serializers.ValidationError(
                    {'fecha_devolucion': 'Debe especificar primero la fecha de entrega'}
                )
            if fecha_devolucion < fecha_entrega:
                raise serializers.ValidationError(
                    {'fecha_devolucion': 'La fecha de devolución no puede ser anterior a la fecha de entrega'}
                )

        # Si el estado es devuelto, debe tener fecha de devolución
        if estado == 'devuelto' and not fecha_devolucion:
            raise serializers.ValidationError(
                {'estado': 'Los uniformes devueltos deben tener fecha de devolución'}
            )

        # Validar que tenga al menos una talla o campo relacionado según el tipo
        if tipo_uniforme:
            campos_requeridos = self._get_campos_requeridos_por_tipo(tipo_uniforme)
            if campos_requeridos:
                tiene_al_menos_uno = False
                for campo in campos_requeridos:
                    valor = data.get(campo)
                    if valor and (isinstance(valor, bool) or str(valor).strip()):
                        tiene_al_menos_uno = True
                        break

                if not tiene_al_menos_uno:
                    raise serializers.ValidationError(
                        f'Debe especificar al menos una talla o componente para el tipo de uniforme {tipo_uniforme}'
                    )

        return data

    def _get_campos_requeridos_por_tipo(self, tipo_uniforme):
        """Retorna los campos que deberían tener valor según el tipo de uniforme"""
        campos_por_tipo = {
            'estructural': ['talla_chaqueton', 'talla_pantalon', 'talla_casco', 'talla_botas', 'talla_guantes', 'talla_capucha'],
            'forestal': ['talla_chaqueton', 'talla_pantalon', 'talla_casco', 'talla_botas', 'talla_guantes', 'tiene_antiparras'],
            'rescate': ['talla_overol', 'talla_casco', 'talla_botas', 'talla_guantes', 'tiene_arnes', 'cantidad_mosquetones'],
            'hazmat': ['talla_traje_hazmat', 'tiene_botas_quimicas', 'talla_guantes', 'tiene_mascara'],
            'tenida_cuartel': ['talla_camisa', 'talla_pantalon', 'tiene_cinturon', 'talla_zapatos'],
            'accesorios': ['tiene_linterna', 'tiene_silbato', 'tiene_cuchillo', 'tiene_radio'],
            'parada': ['talla_chaqueta_parada', 'talla_pantalon', 'talla_camisa', 'tiene_corbata', 'talla_zapatos'],
            'usar': ['talla_casco_usar', 'talla_botas', 'tiene_guantes_tecnicos', 'tiene_chaleco'],
            'agreste': ['talla_camisa_agreste', 'talla_pantalon', 'talla_botas', 'tiene_gorro'],
            'um6': ['talla_overol_um6', 'talla_casco', 'talla_botas', 'talla_guantes', 'tiene_chaleco_um6'],
            'gersa': ['talla_traje_gersa', 'talla_botas', 'talla_guantes', 'talla_casco'],
        }
        return campos_por_tipo.get(tipo_uniforme, [])


class UniformeListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listados de uniformes"""

    voluntario_nombre = serializers.CharField(
        source='voluntario.nombre_completo',
        read_only=True
    )
    tipo_uniforme_display = serializers.CharField(
        source='get_tipo_uniforme_display',
        read_only=True
    )
    estado_display = serializers.CharField(
        source='get_estado_display',
        read_only=True
    )
    esta_activo = serializers.ReadOnlyField()
    resumen_piezas = serializers.ReadOnlyField()

    class Meta:
        model = Uniforme
        fields = [
            'id', 'voluntario', 'voluntario_nombre', 'tipo_uniforme',
            'tipo_uniforme_display', 'fecha_entrega', 'cantidad',
            'estado', 'estado_display', 'esta_activo', 'resumen_piezas'
        ]


class UniformeBasicSerializer(serializers.ModelSerializer):
    """Serializer básico para relaciones FK"""

    voluntario_nombre = serializers.CharField(
        source='voluntario.nombre_completo',
        read_only=True
    )
    tipo_uniforme_display = serializers.CharField(
        source='get_tipo_uniforme_display',
        read_only=True
    )

    class Meta:
        model = Uniforme
        fields = [
            'id', 'voluntario_nombre', 'tipo_uniforme',
            'tipo_uniforme_display', 'fecha_entrega', 'estado'
        ]


class ResumenUniformesVoluntarioSerializer(serializers.Serializer):
    """Serializer para resumen de uniformes de un voluntario"""

    voluntario_id = serializers.IntegerField()
    voluntario_nombre = serializers.CharField()
    total_uniformes = serializers.IntegerField()
    uniformes_activos = serializers.IntegerField()
    uniformes_devueltos = serializers.IntegerField()
    uniformes_perdidos = serializers.IntegerField()
    uniformes_danados = serializers.IntegerField()
    tipos_uniformes = serializers.ListField(child=serializers.CharField())
