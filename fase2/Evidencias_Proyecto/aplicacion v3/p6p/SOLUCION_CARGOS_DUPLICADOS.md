# 🔧 SOLUCIÓN TEMPORAL: Eliminar Cargos Duplicados

## 📌 Problema
Cuando editas un cargo, se crea uno nuevo en lugar de actualizar el existente, generando duplicados.

---

## 🚨 SOLUCIÓN RÁPIDA (Consola del navegador)

### Paso 1: Abrir consola (F12)

### Paso 2: Ver los cargos actuales
```javascript
let cargos = JSON.parse(localStorage.getItem('cargos') || '[]');
console.table(cargos);
```

### Paso 3: Identificar el ID del cargo duplicado que quieres eliminar
Busca el cargo con fecha de término pasada (ej: 09-11-2025 para Cristian)

### Paso 4: Eliminar el cargo duplicado
```javascript
// Reemplaza "ID_DEL_CARGO" con el ID que quieres eliminar
let cargos = JSON.parse(localStorage.getItem('cargos') || '[]');
cargos = cargos.filter(c => c.id !== ID_DEL_CARGO);  // ⚠️ Cambiar ID_DEL_CARGO
localStorage.setItem('cargos', JSON.stringify(cargos));
location.reload();
```

**Ejemplo:**
```javascript
// Si el ID del cargo duplicado es 123
let cargos = JSON.parse(localStorage.getItem('cargos') || '[]');
cargos = cargos.filter(c => c.id !== 123);
localStorage.setItem('cargos', JSON.stringify(cargos));
location.reload();
```

---

## 🔍 Para Cristian específicamente:

```javascript
// Ver cargos de Cristian (asumiendo bomberoId = 1)
let cargos = JSON.parse(localStorage.getItem('cargos') || '[]');
let cargosCristian = cargos.filter(c => c.bomberoId == 1);
console.table(cargosCristian);

// Eliminar el cargo que termina en 09-11-2025 (el que renunció)
// Busca el ID en la tabla y reemplázalo aquí:
cargos = cargos.filter(c => !(c.bomberoId == 1 && c.fechaFinCargo == '2025-11-09'));
localStorage.setItem('cargos', JSON.stringify(cargos));
location.reload();
```

---

## 📝 SOLUCIÓN PERMANENTE (Ya implementada)

Ya agregué el campo `cargoIdEditando` al formulario. Para verificar que funciona:

1. Edita un cargo
2. Abre consola (F12)
3. Verifica que aparezca: `🔍 cargoIdEditando: [ID_DEL_CARGO]`
4. Si aparece como `undefined` o vacío, hay un problema con el campo oculto

---

## ⚠️ Si el campo cargoIdEditando NO aparece:

Verificar que el HTML tenga:
```html
<input type="hidden" id="cargoIdEditando" name="cargoIdEditando">
```

Y que la función `editarCargo()` lo esté llenando:
```javascript
document.getElementById('cargoIdEditando').value = cargo.id;
```
