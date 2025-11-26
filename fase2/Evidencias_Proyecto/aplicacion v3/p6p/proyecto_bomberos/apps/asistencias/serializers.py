from rest_framework import serializers
from .models import Asistencia, DetalleAsistencia, VoluntarioExterno, RankingAsistencia


class AsistenciaSerializer(serializers.ModelSerializer):
    """Serializer para el modelo Asistencia"""

    # Campos calculados (read-only)
    es_emergencia = serializers.ReadOnlyField()
    total_asistentes = serializers.ReadOnlyField()
    total_internos = serializers.ReadOnlyField()
    total_externos = serializers.ReadOnlyField()
    duracion_horas = serializers.ReadOnlyField()
    resumen_asistentes = serializers.ReadOnlyField()

    # Campos display
    tipo_asistencia_display = serializers.CharField(
        source='get_tipo_asistencia_display',
        read_only=True
    )

    class Meta:
        model = Asistencia
        fields = '__all__'
        read_only_fields = ['fecha_registro', 'fecha_actualizacion']

    def validate(self, data):
        """Validaciones personalizadas"""
        tipo_asistencia = data.get('tipo_asistencia')
        fecha = data.get('fecha')
        hora_inicio = data.get('hora_inicio')
        hora_termino = data.get('hora_termino')

        # Validar fecha
        if fecha:
            from datetime import date
            if fecha > date.today():
                raise serializers.ValidationError(
                    {'fecha': 'La fecha no puede ser futura'}
                )

        # Validar horas
        if hora_inicio and hora_termino:
            # Las horas pueden ser iguales o terminar después de inicio
            # No validamos aquí porque puede terminar al día siguiente
            pass

        # Validaciones específicas por tipo
        if tipo_asistencia == 'emergencia':
            # Las emergencias deben tener tipo de emergencia
            tipo_emergencia = data.get('tipo_emergencia')
            if not tipo_emergencia or not tipo_emergencia.strip():
                raise serializers.ValidationError(
                    {'tipo_emergencia': 'Las emergencias deben especificar el tipo de emergencia'}
                )

        else:
            # Otros tipos deben tener motivo
            motivo = data.get('motivo')
            if not motivo or not motivo.strip():
                raise serializers.ValidationError(
                    {'motivo': f'Las asistencias de tipo {tipo_asistencia} deben especificar el motivo'}
                )

        return data


class AsistenciaListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listados de asistencias"""

    tipo_asistencia_display = serializers.CharField(
        source='get_tipo_asistencia_display',
        read_only=True
    )
    es_emergencia = serializers.ReadOnlyField()
    total_asistentes = serializers.ReadOnlyField()
    duracion_horas = serializers.ReadOnlyField()

    class Meta:
        model = Asistencia
        fields = [
            'id', 'tipo_asistencia', 'tipo_asistencia_display',
            'fecha', 'hora_inicio', 'hora_termino', 'es_emergencia',
            'tipo_emergencia', 'clave_radial', 'motivo', 'lugar',
            'total_asistentes', 'duracion_horas'
        ]


class DetalleAsistenciaSerializer(serializers.ModelSerializer):
    """Serializer para el modelo DetalleAsistencia"""

    # Campos calculados (read-only)
    es_oficial_comandancia = serializers.ReadOnlyField()
    es_oficial_compania = serializers.ReadOnlyField()
    es_cargo_confianza = serializers.ReadOnlyField()
    es_voluntario_regular = serializers.ReadOnlyField()

    # Información de la asistencia
    asistencia_fecha = serializers.DateField(
        source='asistencia.fecha',
        read_only=True
    )
    asistencia_tipo = serializers.CharField(
        source='asistencia.tipo_asistencia',
        read_only=True
    )

    # Información del voluntario (si es interno)
    voluntario_nombre_completo = serializers.CharField(
        source='voluntario.nombre_completo',
        read_only=True,
        required=False,
        allow_null=True
    )

    # Información del voluntario externo (si es externo)
    voluntario_externo_nombre = serializers.CharField(
        source='voluntario_externo.nombre',
        read_only=True,
        required=False,
        allow_null=True
    )

    # Campos display
    categoria_cargo_display = serializers.CharField(
        source='get_categoria_cargo_display',
        read_only=True
    )

    class Meta:
        model = DetalleAsistencia
        fields = '__all__'
        read_only_fields = ['fecha_registro']

    def validate(self, data):
        """Validaciones personalizadas"""
        voluntario = data.get('voluntario')
        voluntario_externo = data.get('voluntario_externo')
        es_externo = data.get('es_externo', False)

        # Validar que tenga un voluntario (interno o externo) pero no ambos
        if voluntario and voluntario_externo:
            raise serializers.ValidationError(
                'No puede tener tanto voluntario interno como externo'
            )

        if not voluntario and not voluntario_externo:
            raise serializers.ValidationError(
                'Debe tener un voluntario interno o externo'
            )

        # Validar coherencia con el campo es_externo
        if es_externo and voluntario:
            raise serializers.ValidationError(
                {'es_externo': 'Si marca como externo, debe usar voluntario_externo en lugar de voluntario'}
            )

        if not es_externo and voluntario_externo:
            raise serializers.ValidationError(
                {'es_externo': 'Si usa voluntario_externo, debe marcar es_externo como True'}
            )

        # Validar tipo_externo si es externo
        if es_externo:
            tipo_externo = data.get('tipo_externo')
            if not tipo_externo or tipo_externo not in ['participante', 'canje']:
                raise serializers.ValidationError(
                    {'tipo_externo': 'Los externos deben tener tipo_externo: participante o canje'}
                )

        return data


class DetalleAsistenciaListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listados de detalles"""

    asistencia_fecha = serializers.DateField(
        source='asistencia.fecha',
        read_only=True
    )
    asistencia_tipo = serializers.CharField(
        source='asistencia.tipo_asistencia',
        read_only=True
    )
    categoria_cargo_display = serializers.CharField(
        source='get_categoria_cargo_display',
        read_only=True
    )

    class Meta:
        model = DetalleAsistencia
        fields = [
            'id', 'asistencia', 'asistencia_fecha', 'asistencia_tipo',
            'nombre_completo', 'clave_bombero', 'compania',
            'categoria_cargo', 'categoria_cargo_display',
            'cargo_especifico', 'es_externo', 'tipo_externo'
        ]


class VoluntarioExternoSerializer(serializers.ModelSerializer):
    """Serializer para el modelo VoluntarioExterno"""

    # Campos calculados (read-only)
    es_participante = serializers.ReadOnlyField()
    es_canje = serializers.ReadOnlyField()

    # Campos display
    tipo_display = serializers.CharField(
        source='get_tipo_display',
        read_only=True
    )

    class Meta:
        model = VoluntarioExterno
        fields = '__all__'
        read_only_fields = ['fecha_registro', 'fecha_actualizacion', 'total_asistencias']

    def validate(self, data):
        """Validaciones personalizadas"""
        tipo = data.get('tipo')
        compania_origen = data.get('compania_origen')

        # Si es canje, debe tener compañía de origen
        if tipo == 'canje' and (not compania_origen or not compania_origen.strip()):
            raise serializers.ValidationError(
                {'compania_origen': 'Los canjes deben especificar la compañía de origen'}
            )

        return data


class VoluntarioExternoListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listados de voluntarios externos"""

    tipo_display = serializers.CharField(
        source='get_tipo_display',
        read_only=True
    )

    class Meta:
        model = VoluntarioExterno
        fields = [
            'id', 'nombre', 'tipo', 'tipo_display',
            'compania_origen', 'total_asistencias'
        ]


class RankingAsistenciaSerializer(serializers.ModelSerializer):
    """Serializer para el modelo RankingAsistencia"""

    # Campos calculados (read-only)
    porcentaje_emergencias = serializers.ReadOnlyField()
    porcentaje_asambleas = serializers.ReadOnlyField()
    porcentaje_ejercicios = serializers.ReadOnlyField()
    distribucion_asistencias = serializers.ReadOnlyField()

    # Información del voluntario
    voluntario_nombre_completo = serializers.CharField(
        source='voluntario.nombre_completo',
        read_only=True
    )
    voluntario_compania = serializers.CharField(
        source='voluntario.compania',
        read_only=True
    )

    class Meta:
        model = RankingAsistencia
        fields = '__all__'
        read_only_fields = ['fecha_actualizacion']

    def validate_anio(self, value):
        """Valida que el año no sea muy antiguo ni futuro"""
        from datetime import date

        if value < 2020:
            raise serializers.ValidationError('El año debe ser 2020 o posterior')

        if value > date.today().year:
            raise serializers.ValidationError('El año no puede ser futuro')

        return value


class RankingAsistenciaListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listados de rankings"""

    voluntario_nombre_completo = serializers.CharField(
        source='voluntario.nombre_completo',
        read_only=True
    )
    voluntario_compania = serializers.CharField(
        source='voluntario.compania',
        read_only=True
    )
    porcentaje_emergencias = serializers.ReadOnlyField()

    class Meta:
        model = RankingAsistencia
        fields = [
            'id', 'anio', 'posicion', 'voluntario', 'voluntario_nombre_completo',
            'voluntario_compania', 'total_asistencias', 'total_emergencias',
            'total_asambleas', 'total_ejercicios', 'porcentaje_emergencias'
        ]


class EstadisticasAsistenciaSerializer(serializers.Serializer):
    """Serializer para estadísticas generales de asistencias"""

    anio = serializers.IntegerField()
    total_asistencias = serializers.IntegerField()
    total_emergencias = serializers.IntegerField()
    total_asambleas = serializers.IntegerField()
    total_ejercicios = serializers.IntegerField()
    total_citaciones = serializers.IntegerField()
    total_otras = serializers.IntegerField()
    promedio_asistentes_por_evento = serializers.FloatField()
    voluntario_mas_asistencias = serializers.CharField(required=False, allow_null=True)
    total_voluntarios_activos = serializers.IntegerField()
