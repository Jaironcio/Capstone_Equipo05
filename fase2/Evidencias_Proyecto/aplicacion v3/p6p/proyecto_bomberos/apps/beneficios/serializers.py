from rest_framework import serializers
from .models import Beneficio, AsignacionBeneficio, PagoBeneficio, VentaExtra


class BeneficioSerializer(serializers.ModelSerializer):
    """Serializer para el modelo Beneficio"""

    # Campos calculados (read-only)
    esta_vencido = serializers.ReadOnlyField()
    total_tarjetas_por_categoria = serializers.ReadOnlyField()
    total_asignaciones = serializers.ReadOnlyField()
    total_esperado = serializers.ReadOnlyField()
    total_recaudado = serializers.ReadOnlyField()
    eficiencia_cobro = serializers.ReadOnlyField()
    total_deudores = serializers.ReadOnlyField()

    # Campos display
    tipo_display = serializers.CharField(
        source='get_tipo_display',
        read_only=True
    )
    estado_display = serializers.CharField(
        source='get_estado_display',
        read_only=True
    )

    class Meta:
        model = Beneficio
        fields = '__all__'
        read_only_fields = ['fecha_creacion', 'fecha_actualizacion']

    def validate(self, data):
        """Validaciones personalizadas"""
        fecha_evento = data.get('fecha_evento')
        fecha_limite = data.get('fecha_limite_rendicion')
        precio_tarjeta = data.get('precio_tarjeta')

        # Validar que la fecha límite sea antes del evento
        if fecha_evento and fecha_limite:
            if fecha_limite > fecha_evento:
                raise serializers.ValidationError(
                    {'fecha_limite_rendicion': 'La fecha límite debe ser antes o el mismo día del evento'}
                )

        # Validar que el precio sea positivo
        if precio_tarjeta and precio_tarjeta <= 0:
            raise serializers.ValidationError(
                {'precio_tarjeta': 'El precio de la tarjeta debe ser mayor a cero'}
            )

        # Validar cantidades de tarjetas
        tarjetas_campos = [
            'tarjetas_voluntarios',
            'tarjetas_honorarios_cia',
            'tarjetas_honorarios_cuerpo',
            'tarjetas_insignes'
        ]

        for campo in tarjetas_campos:
            valor = data.get(campo)
            if valor is not None and valor < 0:
                raise serializers.ValidationError(
                    {campo: f'{campo} no puede ser negativo'}
                )

        return data


class BeneficioListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listados de beneficios"""

    tipo_display = serializers.CharField(
        source='get_tipo_display',
        read_only=True
    )
    estado_display = serializers.CharField(
        source='get_estado_display',
        read_only=True
    )
    esta_vencido = serializers.ReadOnlyField()
    total_esperado = serializers.ReadOnlyField()
    total_recaudado = serializers.ReadOnlyField()
    eficiencia_cobro = serializers.ReadOnlyField()

    class Meta:
        model = Beneficio
        fields = [
            'id', 'nombre', 'tipo', 'tipo_display', 'fecha_evento',
            'fecha_limite_rendicion', 'precio_tarjeta', 'estado',
            'estado_display', 'esta_vencido', 'total_esperado',
            'total_recaudado', 'eficiencia_cobro'
        ]


class AsignacionBeneficioSerializer(serializers.ModelSerializer):
    """Serializer para el modelo AsignacionBeneficio"""

    # Campos calculados (read-only)
    saldo_pendiente = serializers.ReadOnlyField()
    porcentaje_pagado = serializers.ReadOnlyField()
    esta_al_dia = serializers.ReadOnlyField()

    # Información relacionada
    beneficio_nombre = serializers.CharField(
        source='beneficio.nombre',
        read_only=True
    )
    beneficio_estado = serializers.CharField(
        source='beneficio.estado',
        read_only=True
    )
    voluntario_nombre_completo = serializers.CharField(
        source='voluntario.nombre_completo',
        read_only=True
    )

    # Campos display
    categoria_display = serializers.CharField(
        source='get_categoria_display',
        read_only=True
    )
    estado_pago_display = serializers.CharField(
        source='get_estado_pago_display',
        read_only=True
    )

    class Meta:
        model = AsignacionBeneficio
        fields = '__all__'
        read_only_fields = ['fecha_asignacion', 'fecha_actualizacion']

    def validate(self, data):
        """Validaciones personalizadas"""
        tarjetas_asignadas = data.get('tarjetas_asignadas')
        tarjetas_vendidas = data.get('tarjetas_vendidas')
        monto_esperado = data.get('monto_esperado')
        monto_pagado = data.get('monto_pagado')

        # Validar cantidades positivas
        if tarjetas_asignadas is not None and tarjetas_asignadas < 0:
            raise serializers.ValidationError(
                {'tarjetas_asignadas': 'Las tarjetas asignadas no pueden ser negativas'}
            )

        if tarjetas_vendidas is not None and tarjetas_vendidas < 0:
            raise serializers.ValidationError(
                {'tarjetas_vendidas': 'Las tarjetas vendidas no pueden ser negativas'}
            )

        # Validar montos positivos
        if monto_esperado is not None and monto_esperado < 0:
            raise serializers.ValidationError(
                {'monto_esperado': 'El monto esperado no puede ser negativo'}
            )

        if monto_pagado is not None and monto_pagado < 0:
            raise serializers.ValidationError(
                {'monto_pagado': 'El monto pagado no puede ser negativo'}
            )

        # Validar que el monto pagado no supere el esperado (permitir extra por ventas adicionales)
        # Esta validación se eliminó porque puede haber ventas extras

        return data


class AsignacionBeneficioListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listados de asignaciones"""

    beneficio_nombre = serializers.CharField(
        source='beneficio.nombre',
        read_only=True
    )
    estado_pago_display = serializers.CharField(
        source='get_estado_pago_display',
        read_only=True
    )
    saldo_pendiente = serializers.ReadOnlyField()
    porcentaje_pagado = serializers.ReadOnlyField()

    class Meta:
        model = AsignacionBeneficio
        fields = [
            'id', 'beneficio', 'beneficio_nombre', 'nombre_voluntario',
            'clave_bombero', 'categoria', 'tarjetas_asignadas',
            'tarjetas_vendidas', 'monto_esperado', 'monto_pagado',
            'saldo_pendiente', 'porcentaje_pagado', 'estado_pago',
            'estado_pago_display'
        ]


class PagoBeneficioSerializer(serializers.ModelSerializer):
    """Serializer para el modelo PagoBeneficio"""

    # Información relacionada
    beneficio_nombre = serializers.CharField(
        source='beneficio.nombre',
        read_only=True
    )
    voluntario_nombre_completo = serializers.CharField(
        source='voluntario.nombre_completo',
        read_only=True
    )
    asignacion_estado = serializers.CharField(
        source='asignacion.estado_pago',
        read_only=True
    )

    # Campos display
    forma_pago_display = serializers.CharField(
        source='get_forma_pago_display',
        read_only=True
    )

    class Meta:
        model = PagoBeneficio
        fields = '__all__'
        read_only_fields = ['fecha_registro', 'fecha_actualizacion']

    def validate(self, data):
        """Validaciones personalizadas"""
        monto_pagado = data.get('monto_pagado')
        tarjetas_vendidas = data.get('tarjetas_vendidas')
        fecha_pago = data.get('fecha_pago')

        # Validar monto positivo
        if monto_pagado and monto_pagado <= 0:
            raise serializers.ValidationError(
                {'monto_pagado': 'El monto pagado debe ser mayor a cero'}
            )

        # Validar tarjetas vendidas no negativas
        if tarjetas_vendidas is not None and tarjetas_vendidas < 0:
            raise serializers.ValidationError(
                {'tarjetas_vendidas': 'Las tarjetas vendidas no pueden ser negativas'}
            )

        # Validar fecha de pago
        if fecha_pago:
            from datetime import date
            if fecha_pago > date.today():
                raise serializers.ValidationError(
                    {'fecha_pago': 'La fecha de pago no puede ser futura'}
                )

        return data


class PagoBeneficioListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listados de pagos"""

    beneficio_nombre = serializers.CharField(
        source='beneficio.nombre',
        read_only=True
    )
    voluntario_nombre_completo = serializers.CharField(
        source='voluntario.nombre_completo',
        read_only=True
    )
    forma_pago_display = serializers.CharField(
        source='get_forma_pago_display',
        read_only=True
    )

    class Meta:
        model = PagoBeneficio
        fields = [
            'id', 'beneficio', 'beneficio_nombre', 'voluntario_nombre_completo',
            'monto_pagado', 'tarjetas_vendidas', 'fecha_pago',
            'forma_pago', 'forma_pago_display', 'es_venta_extra'
        ]


class VentaExtraSerializer(serializers.ModelSerializer):
    """Serializer para el modelo VentaExtra"""

    # Campos calculados (read-only)
    esta_pagado = serializers.ReadOnlyField()

    # Información relacionada
    beneficio_nombre = serializers.CharField(
        source='beneficio.nombre',
        read_only=True
    )
    voluntario_nombre_completo = serializers.CharField(
        source='voluntario.nombre_completo',
        read_only=True
    )
    asignacion_estado = serializers.CharField(
        source='asignacion.estado_pago',
        read_only=True
    )

    # Campos display
    estado_display = serializers.CharField(
        source='get_estado_display',
        read_only=True
    )

    class Meta:
        model = VentaExtra
        fields = '__all__'
        read_only_fields = ['fecha_registro', 'fecha_actualizacion', 'total']

    def validate(self, data):
        """Validaciones personalizadas"""
        cantidad_tarjetas = data.get('cantidad_tarjetas')
        valor_unitario = data.get('valor_unitario')
        nota = data.get('nota')

        # Validar cantidad de tarjetas
        if cantidad_tarjetas and cantidad_tarjetas < 1:
            raise serializers.ValidationError(
                {'cantidad_tarjetas': 'La cantidad de tarjetas debe ser al menos 1'}
            )

        # Validar valor unitario positivo
        if valor_unitario and valor_unitario <= 0:
            raise serializers.ValidationError(
                {'valor_unitario': 'El valor unitario debe ser mayor a cero'}
            )

        # Validar que tenga nota (obligatorio para auditoría)
        if not nota or not nota.strip():
            raise serializers.ValidationError(
                {'nota': 'Debe proporcionar una nota/justificación para la venta extra (obligatorio para auditoría)'}
            )

        return data


class VentaExtraListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listados de ventas extras"""

    beneficio_nombre = serializers.CharField(
        source='beneficio.nombre',
        read_only=True
    )
    voluntario_nombre_completo = serializers.CharField(
        source='voluntario.nombre_completo',
        read_only=True
    )
    estado_display = serializers.CharField(
        source='get_estado_display',
        read_only=True
    )
    esta_pagado = serializers.ReadOnlyField()

    class Meta:
        model = VentaExtra
        fields = [
            'id', 'beneficio', 'beneficio_nombre', 'voluntario_nombre_completo',
            'cantidad_tarjetas', 'valor_unitario', 'total', 'estado',
            'estado_display', 'esta_pagado', 'fecha_pago', 'fecha_registro'
        ]
