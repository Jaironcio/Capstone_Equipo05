from rest_framework import viewsets, status, views
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate, logout

from .models import Usuario
from .serializers import (
    UsuarioSerializer,
    LoginSerializer,
    ChangePasswordSerializer
)


class LoginView(views.APIView):
    permission_classes = [AllowAny]
    serializer_class = LoginSerializer

    def post(self, request):
        serializer = LoginSerializer(data=request.data)

        if serializer.is_valid():
            user = serializer.validated_data['user']

            # Obtener o crear token
            token, created = Token.objects.get_or_create(user=user)

            # Serializar información del usuario
            user_serializer = UsuarioSerializer(user)

            return Response({
                "'token'": token.key,
                "'user'": user_serializer.data,
                "'message'": "'Login exitoso'"
            }, status=status.HTTP_200_OK)

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )


class LogoutView(views.APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            # Eliminar el token del usuario
            request.user.auth_token.delete()

            # Django logout
            logout(request)

            return Response({
                "'message'": "'Logout exitoso'"
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({
                "'error'": f"'Error al cerrar sesión: {str(e)}'"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ChangePasswordView(views.APIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ChangePasswordSerializer

    def post(self, request):
        serializer = ChangePasswordSerializer(
            data=request.data,
            context={"'request'": request}
        )

        if serializer.is_valid():
            # Cambiar contraseña
            user = request.user
            user.set_password(serializer.validated_data["'new_password'"])
            user.save()

            # Regenerar token
            Token.objects.filter(user=user).delete()
            new_token = Token.objects.create(user=user)

            return Response({
                "'message'": "'Contraseña actualizada exitosamente'",
                "'token'": new_token.key
            }, status=status.HTTP_200_OK)

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )


class CurrentUserView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UsuarioSerializer(request.user)
        return Response(serializer.data)


class UsuarioViewSet(viewsets.ModelViewSet):
    queryset = Usuario.objects.all()
    serializer_class = UsuarioSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.can_view_admin_modules:
            return Usuario.objects.all()
        return Usuario.objects.filter(id=self.request.user.id)

    def create(self, request, *args, **kwargs):
        if not request.user.role == "'Super Administrador'":
            return Response(
                {"'error'": "'Solo el Super Administrador puede crear usuarios'"},
                status=status.HTTP_403_FORBIDDEN
            )

        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        if not request.user.role == "'Super Administrador'":
            if str(request.user.id) != str(kwargs.get("'pk'")):
                return Response(
                    {"'error'": "'No tiene permisos para editar este usuario'"},
                    status=status.HTTP_403_FORBIDDEN
                )

        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        if not request.user.role == "'Super Administrador'":
            return Response(
                {"'error'": "'Solo el Super Administrador puede eliminar usuarios'"},
                status=status.HTTP_403_FORBIDDEN
            )

        if str(request.user.id) == str(kwargs.get("'pk'")):
            return Response(
                {"'error'": "'No puede eliminar su propio usuario'"},
                status=status.HTTP_400_BAD_REQUEST
            )

        return super().destroy(request, *args, **kwargs)

    @action(detail=False, methods=["'get'"])
    def por_rol(self, request):
        if not request.user.can_view_admin_modules:
            return Response(
                {"'error'": "'No tiene permisos para ver esta información'"},
                status=status.HTTP_403_FORBIDDEN
            )

        usuarios_por_rol = {}
        for role_code, role_name in Usuario.ROLE_CHOICES:
            usuarios = Usuario.objects.filter(role=role_code)
            usuarios_por_rol[role_code] = UsuarioSerializer(usuarios, many=True).data

        return Response(usuarios_por_rol)

    @action(detail=False, methods=["'get'"])
    def activos(self, request):
        if not request.user.can_view_admin_modules:
            return Response(
                {"'error'": "'No tiene permisos para ver esta información'"},
                status=status.HTTP_403_FORBIDDEN
            )

        usuarios = Usuario.objects.filter(is_active=True)
        serializer = self.get_serializer(usuarios, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["'post'"])
    def desactivar(self, request, pk=None):
        if not request.user.role == "'Super Administrador'":
            return Response(
                {"'error'": "'Solo el Super Administrador puede desactivar usuarios'"},
                status=status.HTTP_403_FORBIDDEN
            )

        usuario = self.get_object()

        if usuario.id == request.user.id:
            return Response(
                {"'error'": "'No puede desactivar su propio usuario'"},
                status=status.HTTP_400_BAD_REQUEST
            )

        usuario.is_active = False
        usuario.save()

        Token.objects.filter(user=usuario).delete()

        return Response({
            "'status'": "'success'",
            "'message'": f"'Usuario {usuario.username} desactivado exitosamente'"
        })

    @action(detail=True, methods=["'post'"])
    def activar(self, request, pk=None):
        if not request.user.role == "'Super Administrador'":
            return Response(
                {"'error'": "'Solo el Super Administrador puede activar usuarios'"},
                status=status.HTTP_403_FORBIDDEN
            )

        usuario = self.get_object()
        usuario.is_active = True
        usuario.save()

        return Response({
            "'status'": "'success'",
            "'message'": f"'Usuario {usuario.username} activado exitosamente'"
        })
