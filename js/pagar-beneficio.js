// ==================== SISTEMA DE PAGO DE BENEFICIOS ====================
class SistemaPagarBeneficio {
    constructor() {
        this.bomberoActual = null;
        this.asignaciones = [];
        this.beneficios = [];
        this.pagosBeneficios = [];
        this.asignacionActual = null;
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
        this.actualizarResumenDeudas();
    }

    async cargarBomberoActual() {
        const bomberoId = localStorage.getItem('bomberoPagarBeneficioActual');
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
        const contenedor = document.getElementById('bomberoDatosPago');
        
        contenedor.innerHTML = `
            <div><strong>Nombre:</strong> <span>${this.bomberoActual.nombre}</span></div>
            <div><strong>Clave:</strong> <span>${this.bomberoActual.claveBombero}</span></div>
            <div><strong>RUN:</strong> <span>${this.bomberoActual.run}</span></div>
            <div><strong>Compañía:</strong> <span>${this.bomberoActual.compania}</span></div>
        `;
    }

    cargarDatos() {
        this.asignaciones = storage.getAsignacionesBeneficios();
        this.beneficios = storage.getBeneficios();
        this.pagosBeneficios = storage.getPagosBeneficios();
    }

    configurarInterfaz() {
        document.getElementById('formPagoBeneficio').addEventListener('submit', (e) => {
            this.manejarSubmitPago(e);
        });

        const hoy = new Date().toISOString().split('T')[0];
        document.getElementById('fechaPago').value = hoy;
    }

    renderizarTodo() {
        this.renderizarBeneficiosAsignados();
        this.renderizarHistorialPagos();
    }

    actualizarResumenDeudas() {
        const asignacionesBombero = this.asignaciones.filter(a => a.bomberoId == this.bomberoActual.id);
        const beneficiosPendientes = asignacionesBombero.filter(a => 
            a.estadoPago === 'pendiente' || a.estadoPago === 'parcial'
        );
        
        const deudaTotal = beneficiosPendientes.reduce((sum, a) => 
            sum + (a.montoEsperado - a.montoPagado), 0
        );

        document.getElementById('totalBeneficiosPendientes').textContent = beneficiosPendientes.length;
        document.getElementById('deudaTotalBeneficios').textContent = this.formatearMonto(deudaTotal);
    }

    renderizarBeneficiosAsignados() {
        const contenedor = document.getElementById('listaBeneficiosAsignados');
        const asignacionesBombero = this.asignaciones.filter(a => a.bomberoId == this.bomberoActual.id);

        if (asignacionesBombero.length === 0) {
            contenedor.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">No tienes beneficios asignados</p>';
            return;
        }

        contenedor.innerHTML = asignacionesBombero.map(a => {
            const beneficio = this.beneficios.find(b => b.id === a.beneficioId);
            if (!beneficio) return '';

            const hoy = new Date();
            const fechaLimite = new Date(beneficio.fechaLimiteRendicion);
            const vencido = fechaLimite < hoy && a.estadoPago !== 'pagado';
            
            let estadoClass = a.estadoPago;
            let estadoTexto = this.obtenerTextoEstado(a.estadoPago);
            
            if (vencido && a.estadoPago !== 'pagado') {
                estadoClass = 'vencido';
                estadoTexto = '⚠️ VENCIDO';
            }

            return `
                <div class="asignacion-card">
                    <div class="asignacion-header">
                        <div class="asignacion-nombre">${beneficio.nombre}</div>
                        <div class="asignacion-estado ${estadoClass}">${estadoTexto}</div>
                    </div>
                    <div class="asignacion-info">
                        <div><strong>Tipo:</strong> <span>${beneficio.tipo}</span></div>
                        <div><strong>Fecha evento:</strong> <span>${Utils.formatearFecha(beneficio.fechaEvento)}</span></div>
                        <div><strong>Fecha límite:</strong> <span>${Utils.formatearFecha(beneficio.fechaLimiteRendicion)}</span></div>
                        <div><strong>Precio tarjeta:</strong> <span>${this.formatearMonto(beneficio.precioTarjeta)}</span></div>
                        <div><strong>Tarjetas asignadas:</strong> <span>${a.tarjetasAsignadas}</span></div>
                        <div><strong>Tarjetas vendidas:</strong> <span>${a.tarjetasVendidas}</span></div>
                        <div><strong>Monto esperado:</strong> <span>${this.formatearMonto(a.montoEsperado)}</span></div>
                        <div><strong>Monto pagado:</strong> <span style="color: #4caf50;">${this.formatearMonto(a.montoPagado)}</span></div>
                        <div><strong>Deuda:</strong> <span style="color: ${a.montoEsperado - a.montoPagado > 0 ? '#f44336' : '#4caf50'};">${this.formatearMonto(a.montoEsperado - a.montoPagado)}</span></div>
                    </div>
                    ${beneficio.estado === 'activo' && a.estadoPago !== 'pagado' ? `
                        <button class="btn-pagar-beneficio" onclick="pagarBeneficioSistema.abrirFormularioPago('${a.id}')">
                            💰 Registrar Pago
                        </button>
                    ` : ''}
                </div>
            `;
        }).join('');
    }

    abrirFormularioPago(asignacionId) {
        this.asignacionActual = this.asignaciones.find(a => a.id === asignacionId);
        if (!this.asignacionActual) return;

        const beneficio = this.beneficios.find(b => b.id === this.asignacionActual.beneficioId);
        if (!beneficio) return;

        document.getElementById('asignacionId').value = asignacionId;
        document.getElementById('beneficioId').value = beneficio.id;

        const infoDiv = document.getElementById('infoBeneficio');
        infoDiv.innerHTML = `
            <div class="info-beneficio">
                <h4>${beneficio.nombre}</h4>
                <div class="info-grid">
                    <div><strong>Tarjetas asignadas:</strong> ${this.asignacionActual.tarjetasAsignadas}</div>
                    <div><strong>Precio por tarjeta:</strong> ${this.formatearMonto(beneficio.precioTarjeta)}</div>
                    <div><strong>Total esperado:</strong> ${this.formatearMonto(this.asignacionActual.montoEsperado)}</div>
                    <div><strong>Ya pagado:</strong> ${this.formatearMonto(this.asignacionActual.montoPagado)}</div>
                    <div><strong>Tarjetas ya registradas:</strong> ${this.asignacionActual.tarjetasVendidas}</div>
                    <div><strong>Fecha límite:</strong> ${Utils.formatearFecha(beneficio.fechaLimiteRendicion)}</div>
                </div>
            </div>
        `;

        document.getElementById('formPagoContainer').style.display = 'block';
        document.getElementById('formPagoContainer').scrollIntoView({ behavior: 'smooth' });
    }

    cerrarFormulario() {
        document.getElementById('formPagoContainer').style.display = 'none';
        document.getElementById('formPagoBeneficio').reset();
        this.asignacionActual = null;
    }

    calcularMonto() {
        if (!this.asignacionActual) return;

        const beneficio = this.beneficios.find(b => b.id === this.asignacionActual.beneficioId);
        if (!beneficio) return;

        const tarjetasVendidas = parseInt(document.getElementById('tarjetasVendidas').value) || 0;
        const monto = tarjetasVendidas * beneficio.precioTarjeta;
        
        document.getElementById('montoPago').value = monto;
    }

    async manejarSubmitPago(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const datos = Object.fromEntries(formData);
        
        const errores = this.validarDatosPago(datos);
        if (errores.length > 0) {
            Utils.mostrarNotificacion('Errores: ' + errores.join(', '), 'error');
            return;
        }

        try {
            await this.guardarPago(datos);
            Utils.mostrarNotificacion('Pago registrado exitosamente', 'success');
            this.cerrarFormulario();
            this.cargarDatos();
            this.renderizarTodo();
            this.actualizarResumenDeudas();
        } catch (error) {
            Utils.mostrarNotificacion(error.message, 'error');
        }
    }

    validarDatosPago(datos) {
        const errores = [];
        
        if (!datos.tarjetasVendidas || parseInt(datos.tarjetasVendidas) < 0) {
            errores.push('Cantidad de tarjetas inválida');
        }
        
        if (!datos.montoPago || parseFloat(datos.montoPago) < 0) {
            errores.push('Monto inválido');
        }
        
        if (!datos.fechaPago) {
            errores.push('Debe ingresar la fecha de pago');
        }
        
        return errores;
    }

    async guardarPago(datos) {
        const tarjetasVendidas = parseInt(datos.tarjetasVendidas);
        const montoPago = parseFloat(datos.montoPago);
        
        const asignacion = this.asignaciones.find(a => a.id === datos.asignacionId);
        if (!asignacion) throw new Error('Asignación no encontrada');

        const beneficio = this.beneficios.find(b => b.id === datos.beneficioId);
        if (!beneficio) throw new Error('Beneficio no encontrado');

        asignacion.tarjetasVendidas += tarjetasVendidas;
        asignacion.montoPagado += montoPago;

        if (asignacion.montoPagado >= asignacion.montoEsperado) {
            asignacion.estadoPago = 'pagado';
        } else if (asignacion.montoPagado > 0) {
            asignacion.estadoPago = 'parcial';
        }

        const pagoBeneficio = {
            id: this.generarId(),
            asignacionId: datos.asignacionId,
            beneficioId: datos.beneficioId,
            bomberoId: this.bomberoActual.id,
            nombreBombero: this.bomberoActual.nombre,
            claveBombero: this.bomberoActual.claveBombero,
            nombreBeneficio: beneficio.nombre,
            tarjetasVendidas: tarjetasVendidas,
            montoPagado: montoPago,
            fechaPago: datos.fechaPago,
            observaciones: datos.observaciones || null,
            registradoPor: JSON.parse(localStorage.getItem('currentUser')).username,
            fechaRegistro: new Date().toISOString()
        };

        this.pagosBeneficios.push(pagoBeneficio);
        
        storage.saveAsignacionesBeneficios(this.asignaciones);
        storage.savePagosBeneficios(this.pagosBeneficios);

        await this.registrarIngresoFinanzas({
            monto: montoPago,
            tipo: 'Beneficio',
            descripcion: `Pago beneficio ${beneficio.nombre} - ${this.bomberoActual.nombre} - ${tarjetasVendidas} tarjetas`,
            fecha: datos.fechaPago
        });
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

    renderizarHistorialPagos() {
        const lista = document.getElementById('listaPagos');
        const total = document.getElementById('totalPagos');
        
        const pagosBombero = this.pagosBeneficios
            .filter(p => p.bomberoId == this.bomberoActual.id)
            .sort((a, b) => new Date(b.fechaPago) - new Date(a.fechaPago));

        total.textContent = pagosBombero.length;

        if (pagosBombero.length === 0) {
            lista.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">No hay pagos registrados</p>';
            return;
        }

        lista.innerHTML = pagosBombero.map(pago => `
            <div class="pago-card">
                <div class="pago-header">
                    <div><strong>${pago.nombreBeneficio}</strong></div>
                    <div class="pago-monto">${this.formatearMonto(pago.montoPagado)}</div>
                </div>
                <div class="item-info">
                    <div><strong>Tarjetas vendidas:</strong> <span>${pago.tarjetasVendidas}</span></div>
                    <div><strong>Fecha de pago:</strong> <span>${Utils.formatearFecha(pago.fechaPago)}</span></div>
                    ${pago.observaciones ? `<div class="full-width"><strong>Observaciones:</strong> <span>${pago.observaciones}</span></div>` : ''}
                    <div><strong>Registrado por:</strong> <span>${pago.registradoPor}</span></div>
                </div>
            </div>
        `).join('');
    }

    obtenerTextoEstado(estado) {
        const textos = {
            'pendiente': 'Pendiente',
            'parcial': 'Parcial',
            'pagado': 'Pagado'
        };
        return textos[estado] || estado;
    }

    async exportarExcel() {
        const pagosBombero = this.pagosBeneficios.filter(p => p.bomberoId == this.bomberoActual.id);
        
        if (pagosBombero.length === 0) {
            Utils.mostrarNotificacion('No hay pagos para exportar', 'error');
            return;
        }

        try {
            const datosExcel = pagosBombero.map((pago, index) => ({
                'N°': index + 1,
                'Voluntario': pago.nombreBombero,
                'Clave': pago.claveBombero,
                'Beneficio': pago.nombreBeneficio,
                'Tarjetas': pago.tarjetasVendidas,
                'Monto': pago.montoPagado,
                'Fecha': Utils.formatearFecha(pago.fechaPago),
                'Observaciones': pago.observaciones || '-',
                'Registrado por': pago.registradoPor
            }));

            await Utils.exportarAExcel(
                datosExcel,
                `Pagos_Beneficios_${this.bomberoActual.claveBombero}_${new Date().toISOString().split('T')[0]}.xlsx`,
                'Pagos Beneficios'
            );

            Utils.mostrarNotificacion('Excel descargado exitosamente', 'success');
        } catch (error) {
            Utils.mostrarNotificacion('Error al generar Excel: ' + error.message, 'error');
        }
    }

    generarId() {
        return Date.now() + Math.random().toString(36).substr(2, 9);
    }

    formatearMonto(monto) {
        return new Intl.NumberFormat('es-CL', {
            style: 'currency',
            currency: 'CLP',
            minimumFractionDigits: 0
        }).format(monto);
    }

    volverAlSistema() {
        localStorage.removeItem('bomberoPagarBeneficioActual');
        window.location.href = 'sistema.html';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.pagarBeneficioSistema = new SistemaPagarBeneficio();
});