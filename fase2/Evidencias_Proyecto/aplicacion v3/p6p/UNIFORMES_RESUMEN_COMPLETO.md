# 📋 RESUMEN EJECUTIVO - SISTEMA UNIFORMES P6P PARA DJANGO

## 🎯 OBJETIVO
Migrar sistema de uniformes de JavaScript/localStorage a Django manteniendo 100% funcionalidad.

## 🔐 PERMISOS POR ROL
- **Tesorero:** SOLO Accesorios + Tenida Cuartel
- **Director:** SOLO Parada
- **Capitán/Ayudante:** Básicos + USAR/AGRESTE/UM-6/GERSA
- **Secretario:** Básicos + Hazmat
- **Super Admin:** TODOS + Edición total

## 📦 11 TIPOS DE UNIFORMES
ESTR (Naranja), FOR (Verde), RESC (Rojo), HAZ (Amarillo), TCU (Azul), ACC (Morado), PAR (Índigo), USAR (Naranja Oscuro), AGR (Verde Oliva), UM6 (Azul Marítimo), GERSA (Cyan)

## 🗄️ 3 MODELOS
1. **Uniforme:** id (TIPO-NNN), bombero_id, tipo, estado, fechas, observaciones
2. **PiezaUniforme:** componente, marca, serie, talla, condicion, estado_fisico, unidad, par_simple, fechas, devolución, historial_cambios (JSON)
3. **ContadorUniformes:** id_{tipo} por cada tipo

## ⚠️ REGLAS CRÍTICAS
- Mínimo 1 pieza por uniforme
- Estados bloqueados NO reciben: renunciado, separado, expulsado, fallecido
- Componente='otro' → nombre_personalizado obligatorio
- Detección automática: guantes/botas/aletas = Par (unidad=2)
- Campos obligatorios: componente, condicion, estado_fisico, fecha_entrega
- Devolución completa automática si todas piezas devueltas

## 🔄 OPERACIONES
- POST `/api/uniformes/` - Crear con piezas
- GET `/api/uniformes/` - Listar (filtrado por rol)
- POST `/api/uniformes/{id}/devolver_pieza/{pieza_id}/` - Devolver individual
- PATCH `/api/uniformes/{id}/actualizar_pieza/{pieza_id}/` - Actualizar estado/condición
- PUT `/api/uniformes/{id}/` - Editar completo (SOLO Super Admin)
- GET `/api/uniformes/{id}/generar_pdf/` - Generar PDF

## 📄 PDF REPORTLAB
Header (logo + título) → Datos voluntario (recuadro color uniforme) → Barra tipo uniforme → Lista piezas → Observaciones → Declaración → Firmas → Footer

## ✅ CHECKLIST
- [ ] Modelos + Migraciones
- [ ] Contadores independientes por tipo
- [ ] Serializers con validaciones
- [ ] Utilidades: generar_id, detectar_par_simple, puede_recibir
- [ ] Views con filtrado por rol
- [ ] Permission classes
- [ ] Historial cambios en JSON
- [ ] Devolución completa automática
- [ ] PDF con colores por tipo
- [ ] Testing completo

**VER ARCHIVOS DETALLADOS:**
- UNIFORMES_DJANGO_PARTE1_ESTRUCTURA.md
- UNIFORMES_DJANGO_PARTE2_LOGICA.md  
- UNIFORMES_DJANGO_PARTE3_PDF.md
