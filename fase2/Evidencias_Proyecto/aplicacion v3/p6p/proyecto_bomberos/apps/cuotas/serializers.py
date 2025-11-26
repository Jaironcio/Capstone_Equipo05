from rest_framework import serializers
from .models import PagoCuota, CicloAnual, ConfiguracionCuota


class CicloAnualSerializer(serializers.ModelSerializer):
    """Serializer para el modelo CicloAnual"""

    # Campos calculados (read-only)
    puede_modificarse = serializers.ReadOnlyField()
    total_esperado = serializers.ReadOnlyField()

    # Campos display
    estado_display = serializers.CharField(
        source='get_estado_display',
        read_only=True
    )

    class Meta:
        model = CicloAnual
        fields = '__all__'
        read_only_fields = ['fecha_creacion', 'fecha_actualizacion']

    def validate_anio(self, value):
        """Valida que el año no sea muy antiguo"""
        if value < 2020:
            raise serializers.ValidationError('El año debe ser 2020 o posterior')

        return value

    def validate(self, data):
        """Validaciones personalizadas"""
        estado = data.get('estado')
        bloqueado = data.get('bloqueado')

        # Si está bloqueado, debe estar cerrado
        if bloqueado and estado != 'cerrado':
            raise serializers.ValidationError(
                {'bloqueado': 'Solo se pueden bloquear ciclos cerrados'}
            )

        return data


class CicloAnualListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listados de ciclos"""

    estado_display = serializers.CharField(
        source='get_estado_display',
        read_only=True
    )
    puede_modificarse = serializers.ReadOnlyField()

    class Meta:
        model = CicloAnual
        fields = [
            'id', 'anio', 'estado', 'estado_display',
            'bloqueado', 'puede_modificarse', 'fecha_cierre'
        ]


class PagoCuotaSerializer(serializers.ModelSerializer):
    """Serializer para el modelo PagoCuota"""

    # Campos calculados (read-only)
    nombre_mes = serializers.ReadOnlyField()
    estado_pago = serializers.ReadOnlyField()
    puede_eliminarse = serializers.ReadOnlyField()

    # Información del voluntario relacionado
    voluntario_nombre = serializers.CharField(
        source='voluntario.nombre_completo',
        read_only=True
    )
    voluntario_rut = serializers.CharField(
        source='voluntario.rut',
        read_only=True
    )

    # Campos display
    tipo_cuota_display = serializers.CharField(
        source='get_tipo_cuota_display',
        read_only=True
    )
    mes_display = serializers.CharField(
        source='get_mes_display',
        read_only=True
    )
    forma_pago_display = serializers.CharField(
        source='get_forma_pago_display',
        read_only=True
    )

    # Información del ciclo
    ciclo_estado = serializers.CharField(
        source='ciclo.estado',
        read_only=True,
        required=False
    )

    class Meta:
        model = PagoCuota
        fields = '__all__'
        read_only_fields = ['fecha_registro', 'fecha_actualizacion']

    def validate(self, data):
        """Validaciones personalizadas"""
        mes = data.get('mes')
        anio = data.get('anio')
        monto = data.get('monto')
        voluntario = data.get('voluntario')

        # Validar que el mes esté entre 1 y 12
        if mes and not (1 <= mes <= 12):
            raise serializers.ValidationError(
                {'mes': 'El mes debe estar entre 1 y 12'}
            )

        # Validar que el monto sea positivo
        if monto and monto <= 0:
            raise serializers.ValidationError(
                {'monto': 'El monto debe ser mayor a cero'}
            )

        # Validar que no exista otro pago para el mismo mes/año (excepto en edición)
        if voluntario and mes and anio:
            existing = PagoCuota.objects.filter(
                voluntario=voluntario,
                mes=mes,
                anio=anio
            )

            # Si estamos editando, excluir el registro actual
            if self.instance:
                existing = existing.exclude(pk=self.instance.pk)

            if existing.exists():
                raise serializers.ValidationError(
                    {'mes': f'Ya existe un pago registrado para {data.get("mes_display", mes)}/{anio}'}
                )

        # Validar que el ciclo no esté bloqueado
        ciclo = data.get('ciclo')
        if ciclo and ciclo.bloqueado:
            raise serializers.ValidationError(
                {'ciclo': 'El ciclo está bloqueado y no puede modificarse'}
            )

        # Validar fecha de pago
        fecha_pago = data.get('fecha_pago')
        if fecha_pago:
            from datetime import date
            if fecha_pago > date.today():
                raise serializers.ValidationError(
                    {'fecha_pago': 'La fecha de pago no puede ser futura'}
                )

        return data


class PagoCuotaListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listados de pagos"""

    voluntario_nombre = serializers.CharField(
        source='voluntario.nombre_completo',
        read_only=True
    )
    mes_display = serializers.CharField(
        source='get_mes_display',
        read_only=True
    )
    tipo_cuota_display = serializers.CharField(
        source='get_tipo_cuota_display',
        read_only=True
    )

    class Meta:
        model = PagoCuota
        fields = [
            'id', 'voluntario', 'voluntario_nombre', 'mes',
            'mes_display', 'anio', 'tipo_cuota', 'tipo_cuota_display',
            'monto', 'fecha_pago', 'forma_pago'
        ]


class ConfiguracionCuotaSerializer(serializers.ModelSerializer):
    """Serializer para el modelo ConfiguracionCuota"""

    class Meta:
        model = ConfiguracionCuota
        fields = '__all__'
        read_only_fields = ['fecha_creacion', 'fecha_actualizacion']

    def validate(self, data):
        """Validaciones personalizadas"""
        precio_regular = data.get('precio_regular')
        precio_estudiante = data.get('precio_estudiante')

        # Validar que los precios sean positivos
        if precio_regular and precio_regular <= 0:
            raise serializers.ValidationError(
                {'precio_regular': 'El precio regular debe ser mayor a cero'}
            )

        if precio_estudiante and precio_estudiante <= 0:
            raise serializers.ValidationError(
                {'precio_estudiante': 'El precio de estudiante debe ser mayor a cero'}
            )

        # Validar que el precio de estudiante sea menor que el regular
        if precio_regular and precio_estudiante:
            if precio_estudiante >= precio_regular:
                raise serializers.ValidationError(
                    {'precio_estudiante': 'El precio de estudiante debe ser menor que el precio regular'}
                )

        return data


class ResumenCuotasVoluntarioSerializer(serializers.Serializer):
    """Serializer para resumen de cuotas de un voluntario"""

    voluntario_id = serializers.IntegerField()
    voluntario_nombre = serializers.CharField()
    anio = serializers.IntegerField()
    total_pagado = serializers.DecimalField(max_digits=10, decimal_places=0)
    meses_pagados = serializers.IntegerField()
    meses_pendientes = serializers.IntegerField()
    ultimo_pago = serializers.DateField(required=False, allow_null=True)
    esta_al_dia = serializers.BooleanField()
