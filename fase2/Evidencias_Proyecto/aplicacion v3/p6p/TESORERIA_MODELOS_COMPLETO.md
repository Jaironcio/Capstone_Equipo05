# 💰 TESORERÍA - MODELOS Y LÓGICA COMPLETA

## 🎨 IMPORTANTE: BASARSE EN PLANTILLA P6P

⚠️ **P6P es una plantilla HTML/CSS/JavaScript pura SIN backend**

**Instrucciones:**
1. Mantener HTML de la plantilla (cuotas-beneficios.html, beneficios.html, etc.)
2. Mantener TODOS los estilos CSS existentes
3. Convertir lógica JavaScript a Python/Django
4. Replicar PDFs con mismo diseño
5. Usuario NO debe notar diferencia visual

**Ver:** `TESORERIA_INSTRUCCIONES_MIGRACION.md` para guía completa

---

## 🆕 COMPONENTES FALTANTES AGREGADOS

### ✅ 1. Configurar Cuotas (Formulario)
### ✅ 2. Saldo de Compañía (Widget)
### ✅ 3. Notificación Deudores (Badge)
### ✅ 4. Activar Estudiante (Botón + Form)
### ✅ 5. Desactivar Cuotas para Honorarios/Insignes

---

## 📊 MODELO NUEVO: EstadoCuotasBombero

```python
class EstadoCuotasBombero(models.Model):
    """
    Control individual de cuotas por voluntario
    - es_estudiante: Cobra precio estudiante
    - cuotas_desactivadas: NO aparece como deudor
    """
    bombero = models.OneToOneField('Bombero', on_delete=models.CASCADE, related_name='estado_cuotas')
    
    # ESTUDIANTE
    es_estudiante = models.BooleanField(default=False)
    fecha_activacion_estudiante = models.DateField(blank=True, null=True)
    observaciones_estudiante = models.TextField(blank=True, null=True)
    
    # DESACTIVACIÓN DE CUOTAS (Honorarios/Insignes)
    cuotas_desactivadas = models.BooleanField(default=False)
    motivo_desactivacion = models.CharField(max_length=200, blank=True, null=True)
    fecha_desactivacion = models.DateTimeField(blank=True, null=True)
    desactivado_por = models.CharField(max_length=100, blank=True, null=True)
    
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    ultima_actualizacion = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Estado de Cuotas'
        verbose_name_plural = 'Estados de Cuotas'
```

---

## ⚙️ LÓGICA ACTUALIZADA

### 1. puede_pagar_cuotas() - ACTUALIZADA

```python
def puede_pagar_cuotas(voluntario):
    """
    PRIORIDADES:
    1. cuotas_desactivadas=True → NO (aunque sea activo)
    2. Estado bloqueado → NO
    3. Honorario/Insigne/Mártir → Exento
    """
    # 1. Verificar desactivación explícita
    try:
        estado = voluntario.estado_cuotas
        if estado.cuotas_desactivadas:
            return {
                'puede': False,
                'mensaje': f'Cuotas desactivadas: {estado.motivo_desactivacion}',
                'tipo': 'desactivado'
            }
    except:
        pass
    
    # 2. Estados bloqueados
    if voluntario.estado_bombero in ['renunciado', 'separado', 'expulsado', 'fallecido']:
        return {
            'puede': False,
            'mensaje': f'Estado {voluntario.estado_bombero}',
            'tipo': 'bloqueado'
        }
    
    # 3. Exenciones automáticas
    categoria = calcular_categoria_bombero(voluntario.fecha_ingreso)
    if categoria in ['Honorario', 'Insigne de 25 Años']:
        return {'puede': False, 'mensaje': f'Exento: {categoria}', 'tipo': 'exento'}
    
    if voluntario.estado_bombero == 'martir':
        return {'puede': False, 'mensaje': 'Exento: Mártir', 'tipo': 'exento'}
    
    return {'puede': True, 'mensaje': '', 'tipo': 'activo'}
```

### 2. Activar Estudiante

```python
@transaction.atomic
def activar_estudiante(bombero_id, datos, usuario):
    from voluntarios.models_tesoreria import EstadoCuotasBombero
    
    voluntario = Bombero.objects.get(id=bombero_id)
    estado, _ = EstadoCuotasBombero.objects.get_or_create(bombero=voluntario)
    
    estado.es_estudiante = True
    estado.fecha_activacion_estudiante = datos.get('fecha_activacion', timezone.now().date())
    estado.observaciones_estudiante = datos.get('observaciones', '')
    estado.save()
    
    return estado
```

### 3. Desactivar Cuotas (Honorarios/Insignes)

```python
@transaction.atomic
def desactivar_cuotas_voluntario(bombero_id, motivo, usuario):
    """
    Desactiva cuotas → NO aparece como deudor en reportes
    """
    from voluntarios.models_tesoreria import EstadoCuotasBombero
    
    voluntario = Bombero.objects.get(id=bombero_id)
    estado, _ = EstadoCuotasBombero.objects.get_or_create(bombero=voluntario)
    
    estado.cuotas_desactivadas = True
    estado.motivo_desactivacion = motivo
    estado.fecha_desactivacion = timezone.now()
    estado.desactivado_por = usuario.username
    estado.save()
    
    return estado

@transaction.atomic
def reactivar_cuotas_voluntario(bombero_id):
    try:
        estado = EstadoCuotasBombero.objects.get(bombero_id=bombero_id)
        estado.cuotas_desactivadas = False
        estado.save()
        return estado
    except:
        return None
```

### 4. Calcular Deudores - ACTUALIZADA

```python
def calcular_deudores_cuotas(anio=None):
    """
    EXCLUYE:
    - Exentos automáticos
    - Estados bloqueados
    - Con cuotas_desactivadas=True ← NUEVO
    """
    deudores = []
    voluntarios = Bombero.objects.filter(estado_bombero__in=['activo', 'inactivo'])
    
    for v in voluntarios:
        validacion = puede_pagar_cuotas(v)
        if not validacion['puede']:
            continue  # Saltar
        
        deuda = calcular_deuda_cuotas(v, anio)
        if deuda['monto'] > 0:
            deudores.append({
                'voluntario': v,
                'monto': deuda['monto'],
                'meses_pendientes': deuda['meses_pendientes']
            })
    
    return deudores
```

### 5. Calcular Saldo Compañía

```python
def calcular_saldo_compania():
    from django.db.models import Sum
    
    ingresos = MovimientoFinanciero.objects.filter(tipo='ingreso').aggregate(Sum('monto'))['monto__sum'] or 0
    egresos = MovimientoFinanciero.objects.filter(tipo='egreso').aggregate(Sum('monto'))['monto__sum'] or 0
    
    return {
        'saldo': ingresos - egresos,
        'ingresos': ingresos,
        'egresos': egresos
    }
```

---

## 🌐 ENDPOINTS NUEVOS

### Configuración de Cuotas
```python
GET    /api/configuracion-cuotas/         → Obtener precios
PUT    /api/configuracion-cuotas/1/       → Actualizar precios
```

### Estados de Cuotas
```python
POST   /api/estado-cuotas/activar-estudiante/{id}/      → Activar estudiante
POST   /api/estado-cuotas/desactivar-estudiante/{id}/   → Desactivar
POST   /api/estado-cuotas/desactivar-cuotas/{id}/       → Desactivar cuotas
POST   /api/estado-cuotas/reactivar-cuotas/{id}/        → Reactivar
```

### Finanzas
```python
GET    /api/finanzas/saldo_compania/      → Saldo + ingresos + egresos
GET    /api/finanzas/deudores/?anio=2024  → Lista deudores (sin desactivados)
```

---

## ✅ RESUMEN DE CAMBIOS

| Componente | Estado |
|------------|--------|
| **ConfiguracionCuotas** | ✅ Ya existía |
| **EstadoCuotasBombero** | 🆕 NUEVO |
| **Activar Estudiante** | 🆕 NUEVO |
| **Desactivar Cuotas** | 🆕 NUEVO |
| **Saldo Compañía** | 🆕 NUEVO |
| **Notificación Deudores** | 🆕 NUEVO |
| **puede_pagar_cuotas()** | ♻️ ACTUALIZADA |
| **calcular_deudores()** | ♻️ ACTUALIZADA |
