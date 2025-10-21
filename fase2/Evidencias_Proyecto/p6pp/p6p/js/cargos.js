// ==================== SISTEMA DE CARGOS ====================
class SistemaCargos {
    constructor() {
        this.bomberoActual = null;
        this.cargos = [];
        this.init();
    }

    async init() {
        // Verificar autenticación
        if (!checkAuth()) {
            window.location.href = 'index.html';
            return;
        }

        // Cargar datos del bombero
        await this.cargarBomberoActual();
        
        // Cargar cargos
        this.cargos = storage.getCargos();
        
        // Configurar interfaz
        this.configurarInterfaz();
        
        // Renderizar cargos
        this.renderizarCargos();
    }

    async cargarBomberoActual() {
        const bomberoId = localStorage.getItem('bomberoCargoActual');
        if (!bomberoId) {
            Utils.mostrarNotificacion('No se ha seleccionado ningún bombero', 'error');
            setTimeout(() => this.volverAlSistema(), 2000);
            return;
        }

        const bomberos = storage.getBomberos();
        this.bomberoActual = bomberos.find(b => b.id == bomberoId);
        
        if (!this.bomberoActual) {
            Utils.mostrarNotificacion('Bombero no encontrado', 'error');
            setTimeout(() => this.volverAlSistema(), 2000);
            return;
        }

        this.mostrarInfoBombero();
    }

    mostrarInfoBombero() {
        const contenedor = document.getElementById('bomberoDatosCargos');
        const antiguedad = Utils.calcularAntiguedadDetallada(this.bomberoActual.fechaIngreso);
        
        contenedor.innerHTML = `
            <div><strong>Nombre Completo:</strong> <span>${this.bomberoActual.nombre}</span></div>
            <div><strong>Clave Bombero:</strong> <span>${this.bomberoActual.claveBombero}</span></div>
            <div><strong>RUN:</strong> <span>${this.bomberoActual.run}</span></div>
            <div><strong>Compañía:</strong> <span>${this.bomberoActual.compania}</span></div>
            <div><strong>Antigüedad:</strong> <span>${antiguedad.años} años, ${antiguedad.meses} meses</span></div>
            <div><strong>Fecha Ingreso:</strong> <span>${Utils.formatearFecha(this.bomberoActual.fechaIngreso)}</span></div>
        `;

        document.getElementById('bomberoCargoId').value = this.bomberoActual.id;
    }

    configurarInterfaz() {
        // Configurar formulario
        document.getElementById('formCargo').addEventListener('submit', (e) => {
            this.manejarSubmitFormulario(e);
        });

        // Configurar año actual por defecto
        document.getElementById('añoCargo').value = new Date().getFullYear();
    }

    async manejarSubmitFormulario(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const datos = Object.fromEntries(formData);
        const errores = this.validarDatosCargo(datos);

        if (errores.length > 0) {
            Utils.mostrarNotificacion('Errores: ' + errores.join(', '), 'error');
            return;
        }

        try {
            await this.guardarCargo(datos);
            Utils.mostrarNotificacion('Cargo registrado exitosamente', 'success');
            this.limpiarFormulario();
            this.renderizarCargos();
        } catch (error) {
            Utils.mostrarNotificacion(error.message, 'error');
        }
    }

    validarDatosCargo(datos) {
        const errores = [];
        
        const tieneAño = datos.añoCargo && datos.añoCargo.trim();
        const tieneCargo = datos.tipoCargo && datos.tipoCargo.trim();
        const tieneDesde = datos.fechaInicioCargo && datos.fechaInicioCargo.trim();

        if (!tieneAño && !tieneCargo && !tieneDesde) {
            errores.push('Debe completar al menos uno de los siguientes campos: Año, Cargo o Desde');
        }

        if (datos.añoCargo) {
            const año = parseInt(datos.añoCargo);
            if (año < 1950 || año > 2030) {
                errores.push('El año debe estar entre 1950 y 2030');
            }
        }

        if (datos.fechaInicioCargo && datos.fechaFinCargo) {
            if (new Date(datos.fechaInicioCargo) > new Date(datos.fechaFinCargo)) {
                errores.push('La fecha de término debe ser posterior a la fecha de inicio');
            }
        }

        return errores;
    }

    async guardarCargo(datos) {
        const cargoData = {
            id: window.cargoIdCounter++,
            bomberoId: parseInt(datos.bomberoCargoId),
            añoCargo: datos.añoCargo ? parseInt(datos.añoCargo) : null,
            tipoCargo: datos.tipoCargo || null,
            fechaInicioCargo: datos.fechaInicioCargo || null,
            fechaFinCargo: datos.fechaFinCargo || null,
            premioAñoServicio: datos.premioAñoServicio || null,
            observacionesCargo: datos.observacionesCargo || null,
            fechaRegistro: new Date().toISOString()
        };

        this.cargos.push(cargoData);
        this.guardarDatos();
    }

    guardarDatos() {
        storage.saveCargos(this.cargos);
        storage.saveCounters({
            bomberoId: window.idCounter,
            sancionId: window.sancionIdCounter,
            cargoId: window.cargoIdCounter
        });
    }

    renderizarCargos() {
        const lista = document.getElementById('listaCargos');
        const total = document.getElementById('totalCargos');
        
        const cargosBombero = this.cargos.filter(c => c.bomberoId == this.bomberoActual.id);
        const cargosOrdenados = this.ordenarCargos(cargosBombero);
        
        total.textContent = cargosBombero.length;

        if (cargosBombero.length === 0) {
            lista.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">No hay cargos registrados para este bombero</p>';
            return;
        }

        lista.innerHTML = cargosOrdenados.map(cargo => this.generarHTMLCargo(cargo)).join('');
    }

    ordenarCargos(cargos) {
        return [...cargos].sort((a, b) => {
            // Priorizar fecha de inicio
            if (a.fechaInicioCargo && b.fechaInicioCargo) {
                return new Date(b.fechaInicioCargo) - new Date(a.fechaInicioCargo);
            }
            
            // Luego por año
            if (a.añoCargo && b.añoCargo) {
                return b.añoCargo - a.añoCargo;
            }
            
            // Finalmente por fecha de registro
            return new Date(b.fechaRegistro) - new Date(a.fechaRegistro);
        });
    }

    generarHTMLCargo(cargo) {
        const esVigente = cargo.fechaInicioCargo && !cargo.fechaFinCargo;
        
        return `
            <div class="item-card cargo-card">
                <div class="item-header">
                    <div class="item-tipo">
                        ${cargo.tipoCargo || 'Registro de Servicio'}
                        ${cargo.añoCargo ? ` (${cargo.añoCargo})` : ''}
                    </div>
                    <div class="item-fecha">
                        Registrado: ${Utils.formatearFecha(cargo.fechaRegistro)}
                    </div>
                </div>
                <div class="item-info">
                    ${cargo.añoCargo ? `
                        <div><strong>Año:</strong> <span>${cargo.añoCargo}</span></div>
                    ` : ''}
                    
                    ${cargo.tipoCargo ? `
                        <div><strong>Cargo:</strong> <span>${cargo.tipoCargo}</span></div>
                    ` : ''}
                    
                    ${cargo.fechaInicioCargo ? `
                        <div><strong>Desde:</strong> <span>${Utils.formatearFecha(cargo.fechaInicioCargo)}</span></div>
                    ` : ''}
                    
                    ${cargo.fechaFinCargo ? `
                        <div><strong>Hasta:</strong> <span>${Utils.formatearFecha(cargo.fechaFinCargo)}</span></div>
                    ` : cargo.fechaInicioCargo ? `
                        <div><strong>Estado:</strong> <span style="color: #4caf50; font-weight: bold;">En ejercicio</span></div>
                    ` : ''}
                    
                    ${cargo.premioAñoServicio ? `
                        <div><strong>Premio:</strong> <span>${cargo.premioAñoServicio}</span></div>
                    ` : ''}
                    
                    <div class="full-width">
                        <strong>Observaciones:</strong> 
                        <span>${cargo.observacionesCargo || 'Sin observaciones'}</span>
                    </div>
                </div>
            </div>
        `;
    }

    limpiarFormulario() {
        document.getElementById('formCargo').reset();
        document.getElementById('bomberoCargoId').value = this.bomberoActual.id;
        document.getElementById('añoCargo').value = new Date().getFullYear();
    }

    async exportarExcel() {
        if (!this.bomberoActual) {
            Utils.mostrarNotificacion('Error: No hay un bombero seleccionado', 'error');
            return;
        }

        const cargosBombero = this.cargos.filter(c => c.bomberoId == this.bomberoActual.id);
        
        if (cargosBombero.length === 0) {
            Utils.mostrarNotificacion('No hay cargos registrados para exportar', 'error');
            return;
        }

        try {
            const datosExcel = cargosBombero.map((cargo, index) => ({
                'N°': index + 1,
                'Bombero': this.bomberoActual.nombre,
                'Clave': this.bomberoActual.claveBombero,
                'RUN': this.bomberoActual.run,
                'Compañía': this.bomberoActual.compania,
                'Año': cargo.añoCargo || 'No especificado',
                'Cargo': cargo.tipoCargo || 'No especificado',
                'Desde': cargo.fechaInicioCargo ? Utils.formatearFecha(cargo.fechaInicioCargo) : 'No especificado',
                'Hasta': cargo.fechaFinCargo ? Utils.formatearFecha(cargo.fechaFinCargo) : 'En ejercicio',
                'Premio Año Servicio': cargo.premioAñoServicio || 'No especificado',
                'Observaciones': cargo.observacionesCargo || 'Sin observaciones',
                'Fecha Registro': Utils.formatearFecha(cargo.fechaRegistro)
            }));

            await Utils.exportarAExcel(
                datosExcel,
                `Cargos_${this.bomberoActual.claveBombero}_${new Date().toISOString().split('T')[0]}.xlsx`,
                'Cargos'
            );

            Utils.mostrarNotificacion('Excel de cargos descargado exitosamente', 'success');
        } catch (error) {
            Utils.mostrarNotificacion('Error al generar Excel: ' + error.message, 'error');
        }
    }

    volverAlSistema() {
        localStorage.removeItem('bomberoCargoActual');
        window.location.href = 'sistema.html';
    }
}

// Inicializar sistema cuando se cargue la página
document.addEventListener('DOMContentLoaded', () => {
    window.cargosSistema = new SistemaCargos();
});