from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Count

from .models import Voluntario
from .serializers import (
    VoluntarioSerializer,
    VoluntarioListSerializer,
    VoluntarioBasicSerializer
)


class VoluntarioViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar voluntarios (bomberos)
    """

    queryset = Voluntario.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['estado_bombero', 'compania', 'tipo_cuota']
    search_fields = ['primer_nombre', 'primer_apellido', 'segundo_apellido', 'rut']
    ordering_fields = ['fecha_ingreso', 'primer_apellido']
    ordering = ['fecha_ingreso']

    def get_serializer_class(self):
        if self.action == 'list':
            return VoluntarioListSerializer
        elif self.action == 'basic':
            return VoluntarioBasicSerializer
        return VoluntarioSerializer

    @action(detail=False, methods=['get'])
    def activos(self, request):
        """Retorna solo voluntarios activos"""
        activos = self.queryset.filter(estado_bombero='activo')
        serializer = self.get_serializer(activos, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def basic(self, request):
        """Retorna listado básico para selects"""
        voluntarios = self.queryset.filter(estado_bombero='activo').order_by('primer_apellido')
        serializer = VoluntarioBasicSerializer(voluntarios, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def reintegrar(self, request, pk=None):
        """Reintegra un voluntario"""
        voluntario = self.get_object()

        if not request.user.can_activate_voluntarios:
            return Response(
                {'error': 'No tiene permisos para reintegrar voluntarios'},
                status=status.HTTP_403_FORBIDDEN
            )

        if not voluntario.puede_reintegrarse():
            return Response(
                {'error': f'El voluntario no puede ser reintegrado'},
                status=status.HTTP_400_BAD_REQUEST
            )

        motivo = request.data.get('motivo', '')
        voluntario.estado_bombero = 'activo'
        voluntario.motivo_estado = f'Reintegrado: {motivo}'
        voluntario.save()

        return Response({
            'status': 'success',
            'message': f'{voluntario.nombre_completo} ha sido reintegrado'
        })

    @action(detail=False, methods=['get'])
    def estadisticas(self, request):
        """Retorna estadísticas generales"""
        por_estado = self.queryset.values('estado_bombero').annotate(total=Count('id'))
        por_compania = self.queryset.filter(estado_bombero='activo').values('compania').annotate(total=Count('id'))

        return Response({
            'total': self.queryset.count(),
            'por_estado': list(por_estado),
            'por_compania': list(por_compania),
        })
