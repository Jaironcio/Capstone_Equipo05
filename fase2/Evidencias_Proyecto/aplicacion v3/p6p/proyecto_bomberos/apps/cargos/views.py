from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Count
from datetime import date

from .models import Cargo, Felicitacion
from .serializers import (
    CargoSerializer,
    CargoListSerializer,
    FelicitacionSerializer,
    FelicitacionListSerializer
)


class CargoViewSet(viewsets.ModelViewSet):
    queryset = Cargo.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['voluntario', 'categoria', 'ano_cargo']
    search_fields = ['cargo', 'voluntario__primer_nombre', 'voluntario__primer_apellido']
    ordering_fields = ['fecha_inicio_cargo', 'ano_cargo']
    ordering = ['-ano_cargo', '-fecha_inicio_cargo']

    def get_serializer_class(self):
        if self.action == 'list':
            return CargoListSerializer
        return CargoSerializer

    def create(self, request, *args, **kwargs):
        if not request.user.can_edit_cargos:
            return Response(
                {'error': 'No tiene permisos para crear cargos'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        if not request.user.can_edit_cargos:
            return Response(
                {'error': 'No tiene permisos para editar cargos'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        if not request.user.can_delete:
            return Response(
                {'error': 'No tiene permisos para eliminar cargos'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().destroy(request, *args, **kwargs)

    @action(detail=False, methods=['get'])
    def vigentes(self, request):
        ano_actual = date.today().year
        cargos_vigentes = self.queryset.filter(
            Q(ano_cargo=ano_actual) |
            Q(fecha_inicio_cargo__lte=date.today(), fecha_fin_cargo__gte=date.today()) |
            Q(fecha_inicio_cargo__lte=date.today(), fecha_fin_cargo__isnull=True)
        )
        serializer = self.get_serializer(cargos_vigentes, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def por_voluntario(self, request):
        voluntario_id = request.query_params.get('voluntario_id')
        if not voluntario_id:
            return Response(
                {'error': 'Debe proporcionar voluntario_id'},
                status=status.HTTP_400_BAD_REQUEST
            )

        cargos = self.queryset.filter(voluntario_id=voluntario_id)
        serializer = self.get_serializer(cargos, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def por_ano(self, request):
        ano = request.query_params.get('ano')
        if not ano:
            return Response(
                {'error': 'Debe proporcionar el año'},
                status=status.HTTP_400_BAD_REQUEST
            )

        cargos = self.queryset.filter(ano_cargo=ano)
        serializer = self.get_serializer(cargos, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def por_categoria(self, request):
        categoria = request.query_params.get('categoria')
        if not categoria:
            return Response(
                {'error': 'Debe proporcionar la categoría'},
                status=status.HTTP_400_BAD_REQUEST
            )

        cargos = self.queryset.filter(categoria=categoria)
        serializer = self.get_serializer(cargos, many=True)
        return Response(serializer.data)


class FelicitacionViewSet(viewsets.ModelViewSet):
    queryset = Felicitacion.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['voluntario', 'fecha_felicitacion']
    search_fields = ['motivo', 'voluntario__primer_nombre', 'voluntario__primer_apellido', 'otorgado_por']
    ordering_fields = ['fecha_felicitacion']
    ordering = ['-fecha_felicitacion']

    def get_serializer_class(self):
        if self.action == 'list':
            return FelicitacionListSerializer
        return FelicitacionSerializer

    def create(self, request, *args, **kwargs):
        if not request.user.can_edit_felicitaciones:
            return Response(
                {'error': 'No tiene permisos para crear felicitaciones'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        if not request.user.can_edit_felicitaciones:
            return Response(
                {'error': 'No tiene permisos para editar felicitaciones'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        if not request.user.can_delete:
            return Response(
                {'error': 'No tiene permisos para eliminar felicitaciones'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().destroy(request, *args, **kwargs)

    @action(detail=False, methods=['get'])
    def por_voluntario(self, request):
        voluntario_id = request.query_params.get('voluntario_id')
        if not voluntario_id:
            return Response(
                {'error': 'Debe proporcionar voluntario_id'},
                status=status.HTTP_400_BAD_REQUEST
            )

        felicitaciones = self.queryset.filter(voluntario_id=voluntario_id)
        serializer = self.get_serializer(felicitaciones, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def por_ano(self, request):
        ano = request.query_params.get('ano')
        if not ano:
            return Response(
                {'error': 'Debe proporcionar el año'},
                status=status.HTTP_400_BAD_REQUEST
            )

        felicitaciones = self.queryset.filter(fecha_felicitacion__year=ano)
        serializer = self.get_serializer(felicitaciones, many=True)
        return Response(serializer.data)
