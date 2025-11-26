# 🎯 Próximos Pasos para Completar la Migración a Django

## ✅ Lo que ya está hecho

1. ✅ Estructura completa del proyecto Django
2. ✅ 10 apps configuradas (usuarios, voluntarios, asistencias, cargos, sanciones, finanzas, cuotas, beneficios, uniformes, informes)
3. ✅ 12 modelos de base de datos completos con todas las relaciones
4. ✅ Sistema de autenticación con 6 roles y permisos granulares
5. ✅ Utilidades Python (validaciones, cálculos) migradas desde JS
6. ✅ Configuración de Django REST Framework
7. ✅ Configuración de CORS para API
8. ✅ Archivo requirements.txt con todas las dependencias
9. ✅ Documentación completa (README.md)

## 🚀 Pasos para Poner en Marcha

### 1. Instalar Dependencias e Inicializar DB

```bash
cd proyecto_bomberos

# Crear entorno virtual
python -m venv venv
venv\Scripts\activate  # En Windows

# Instalar dependencias
pip install -r requirements.txt

# Crear base de datos
python manage.py makemigrations
python manage.py migrate

# Crear superusuario
python manage.py createsuperuser
```

### 2. Crear Usuarios del Sistema

```bash
python manage.py shell
```

```python
from apps.usuarios.models import Usuario

usuarios = [
    {'username': 'director', 'password': 'dir2024', 'role': 'Director'},
    {'username': 'secretario', 'password': 'sec2024', 'role': 'Secretario'},
    {'username': 'tesorero', 'password': 'tes2024', 'role': 'Tesorero'},
    {'username': 'capitan', 'password': 'cap2024', 'role': 'Capitán'},
    {'username': 'ayudante', 'password': 'ayu2024', 'role': 'Ayudante'},
]

for user_data in usuarios:
    Usuario.objects.create_user(**user_data)
```

### 3. Ejecutar Servidor

```bash
python manage.py runserver
```

## 📝 Tareas Pendientes

### A. Crear Serializers (ALTA PRIORIDAD)

Crear serializers para cada modelo en cada app. Ejemplo:

**apps/voluntarios/serializers.py:**
```python
from rest_framework import serializers
from .models import Voluntario

class VoluntarioSerializer(serializers.ModelSerializer):
    nombre_completo = serializers.ReadOnlyField()
    edad = serializers.ReadOnlyField()
    antiguedad_anos = serializers.ReadOnlyField()
    categoria_bombero = serializers.ReadOnlyField()

    class Meta:
        model = Voluntario
        fields = '__all__'
        read_only_fields = ['fecha_creacion', 'fecha_actualizacion']
```

**Crear serializers para:**
- [x] Voluntario
- [ ] Cargo, Felicitacion
- [ ] Sancion
- [ ] MovimientoFinanciero
- [ ] PagoCuota, CicloAnual
- [ ] Beneficio, AsignacionBeneficio, PagoBeneficio
- [ ] Uniforme
- [ ] Asistencia, DetalleAsistencia, RankingAsistencia

### B. Crear ViewSets (ALTA PRIORIDAD)

Crear viewsets con lógica de negocio. Ejemplo:

**apps/voluntarios/views.py:**
```python
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Voluntario
from .serializers import VoluntarioSerializer

class VoluntarioViewSet(viewsets.ModelViewSet):
    queryset = Voluntario.objects.all()
    serializer_class = VoluntarioSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        estado = self.request.query_params.get('estado', None)
        if estado:
            queryset = queryset.filter(estado_bombero=estado)
        return queryset

    @action(detail=True, methods=['post'])
    def reintegrar(self, request, pk=None):
        voluntario = self.get_object()
        if not voluntario.puede_reintegrarse():
            return Response(
                {'error': 'El voluntario no puede ser reintegrado'},
                status=status.HTTP_400_BAD_REQUEST
            )
        voluntario.estado_bombero = 'activo'
        voluntario.save()
        return Response({'status': 'Voluntario reintegrado'})
```

**Crear viewsets para todas las apps**

### C. Configurar URLs (ALTA PRIORIDAD)

**config/urls.py:**
```python
from django.contrib import admin
from django.urls import path, include
from rest_framework import routers
from apps.voluntarios.views import VoluntarioViewSet
# ... más imports

router = routers.DefaultRouter()
router.register(r'voluntarios', VoluntarioViewSet)
# ... más registros

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    path('api-auth/', include('rest_framework.urls')),
]
```

### D. Registrar Modelos en Admin (MEDIA PRIORIDAD)

**apps/voluntarios/admin.py:**
```python
from django.contrib import admin
from .models import Voluntario

@admin.register(Voluntario)
class VoluntarioAdmin(admin.ModelAdmin):
    list_display = ['nombre_completo', 'rut', 'compania', 'estado_bombero', 'antiguedad_anos']
    list_filter = ['estado_bombero', 'compania']
    search_fields = ['primer_nombre', 'primer_apellido', 'rut']
    readonly_fields = ['fecha_creacion', 'fecha_actualizacion']
```

**Hacer lo mismo para todos los modelos**

### E. Adaptar Templates HTML (ALTA PRIORIDAD)

Tus HTML actuales están en la raíz. Necesitas:

1. **Moverlos a `templates/`**
2. **Extender de base template**
3. **Usar template tags de Django**

**Crear templates/base.html:**
```html
<!DOCTYPE html>
<html lang="es">
<head>
    {% load static %}
    <meta charset="UTF-8">
    <title>{% block title %}Sistema Bomberos{% endblock %}</title>
    <link rel="stylesheet" href="{% static 'css/global-profesional.css' %}">
    {% block extra_css %}{% endblock %}
</head>
<body>
    {% block content %}{% endblock %}

    <script src="{% static 'js/utils-django.js' %}"></script>
    {% block extra_js %}{% endblock %}
</body>
</html>
```

**Adaptar cada HTML:**
```html
{% extends 'base.html' %}
{% load static %}

{% block title %}Voluntarios{% endblock %}

{% block content %}
    <!-- Tu HTML actual aquí -->
{% endblock %}

{% block extra_js %}
    <script src="{% static 'js/voluntarios-django.js' %}"></script>
{% endblock %}
```

### F. Actualizar JavaScript para Consumir API (ALTA PRIORIDAD)

Cambiar todas las llamadas a `StorageManager` por llamadas a la API Django.

**Ejemplo - ANTES (localStorage):**
```javascript
const storage = new StorageManager();
const bomberos = storage.getBomberos();
```

**DESPUÉS (API Django):**
```javascript
// Crear nuevo archivo: static/js/api.js
class APIClient {
    constructor() {
        this.baseURL = 'http://localhost:8000/api';
        this.token = localStorage.getItem('token');
    }

    async get(endpoint) {
        const response = await fetch(`${this.baseURL}${endpoint}`, {
            headers: {
                'Authorization': `Token ${this.token}`,
                'Content-Type': 'application/json'
            }
        });
        return await response.json();
    }

    async post(endpoint, data) {
        const response = await fetch(`${this.baseURL}${endpoint}`, {
            method: 'POST',
            headers: {
                'Authorization': `Token ${this.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        return await response.json();
    }
}

// Usar en tus scripts
const api = new APIClient();
const bomberos = await api.get('/voluntarios/');
```

**Actualizar TODOS los archivos JS:**
- [ ] js/sistema.js
- [ ] js/crear-bombero.js
- [ ] js/editar-bombero.js
- [ ] js/cargos.js
- [ ] js/sanciones.js
- [ ] js/asistencias.js
- [ ] js/cuotas.js
- [ ] js/beneficios.js
- [ ] js/uniformes.js
- [ ] js/finanzas.js
- [ ] ... todos los demás

### G. Migrar Datos Existentes (MEDIA PRIORIDAD)

Si tienes datos en localStorage que quieres conservar:

1. **Exportar desde navegador:**
```javascript
const storage = new StorageManager();
const datos = {
    voluntarios: storage.getBomberos(),
    cargos: storage.getCargos(),
    sanciones: storage.getSanciones(),
    // ... todo
};
console.log(JSON.stringify(datos));
// Copiar y guardar en archivo datos_export.json
```

2. **Crear script de migración:**
```bash
# Crear: apps/voluntarios/management/commands/importar_datos.py
```

```python
from django.core.management.base import BaseCommand
import json
from apps.voluntarios.models import Voluntario

class Command(BaseCommand):
    help = 'Importa datos desde JSON'

    def handle(self, *args, **options):
        with open('datos_export.json', 'r') as f:
            datos = json.load(f)

        for v in datos['voluntarios']:
            Voluntario.objects.create(
                primer_nombre=v['primerNombre'],
                # ... mapear todos los campos
            )

        self.stdout.write(self.style.SUCCESS('Datos importados'))
```

3. **Ejecutar:**
```bash
python manage.py importar_datos
```

### H. Configurar Archivos Estáticos (MEDIA PRIORIDAD)

```bash
# Copiar tus CSS y JS actuales
cp css/* proyecto_bomberos/static/css/
cp js/* proyecto_bomberos/static/js/

# Colectar estáticos para producción
python manage.py collectstatic
```

### I. Testing (BAJA PRIORIDAD)

Crear tests para cada modelo y vista:

**apps/voluntarios/tests.py:**
```python
from django.test import TestCase
from .models import Voluntario

class VoluntarioTestCase(TestCase):
    def setUp(self):
        Voluntario.objects.create(
            primer_nombre='Juan',
            primer_apellido='Pérez',
            rut='12345678-9',
            # ...
        )

    def test_nombre_completo(self):
        voluntario = Voluntario.objects.get(rut='12345678-9')
        self.assertEqual(voluntario.nombre_completo, 'Juan Pérez')
```

### J. Deploy en Producción (BAJA PRIORIDAD)

1. **Configurar servidor** (Linux con Nginx + Gunicorn)
2. **Configurar variables de entorno**
3. **Configurar base de datos MySQL/PostgreSQL**
4. **Configurar HTTPS**
5. **Configurar backups automáticos**

## 📊 Orden Recomendado de Implementación

### Fase 1: Backend Básico (1-2 semanas)
1. ✅ Crear serializers para todos los modelos
2. ✅ Crear viewsets básicos (CRUD)
3. ✅ Configurar URLs
4. ✅ Registrar en Admin
5. ✅ Probar API con Postman/curl

### Fase 2: Frontend (2-3 semanas)
1. ✅ Crear API client en JavaScript
2. ✅ Actualizar templates HTML
3. ✅ Actualizar JavaScript para consumir API
4. ✅ Probar funcionalidad completa

### Fase 3: Migración de Datos (1 semana)
1. ✅ Exportar datos de localStorage
2. ✅ Crear scripts de importación
3. ✅ Migrar datos
4. ✅ Validar integridad

### Fase 4: Testing y Deploy (1-2 semanas)
1. ✅ Crear tests
2. ✅ Configurar servidor de producción
3. ✅ Deploy
4. ✅ Capacitación a usuarios

## 🎓 Recursos Útiles

- **Django Docs**: https://docs.djangoproject.com/
- **DRF Docs**: https://www.django-rest-framework.org/
- **Tutorial Django**: https://docs.djangoproject.com/en/5.2/intro/tutorial01/
- **Tutorial DRF**: https://www.django-rest-framework.org/tutorial/quickstart/

## ❓ Dudas Frecuentes

**Q: ¿Puedo usar SQLite para producción?**
A: No recomendado. Usa MySQL o PostgreSQL.

**Q: ¿Debo reescribir todo el JavaScript?**
A: No. Solo cambiar las llamadas a localStorage por llamadas fetch() a la API.

**Q: ¿Los HTML actuales funcionarán?**
A: Sí, con mínimas adaptaciones (template tags de Django).

**Q: ¿Cuánto tiempo tomará la migración completa?**
A: Aproximadamente 6-8 semanas de trabajo full-time.

## 🎯 Checklist Final

- [ ] Serializers creados
- [ ] ViewSets creados
- [ ] URLs configuradas
- [ ] Admin configurado
- [ ] Templates adaptados
- [ ] JavaScript actualizado
- [ ] Datos migrados
- [ ] Tests escritos
- [ ] Deployed en producción

---

**¡Éxito en la migración!** 🚀
