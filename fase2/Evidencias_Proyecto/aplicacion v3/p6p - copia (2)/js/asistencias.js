// ==================== SISTEMA DE ASISTENCIAS A EMERGENCIAS ====================
class SistemaAsistencias {
    constructor() {
        this.bomberos = [];
        this.cargos = [];
        this.init();
    }

    async init() {
        try {
            // Verificar autenticación
            if (typeof checkAuth !== 'undefined' && !checkAuth()) {
                window.location.href = 'index.html';
                return;
            }

            // Cargar bomberos y cargos
            this.bomberos = storage.getBomberos();
            this.cargos = storage.getCargos();

            console.log('📊 Bomberos cargados:', this.bomberos.length);
            console.log('🎖️ Cargos cargados:', this.cargos.length);

            // Establecer fecha y hora actual
            const hoy = new Date();
            document.getElementById('fechaEmergencia').valueAsDate = hoy;
            
            const horaActual = hoy.toTimeString().slice(0, 5);
            document.getElementById('horaEmergencia').value = horaActual;

            // Renderizar listas de voluntarios
            this.renderizarVoluntarios();

            // Configurar eventos
            this.configurarEventos();

            // Actualizar estadísticas iniciales
            this.actualizarEstadisticas();

            console.log('✅ Sistema de asistencias inicializado correctamente');
        } catch (error) {
            console.error('❌ Error al inicializar sistema de asistencias:', error);
            alert('Error al cargar el sistema. Por favor recargue la página.');
        }
    }

    /**
     * Obtiene el cargo vigente del bombero para el año actual
     * @param {number} bomberoId - ID del bombero
     * @returns {object|null} - Objeto con el cargo o null
     */
    obtenerCargoVigente(bomberoId) {
        try {
            const anioActual = new Date().getFullYear();
            const fechaActual = new Date();
            
            // Filtrar cargos del bombero
            const cargosBombero = this.cargos.filter(c => c.bomberoId == bomberoId);
            
            if (cargosBombero.length === 0) return null;
            
            // Buscar cargo vigente (por año y fechas)
            let cargoVigente = cargosBombero.find(cargo => {
                // Filtrar por año
                if (cargo.añoCargo && cargo.añoCargo != anioActual) return false;
                
                // Si tiene fechas de inicio/fin, validar que esté vigente
                if (cargo.fechaInicioCargo && cargo.fechaFinCargo) {
                    const inicio = new Date(cargo.fechaInicioCargo);
                    const fin = new Date(cargo.fechaFinCargo);
                    return fechaActual >= inicio && fechaActual <= fin;
                }
                
                // Si solo tiene fechaInicio
                if (cargo.fechaInicioCargo) {
                    const inicio = new Date(cargo.fechaInicioCargo);
                    return fechaActual >= inicio;
                }
                
                // Si solo tiene año
                return true;
            });
            
            // Si no encontró por fechas, buscar el más reciente del año actual
            if (!cargoVigente) {
                const cargosAnioActual = cargosBombero.filter(c => 
                    c.añoCargo == anioActual || 
                    (c.fechaInicioCargo && new Date(c.fechaInicioCargo).getFullYear() == anioActual)
                );
                
                if (cargosAnioActual.length > 0) {
                    // Ordenar por fecha de inicio más reciente
                    cargosAnioActual.sort((a, b) => {
                        const fechaA = a.fechaInicioCargo ? new Date(a.fechaInicioCargo) : new Date(a.añoCargo, 0, 1);
                        const fechaB = b.fechaInicioCargo ? new Date(b.fechaInicioCargo) : new Date(b.añoCargo, 0, 1);
                        return fechaB - fechaA;
                    });
                    cargoVigente = cargosAnioActual[0];
                }
            }
            
            return cargoVigente;
        } catch (error) {
            console.error('Error al obtener cargo vigente:', error);
            return null;
        }
    }

    /**
     * Determina si un cargo es de oficialidad de compañía
     * @param {string} tipoCargo - Tipo del cargo
     * @returns {boolean}
     */
    esCargoOficialCompania(tipoCargo) {
        if (!tipoCargo) return false;
        
        const cargosOficialidad = [
            'Capitán',
            'Teniente Primero',
            'Teniente Segundo', 
            'Teniente Tercero',
            'Teniente Cuarto',
            'Director',
            'Tesorero',
            'Secretario',
            'Intendente',
            'Ayudante',
            'Ayudante 1',
            'Ayudante 2',
            'Ayudante 3',
            'Ayudante 4',
            'Jefe de Máquinas',
            'Primer Maquinista',
            'Segundo Maquinista',
            'Tercer Maquinista'
        ];
        
        return cargosOficialidad.includes(tipoCargo);
    }

    /**
     * Determina si un cargo es de comandancia/general
     * @param {string} tipoCargo - Tipo del cargo
     * @returns {boolean}
     */
    esCargoComandancia(tipoCargo) {
        if (!tipoCargo) return false;
        
        const cargosComandancia = [
            'Superintendente',
            'Comandante 1',
            'Comandante 2',
            'Comandante 3',
            'Intendente General',
            'Tesorero General',
            'Secretario General',
            'Ayudante General'
        ];
        
        return cargosComandancia.includes(tipoCargo);
    }

    /**
     * Formatea el cargo para mostrar
     * @param {object} cargo - Objeto del cargo
     * @returns {string} - HTML del cargo formateado
     */
    formatearCargo(cargo) {
        if (!cargo || !cargo.tipoCargo) return '';
        
        // Definir iconos según tipo de cargo
        const iconosCargos = {
            // Comandancia
            'Superintendente': '⭐⭐⭐',
            'Comandante 1': '⭐⭐',
            'Comandante 2': '⭐⭐',
            'Comandante 3': '⭐⭐',
            'Intendente General': '🎖️',
            'Tesorero General': '💰',
            'Secretario General': '📋',
            'Ayudante General': '🎯',
            
            // Compañía
            'Capitán': '👨‍🚒',
            'Teniente Primero': '🔰',
            'Teniente Segundo': '🔰',
            'Teniente Tercero': '🔰',
            'Teniente Cuarto': '🔰',
            'Ayudante': '🎯',
            'Ayudante 1': '🎯',
            'Ayudante 2': '🎯',
            'Ayudante 3': '🎯',
            'Ayudante 4': '🎯',
            'Cabo Primero': '📌',
            'Cabo Segundo': '📌',
            'Cabo': '📌',
            
            // Maquinistas
            'Jefe de Máquinas': '🔧',
            'Primer Maquinista': '⚙️',
            'Segundo Maquinista': '⚙️',
            'Tercer Maquinista': '⚙️',
            
            // Otros cargos administrativos
            'Director': '🎖️',
            'Tesorero': '💰',
            'Intendente': '📊',
            'Secretario': '📝',
            
            'Otro': '🔹'
        };
        
        const icono = iconosCargos[cargo.tipoCargo] || '🎖️';
        const año = cargo.añoCargo || new Date().getFullYear();
        
        return `
            <div class="voluntario-cargo">
                ${icono} ${cargo.tipoCargo} | ${año}
            </div>
        `;
    }

    renderizarVoluntarios() {
        try {
            // Filtrar bomberos activos
            const bomberosActivos = this.bomberos.filter(b => b.estadoBombero !== 'Dado de Baja');

            // Clasificar bomberos según su cargo actual
            const bomberosConCargo = [];
            const bomberosSinCargo = [];
            const martires = [];
            const generales = [];

            bomberosActivos.forEach(bombero => {
                const cargoVigente = this.obtenerCargoVigente(bombero.id);
                
                // Primero verificar si es mártir (prioridad máxima)
                if (bombero.categoriaVoluntario === 'Voluntario Mártir') {
                    martires.push(bombero);
                }
                // Luego verificar si tiene cargo de comandancia
                else if (cargoVigente && this.esCargoComandancia(cargoVigente.tipoCargo)) {
                    generales.push(bombero);
                }
                // Luego verificar si tiene cargo de oficialidad de compañía
                else if (cargoVigente && this.esCargoOficialCompania(cargoVigente.tipoCargo)) {
                    bomberosConCargo.push(bombero);
                }
                // Verificar si es oficial general por categoría
                else if (bombero.categoriaVoluntario === 'Oficial General') {
                    generales.push(bombero);
                }
                // El resto son voluntarios sin cargo
                else {
                    bomberosSinCargo.push(bombero);
                }
            });

            console.log('📊 Clasificación de bomberos:');
            console.log('  - Mártires:', martires.length);
            console.log('  - Generales:', generales.length);
            console.log('  - Oficiales Compañía:', bomberosConCargo.length);
            console.log('  - Voluntarios:', bomberosSinCargo.length);

            // Renderizar cada categoría
            this.renderizarCategoria('listaMartires', martires, 'martir');
            this.renderizarCategoria('listaGenerales', generales, 'general');
            this.renderizarCategoria('listaCompania', bomberosConCargo, 'compania');
            this.renderizarCategoria('listaVoluntarios', bomberosSinCargo, 'voluntario');
        } catch (error) {
            console.error('❌ Error al renderizar voluntarios:', error);
        }
    }
// En el archivo asistencias.js

renderizarCategoria(containerId, bomberos, tipo) {
    const container = document.getElementById(containerId);
    
    if (!container) {
        console.warn(`⚠️ Contenedor ${containerId} no encontrado`);
        return;
    }
    
    if (bomberos.length === 0) {
        container.innerHTML = '<p style="color: #999; text-align: center; padding: 20px;">No hay voluntarios en esta categoría</p>';
        return;
    }

    // Ordenar por nombre (usando la función Utils)
    bomberos.sort((a, b) => Utils.obtenerNombreCompleto(a).localeCompare(Utils.obtenerNombreCompleto(b)));

    container.innerHTML = bomberos.map(bombero => {
        // Obtener cargo vigente
        const cargoVigente = this.obtenerCargoVigente(bombero.id);
        const htmlCargo = this.formatearCargo(cargoVigente);
        const nombreCompleto = Utils.obtenerNombreCompleto(bombero); // CORRECCIÓN
        
        return `
            <div class="voluntario-item" onclick="this.querySelector('input').click()">
                <input 
                    type="checkbox" 
                    id="bombero_${bombero.id}" 
                    data-bombero-id="${bombero.id}"
                    data-tipo="${tipo}"
                    onchange="asistencias.actualizarEstadisticas()"
                    onclick="event.stopPropagation()">
                <div class="voluntario-info">
                    <div class="voluntario-nombre">${nombreCompleto}</div>
                    ${htmlCargo}
                    <div class="voluntario-clave">${bombero.claveBombero}</div>
                </div>
            </div>
        `;
    }).join('');
}

guardarRegistro() {
    try {
        console.log('🔄 Iniciando guardado de registro...');

        // Validar campos requeridos
        const fecha = document.getElementById('fechaEmergencia').value;
        const hora = document.getElementById('horaEmergencia').value;
        const direccion = document.getElementById('direccionEmergencia').value;

        console.log('📋 Datos del formulario:', { fecha, hora, direccion });

        if (!fecha || !hora || !direccion) {
            this.mostrarNotificacion('Por favor complete todos los campos obligatorios', 'error');
            return;
        }

        // Obtener asistentes
        const checkboxes = document.querySelectorAll('input[type="checkbox"]:checked');
        
        console.log('👥 Checkboxes marcados:', checkboxes.length);

        if (checkboxes.length === 0) {
            this.mostrarNotificacion('Debe seleccionar al menos un asistente', 'error');
            return;
        }

        const asistentes = Array.from(checkboxes).map(cb => {
            const bomberoId = cb.dataset.bomberoId;
            const bombero = this.bomberos.find(b => b.id == bomberoId);
            
            if (!bombero) {
                console.warn('⚠️ Bombero no encontrado:', bomberoId);
                return null;
            }
            
            // Obtener cargo vigente del bombero
            const cargoVigente = this.obtenerCargoVigente(bomberoId);
            
            return {
                bomberoId: bomberoId,
                nombre: Utils.obtenerNombreCompleto(bombero), // CORRECCIÓN CLAVE
                claveBombero: bombero.claveBombero,
                categoria: bombero.categoriaVoluntario,
                cargo: cargoVigente ? cargoVigente.tipoCargo : null,
                añoCargo: cargoVigente ? cargoVigente.añoCargo : null
            };
        }).filter(a => a !== null);

        console.log('✅ Asistentes procesados:', asistentes.length);

        // Crear registro de asistencia
        const registro = {
            id: Date.now(),
            fecha: fecha,
            hora: hora,
            claveEmergencia: document.getElementById('claveEmergencia').value || 'N/A',
            direccion: direccion,
            observaciones: document.getElementById('observaciones').value || '',
            asistentes: asistentes,
            totalAsistentes: asistentes.length,
            totalPersonas: this.bomberos.filter(b => b.estadoBombero !== 'Dado de Baja').length,
            porcentajeAsistencia: Math.round((asistentes.length / this.bomberos.filter(b => b.estadoBombero !== 'Dado de Baja').length) * 100),
            registradoPor: this.obtenerUsuarioActual(),
            fechaRegistro: new Date().toISOString()
        };

        console.log('📦 Registro creado:', registro);

        // Guardar en localStorage
        this.guardarEnStorage(registro);

        console.log('💾 Registro guardado en localStorage');

        this.mostrarNotificacion('✅ Registro de asistencia guardado exitosamente', 'success');

        // Preguntar si desea agregar otra asistencia
        setTimeout(() => {
            if (confirm('¿Desea registrar otra emergencia?')) {
                this.limpiarFormulario();
            } else {
                // Verificar si existe la página de historial
                if (document.querySelector('a[href*="historial"]')) {
                    window.location.href = 'historial-asistencias.html';
                } else {
                    this.limpiarFormulario();
                    this.mostrarNotificacion('Registro guardado. Puede ver el historial en el menú principal.', 'info');
                }
            }
        }, 1000);

    } catch (error) {
        console.error('❌ ERROR al guardar registro:', error);
        alert('Error al guardar el registro: ' + error.message);
    }
}

    configurarEventos() {
        // Evento para actualizar estadísticas en tiempo real
        document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', () => this.actualizarEstadisticas());
        });
    }

    actualizarEstadisticas() {
        try {
            const totalPersonas = this.bomberos.filter(b => b.estadoBombero !== 'Dado de Baja').length;
            const asistentes = document.querySelectorAll('input[type="checkbox"]:checked').length;
            const porcentaje = totalPersonas > 0 ? Math.round((asistentes / totalPersonas) * 100) : 0;

            document.getElementById('totalPersonas').textContent = totalPersonas;
            document.getElementById('totalAsistentes').textContent = asistentes;
            document.getElementById('porcentajeAsistencia').textContent = porcentaje + '%';
        } catch (error) {
            console.error('Error al actualizar estadísticas:', error);
        }
    }

    seleccionarTodos(tipo) {
        const checkboxes = document.querySelectorAll(`input[data-tipo="${tipo}"]`);
        checkboxes.forEach(checkbox => checkbox.checked = true);
        this.actualizarEstadisticas();
    }

    deseleccionarTodos(tipo) {
        const checkboxes = document.querySelectorAll(`input[data-tipo="${tipo}"]`);
        checkboxes.forEach(checkbox => checkbox.checked = false);
        this.actualizarEstadisticas();
    }

    mostrarNotificacion(mensaje, tipo) {
        // Intentar usar Utils si existe
        if (typeof Utils !== 'undefined' && Utils.mostrarNotificacion) {
            Utils.mostrarNotificacion(mensaje, tipo);
        } else {
            // Fallback a alert
            alert(mensaje);
        }
        console.log(`📢 ${tipo.toUpperCase()}: ${mensaje}`);
    }

    obtenerUsuarioActual() {
        // Intentar obtener usuario de diferentes formas
        if (typeof getCurrentUser === 'function') {
            try {
                const user = getCurrentUser();
                return user ? user.username : 'Sistema';
            } catch (error) {
                console.warn('Error al obtener usuario:', error);
            }
        }
        
        // Intentar de localStorage directamente
        try {
            const user = JSON.parse(localStorage.getItem('currentUser'));
            return user ? user.username : 'Sistema';
        } catch (error) {
            return 'Sistema';
        }
    }
guardarRegistro() {
    try {
        console.log('🔄 Iniciando guardado de registro...');

        // Validar campos requeridos
        const fecha = document.getElementById('fechaEmergencia').value;
        const hora = document.getElementById('horaEmergencia').value;
        const direccion = document.getElementById('direccionEmergencia').value;

        console.log('📋 Datos del formulario:', { fecha, hora, direccion });

        if (!fecha || !hora || !direccion) {
            this.mostrarNotificacion('Por favor complete todos los campos obligatorios', 'error');
            return;
        }

        // Obtener asistentes
        const checkboxes = document.querySelectorAll('input[type="checkbox"]:checked');
        
        console.log('👥 Checkboxes marcados:', checkboxes.length);

        if (checkboxes.length === 0) {
            this.mostrarNotificacion('Debe seleccionar al menos un asistente', 'error');
            return;
        }

        const asistentes = Array.from(checkboxes).map(cb => {
            const bomberoId = cb.dataset.bomberoId;
            const bombero = this.bomberos.find(b => b.id == bomberoId);
            
            if (!bombero) {
                console.warn('⚠️ Bombero no encontrado:', bomberoId);
                return null;
            }
            
            // Obtener cargo vigente del bombero
            const cargoVigente = this.obtenerCargoVigente(bomberoId);
            
            return {
                bomberoId: bomberoId,
                nombre: Utils.obtenerNombreCompleto(bombero), // CORRECCIÓN CLAVE
                claveBombero: bombero.claveBombero,
                categoria: bombero.categoriaVoluntario,
                cargo: cargoVigente ? cargoVigente.tipoCargo : null,
                añoCargo: cargoVigente ? cargoVigente.añoCargo : null
            };
        }).filter(a => a !== null);

        console.log('✅ Asistentes procesados:', asistentes.length);

        // Crear registro de asistencia
        const registro = {
            id: Date.now(),
            fecha: fecha,
            hora: hora,
            claveEmergencia: document.getElementById('claveEmergencia').value || 'N/A',
            direccion: direccion,
            observaciones: document.getElementById('observaciones').value || '',
            asistentes: asistentes,
            totalAsistentes: asistentes.length,
            totalPersonas: this.bomberos.filter(b => b.estadoBombero !== 'Dado de Baja').length,
            porcentajeAsistencia: Math.round((asistentes.length / this.bomberos.filter(b => b.estadoBombero !== 'Dado de Baja').length) * 100),
            registradoPor: this.obtenerUsuarioActual(),
            fechaRegistro: new Date().toISOString()
        };

        console.log('📦 Registro creado:', registro);

        // Guardar en localStorage
        this.guardarEnStorage(registro);

        console.log('💾 Registro guardado en localStorage');

        this.mostrarNotificacion('✅ Registro de asistencia guardado exitosamente', 'success');

        // Preguntar si desea agregar otra asistencia
        setTimeout(() => {
            if (confirm('¿Desea registrar otra emergencia?')) {
                this.limpiarFormulario();
            } else {
                // Verificar si existe la página de historial
                if (document.querySelector('a[href*="historial"]')) {
                    window.location.href = 'historial-asistencias.html';
                } else {
                    this.limpiarFormulario();
                    this.mostrarNotificacion('Registro guardado. Puede ver el historial en el menú principal.', 'info');
                }
            }
        }, 1000);

    } catch (error) {
        console.error('❌ ERROR al guardar registro:', error);
        alert('Error al guardar el registro: ' + error.message);
    }
}

    guardarEnStorage(registro) {
        try {
            let asistencias = JSON.parse(localStorage.getItem('asistenciasEmergencias')) || [];
            asistencias.push(registro);
            localStorage.setItem('asistenciasEmergencias', JSON.stringify(asistencias));
            console.log('✅ Guardado exitoso. Total asistencias:', asistencias.length);
        } catch (error) {
            console.error('❌ Error al guardar en localStorage:', error);
            throw error;
        }
    }

    limpiarFormulario() {
        try {
            // Limpiar campos
            document.getElementById('claveEmergencia').value = '';
            document.getElementById('direccionEmergencia').value = '';
            document.getElementById('observaciones').value = '';

            // Establecer fecha y hora actual
            const hoy = new Date();
            document.getElementById('fechaEmergencia').valueAsDate = hoy;
            document.getElementById('horaEmergencia').value = hoy.toTimeString().slice(0, 5);

            // Desmarcar todos los checkboxes
            document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);

            // Actualizar estadísticas
            this.actualizarEstadisticas();

            // Scroll al inicio
            window.scrollTo(0, 0);

            console.log('🧹 Formulario limpiado');
        } catch (error) {
            console.error('Error al limpiar formulario:', error);
        }
    }
}

// Inicializar cuando cargue la página
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Iniciando Sistema de Asistencias...');
    window.asistencias = new SistemaAsistencias();
});