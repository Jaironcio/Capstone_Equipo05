from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import Usuario


class UsuarioSerializer(serializers.ModelSerializer):
    """Serializer para el modelo Usuario"""

    # Incluir todos los permisos como campos read-only
    permisos = serializers.SerializerMethodField()

    class Meta:
        model = Usuario
        fields = [
            'id', 'username', 'role', 'is_active', 'date_joined', 'permisos'
        ]
        read_only_fields = ['date_joined']

    def get_permisos(self, obj):
        """Retorna todos los permisos del usuario"""
        return {
            'can_edit': obj.can_edit,
            'can_delete': obj.can_delete,
            'can_create': obj.can_create,
            'can_view_voluntarios': obj.can_view_voluntarios,
            'can_edit_voluntarios': obj.can_edit_voluntarios,
            'can_activate_voluntarios': obj.can_activate_voluntarios,
            'can_view_cargos': obj.can_view_cargos,
            'can_edit_cargos': obj.can_edit_cargos,
            'can_view_sanciones': obj.can_view_sanciones,
            'can_edit_sanciones': obj.can_edit_sanciones,
            'can_only_suspensions': obj.can_only_suspensions,
            'can_view_felicitaciones': obj.can_view_felicitaciones,
            'can_edit_felicitaciones': obj.can_edit_felicitaciones,
            'can_view_asistencia': obj.can_view_asistencia,
            'can_edit_asistencia': obj.can_edit_asistencia,
            'can_view_historial_asistencia': obj.can_view_historial_asistencia,
            'can_view_ranking': obj.can_view_ranking,
            'can_view_finanzas': obj.can_view_finanzas,
            'can_edit_finanzas': obj.can_edit_finanzas,
            'can_view_uniformes': obj.can_view_uniformes,
            'can_edit_uniformes': obj.can_edit_uniformes,
            'can_generate_pdf_ficha': obj.can_generate_pdf_ficha,
            'can_generate_pdf_voluntarios': obj.can_generate_pdf_voluntarios,
            'can_upload_logos': obj.can_upload_logos,
            'can_view_admin_modules': obj.can_view_admin_modules,
        }


class LoginSerializer(serializers.Serializer):
    """Serializer para login"""

    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        username = data.get('username')
        password = data.get('password')

        if username and password:
            user = authenticate(username=username, password=password)

            if not user:
                raise serializers.ValidationError('Credenciales inválidas')

            if not user.is_active:
                raise serializers.ValidationError('Usuario inactivo')

            data['user'] = user
            return data

        raise serializers.ValidationError('Debe incluir username y password')


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer para cambio de contraseña"""

    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True)

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('Contraseña actual incorrecta')
        return value

    def validate_new_password(self, value):
        if len(value) < 6:
            raise serializers.ValidationError('La contraseña debe tener al menos 6 caracteres')
        return value
