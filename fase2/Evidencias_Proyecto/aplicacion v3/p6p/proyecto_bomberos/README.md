# Sistema de Gestión de Bomberos - Django

Sistema completo de gestión para compañías de bomberos, migrado desde JavaScript/localStorage a Django con base de datos.

## 📋 Características

- **Gestión de Voluntarios**: CRUD completo con estados, categorías automáticas según antigüedad
- **Asistencias**: Registro de emergencias, asambleas, ejercicios, citaciones
- **Ranking**: Sistema de ranking anual de asistencias
- **Cargos y Felicitaciones**: Gestión temporal de cargos por año o fechas
- **Sanciones**: Amonestaciones, suspensiones, separaciones, expulsiones
- **Finanzas**: Control de ingresos y egresos con categorías
- **Cuotas Sociales**: Sistema de cuotas con ciclos anuales
- **Beneficios**: Gestión de eventos (bingos, rifas) con asignación automática
- **Uniformes**: Control de 11 tipos diferentes de uniformes
- **Sistema de Permisos**: 6 roles con permisos granulares

## 🚀 Instalación

### Requisitos Previos

- Python 3.10+
- pip
- virtualenv (recomendado)
- MySQL o PostgreSQL (o SQLite para desarrollo)

### Paso 1: Clonar y Configurar Entorno

```bash
cd proyecto_bomberos

# Crear entorno virtual
python -m venv venv

# Activar entorno virtual
# En Windows:
venv\Scripts\activate
# En Linux/Mac:
source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt
```

### Paso 2: Configurar Base de Datos

Editar `config/settings.py` y configurar la base de datos:

```python
# Para MySQL
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'bomberos_db',
        'USER': 'tu_usuario',
        'PASSWORD': 'tu_password',
        'HOST': 'localhost',
        'PORT': '3306',
    }
}

# Para SQLite (desarrollo)
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}
```

### Paso 3: Crear Base de Datos y Migraciones

```bash
# Crear migraciones
python manage.py makemigrations

# Aplicar migraciones
python manage.py migrate

# Crear superusuario
python manage.py createsuperuser
```

### Paso 4: Crear Usuarios del Sistema

Entrar a Django shell y crear los usuarios predefinidos:

```bash
python manage.py shell
```

```python
from apps.usuarios.models import Usuario

# Crear usuarios del sistema
usuarios = [
    {'username': 'director', 'password': 'dir2024', 'role': 'Director'},
    {'username': 'secretario', 'password': 'sec2024', 'role': 'Secretario'},
    {'username': 'tesorero', 'password': 'tes2024', 'role': 'Tesorero'},
    {'username': 'capitan', 'password': 'cap2024', 'role': 'Capitán'},
    {'username': 'ayudante', 'password': 'ayu2024', 'role': 'Ayudante'},
    {'username': 'superadmin', 'password': 'admin2024', 'role': 'Super Administrador', 'is_staff': True},
]

for user_data in usuarios:
    if not Usuario.objects.filter(username=user_data['username']).exists():
        Usuario.objects.create_user(**user_data)
        print(f"Usuario {user_data['username']} creado")
```

### Paso 5: Ejecutar Servidor

```bash
python manage.py runserver
```

Acceder a:
- Sistema: http://localhost:8000
- Admin: http://localhost:8000/admin

## 📁 Estructura del Proyecto

```
proyecto_bomberos/
├── config/                     # Configuración del proyecto
│   ├── settings.py            # Configuración principal
│   ├── urls.py                # URLs principales
│   └── wsgi.py
├── apps/
│   ├── usuarios/              # Autenticación y permisos
│   │   ├── models.py          # Usuario con roles
│   │   ├── serializers.py
│   │   └── views.py
│   ├── voluntarios/           # CRUD de bomberos
│   │   ├── models.py          # Modelo Voluntario
│   │   ├── serializers.py
│   │   ├── views.py
│   │   └── utils.py           # Utilidades (validaciones, cálculos)
│   ├── asistencias/           # Sistema de asistencias
│   │   ├── models.py          # Asistencia, DetalleAsistencia, RankingAsistencia
│   │   └── ...
│   ├── cargos/                # Cargos y felicitaciones
│   │   ├── models.py          # Cargo, Felicitacion
│   │   └── ...
│   ├── sanciones/             # Sanciones
│   │   ├── models.py          # Sancion
│   │   └── ...
│   ├── finanzas/              # Gestión financiera
│   │   ├── models.py          # MovimientoFinanciero
│   │   └── ...
│   ├── cuotas/                # Cuotas sociales
│   │   ├── models.py          # PagoCuota, CicloAnual, ConfiguracionCuota
│   │   └── ...
│   ├── beneficios/            # Beneficios/eventos
│   │   ├── models.py          # Beneficio, AsignacionBeneficio, PagoBeneficio
│   │   └── ...
│   ├── uniformes/             # Uniformes
│   │   ├── models.py          # Uniforme
│   │   └── ...
│   └── informes/              # Generación de informes
├── templates/                 # Templates HTML (tus HTML actuales adaptados)
├── static/                    # Archivos estáticos (tus CSS y JS actuales)
│   ├── css/
│   └── js/
├── media/                     # Archivos subidos (fotos, comprobantes)
├── manage.py
├── requirements.txt
└── README.md
```

## 🔐 Sistema de Permisos

### Roles Disponibles

1. **Super Administrador**: Acceso total al sistema
2. **Director**: Acceso casi total (excepto módulos admin)
3. **Secretario**: Gestión de voluntarios, cargos, sanciones
4. **Tesorero**: Finanzas, cuotas, beneficios
5. **Capitán**: Asistencias, suspensiones
6. **Ayudante**: Asistencias, uniformes (solo lectura voluntarios)

### Permisos por Módulo

| Módulo | Super Admin | Director | Secretario | Tesorero | Capitán | Ayudante |
|--------|-------------|----------|------------|----------|---------|----------|
| Voluntarios (editar) | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Cargos | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Sanciones | ✅ | ✅ | ✅ | ❌ | ⚠️ | ❌ |
| Asistencias | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ |
| Finanzas | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Uniformes | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |

⚠️ Capitán solo puede registrar Suspensiones

## 📊 Modelos Principales

### Voluntario

```python
- Información básica: 3 nombres, 2 apellidos
- RUT validado con formato chileno
- Estado: activo, renunciado, separado, expulsado, mártir, fallecido
- Categoría automática según antigüedad:
  * < 20 años: Voluntario
  * 20-24: Voluntario Honorario de Compañía
  * 25-49: Voluntario Honorario del Cuerpo
  * 50+: Voluntario Insigne de Chile
- Propiedades calculadas: edad, antigüedad, categoría
```

### Asistencia

```python
- Tipos: emergencia, asamblea, ejercicio, citación, otra
- Registro de asistentes (internos y externos)
- Cálculo automático de totales
- Integración con ranking anual
```

### Beneficio

```python
- Tipos: Bingo, Rifa, Tarjetón, Gala, Evento, Otro
- Asignación automática de tarjetas por categoría
- Control de pagos (pendiente, parcial, pagado)
- Ventas extra de tarjetas
- Estadísticas de eficiencia y deudores
```

### Sancion

```python
- Tipos: Amonestación, Suspensión, Separación, Expulsión
- Fechas de vigencia (para suspensiones)
- Autoridad sancionatoria
- Validaciones según rol de usuario
```

## 🛠️ API REST

El sistema incluye una API RESTful completa con Django REST Framework.

### Endpoints Principales

```
# Voluntarios
GET    /api/voluntarios/          # Listar voluntarios
POST   /api/voluntarios/          # Crear voluntario
GET    /api/voluntarios/{id}/     # Ver voluntario
PUT    /api/voluntarios/{id}/     # Actualizar voluntario
DELETE /api/voluntarios/{id}/     # Eliminar voluntario

# Asistencias
GET    /api/asistencias/          # Listar asistencias
POST   /api/asistencias/          # Registrar asistencia
GET    /api/asistencias/ranking/  # Ranking anual

# Finanzas
GET    /api/finanzas/             # Movimientos financieros
GET    /api/finanzas/saldo/       # Saldo actual

# Cuotas
GET    /api/cuotas/               # Pagos de cuotas
POST   /api/cuotas/pagar/         # Registrar pago

# Beneficios
GET    /api/beneficios/           # Listar beneficios
POST   /api/beneficios/           # Crear beneficio
GET    /api/beneficios/{id}/asignaciones/  # Ver asignaciones
```

### Autenticación

La API usa autenticación por token:

```bash
# Obtener token
curl -X POST http://localhost:8000/api/auth/login/ \
  -d "username=director&password=dir2024"

# Usar token
curl -H "Authorization: Token {token}" \
  http://localhost:8000/api/voluntarios/
```

## 🔄 Migración desde localStorage

Para migrar datos existentes desde el sistema JavaScript:

### Paso 1: Exportar Datos

En la consola del navegador del sistema actual:

```javascript
// Exportar todos los datos
const storage = new StorageManager();
const datos = {
    voluntarios: storage.getBomberos(),
    cargos: storage.getCargos(),
    sanciones: storage.getSanciones(),
    asistencias: storage.getAsistencias(),
    // ... más datos
};

// Descargar como JSON
const blob = new Blob([JSON.stringify(datos, null, 2)], {type: 'application/json'});
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'datos_bomberos.json';
a.click();
```

### Paso 2: Importar a Django

Crear un script de migración:

```bash
python manage.py shell
```

```python
import json
from apps.voluntarios.models import Voluntario
from apps.cargos.models import Cargo
# ... más imports

# Cargar JSON
with open('datos_bomberos.json', 'r') as f:
    datos = json.load(f)

# Migrar voluntarios
for v in datos['voluntarios']:
    Voluntario.objects.create(
        primer_nombre=v['primerNombre'],
        segundo_nombre=v.get('segundoNombre', ''),
        # ... más campos
    )

print("Migración completada")
```

## 🧪 Testing

```bash
# Ejecutar todos los tests
python manage.py test

# Tests de una app específica
python manage.py test apps.voluntarios

# Con cobertura
pytest --cov=apps
```

## 📱 Próximos Pasos

1. **Actualizar JavaScript** para consumir API Django en lugar de localStorage
2. **Adaptar templates HTML** al sistema de templates de Django
3. **Configurar CORS** para permitir peticiones desde el frontend
4. **Deploy** en servidor de producción

## 🤝 Contribuir

1. Fork el proyecto
2. Crear rama feature (`git checkout -b feature/NuevaCaracteristica`)
3. Commit cambios (`git commit -m 'Agregar nueva característica'`)
4. Push a la rama (`git push origin feature/NuevaCaracteristica`)
5. Abrir Pull Request

## 📝 Licencia

Este proyecto es de uso interno para la compañía de bomberos.

## 👥 Soporte

Para reportar problemas o solicitar características, contactar al equipo de desarrollo.

---

**Generado**: 2025-11-12
**Versión**: 1.0.0
**Framework**: Django 5.2 + Django REST Framework 3.15
