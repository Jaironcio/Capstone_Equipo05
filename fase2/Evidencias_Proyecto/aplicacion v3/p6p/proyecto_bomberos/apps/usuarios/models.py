from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models


class UsuarioManager(BaseUserManager):
    """Manager personalizado para el modelo Usuario"""

    def create_user(self, username, password=None, **extra_fields):
        """Crea y guarda un usuario normal"""
        if not username:
            raise ValueError('El usuario debe tener un nombre de usuario')

        user = self.model(username=username, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, username, password=None, **extra_fields):
        """Crea y guarda un superusuario"""
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'Super Administrador')

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser debe tener is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser debe tener is_superuser=True.')

        return self.create_user(username, password, **extra_fields)


class Usuario(AbstractBaseUser, PermissionsMixin):
    """
    Modelo de usuario personalizado basado en el sistema de roles del JS original
    Roles: Super Administrador, Director, Secretario, Tesorero, Capitán, Ayudante
    """

    ROLE_CHOICES = [
        ('Super Administrador', 'Super Administrador'),
        ('Director', 'Director'),
        ('Secretario', 'Secretario'),
        ('Tesorero', 'Tesorero'),
        ('Capitán', 'Capitán'),
        ('Ayudante', 'Ayudante'),
    ]

    username = models.CharField('Nombre de usuario', max_length=150, unique=True)
    role = models.CharField('Rol', max_length=50, choices=ROLE_CHOICES)
    is_active = models.BooleanField('Activo', default=True)
    is_staff = models.BooleanField('Es staff', default=False)
    date_joined = models.DateTimeField('Fecha de registro', auto_now_add=True)

    objects = UsuarioManager()

    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['role']

    class Meta:
        verbose_name = 'Usuario'
        verbose_name_plural = 'Usuarios'
        db_table = 'usuarios'

    def __str__(self):
        return f"{self.username} ({self.role})"

    # Permisos basados en roles (migrado desde auth.js)

    @property
    def can_edit(self):
        """Puede editar registros"""
        return self.role in ['Super Administrador', 'Director', 'Secretario', 'Tesorero', 'Capitán']

    @property
    def can_delete(self):
        """Puede eliminar registros"""
        return self.role in ['Super Administrador', 'Director']

    @property
    def can_create(self):
        """Puede crear registros"""
        return self.role in ['Super Administrador', 'Director', 'Secretario', 'Tesorero', 'Capitán']

    # Permisos de Voluntarios
    @property
    def can_view_voluntarios(self):
        return True

    @property
    def can_edit_voluntarios(self):
        return self.role in ['Super Administrador', 'Director', 'Secretario']

    @property
    def can_activate_voluntarios(self):
        """Puede reintegrar/activar voluntarios"""
        return self.role in ['Super Administrador', 'Director']

    # Permisos de Cargos
    @property
    def can_view_cargos(self):
        return True

    @property
    def can_edit_cargos(self):
        return self.role in ['Super Administrador', 'Director', 'Secretario']

    # Permisos de Sanciones
    @property
    def can_view_sanciones(self):
        return True

    @property
    def can_edit_sanciones(self):
        return self.role in ['Super Administrador', 'Director', 'Secretario', 'Capitán']

    @property
    def can_only_suspensions(self):
        """Solo puede registrar suspensiones (Capitán)"""
        return self.role == 'Capitán'

    # Permisos de Felicitaciones
    @property
    def can_view_felicitaciones(self):
        return True

    @property
    def can_edit_felicitaciones(self):
        return self.role in ['Super Administrador', 'Director', 'Secretario']

    # Permisos de Asistencias
    @property
    def can_view_asistencia(self):
        return True

    @property
    def can_edit_asistencia(self):
        return self.role in ['Super Administrador', 'Director', 'Capitán', 'Ayudante']

    @property
    def can_view_historial_asistencia(self):
        return True

    @property
    def can_view_ranking(self):
        return True

    # Permisos de Finanzas
    @property
    def can_view_finanzas(self):
        return self.role in ['Super Administrador', 'Director', 'Tesorero']

    @property
    def can_edit_finanzas(self):
        return self.role in ['Super Administrador', 'Director', 'Tesorero']

    # Permisos de Uniformes
    @property
    def can_view_uniformes(self):
        return True

    @property
    def can_edit_uniformes(self):
        return self.role in ['Super Administrador', 'Director', 'Ayudante']

    # Permisos de Generación de PDFs
    @property
    def can_generate_pdf_ficha(self):
        """Puede generar PDF de ficha de voluntario"""
        return True

    @property
    def can_generate_pdf_voluntarios(self):
        """Puede generar PDF de listado de voluntarios"""
        return True

    # Permisos de Administración
    @property
    def can_upload_logos(self):
        """Puede subir logos"""
        return self.role in ['Super Administrador', 'Director']

    @property
    def can_view_admin_modules(self):
        """Puede acceder a módulos de administración"""
        return self.role in ['Super Administrador', 'Director']
