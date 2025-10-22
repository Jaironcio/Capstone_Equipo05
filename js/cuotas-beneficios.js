// ==================== SISTEMA DE CUOTAS Y BENEFICIOS ====================
class SistemaCuotasBeneficios {
    constructor() {
        this.bomberoActual = null;
        this.cuotas = [];
        this.beneficios = [];
        this.pagosCuotas = [];
        this.pagosBeneficios = [];
        this.tabActual = 'cuotas';
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
        this.aplicarPermisosUI();
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
        
        contenedor.innerHTML = `
            <div><strong>Nombre:</strong> <span>${this.bomberoActual.nombre}</span></div>
            <div><strong>Clave:</strong> <span>${this.bomberoActual.claveBombero}</span></div>
            <div><strong>RUN:</strong> <span>${this.bomberoActual.run}</span></div>
            <div><strong>Compañía:</strong> <span>${this.bomberoActual.compania}</span></div>
        `;

        document.getElementById('bomberoCuotaId').value = this.bomberoActual.id;
        document.getElementById('bomberoBeneficioId').value = this.bomberoActual.id;
    }

    cargarDatos() {
        this.beneficios = storage.getBeneficios();
        this.pagosCuotas = storage.getPagosCuotas();
        this.pagosBeneficios = storage.getPagosBeneficios();
    }

    configurarInterfaz() {
        // Formulario de cuota social
        document.getElementById('formCuotaSocial').addEventListener('submit', (e) => {
            this.manejarSubmitCuota(e);
        });

        // Formulario crear beneficio
        document.getElementById('formCrearBeneficio').addEventListener('submit', (e) => {
            this.manejarSubmitCrearBeneficio(e);
        });

        // Formulario pago beneficio
        document.getElementById('formPagoBeneficio').addEventListener('submit', (e) => {
            this.manejarSubmitPagoBeneficio(e);
        });

        // Fecha automática
        const hoy = new Date().toISOString().split('T')[0];
        document.getElementById('fechaPagoCuota').value = hoy;
        document.getElementById('fechaPagoBeneficio').value = hoy;
        
        // Año actual
        document.getElementById('anioCuota').value = this.anioActual;
    }

    aplicarPermisosUI() {
        const permisos = getUserPermissions();
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        
        // Solo administradores pueden crear beneficios
        const adminSection = document.getElementById('adminBeneficios');
        if (adminSection) {
            if (currentUser.role === 'Director' || currentUser.role === 'Super Administrador' || currentUser.role === 'Tesorero') {
                adminSection.style.display = 'block';
            } else {
                adminSection.style.display = 'none';
            }
        }
    }

    // ==================== GESTIÓN DE TABS ====================
    cambiarTab(tab) {
        this.tabActual = tab;
        
        // Actualizar botones
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        event.target.classList.add('active');
        
        // Actualizar contenido
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        document.getElementById(`tab${tab.charAt(0).toUpperCase() + tab.slice(1)}`).classList.add('active');
        
        // Renderizar según tab
        if (tab === 'cuotas') {
            this.renderizarGridMeses();
            this.renderizarHistorialCuotas();
        } else if (tab === 'beneficios') {
            this.cargarBeneficiosEnSelect();
            this.renderizarBeneficiosActivos();
            this.renderizarHistorialBeneficios();
        } else if (tab === 'deudas') {
            this.renderizarEstadoDeudas();
        }
    }

    // ==================== CUOTAS SOCIALES ====================
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
            this.limpiarFormularioCuota();
            this.renderizarGridMeses();
            this.renderizarHistorialCuotas();
            
            // Sumar al pozo total de finanzas
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
        
        // Verificar si ya existe pago para ese mes/año
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

    renderizarGridMeses() {
        const grid = document.getElementById('gridMesesCuotas');
        const meses = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];

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
        const pagosBombero = this.pagosCuotas
            .filter(p => p.bomberoId == this.bomberoActual.id)
            .sort((a, b) => new Date(b.fechaPago) - new Date(a.fechaPago));

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

    // ==================== BENEFICIOS ====================
    async manejarSubmitCrearBeneficio(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const datos = Object.fromEntries(formData);
        
        const errores = this.validarDatosBeneficio(datos);
        if (errores.length > 0) {
            Utils.mostrarNotificacion('Errores: ' + errores.join(', '), 'error');
            return;
        }

        try {
            await this.guardarBeneficio(datos);
            Utils.mostrarNotificacion('Beneficio creado exitosamente', 'success');
            this.limpiarFormularioBeneficio();
            this.cargarBeneficiosEnSelect();
            this.renderizarBeneficiosActivos();
        } catch (error) {
            Utils.mostrarNotificacion(error.message, 'error');
        }
    }

    validarDatosBeneficio(datos) {
        const errores = [];
        
        if (!datos.tipoBeneficio) errores.push('Debe seleccionar tipo de beneficio');
        if (!datos.nombreBeneficio) errores.push('Debe ingresar nombre del evento');
        if (!datos.fechaEvento) errores.push('Debe ingresar fecha del evento');
        if (!datos.fechaLimiteRendicion) errores.push('Debe ingresar fecha límite de rendición');
        if (!datos.cantidadTarjetas || parseInt(datos.cantidadTarjetas) <= 0) errores.push('Cantidad de tarjetas inválida');
        if (!datos.precioTarjeta || parseFloat(datos.precioTarjeta) <= 0) errores.push('Precio de tarjeta inválido');
        
        if (new Date(datos.fechaLimiteRendicion) < new Date(datos.fechaEvento)) {
            errores.push('La fecha límite debe ser posterior a la fecha del evento');
        }
        
        return errores;
    }

    async guardarBeneficio(datos) {
        const beneficio = {
            id: this.generarId(),
            tipo: datos.tipoBeneficio,
            nombre: datos.nombreBeneficio,
            fechaEvento: datos.fechaEvento,
            fechaLimiteRendicion: datos.fechaLimiteRendicion,
            cantidadTarjetas: parseInt(datos.cantidadTarjetas),
            precioTarjeta: parseFloat(datos.precioTarjeta),
            descripcion: datos.descripcionBeneficio || null,
            estado: 'activo',
            creadoPor: JSON.parse(localStorage.getItem('currentUser')).username,
            fechaCreacion: new Date().toISOString()
        };

        this.beneficios.push(beneficio);
        this.guardarDatos();
    }

    cargarBeneficiosEnSelect() {
        const select = document.getElementById('beneficioSeleccionado');
        const beneficiosActivos = this.beneficios.filter(b => b.estado === 'activo');
        
        select.innerHTML = '<option value="">Seleccione un beneficio</option>';
        
        beneficiosActivos.forEach(b => {
            const option = document.createElement('option');
            option.value = b.id;
            option.textContent = `${b.nombre} - ${b.tipo}`;
            select.appendChild(option);
        });
    }

    cambioBeneficioSeleccionado() {
        const beneficioId = document.getElementById('beneficioSeleccionado').value;
        const infoDiv = document.getElementById('infoBeneficioSeleccionado');
        
        if (!beneficioId) {
            infoDiv.style.display = 'none';
            document.getElementById('montoPagoBeneficio').value = '';
            return;
        }

        const beneficio = this.beneficios.find(b => b.id === beneficioId);
        if (!beneficio) return;

        document.getElementById('infoTarjetasAsignadas').textContent = beneficio.cantidadTarjetas;
        document.getElementById('infoPrecioTarjeta').textContent = this.formatearMonto(beneficio.precioTarjeta);
        document.getElementById('infoTotalEsperado').textContent = this.formatearMonto(beneficio.cantidadTarjetas * beneficio.precioTarjeta);
        document.getElementById('infoFechaLimite').textContent = Utils.formatearFecha(beneficio.fechaLimiteRendicion);
        
        infoDiv.style.display = 'block';
        
        // Calcular monto al cambiar tarjetas vendidas
        document.getElementById('tarjetasVendidas').addEventListener('input', () => {
            this.calcularMontoBeneficio();
        });
    }

    calcularMontoBeneficio() {
        const beneficioId = document.getElementById('beneficioSeleccionado').value;
        const tarjetasVendidas = parseInt(document.getElementById('tarjetasVendidas').value) || 0;
        
        if (!beneficioId) return;
        
        const beneficio = this.beneficios.find(b => b.id === beneficioId);
        if (!beneficio) return;
        
        const monto = tarjetasVendidas * beneficio.precioTarjeta;
        document.getElementById('montoPagoBeneficio').value = monto;
    }

    async manejarSubmitPagoBeneficio(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const datos = Object.fromEntries(formData);
        
        const errores = this.validarDatosPagoBeneficio(datos);
        if (errores.length > 0) {
            Utils.mostrarNotificacion('Errores: ' + errores.join(', '), 'error');
            return;
        }

        try {
            await this.guardarPagoBeneficio(datos);
            Utils.mostrarNotificacion('Pago de beneficio registrado exitosamente', 'success');
            this.limpiarFormularioPagoBeneficio();
            this.renderizarHistorialBeneficios();
            
            // Sumar al pozo total de finanzas
            const beneficio = this.beneficios.find(b => b.id === datos.beneficioSeleccionado);
            await this.registrarIngresoFinanzas({
                monto: parseFloat(datos.montoPagoBeneficio),
                tipo: 'Beneficio',
                descripcion: `Pago beneficio ${beneficio.nombre} - ${this.bomberoActual.nombre}`,
                fecha: datos.fechaPagoBeneficio
            });
            
        } catch (error) {
            Utils.mostrarNotificacion(error.message, 'error');
        }
    }

    validarDatosPagoBeneficio(datos) {
        const errores = [];
        
        if (!datos.beneficioSeleccionado) errores.push('Debe seleccionar un beneficio');
        if (!datos.tarjetasVendidas || parseInt(datos.tarjetasVendidas) < 0) errores.push('Cantidad de tarjetas inválida');
        if (!datos.montoPagoBeneficio || parseFloat(datos.montoPagoBeneficio) < 0) errores.push('Monto inválido');
        if (!datos.fechaPagoBeneficio) errores.push('Debe ingresar la fecha de pago');
        
        return errores;
    }

    async guardarPagoBeneficio(datos) {
        const beneficio = this.beneficios.find(b => b.id === datos.beneficioSeleccionado);
        
        const pagoBeneficio = {
            id: this.generarId(),
            bomberoId: parseInt(datos.bomberoBeneficioId),
            beneficioId: datos.beneficioSeleccionado,
            beneficioNombre: beneficio.nombre,
            tarjetasAsignadas: beneficio.cantidadTarjetas,
            tarjetasVendidas: parseInt(datos.tarjetasVendidas),
            precioTarjeta: beneficio.precioTarjeta,
            montoPagado: parseFloat(datos.montoPagoBeneficio),
            montoEsperado: beneficio.cantidadTarjetas * beneficio.precioTarjeta,
            fechaPago: datos.fechaPagoBeneficio,
            observaciones: datos.observacionesBeneficio || null,
            registradoPor: JSON.parse(localStorage.getItem('currentUser')).username,
            fechaRegistro: new Date().toISOString()
        };

        this.pagosBeneficios.push(pagoBeneficio);
        this.guardarDatos();
    }

    renderizarBeneficiosActivos() {
        const lista = document.getElementById('listaBeneficiosActivos');
        const beneficiosActivos = this.beneficios.filter(b => b.estado === 'activo');

        if (beneficiosActivos.length === 0) {
            lista.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">No hay beneficios activos</p>';
            return;
        }

        lista.innerHTML = beneficiosActivos.map(b => {
            const hoy = new Date();
            const fechaLimite = new Date(b.fechaLimiteRendicion);
            let estadoClass = 'activo';
            let estadoTexto = 'Activo';
            
            if (fechaLimite < hoy) {
                estadoClass = 'vencido';
                estadoTexto = 'Vencido';
            }

            return `
                <div class="beneficio-card">
                    <div class="beneficio-header">
                        <div class="beneficio-tipo">${b.tipo} - ${b.nombre}</div>
                        <div class="beneficio-estado ${estadoClass}">${estadoTexto}</div>
                    </div>
                    <div class="item-info">
                        <div><strong>Fecha evento:</strong> <span>${Utils.formatearFecha(b.fechaEvento)}</span></div>
                        <div><strong>Fecha límite:</strong> <span>${Utils.formatearFecha(b.fechaLimiteRendicion)}</span></div>
                        <div><strong>Tarjetas por voluntario:</strong> <span>${b.cantidadTarjetas}</span></div>
                        <div><strong>Precio por tarjeta:</strong> <span>${this.formatearMonto(b.precioTarjeta)}</span></div>
                        <div><strong>Total esperado:</strong> <span>${this.formatearMonto(b.cantidadTarjetas * b.precioTarjeta)}</span></div>
                        ${b.descripcion ? `<div class="full-width"><strong>Descripción:</strong> <span>${b.descripcion}</span></div>` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    renderizarHistorialBeneficios() {
        const lista = document.getElementById('listaPagosBeneficios');
        const pagosBombero = this.pagosBeneficios
            .filter(p => p.bomberoId == this.bomberoActual.id)
            .sort((a, b) => new Date(b.fechaPago) - new Date(a.fechaPago));

        if (pagosBombero.length === 0) {
            lista.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">No hay pagos de beneficios registrados</p>';
            return;
        }

        lista.innerHTML = pagosBombero.map(pago => {
            const esCompleto = pago.montoPagado >= pago.montoEsperado;
            
            return `
                <div class="pago-card">
                    <div class="pago-header">
                        <div><strong>${pago.beneficioNombre}</strong></div>
                        <div class="pago-monto">${this.formatearMonto(pago.montoPagado)}</div>
                    </div>
                    <div class="item-info">
                        <div><strong>Tarjetas asignadas:</strong> <span>${pago.tarjetasAsignadas}</span></div>
                        <div><strong>Tarjetas vendidas:</strong> <span>${pago.tarjetasVendidas}</span></div>
                        <div><strong>Monto esperado:</strong> <span>${this.formatearMonto(pago.montoEsperado)}</span></div>
                        <div><strong>Estado:</strong> <span style="color: ${esCompleto ? '#4caf50' : '#f44336'}">${esCompleto ? '✓ Completo' : '⚠ Incompleto'}</span></div>
                        <div><strong>Fecha de pago:</strong> <span>${Utils.formatearFecha(pago.fechaPago)}</span></div>
                        ${pago.observaciones ? `<div class="full-width"><strong>Observaciones:</strong> <span>${pago.observaciones}</span></div>` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    // ==================== ESTADO DE DEUDAS ====================
    renderizarEstadoDeudas() {
        const deudaCuotas = this.calcularDeudaCuotas();
        const deudaBeneficios = this.calcularDeudaBeneficios();
        const deudaTotal = deudaCuotas.monto + deudaBeneficios.monto;

        document.getElementById('deudaCuotas').textContent = this.formatearMonto(deudaCuotas.monto);
        document.getElementById('detalleCuotasDeuda').textContent = `${deudaCuotas.mesesPendientes} meses pendientes`;
        
        document.getElementById('deudaBeneficios').textContent = this.formatearMonto(deudaBeneficios.monto);
        document.getElementById('detalleBeneficiosDeuda').textContent = `${deudaBeneficios.beneficiosPendientes} beneficios pendientes`;
        
        document.getElementById('deudaTotal').textContent = this.formatearMonto(deudaTotal);

        // Renderizar detalle de deudas
        const contenedor = document.getElementById('deudasDetalladas');
        let html = '';

        if (deudaCuotas.detalle.length > 0) {
            html += '<h4>Cuotas Pendientes:</h4>';
            deudaCuotas.detalle.forEach(d => {
                html += `
                    <div class="deuda-item">
                        <h5>Cuota ${d.mes} ${d.anio}</h5>
                        <p>Monto: ${this.formatearMonto(d.monto)}</p>
                    </div>
                `;
            });
        }

        if (deudaBeneficios.detalle.length > 0) {
            html += '<h4 style="margin-top: 20px;">Beneficios Pendientes:</h4>';
            deudaBeneficios.detalle.forEach(d => {
                html += `
                    <div class="deuda-item">
                        <h5>${d.nombre}</h5>
                        <p>Monto pendiente: ${this.formatearMonto(d.montoPendiente)}</p>
                        <p>Fecha límite: ${Utils.formatearFecha(d.fechaLimite)}</p>
                        ${d.vencido ? '<p style="color: #f44336; font-weight: bold;">⚠ VENCIDO</p>' : ''}
                    </div>
                `;
            });
        }

        if (deudaTotal === 0) {
            html = '<p style="text-align: center; color: #4caf50; font-size: 1.2rem; padding: 20px;">✓ No hay deudas pendientes</p>';
        }

        contenedor.innerHTML = html;
    }

    calcularDeudaCuotas() {
        const hoy = new Date();
        const mesActual = hoy.getMonth() + 1;
        const anioActual = hoy.getFullYear();
        
        let monto = 0;
        let mesesPendientes = 0;
        let detalle = [];

        // Calcular cuotas pendientes del año actual
        for (let mes = 1; mes <= mesActual; mes++) {
            const pagado = this.pagosCuotas.find(p => 
                p.bomberoId == this.bomberoActual.id && 
                p.mes == mes && 
                p.anio == anioActual
            );

            if (!pagado) {
                monto += 5000; // Asumiendo cuota regular
                mesesPendientes++;
                detalle.push({
                    mes: this.obtenerNombreMes(mes),
                    anio: anioActual,
                    monto: 5000
                });
            }
        }

        return { monto, mesesPendientes, detalle };
    }

    calcularDeudaBeneficios() {
        const hoy = new Date();
        let monto = 0;
        let beneficiosPendientes = 0;
        let detalle = [];

        const beneficiosActivos = this.beneficios.filter(b => b.estado === 'activo');

        beneficiosActivos.forEach(b => {
            const pago = this.pagosBeneficios.find(p => 
                p.bomberoId == this.bomberoActual.id && 
                p.beneficioId === b.id
            );

            const montoEsperado = b.cantidadTarjetas * b.precioTarjeta;
            const montoPagado = pago ? pago.montoPagado : 0;
            const montoPendiente = montoEsperado - montoPagado;

            if (montoPendiente > 0) {
                monto += montoPendiente;
                beneficiosPendientes++;
                detalle.push({
                    nombre: b.nombre,
                    montoPendiente: montoPendiente,
                    fechaLimite: b.fechaLimiteRendicion,
                    vencido: new Date(b.fechaLimiteRendicion) < hoy
                });
            }
        });

        return { monto, beneficiosPendientes, detalle };
    }

  // ==================== REGISTRO EN FINANZAS ====================
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

    // ==================== UTILIDADES ====================
    generarId() {
        return Date.now() + Math.random().toString(36).substr(2, 9);
    }

    guardarDatos() {
        storage.saveBeneficios(this.beneficios);
        storage.savePagosCuotas(this.pagosCuotas);
        storage.savePagosBeneficios(this.pagosBeneficios);
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

    renderizarTodo() {
        this.renderizarGridMeses();
        this.renderizarHistorialCuotas();
        this.cargarBeneficiosEnSelect();
        this.renderizarBeneficiosActivos();
        this.renderizarHistorialBeneficios();
    }

    limpiarFormularioCuota() {
        document.getElementById('formCuotaSocial').reset();
        document.getElementById('bomberoCuotaId').value = this.bomberoActual.id;
        document.getElementById('anioCuota').value = this.anioActual;
        document.getElementById('fechaPagoCuota').value = new Date().toISOString().split('T')[0];
    }

    limpiarFormularioBeneficio() {
        document.getElementById('formCrearBeneficio').reset();
    }

    limpiarFormularioPagoBeneficio() {
        document.getElementById('formPagoBeneficio').reset();
        document.getElementById('bomberoBeneficioId').value = this.bomberoActual.id;
        document.getElementById('fechaPagoBeneficio').value = new Date().toISOString().split('T')[0];
        document.getElementById('infoBeneficioSeleccionado').style.display = 'none';
    }

    async exportarExcel() {
        try {
            const cuotasBombero = this.pagosCuotas.filter(p => p.bomberoId == this.bomberoActual.id);
            const beneficiosBombero = this.pagosBeneficios.filter(p => p.bomberoId == this.bomberoActual.id);
            
            const datosExcel = [];
            
            // Sección de cuotas
            datosExcel.push({
                'Tipo': 'CUOTAS SOCIALES',
                'Detalle': '',
                'Fecha': '',
                'Monto': ''
            });
            
            cuotasBombero.forEach(c => {
                datosExcel.push({
                    'Tipo': 'Cuota Social',
                    'Detalle': `${this.obtenerNombreMes(c.mes)} ${c.anio}`,
                    'Fecha': Utils.formatearFecha(c.fechaPago),
                    'Monto': c.monto
                });
            });
            
            datosExcel.push({});
            
            // Sección de beneficios
            datosExcel.push({
                'Tipo': 'BENEFICIOS',
                'Detalle': '',
                'Fecha': '',
                'Monto': ''
            });
            
            beneficiosBombero.forEach(b => {
                datosExcel.push({
                    'Tipo': 'Beneficio',
                    'Detalle': b.beneficioNombre,
                    'Fecha': Utils.formatearFecha(b.fechaPago),
                    'Monto': b.montoPagado
                });
            });

            await Utils.exportarAExcel(
                datosExcel,
                `Cuotas_Beneficios_${this.bomberoActual.claveBombero}_${new Date().toISOString().split('T')[0]}.xlsx`,
                'Cuotas y Beneficios'
            );

            Utils.mostrarNotificacion('Excel descargado exitosamente', 'success');
        } catch (error) {
            Utils.mostrarNotificacion('Error al generar Excel: ' + error.message, 'error');
        }
    }

    volverAlSistema() {
        localStorage.removeItem('bomberoCuotasActual');
        window.location.href = 'sistema.html';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.cuotasSistema = new SistemaCuotasBeneficios();
});