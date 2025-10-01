// ==================== SISTEMA DE CUOTAS SOCIALES ====================
class SistemaCuotas {
    constructor() {
        this.bomberoActual = null;
        this.pagosCuotas = [];
        this.anioActual = new Date().getFullYear();
        this.init();
    }

    async init() {
        if (!checkAuth()) {
            window.location.href = 'index.html';
            return;
        }

        await this.cargarBomberoActual();
        this.cargarDatos();
        this.configurarInterfaz();
        this.renderizarTodo();
    }

    async cargarBomberoActual() {
        const bomberoId = localStorage.getItem('bomberoCuotasActual');
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
        const contenedor = document.getElementById('bomberoDatosCuotas');
        const antiguedad = Utils.calcularAntiguedadDetallada(this.bomberoActual.fechaIngreso);
        
        contenedor.innerHTML = `
            <div><strong>Nombre:</strong> <span>${this.bomberoActual.nombre}</span></div>
            <div><strong>Clave:</strong> <span>${this.bomberoActual.claveBombero}</span></div>
            <div><strong>RUN:</strong> <span>${this.bomberoActual.run}</span></div>
            <div><strong>Compañía:</strong> <span>${this.bomberoActual.compania}</span></div>
            <div><strong>Antigüedad:</strong> <span>${antiguedad.años} años, ${antiguedad.meses} meses</span></div>
        `;

        document.getElementById('bomberoCuotaId').value = this.bomberoActual.id;
    }

    cargarDatos() {
        this.pagosCuotas = storage.getPagosCuotas();
    }

    configurarInterfaz() {
        document.getElementById('formCuotaSocial').addEventListener('submit', (e) => {
            this.manejarSubmitCuota(e);
        });

        const hoy = new Date().toISOString().split('T')[0];
        document.getElementById('fechaPagoCuota').value = hoy;
        document.getElementById('anioCuota').value = this.anioActual;
    }

    cambioTipoCuota() {
        const tipo = document.getElementById('tipoCuota').value;
        const montoInput = document.getElementById('montoCuota');
        
        if (tipo === 'regular') {
            montoInput.value = 5000;
        } else if (tipo === 'estudiante') {
            montoInput.value = 3000;
        } else {
            montoInput.value = '';
        }
    }

    async manejarSubmitCuota(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const datos = Object.fromEntries(formData);
        
        const errores = this.validarDatosCuota(datos);
        if (errores.length > 0) {
            Utils.mostrarNotificacion('Errores: ' + errores.join(', '), 'error');
            return;
        }

        try {
            await this.guardarPagoCuota(datos);
            Utils.mostrarNotificacion('Pago de cuota registrado exitosamente', 'success');
            this.limpiarFormulario();
            this.renderizarTodo();
            
            // Registrar ingreso en finanzas
            await this.registrarIngresoFinanzas({
                monto: parseFloat(datos.montoCuota),
                tipo: 'Cuota Social',
                descripcion: `Pago cuota social ${this.obtenerNombreMes(datos.mesCuota)} ${datos.anioCuota} - ${this.bomberoActual.nombre}`,
                fecha: datos.fechaPagoCuota
            });
            
        } catch (error) {
            Utils.mostrarNotificacion(error.message, 'error');
        }
    }

    validarDatosCuota(datos) {
        const errores = [];
        
        if (!datos.tipoCuota) errores.push('Debe seleccionar tipo de cuota');
        if (!datos.montoCuota || parseFloat(datos.montoCuota) <= 0) errores.push('Monto inválido');
        if (!datos.mesCuota) errores.push('Debe seleccionar el mes');
        if (!datos.anioCuota) errores.push('Debe ingresar el año');
        if (!datos.fechaPagoCuota) errores.push('Debe ingresar la fecha de pago');
        
        const yaExiste = this.pagosCuotas.some(p => 
            p.bomberoId == datos.bomberoCuotaId && 
            p.mes == datos.mesCuota && 
            p.anio == datos.anioCuota
        );
        
        if (yaExiste) {
            errores.push('Ya existe un pago registrado para este mes y año');
        }
        
        return errores;
    }

    async guardarPagoCuota(datos) {
        const pagoCuota = {
            id: this.generarId(),
            bomberoId: parseInt(datos.bomberoCuotaId),
            tipoCuota: datos.tipoCuota,
            monto: parseFloat(datos.montoCuota),
            mes: parseInt(datos.mesCuota),
            anio: parseInt(datos.anioCuota),
            fechaPago: datos.fechaPagoCuota,
            observaciones: datos.observacionesCuota || null,
            registradoPor: JSON.parse(localStorage.getItem('currentUser')).username,
            fechaRegistro: new Date().toISOString()
        };

        this.pagosCuotas.push(pagoCuota);
        this.guardarDatos();
    }

    async registrarIngresoFinanzas(datos) {
        const movimientos = storage.getMovimientosFinancieros();
        
        const movimiento = {
            id: this.generarId(),
            tipo: 'ingreso',
            monto: datos.monto,
            categoria: datos.tipo,
            detalle: datos.descripcion,
            fecha: datos.fecha,
            descripcion: datos.descripcion,
            comprobante: null,
            nombreComprobanteOriginal: null,
            registradoPor: JSON.parse(localStorage.getItem('currentUser')).username,
            fechaRegistro: new Date().toISOString()
        };

        movimientos.push(movimiento);
        storage.saveMovimientosFinancieros(movimientos);
    }

    renderizarTodo() {
        this.renderizarGridMeses();
        this.renderizarHistorialCuotas();
    }

    renderizarGridMeses() {
        const grid = document.getElementById('gridMesesCuotas');
        const meses = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];

        document.getElementById('anioActualCuotas').textContent = this.anioActual;

        const html = meses.map((mes, index) => {
            const numeroMes = index + 1;
            const pago = this.pagosCuotas.find(p => 
                p.bomberoId == this.bomberoActual.id && 
                p.mes == numeroMes && 
                p.anio == this.anioActual
            );

            let estadoClass = 'pendiente';
            let estadoTexto = 'Pendiente';
            
            if (pago) {
                estadoClass = 'pagado';
                estadoTexto = `Pagado: ${this.formatearMonto(pago.monto)}`;
            }

            return `
                <div class="mes-card ${estadoClass}">
                    <div class="mes-nombre">${mes}</div>
                    <div class="mes-estado">${estadoTexto}</div>
                </div>
            `;
        }).join('');

        grid.innerHTML = html;
    }

    renderizarHistorialCuotas() {
        const lista = document.getElementById('listaCuotas');
        const total = document.getElementById('totalPagosCuotas');
        
        const pagosBombero = this.pagosCuotas
            .filter(p => p.bomberoId == this.bomberoActual.id)
            .sort((a, b) => new Date(b.fechaPago) - new Date(a.fechaPago));

        total.textContent = pagosBombero.length;

        if (pagosBombero.length === 0) {
            lista.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">No hay pagos de cuotas registrados</p>';
            return;
        }

        lista.innerHTML = pagosBombero.map(pago => `
            <div class="pago-card">
                <div class="pago-header">
                    <div>
                        <strong>${this.obtenerNombreMes(pago.mes)} ${pago.anio}</strong> - 
                        <span>${pago.tipoCuota === 'regular' ? 'Cuota Regular' : 'Cuota Estudiante'}</span>
                    </div>
                    <div class="pago-monto">${this.formatearMonto(pago.monto)}</div>
                </div>
                <div class="item-info">
                    <div><strong>Fecha de pago:</strong> <span>${Utils.formatearFecha(pago.fechaPago)}</span></div>
                    ${pago.observaciones ? `<div><strong>Observaciones:</strong> <span>${pago.observaciones}</span></div>` : ''}
                    <div><strong>Registrado por:</strong> <span>${pago.registradoPor}</span></div>
                </div>
            </div>
        `).join('');
    }

    async exportarExcel() {
        const pagosBombero = this.pagosCuotas.filter(p => p.bomberoId == this.bomberoActual.id);
        
        if (pagosBombero.length === 0) {
            Utils.mostrarNotificacion('No hay pagos para exportar', 'error');
            return;
        }

        try {
            const datosExcel = pagosBombero.map((pago, index) => ({
                'N°': index + 1,
                'Voluntario': this.bomberoActual.nombre,
                'Clave': this.bomberoActual.claveBombero,
                'Mes': this.obtenerNombreMes(pago.mes),
                'Año': pago.anio,
                'Tipo': pago.tipoCuota === 'regular' ? 'Regular' : 'Estudiante',
                'Monto': pago.monto,
                'Fecha Pago': Utils.formatearFecha(pago.fechaPago),
                'Observaciones': pago.observaciones || '-',
                'Registrado por': pago.registradoPor
            }));

            await Utils.exportarAExcel(
                datosExcel,
                `Cuotas_${this.bomberoActual.claveBombero}_${new Date().toISOString().split('T')[0]}.xlsx`,
                'Cuotas Sociales'
            );

            Utils.mostrarNotificacion('Excel descargado exitosamente', 'success');
        } catch (error) {
            Utils.mostrarNotificacion('Error al generar Excel: ' + error.message, 'error');
        }
    }

    generarId() {
        return Date.now() + Math.random().toString(36).substr(2, 9);
    }

    guardarDatos() {
        storage.savePagosCuotas(this.pagosCuotas);
    }

    formatearMonto(monto) {
        return new Intl.NumberFormat('es-CL', {
            style: 'currency',
            currency: 'CLP',
            minimumFractionDigits: 0
        }).format(monto);
    }

    obtenerNombreMes(numero) {
        const meses = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];
        return meses[parseInt(numero) - 1];
    }

    limpiarFormulario() {
        document.getElementById('formCuotaSocial').reset();
        document.getElementById('bomberoCuotaId').value = this.bomberoActual.id;
        document.getElementById('anioCuota').value = this.anioActual;
        document.getElementById('fechaPagoCuota').value = new Date().toISOString().split('T')[0];
    }

    volverAlSistema() {
        localStorage.removeItem('bomberoCuotasActual');
        window.location.href = 'sistema.html';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.cuotasSistema = new SistemaCuotas();
});