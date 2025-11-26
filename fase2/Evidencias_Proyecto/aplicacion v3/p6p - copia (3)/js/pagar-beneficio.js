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
            <div><strong>Nombre:</strong> <span>${Utils.obtenerNombreCompleto(this.bomberoActual)}</span></div>
            <div><strong>Clave:</strong> <span>${this.bomberoActual.claveBombero}</span></div>
            <div><strong>RUN:</strong> <span>${this.bomberoActual.rut}</span></div>
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
            nombreBombero: Utils.obtenerNombreCompleto(this.bomberoActual),
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
            descripcion: `Pago beneficio ${beneficio.nombre} - ${Utils.obtenerNombreCompleto(this.bomberoActual)} - ${tarjetasVendidas} tarjetas`,
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
        mostrarDetalleConVentasExtra(beneficioId, bomberoId) {
        const beneficio = this.beneficios.find(b => b.id === beneficioId);
        const asignacion = this.asignaciones.find(a => 
            a.beneficioId === beneficioId && a.bomberoId === bomberoId
        );
        const pagoPrincipal = this.pagosBeneficios.find(p => 
            p.beneficioId === beneficioId && p.bomberoId === bomberoId && !p.esVentaExtra
        );
        const ventasExtras = storage.getVentasExtrasPorBeneficio(beneficioId, bomberoId);
        
        if (!beneficio || !asignacion) return;
        
        const bombero = this.bomberos.find(b => b.id === bomberoId);
        
        const popup = document.createElement('div');
        popup.className = 'popup-overlay';
        popup.innerHTML = `
            <div class="popup-content popup-detalle-beneficio">
                <div class="popup-header">
                    <h3>📊 Detalle Completo - ${beneficio.nombre}</h3>
                    <button onclick="this.closest('.popup-overlay').remove()" class="btn-cerrar-popup">✕</button>
                </div>
                
                <div class="popup-body">
                    <div class="info-bombero-popup">
                        <strong>👤 Bombero:</strong> ${Utils.obtenerNombreCompleto(bombero)}<br>
                        <strong>Clave:</strong> ${bombero.claveBombero}
                    </div>
                    
                    <div class="seccion-detalle">
                        <h4>📦 ASIGNACIÓN INICIAL</h4>
                        <table class="tabla-detalle">
                            <tr>
                                <td><strong>Tarjetas asignadas:</strong></td>
                                <td>${asignacion.cantidadTarjetas}</td>
                            </tr>
                            <tr>
                                <td><strong>Valor unitario:</strong></td>
                                <td>$${beneficio.precioTarjeta.toLocaleString()}</td>
                            </tr>
                            <tr>
                                <td><strong>Total inicial:</strong></td>
                                <td><strong>$${asignacion.montoTotal.toLocaleString()}</strong></td>
                            </tr>
                            <tr>
                                <td><strong>Estado:</strong></td>
                                <td>
                                    ${pagoPrincipal ? 
                                        `<span class="badge badge-pagado">✅ PAGADO el ${Utils.formatearFecha(pagoPrincipal.fechaPago)}</span>` :
                                        `<span class="badge badge-pendiente">❌ PENDIENTE</span>`
                                    }
                                </td>
                            </tr>
                            ${pagoPrincipal ? `
                                <tr>
                                    <td><strong>Registrado por:</strong></td>
                                    <td>${pagoPrincipal.registradoPor}</td>
                                </tr>
                            ` : ''}
                        </table>
                    </div>
                    
                    ${ventasExtras.length > 0 ? `
                        <div class="seccion-detalle">
                            <h4>📊 VENTAS EXTRAS (${ventasExtras.length})</h4>
                            ${ventasExtras.map((venta, index) => `
                                <div class="venta-extra-card">
                                    <div class="venta-extra-header">
                                        <strong>Venta Extra #${index + 1}</strong>
                                        ${venta.estado === 'pagado' ? 
                                            `<span class="badge badge-pagado">✅ PAGADO</span>` :
                                            `<span class="badge badge-pendiente">❌ PENDIENTE</span>`
                                        }
                                    </div>
                                    <table class="tabla-detalle">
                                        <tr>
                                            <td><strong>Cantidad:</strong></td>
                                            <td>${venta.cantidad} tarjetas</td>
                                        </tr>
                                        <tr>
                                            <td><strong>Valor:</strong></td>
                                            <td>$${venta.valorUnitario.toLocaleString()} c/u</td>
                                        </tr>
                                        <tr>
                                            <td><strong>Total:</strong></td>
                                            <td><strong>$${venta.total.toLocaleString()}</strong></td>
                                        </tr>
                                        <tr>
                                            <td><strong>Registrado:</strong></td>
                                            <td>${Utils.formatearFecha(venta.fechaRegistro)} por ${venta.registradoPor}</td>
                                        </tr>
                                        ${venta.estado === 'pagado' ? `
                                            <tr>
                                                <td><strong>Pagado:</strong></td>
                                                <td>${Utils.formatearFecha(venta.fechaPago)} por ${venta.pagadoPor || venta.registradoPor}</td>
                                            </tr>
                                        ` : ''}
                                        ${venta.nota ? `
                                            <tr>
                                                <td><strong>Nota:</strong></td>
                                                <td><em>${venta.nota}</em></td>
                                            </tr>
                                        ` : ''}
                                    </table>
                                    ${venta.estado === 'pendiente' ? `
                                        <button onclick="beneficiosSistema.pagarVentaExtra(${venta.id}, ${beneficioId}, ${bomberoId})" 
                                                class="btn btn-success btn-sm" style="margin-top: 10px;">
                                            💰 Pagar Esta Venta
                                        </button>
                                    ` : ''}
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                    
                    <div class="seccion-detalle resumen-final">
                        <h4>💰 RESUMEN FINANCIERO</h4>
                        ${this.calcularTotalesCompletos(beneficioId, bomberoId)}
                    </div>
                </div>
                
                <div class="popup-footer">
                    ${!pagoPrincipal || ventasExtras.some(v => v.estado === 'pendiente') ? `
                        <button onclick="beneficiosSistema.mostrarPopupVentaExtra(${beneficioId}, ${bomberoId})" 
                                class="btn btn-warning">
                            ➕ Registrar Venta Extra
                        </button>
                    ` : ''}
                    <button onclick="beneficiosSistema.exportarDetalleAuditoria(${beneficioId}, ${bomberoId})" 
                            class="btn btn-info">
                        📄 Exportar Detalle
                    </button>
                    <button onclick="this.closest('.popup-overlay').remove()" 
                            class="btn btn-secondary">
                        Cerrar
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(popup);
    }
    
    calcularTotalesCompletos(beneficioId, bomberoId) {
        const asignacion = this.asignaciones.find(a => 
            a.beneficioId === beneficioId && a.bomberoId === bomberoId
        );
        const pagoPrincipal = this.pagosBeneficios.find(p => 
            p.beneficioId === beneficioId && p.bomberoId === bomberoId && !p.esVentaExtra
        );
        const ventasExtras = storage.getVentasExtrasPorBeneficio(beneficioId, bomberoId);
        
        const totalTarjetas = asignacion.cantidadTarjetas + 
            ventasExtras.reduce((sum, v) => sum + v.cantidad, 0);
        
        const totalEsperado = asignacion.montoTotal + 
            ventasExtras.reduce((sum, v) => sum + v.total, 0);
        
        const totalPagado = (pagoPrincipal ? asignacion.montoTotal : 0) + 
            ventasExtras.filter(v => v.estado === 'pagado')
                       .reduce((sum, v) => sum + v.total, 0);
        
        const totalPendiente = totalEsperado - totalPagado;
        
        return `
            <table class="tabla-resumen">
                <tr>
                    <td><strong>Total tarjetas vendidas:</strong></td>
                    <td><strong>${totalTarjetas}</strong></td>
                </tr>
                <tr>
                    <td><strong>Total esperado:</strong></td>
                    <td><strong>$${totalEsperado.toLocaleString()}</strong></td>
                </tr>
                <tr class="row-success">
                    <td><strong>Total pagado:</strong></td>
                    <td><strong>$${totalPagado.toLocaleString()} ✅</strong></td>
                </tr>
                <tr class="${totalPendiente > 0 ? 'row-danger' : ''}">
                    <td><strong>Pendiente de pago:</strong></td>
                    <td><strong>$${totalPendiente.toLocaleString()} ${totalPendiente > 0 ? '❌' : '✅'}</strong></td>
                </tr>
            </table>
        `;
    }
    
    mostrarPopupVentaExtra(beneficioId, bomberoId) {
        const beneficio = this.beneficios.find(b => b.id === beneficioId);
        const bombero = this.bomberos.find(b => b.id === bomberoId);
        
        // Cerrar popup anterior si existe
        const popupAnterior = document.querySelector('.popup-overlay');
        if (popupAnterior) popupAnterior.remove();
        
        const popup = document.createElement('div');
        popup.className = 'popup-overlay';
        popup.innerHTML = `
            <div class="popup-content popup-venta-extra">
                <div class="popup-header">
                    <h3>➕ REGISTRAR VENTA EXTRA</h3>
                    <button onclick="this.closest('.popup-overlay').remove()" class="btn-cerrar-popup">✕</button>
                </div>
                
                <div class="popup-body">
                    <div class="info-beneficio-venta">
                        <strong>Bombero:</strong> ${Utils.obtenerNombreCompleto(bombero)}<br>
                        <strong>Beneficio:</strong> ${beneficio.nombre}
                    </div>
                    
                    <form id="formVentaExtra" onsubmit="event.preventDefault(); beneficiosSistema.registrarVentaExtra(${beneficioId}, ${bomberoId})">
                        <div class="form-group">
                            <label class="required"><strong>Cantidad de tarjetas vendidas:</strong></label>
                            <input type="number" id="cantidadVentaExtra" min="1" max="100" required
                                   placeholder="Número de tarjetas" class="form-control"
                                   onchange="beneficiosSistema.calcularTotalVentaExtra(${beneficio.precioTarjeta})">
                        </div>
                        
                        <div class="form-group">
                            <label><strong>Valor unitario:</strong></label>
                            <input type="text" value="$${beneficio.precioTarjeta.toLocaleString()}" 
                                   readonly class="form-control campo-readonly">
                        </div>
                        
                        <div class="form-group">
                            <label><strong>Total a cobrar:</strong></label>
                            <input type="text" id="totalVentaExtra" value="$0" 
                                   readonly class="form-control campo-calculado">
                        </div>
                        
                        <div class="form-group">
                            <label><strong>¿Ya fue pagado?</strong></label>
                            <div class="radio-group">
                                <label class="radio-option">
                                    <input type="radio" name="pagadoAhora" value="si" checked>
                                    <span>Sí, pagado ahora</span>
                                </label>
                                <label class="radio-option">
                                    <input type="radio" name="pagadoAhora" value="no">
                                    <span>No, queda pendiente</span>
                                </label>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label class="required"><strong>Nota/Observación (para auditoría):</strong></label>
                            <textarea id="notaVentaExtra" rows="3" required class="form-control"
                                      placeholder="Ej: Vendió en la calle, Cliente corporativo, etc."></textarea>
                            <small style="color: #666; display: block; margin-top: 5px;">
                                Esta nota es obligatoria para trazabilidad en auditorías
                            </small>
                        </div>
                        
                        <div class="popup-footer">
                            <button type="button" onclick="this.closest('.popup-overlay').remove()" 
                                    class="btn btn-secondary">
                                Cancelar
                            </button>
                            <button type="submit" class="btn btn-warning">
                                ✅ Registrar Venta Extra
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        document.body.appendChild(popup);
    }
    
    calcularTotalVentaExtra(precioUnitario) {
        const cantidad = parseInt(document.getElementById('cantidadVentaExtra').value) || 0;
        const total = cantidad * precioUnitario;
        document.getElementById('totalVentaExtra').value = `$${total.toLocaleString()}`;
    }
    
    registrarVentaExtra(beneficioId, bomberoId) {
        const cantidad = parseInt(document.getElementById('cantidadVentaExtra').value);
        const pagadoAhora = document.querySelector('input[name="pagadoAhora"]:checked').value === 'si';
        const nota = document.getElementById('notaVentaExtra').value.trim();
        const beneficio = this.beneficios.find(b => b.id === beneficioId);
        const usuario = getCurrentUser();
        
        // Validaciones
        if (!cantidad || cantidad < 1) {
            Utils.mostrarNotificacion('Debe ingresar una cantidad válida', 'error');
            return;
        }
        
        if (!nota || nota.length < 10) {
            Utils.mostrarNotificacion('La nota debe tener al menos 10 caracteres', 'error');
            return;
        }
        
        const ventaExtra = {
            beneficioId: beneficioId,
            bomberoId: bomberoId,
            cantidad: cantidad,
            valorUnitario: beneficio.precioTarjeta,
            total: cantidad * beneficio.precioTarjeta,
            estado: pagadoAhora ? 'pagado' : 'pendiente',
            fechaRegistro: new Date().toISOString(),
            registradoPor: usuario.username,
            nota: nota
        };
        
        if (pagadoAhora) {
            ventaExtra.fechaPago = new Date().toISOString();
            ventaExtra.pagadoPor = usuario.username;
        }
        
        // Guardar venta extra
        const ventaId = storage.saveVentaExtra(ventaExtra);
        
        if (ventaId) {
            Utils.mostrarNotificacion('✅ Venta extra registrada exitosamente', 'success');
            
            // Cerrar popup
            document.querySelector('.popup-overlay').remove();
            
            // Mostrar detalle actualizado
            this.mostrarDetalleConVentasExtra(beneficioId, bomberoId);
            
            // Actualizar dashboard
            this.actualizarDashboard();
        } else {
            Utils.mostrarNotificacion('Error al registrar venta extra', 'error');
        }
    }
    
    pagarVentaExtra(ventaExtraId, beneficioId, bomberoId) {
        const usuario = getCurrentUser();
        
        const confirmar = confirm('¿Confirmar el pago de esta venta extra?');
        if (!confirmar) return;
        
        const exito = storage.actualizarEstadoVentaExtra(ventaExtraId, 'pagado', {
            fechaPago: new Date().toISOString(),
            pagadoPor: usuario.username
        });
        
        if (exito) {
            Utils.mostrarNotificacion('✅ Venta extra pagada', 'success');
            
            // Cerrar popup y reabrir con datos actualizados
            document.querySelector('.popup-overlay').remove();
            this.mostrarDetalleConVentasExtra(beneficioId, bomberoId);
            
            // Actualizar dashboard
            this.actualizarDashboard();
        } else {
            Utils.mostrarNotificacion('Error al registrar el pago', 'error');
        }
    }
    
    exportarDetalleAuditoria(beneficioId, bomberoId) {
        const beneficio = this.beneficios.find(b => b.id === beneficioId);
        const bombero = this.bomberos.find(b => b.id === bomberoId);
        const asignacion = this.asignaciones.find(a => 
            a.beneficioId === beneficioId && a.bomberoId === bomberoId
        );
        const pagoPrincipal = this.pagosBeneficios.find(p => 
            p.beneficioId === beneficioId && p.bomberoId === bomberoId && !p.esVentaExtra
        );
        const ventasExtras = storage.getVentasExtrasPorBeneficio(beneficioId, bomberoId);
        const logAuditoria = storage.getLogAuditoria('beneficios', { beneficioId, bomberoId });
        
        const reporte = {
            fecha_reporte: new Date().toISOString(),
            beneficio: {
                nombre: beneficio.nombre,
                tipo: beneficio.tipo,
                fecha_evento: beneficio.fechaEvento,
                precio_tarjeta: beneficio.precioTarjeta
            },
            bombero: {
                nombre_completo: Utils.obtenerNombreCompleto(bombero),
                clave: bombero.claveBombero,
                rut: bombero.rut
            },
            asignacion_inicial: {
                cantidad_tarjetas: asignacion.cantidadTarjetas,
                monto_total: asignacion.montoTotal,
                estado: pagoPrincipal ? 'pagado' : 'pendiente',
                fecha_pago: pagoPrincipal ? pagoPrincipal.fechaPago : null,
                registrado_por: pagoPrincipal ? pagoPrincipal.registradoPor : null
            },
            ventas_extras: ventasExtras.map(v => ({
                id: v.id,
                cantidad: v.cantidad,
                total: v.total,
                estado: v.estado,
                fecha_registro: v.fechaRegistro,
                registrado_por: v.registradoPor,
                fecha_pago: v.fechaPago,
                pagado_por: v.pagadoPor,
                nota: v.nota
            })),
            resumen: {
                total_tarjetas: asignacion.cantidadTarjetas + ventasExtras.reduce((sum, v) => sum + v.cantidad, 0),
                total_esperado: asignacion.montoTotal + ventasExtras.reduce((sum, v) => sum + v.total, 0),
                total_pagado: (pagoPrincipal ? asignacion.montoTotal : 0) + 
                             ventasExtras.filter(v => v.estado === 'pagado').reduce((sum, v) => sum + v.total, 0),
                total_pendiente: null // Se calculará automáticamente
            },
            log_auditoria: logAuditoria
        };
        
        reporte.resumen.total_pendiente = reporte.resumen.total_esperado - reporte.resumen.total_pagado;
        
        // Exportar como JSON
        const blob = new Blob([JSON.stringify(reporte, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `auditoria_${beneficio.nombre.replace(/\s+/g, '_')}_${bombero.claveBombero}_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        Utils.mostrarNotificacion('📄 Reporte de auditoría exportado', 'success');
    }
    
    verLogAuditoriaBeneficios() {
        const logs = storage.getLogAuditoria('beneficios');
        
        const popup = document.createElement('div');
        popup.className = 'popup-overlay';
        popup.innerHTML = `
            <div class="popup-content popup-log-auditoria">
                <div class="popup-header">
                    <h3>📋 LOG DE AUDITORÍA - Beneficios</h3>
                    <button onclick="this.closest('.popup-overlay').remove()" class="btn-cerrar-popup">✕</button>
                </div>
                
                <div class="popup-body">
                    <div class="log-stats">
                        <strong>Total de registros:</strong> ${logs.length}<br>
                        <strong>Última actividad:</strong> ${logs.length > 0 ? Utils.formatearFecha(logs[0].fecha) : 'N/A'}
                    </div>
                    
                    <div class="log-list">
                        ${logs.length === 0 ? '<p>No hay registros en el log de auditoría</p>' : 
                            logs.slice(0, 50).map(log => `
                                <div class="log-entry">
                                    <div class="log-header">
                                        <strong>${Utils.formatearFecha(log.fecha)}</strong>
                                        <span class="log-accion">${log.accion.replace(/_/g, ' ').toUpperCase()}</span>
                                    </div>
                                    <div class="log-detalles">
                                        <strong>Usuario:</strong> ${log.usuario}<br>
                                        <strong>Detalle:</strong> ${log.detalles}
                                        ${log.nota ? `<br><strong>Nota:</strong> <em>${log.nota}</em>` : ''}
                                    </div>
                                </div>
                            `).join('')
                        }
                        ${logs.length > 50 ? `<p style="text-align: center; color: #666; margin-top: 20px;">Mostrando los 50 registros más recientes de ${logs.length} totales</p>` : ''}
                    </div>
                </div>
                
                <div class="popup-footer">
                    <button onclick="storage.exportarLogAuditoria('beneficios')" 
                            class="btn btn-info">
                        📥 Exportar Log Completo
                    </button>
                    <button onclick="this.closest('.popup-overlay').remove()" 
                            class="btn btn-secondary">
                        Cerrar
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(popup);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.pagarBeneficioSistema = new SistemaPagarBeneficio();
});