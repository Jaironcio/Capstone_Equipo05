// ==================== SISTEMA DE ADMINISTRACIÓN DE BENEFICIOS MEJORADO ====================
class SistemaBeneficios {
    constructor() {
        this.beneficios = [];
        this.asignaciones = [];
        this.pagosBeneficios = [];
        this.bomberos = [];
        this.filtroEstado = 'todos';
        this.filtroAnio = 'todos';
        this.graficoDeudores = null;
        this.graficoEficiencia = null;
        this.init();
    }

    async init() {
        if (!checkAuth()) {
            window.location.href = 'index.html';
            return;
        }

        this.cargarDatos();
        this.configurarInterfaz();
        this.aplicarPermisosUI();
        this.cargarFiltroAnios();
        this.renderizarTodo();
        this.actualizarDashboard();
        this.renderizarGraficos();
    }

    cargarDatos() {
        this.beneficios = storage.getBeneficios();
        this.asignaciones = storage.getAsignacionesBeneficios();
        this.pagosBeneficios = storage.getPagosBeneficios();
        this.bomberos = storage.getBomberos();
    }

    configurarInterfaz() {
        document.getElementById('formCrearBeneficio').addEventListener('submit', (e) => {
            this.manejarSubmitBeneficio(e);
        });
    }

    aplicarPermisosUI() {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        const puedeCrear = currentUser.role === 'Director' || 
                          currentUser.role === 'Super Administrador' || 
                          currentUser.role === 'Tesorero';
        
        if (!puedeCrear) {
            document.querySelector('.form-container').style.display = 'none';
        }
    }

    // ==================== FILTROS ====================
    cargarFiltroAnios() {
        const select = document.getElementById('filtroAnio');
        const anios = [...new Set(this.beneficios.map(b => new Date(b.fechaEvento).getFullYear()))];
        anios.sort((a, b) => b - a);
        
        anios.forEach(anio => {
            const option = document.createElement('option');
            option.value = anio;
            option.textContent = anio;
            select.appendChild(option);
        });
    }

    aplicarFiltros() {
        this.filtroEstado = document.getElementById('filtroBeneficios').value;
        this.filtroAnio = document.getElementById('filtroAnio').value;
        this.renderizarBeneficios();
    }

    // ==================== CREAR BENEFICIO ====================
    async manejarSubmitBeneficio(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const datos = Object.fromEntries(formData);
        
        const errores = this.validarDatosBeneficio(datos);
        if (errores.length > 0) {
            Utils.mostrarNotificacion('Errores: ' + errores.join(', '), 'error');
            return;
        }

        try {
            await this.crearBeneficioYAsignar(datos);
            Utils.mostrarNotificacion('Beneficio creado y asignado exitosamente', 'success');
            this.limpiarFormulario();
            this.renderizarTodo();
            this.actualizarDashboard();
            this.renderizarGraficos();
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
        if (!datos.precioTarjeta || parseFloat(datos.precioTarjeta) <= 0) errores.push('Precio de tarjeta inválido');
        
        if (new Date(datos.fechaLimiteRendicion) < new Date(datos.fechaEvento)) {
            errores.push('La fecha límite debe ser posterior a la fecha del evento');
        }
        
        const tieneAsignacion = parseInt(datos.tarjetasVoluntarios) > 0 ||
                               parseInt(datos.tarjetasHonorariosCia) > 0 ||
                               parseInt(datos.tarjetasHonorariosCuerpo) > 0 ||
                               parseInt(datos.tarjetasInsignes) > 0;
        
        if (!tieneAsignacion) {
            errores.push('Debe asignar tarjetas a al menos una categoría');
        }
        
        return errores;
    }

    async crearBeneficioYAsignar(datos) {
        const beneficioId = this.generarId();
        const beneficio = {
            id: beneficioId,
            tipo: datos.tipoBeneficio,
            nombre: datos.nombreBeneficio,
            fechaEvento: datos.fechaEvento,
            fechaLimiteRendicion: datos.fechaLimiteRendicion,
            precioTarjeta: parseFloat(datos.precioTarjeta),
            tarjetasPorCategoria: {
                voluntarios: parseInt(datos.tarjetasVoluntarios),
                honorariosCia: parseInt(datos.tarjetasHonorariosCia),
                honorariosCuerpo: parseInt(datos.tarjetasHonorariosCuerpo),
                insignes: parseInt(datos.tarjetasInsignes)
            },
            descripcion: datos.descripcionBeneficio || null,
            estado: 'activo',
            creadoPor: JSON.parse(localStorage.getItem('currentUser')).username,
            fechaCreacion: new Date().toISOString()
        };

        this.beneficios.push(beneficio);

        this.bomberos.forEach(bombero => {
            const categoria = this.obtenerCategoriaBombero(bombero);
            const tarjetasAsignadas = beneficio.tarjetasPorCategoria[categoria];
            
            if (tarjetasAsignadas > 0) {
                const asignacion = {
                    id: this.generarId(),
                    beneficioId: beneficioId,
                    bomberoId: bombero.id,
                    nombreBombero: bombero.nombre,
                    claveBombero: bombero.claveBombero,
                    categoria: categoria,
                    tarjetasAsignadas: tarjetasAsignadas,
                    tarjetasVendidas: 0,
                    montoPagado: 0,
                    montoEsperado: tarjetasAsignadas * beneficio.precioTarjeta,
                    estadoPago: 'pendiente',
                    fechaAsignacion: new Date().toISOString()
                };
                
                this.asignaciones.push(asignacion);
            }
        });

        this.guardarDatos();
    }

    obtenerCategoriaBombero(bombero) {
        const antiguedad = Utils.calcularAntiguedadDetallada(bombero.fechaIngreso);
        const anosCompletos = antiguedad.años;
        
        if (anosCompletos < 20) return 'voluntarios';
        else if (anosCompletos >= 20 && anosCompletos <= 24) return 'honorariosCia';
        else if (anosCompletos >= 25 && anosCompletos <= 49) return 'honorariosCuerpo';
        else return 'insignes';
    }

    // ==================== DASHBOARD MEJORADO ====================
    actualizarDashboard() {
        const beneficiosActivos = this.beneficios.filter(b => b.estado === 'activo');
        
        const asignacionesActivas = this.asignaciones.filter(a => {
            const beneficio = this.beneficios.find(b => b.id === a.beneficioId);
            return beneficio && beneficio.estado === 'activo';
        });
        
        const totalEsperado = asignacionesActivas.reduce((sum, a) => sum + a.montoEsperado, 0);
        const totalRecaudado = asignacionesActivas.reduce((sum, a) => sum + a.montoPagado, 0);
        const totalDeudores = asignacionesActivas.filter(a => 
            a.estadoPago === 'pendiente' || a.estadoPago === 'parcial'
        ).length;
        
        const eficiencia = totalEsperado > 0 ? (totalRecaudado / totalEsperado) * 100 : 0;
        const porcentajeDeudores = asignacionesActivas.length > 0 ? 
            (totalDeudores / asignacionesActivas.length) * 100 : 0;

        document.getElementById('totalBeneficiosActivos').textContent = beneficiosActivos.length;
        document.getElementById('totalEsperado').textContent = this.formatearMonto(totalEsperado);
        document.getElementById('totalRecaudado').textContent = this.formatearMonto(totalRecaudado);
        document.getElementById('totalDeudores').textContent = totalDeudores;
        
        document.getElementById('porcentajeEsperado').textContent = '100%';
        document.getElementById('porcentajeRecaudado').textContent = `${eficiencia.toFixed(1)}%`;
        document.getElementById('porcentajeDeudores').textContent = `${porcentajeDeudores.toFixed(1)}%`;
        document.getElementById('eficienciaGeneral').textContent = `${eficiencia.toFixed(1)}%`;
        
        const progressBar = document.getElementById('progressBeneficiosActivos');
        const porcentajeActivos = this.beneficios.length > 0 ? 
            (beneficiosActivos.length / this.beneficios.length) * 100 : 0;
        progressBar.style.width = `${porcentajeActivos}%`;
        
        const trendElement = document.getElementById('trendEficiencia');
        if (eficiencia >= 80) {
            trendElement.textContent = '📈 Excelente';
            trendElement.style.color = '#4caf50';
        } else if (eficiencia >= 50) {
            trendElement.textContent = '📊 Regular';
            trendElement.style.color = '#ff9800';
        } else {
            trendElement.textContent = '📉 Bajo';
            trendElement.style.color = '#f44336';
        }
    }

    // ==================== RENDERIZADO MEJORADO ====================
    renderizarTodo() {
        this.renderizarBeneficios();
    }

    renderizarBeneficios() {
        const lista = document.getElementById('listaBeneficios');
        const total = document.getElementById('totalBeneficios');
        const mostrados = document.getElementById('totalBeneficiosMostrados');
        
        let beneficiosFiltrados = [...this.beneficios];
        
        if (this.filtroEstado !== 'todos') {
            beneficiosFiltrados = beneficiosFiltrados.filter(b => {
                if (this.filtroEstado === 'vencido') {
                    const hoy = new Date();
                    const fechaLimite = new Date(b.fechaLimiteRendicion);
                    return b.estado === 'activo' && fechaLimite < hoy;
                }
                return b.estado === this.filtroEstado;
            });
        }
        
        if (this.filtroAnio !== 'todos') {
            beneficiosFiltrados = beneficiosFiltrados.filter(b => 
                new Date(b.fechaEvento).getFullYear() == this.filtroAnio
            );
        }
        
        beneficiosFiltrados.sort((a, b) => new Date(b.fechaEvento) - new Date(a.fechaEvento));
        
        total.textContent = this.beneficios.length;
        mostrados.textContent = beneficiosFiltrados.length;

        if (beneficiosFiltrados.length === 0) {
            lista.innerHTML = '<div class="empty-state"><p>📭 No hay beneficios que coincidan con los filtros</p></div>';
            return;
        }

        lista.innerHTML = beneficiosFiltrados.map((b, index) => 
            this.generarHTMLBeneficioCard(b, index + 1)
        ).join('');
    }

    generarHTMLBeneficioCard(beneficio, numero) {
        const hoy = new Date();
        const fechaLimite = new Date(beneficio.fechaLimiteRendicion);
        let estadoClass = beneficio.estado;
        let estadoTexto = beneficio.estado.charAt(0).toUpperCase() + beneficio.estado.slice(1);
        
        if (beneficio.estado === 'activo' && fechaLimite < hoy) {
            estadoClass = 'vencido';
            estadoTexto = 'Vencido';
        }

        const asignacionesBeneficio = this.asignaciones.filter(a => a.beneficioId === beneficio.id);
        const totalAsignados = asignacionesBeneficio.length;
        const totalPagados = asignacionesBeneficio.filter(a => a.estadoPago === 'pagado').length;
        const totalDeudores = asignacionesBeneficio.filter(a => 
            a.estadoPago === 'pendiente' || a.estadoPago === 'parcial'
        ).length;
        
        const totalEsperado = asignacionesBeneficio.reduce((sum, a) => sum + a.montoEsperado, 0);
        const totalRecaudado = asignacionesBeneficio.reduce((sum, a) => sum + a.montoPagado, 0);
        const eficiencia = totalEsperado > 0 ? (totalRecaudado / totalEsperado) * 100 : 0;

        return `
            <div class="beneficio-card-modern" data-beneficio-id="${beneficio.id}">
                <div class="beneficio-numero">#${numero}</div>
                
                <div class="beneficio-header-modern">
                    <div class="beneficio-titulo-modern">
                        <h4>${beneficio.nombre}</h4>
                        <span class="beneficio-tipo-badge">${beneficio.tipo}</span>
                    </div>
                    <div class="beneficio-estado-modern ${estadoClass}">${estadoTexto}</div>
                </div>

                <div class="beneficio-stats-grid">
                    <div class="mini-stat">
                        <div class="mini-stat-label">Asignados</div>
                        <div class="mini-stat-value">${totalAsignados}</div>
                    </div>
                    <div class="mini-stat success">
                        <div class="mini-stat-label">Pagados</div>
                        <div class="mini-stat-value">${totalPagados}</div>
                    </div>
                    <div class="mini-stat danger">
                        <div class="mini-stat-label">Deudores</div>
                        <div class="mini-stat-value">${totalDeudores}</div>
                    </div>
                    <div class="mini-stat">
                        <div class="mini-stat-label">Eficiencia</div>
                        <div class="mini-stat-value">${eficiencia.toFixed(0)}%</div>
                    </div>
                </div>

                <div class="beneficio-progress">
                    <div class="progress-label">
                        <span>${this.formatearMonto(totalRecaudado)}</span>
                        <span>${this.formatearMonto(totalEsperado)}</span>
                    </div>
                    <div class="progress-bar-container">
                        <div class="progress-bar-fill" style="width: ${eficiencia}%"></div>
                    </div>
                </div>

                <div class="beneficio-meta">
                    <div class="meta-item">
                        <span class="meta-icon">📅</span>
                        <span>${Utils.formatearFecha(beneficio.fechaEvento)}</span>
                    </div>
                    <div class="meta-item">
                        <span class="meta-icon">⏰</span>
                        <span>Límite: ${Utils.formatearFecha(beneficio.fechaLimiteRendicion)}</span>
                    </div>
                    <div class="meta-item">
                        <span class="meta-icon">💵</span>
                        <span>${this.formatearMonto(beneficio.precioTarjeta)}/tarjeta</span>
                    </div>
                </div>

                <div class="beneficio-actions">
                    <button class="btn-action btn-dashboard" onclick="beneficiosSistema.verDashboardBeneficio('${beneficio.id}')">
                        📊 Dashboard
                    </button>
                    <button class="btn-action btn-deudores" onclick="beneficiosSistema.verDeudores('${beneficio.id}')">
                        ⚠️ Deudores (${totalDeudores})
                    </button>
                    ${beneficio.estado === 'activo' ? `
                        <button class="btn-action btn-cerrar" onclick="beneficiosSistema.cerrarBeneficio('${beneficio.id}')">
                            🔒 Cerrar
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }

    // ==================== DASHBOARD INDIVIDUAL ====================
    verDashboardBeneficio(beneficioId) {
        const beneficio = this.beneficios.find(b => b.id === beneficioId);
        if (!beneficio) return;

        const asignaciones = this.asignaciones.filter(a => a.beneficioId === beneficioId);
        
        const modal = document.createElement('div');
        modal.className = 'modal-dashboard';
        modal.innerHTML = `
            <div class="modal-dashboard-content">
                <div class="dashboard-header">
                    <h2>📊 Dashboard: ${beneficio.nombre}</h2>
                    <button class="btn-cerrar-modal" onclick="this.closest('.modal-dashboard').remove()">✕</button>
                </div>
                
                <div class="dashboard-body">
                    ${this.generarDashboardHTML(beneficio, asignaciones)}
                </div>
            </div>
        `;

        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            padding: 20px;
            overflow-y: auto;
        `;

        document.body.appendChild(modal);
    }
generarDashboardHTML(beneficio, asignaciones) {
        const totalAsignados = asignaciones.length;
        const pagados = asignaciones.filter(a => a.estadoPago === 'pagado');
        const parciales = asignaciones.filter(a => a.estadoPago === 'parcial');
        const pendientes = asignaciones.filter(a => a.estadoPago === 'pendiente');
        
        const totalEsperado = asignaciones.reduce((sum, a) => sum + a.montoEsperado, 0);
        const totalRecaudado = asignaciones.reduce((sum, a) => sum + a.montoPagado, 0);
        const eficiencia = totalEsperado > 0 ? (totalRecaudado / totalEsperado) * 100 : 0;

        // Agrupar por categoría
        const porCategoria = {
            voluntarios: asignaciones.filter(a => a.categoria === 'voluntarios'),
            honorariosCia: asignaciones.filter(a => a.categoria === 'honorariosCia'),
            honorariosCuerpo: asignaciones.filter(a => a.categoria === 'honorariosCuerpo'),
            insignes: asignaciones.filter(a => a.categoria === 'insignes')
        };

        return `
            <div class="dashboard-stats-grid">
                <div class="dashboard-stat-card">
                    <div class="stat-icon-large">👥</div>
                    <div class="stat-content">
                        <div class="stat-label">Total Asignados</div>
                        <div class="stat-value-large">${totalAsignados}</div>
                        <div class="stat-detail">voluntarios</div>
                    </div>
                </div>

                <div class="dashboard-stat-card success">
                    <div class="stat-icon-large">✅</div>
                    <div class="stat-content">
                        <div class="stat-label">Pagados</div>
                        <div class="stat-value-large">${pagados.length}</div>
                        <div class="stat-detail">${((pagados.length/totalAsignados)*100).toFixed(1)}%</div>
                    </div>
                </div>

                <div class="dashboard-stat-card warning">
                    <div class="stat-icon-large">⚠️</div>
                    <div class="stat-content">
                        <div class="stat-label">Parciales</div>
                        <div class="stat-value-large">${parciales.length}</div>
                        <div class="stat-detail">${((parciales.length/totalAsignados)*100).toFixed(1)}%</div>
                    </div>
                </div>

                <div class="dashboard-stat-card danger">
                    <div class="stat-icon-large">❌</div>
                    <div class="stat-content">
                        <div class="stat-label">Pendientes</div>
                        <div class="stat-value-large">${pendientes.length}</div>
                        <div class="stat-detail">${((pendientes.length/totalAsignados)*100).toFixed(1)}%</div>
                    </div>
                </div>
            </div>

            <div class="dashboard-financial">
                <div class="financial-card">
                    <div class="financial-label">Total Esperado</div>
                    <div class="financial-value">${this.formatearMonto(totalEsperado)}</div>
                </div>
                <div class="financial-card recaudado">
                    <div class="financial-label">Total Recaudado</div>
                    <div class="financial-value">${this.formatearMonto(totalRecaudado)}</div>
                    <div class="financial-percentage">${eficiencia.toFixed(1)}%</div>
                </div>
                <div class="financial-card pendiente">
                    <div class="financial-label">Pendiente de Cobro</div>
                    <div class="financial-value">${this.formatearMonto(totalEsperado - totalRecaudado)}</div>
                </div>
            </div>

            <div class="dashboard-section">
                <h3>📊 Distribución por Categoría</h3>
                <div class="categoria-stats">
                    ${Object.keys(porCategoria).map(cat => {
                        const asigs = porCategoria[cat];
                        const pagadosCat = asigs.filter(a => a.estadoPago === 'pagado').length;
                        const porcentaje = asigs.length > 0 ? (pagadosCat / asigs.length) * 100 : 0;
                        
                        return `
                            <div class="categoria-stat-item">
                                <div class="categoria-nombre">${this.obtenerNombreCategoria(cat)}</div>
                                <div class="categoria-numeros">
                                    <span>${pagadosCat}/${asigs.length}</span>
                                    <span class="categoria-porcentaje">${porcentaje.toFixed(0)}%</span>
                                </div>
                                <div class="categoria-progress">
                                    <div class="categoria-progress-bar" style="width: ${porcentaje}%"></div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>

            <div class="dashboard-section">
                <h3>👥 Lista Completa de Asignaciones</h3>
                <div class="asignaciones-table-container">
                    <table class="asignaciones-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Voluntario</th>
                                <th>Clave</th>
                                <th>Categoría</th>
                                <th>Tarjetas</th>
                                <th>Vendidas</th>
                                <th>Esperado</th>
                                <th>Pagado</th>
                                <th>Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${asignaciones.map((a, i) => `
                                <tr class="estado-${a.estadoPago}">
                                    <td>${i + 1}</td>
                                    <td>${a.nombreBombero}</td>
                                    <td>${a.claveBombero}</td>
                                    <td>${this.obtenerNombreCategoria(a.categoria)}</td>
                                    <td>${a.tarjetasAsignadas}</td>
                                    <td>${a.tarjetasVendidas}</td>
                                    <td>${this.formatearMonto(a.montoEsperado)}</td>
                                    <td>${this.formatearMonto(a.montoPagado)}</td>
                                    <td><span class="badge-estado ${a.estadoPago}">${this.obtenerTextoEstado(a.estadoPago)}</span></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="dashboard-actions">
    <button class="btn btn-pdf" onclick="beneficiosSistema.exportarDashboard('${beneficio.id}')">
        📄 Exportar PDF
    </button>
    <button class="btn btn-secondary" onclick="this.closest('.modal-dashboard').remove()">
        Cerrar
    </button>
</div>
        `;
    }

    // ==================== VER DEUDORES ====================
    verDeudores(beneficioId) {
        const beneficio = this.beneficios.find(b => b.id === beneficioId);
        if (!beneficio) return;

        const deudores = this.asignaciones.filter(a => 
            a.beneficioId === beneficioId && 
            (a.estadoPago === 'pendiente' || a.estadoPago === 'parcial')
        );

        if (deudores.length === 0) {
            Utils.mostrarNotificacion('No hay deudores en este beneficio', 'info');
            return;
        }

        const modal = document.createElement('div');
        modal.className = 'modal-deudores';
        modal.innerHTML = `
            <div class="modal-contenido">
                <div class="modal-header">
                    <h3>⚠️ Deudores - ${beneficio.nombre}</h3>
                    <button class="btn-cerrar-modal" onclick="this.closest('.modal-deudores').remove()">✕</button>
                </div>
                <div class="deudores-stats">
                    <div class="deudor-stat">
                        <div class="stat-label">Total Deudores</div>
                        <div class="stat-value">${deudores.length}</div>
                    </div>
                    <div class="deudor-stat">
                        <div class="stat-label">Deuda Total</div>
                        <div class="stat-value">${this.formatearMonto(deudores.reduce((sum, d) => sum + (d.montoEsperado - d.montoPagado), 0))}</div>
                    </div>
                </div>
                <div class="lista-deudores">
                    ${deudores.map(d => `
                        <div class="deudor-item">
                            <div class="deudor-info">
                                <h5>${d.nombreBombero}</h5>
                                <p>Clave: ${d.claveBombero} | ${this.obtenerNombreCategoria(d.categoria)}</p>
                                <p>Tarjetas: ${d.tarjetasVendidas}/${d.tarjetasAsignadas}</p>
                                <p>Pagado: ${this.formatearMonto(d.montoPagado)} / ${this.formatearMonto(d.montoEsperado)}</p>
                            </div>
                            <div class="deudor-monto">
                                ${this.formatearMonto(d.montoEsperado - d.montoPagado)}
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div class="modal-footer">
                    <button class="btn btn-excel" onclick="beneficiosSistema.exportarDeudores('${beneficioId}')">
                        📊 Exportar Deudores
                    </button>
                    <button class="btn btn-secondary" onclick="this.closest('.modal-deudores').remove()">
                        Cerrar
                    </button>
                </div>
            </div>
        `;

        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            padding: 20px;
        `;

        document.body.appendChild(modal);
    }

    async cerrarBeneficio(beneficioId) {
    const beneficio = this.beneficios.find(b => b.id === beneficioId);
    if (!beneficio) return;

    // VALIDACIÓN: Verificar si hay deudores
    const deudores = this.asignaciones.filter(a => 
        a.beneficioId === beneficioId && 
        (a.estadoPago === 'pendiente' || a.estadoPago === 'parcial')
    );

    if (deudores.length > 0) {
        Utils.mostrarNotificacion(
            `No se puede cerrar el beneficio. Hay ${deudores.length} deudor${deudores.length > 1 ? 'es' : ''} pendiente${deudores.length > 1 ? 's' : ''}.`,
            'error'
        );
        return;
    }

    const confirmado = await Utils.confirmarAccion(
        '¿Está seguro de cerrar este beneficio? No se podrán registrar más pagos.'
    );

    if (confirmado) {
        beneficio.estado = 'cerrado';
        beneficio.fechaCierre = new Date().toISOString();
        this.guardarDatos();
        this.renderizarBeneficios();
        this.actualizarDashboard();
        Utils.mostrarNotificacion('Beneficio cerrado exitosamente', 'success');
    }
}

    // ==================== GRÁFICOS MEJORADOS ====================
    renderizarGraficos() {
        this.renderizarGraficoDeudores();
        this.renderizarGraficoEficiencia();
    }

    renderizarGraficoDeudores() {
        const ctx = document.getElementById('graficoDeudores');
        
        if (this.graficoDeudores) {
            this.graficoDeudores.destroy();
        }

        const beneficiosActivos = this.beneficios.filter(b => b.estado === 'activo');
        
        const labels = [];
        const dataPagados = [];
        const dataDeudores = [];

        beneficiosActivos.forEach(b => {
            const asignaciones = this.asignaciones.filter(a => a.beneficioId === b.id);
            const pagados = asignaciones.filter(a => a.estadoPago === 'pagado').length;
            const deudores = asignaciones.filter(a => a.estadoPago === 'pendiente' || a.estadoPago === 'parcial').length;
            
            labels.push(b.nombre.substring(0, 20));
            dataPagados.push(pagados);
            dataDeudores.push(deudores);
        });

        this.graficoDeudores = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Pagados',
                        data: dataPagados,
                        backgroundColor: '#4caf50',
                        borderRadius: 8
                    },
                    {
                        label: 'Deudores',
                        data: dataDeudores,
                        backgroundColor: '#f44336',
                        borderRadius: 8
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            font: { size: 12, weight: 'bold' },
                            padding: 15
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        titleFont: { size: 14, weight: 'bold' },
                        bodyFont: { size: 12 }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { stepSize: 1, font: { size: 11 } },
                        grid: { color: 'rgba(0, 0, 0, 0.05)' }
                    },
                    x: {
                        ticks: { font: { size: 10 } },
                        grid: { display: false }
                    }
                }
            }
        });
    }

    renderizarGraficoEficiencia() {
        const ctx = document.getElementById('graficoEficiencia');
        
        if (this.graficoEficiencia) {
            this.graficoEficiencia.destroy();
        }

        const beneficiosActivos = this.beneficios.filter(b => b.estado === 'activo');
        
        const labels = [];
        const dataEficiencia = [];
        const colores = [];

        beneficiosActivos.forEach(b => {
            const asignaciones = this.asignaciones.filter(a => a.beneficioId === b.id);
            const totalEsperado = asignaciones.reduce((sum, a) => sum + a.montoEsperado, 0);
            const totalRecaudado = asignaciones.reduce((sum, a) => sum + a.montoPagado, 0);
            const eficiencia = totalEsperado > 0 ? (totalRecaudado / totalEsperado) * 100 : 0;
            
            labels.push(b.nombre.substring(0, 20));
            dataEficiencia.push(eficiencia.toFixed(1));
            
            if (eficiencia >= 80) colores.push('#4caf50');
            else if (eficiencia >= 50) colores.push('#ff9800');
            else colores.push('#f44336');
        });

        this.graficoEficiencia = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Eficiencia (%)',
                    data: dataEficiencia,
                    backgroundColor: colores,
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        callbacks: {
                            label: (context) => `Eficiencia: ${context.parsed.y}%`
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            callback: (value) => value + '%',
                            font: { size: 11 }
                        },
                        grid: { color: 'rgba(0, 0, 0, 0.05)' }
                    },
                    x: {
                        ticks: { font: { size: 10 } },
                        grid: { display: false }
                    }
                }
            }
        });
    }

    // ==================== EXPORTACIÓN ====================
    async exportarExcel() {
        if (this.beneficios.length === 0) {
            Utils.mostrarNotificacion('No hay beneficios para exportar', 'error');
            return;
        }

        try {
            const datosExcel = [];
            
            this.beneficios.forEach(b => {
                const asignaciones = this.asignaciones.filter(a => a.beneficioId === b.id);
                const totalAsignados = asignaciones.length;
                const totalPagados = asignaciones.filter(a => a.estadoPago === 'pagado').length;
                const totalDeudores = asignaciones.filter(a => a.estadoPago === 'pendiente' || a.estadoPago === 'parcial').length;
                const totalEsperado = asignaciones.reduce((sum, a) => sum + a.montoEsperado, 0);
                const totalRecaudado = asignaciones.reduce((sum, a) => sum + a.montoPagado, 0);
                const eficiencia = totalEsperado > 0 ? ((totalRecaudado / totalEsperado) * 100).toFixed(1) : 0;

                datosExcel.push({
                    'Beneficio': b.nombre,
                    'Tipo': b.tipo,
                    'Fecha Evento': Utils.formatearFecha(b.fechaEvento),
                    'Fecha Límite': Utils.formatearFecha(b.fechaLimiteRendicion),
                    'Estado': b.estado,
                    'Asignados': totalAsignados,
                    'Pagados': totalPagados,
                    'Deudores': totalDeudores,
                    'Total Esperado': totalEsperado,
                    'Total Recaudado': totalRecaudado,
                    'Diferencia': totalEsperado - totalRecaudado,
                    'Eficiencia (%)': eficiencia
                });
            });

            await Utils.exportarAExcel(
                datosExcel,
                `Beneficios_${new Date().toISOString().split('T')[0]}.xlsx`,
                'Beneficios'
            );

            Utils.mostrarNotificacion('Excel descargado exitosamente', 'success');
        } catch (error) {
            Utils.mostrarNotificacion('Error al generar Excel: ' + error.message, 'error');
        }
    }

async exportarDashboard(beneficioId) {
    const beneficio = this.beneficios.find(b => b.id === beneficioId);
    const asignaciones = this.asignaciones.filter(a => a.beneficioId === beneficioId);

    if (!beneficio || asignaciones.length === 0) return;

    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        const pageWidth = doc.internal.pageSize.width;
        const margin = 15;
        let yPos = 20;

        // HEADER CON LOGO
        doc.setFillColor(255, 152, 0);
        doc.rect(0, 0, pageWidth, 45, 'F');

        const tieneLogo = Utils.agregarLogoAPDF(doc, 7);
        const textStartX = tieneLogo ? 40 : pageWidth / 2;
        const textAlign = tieneLogo ? 'left' : 'center';

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(18);
        doc.setFont(undefined, 'bold');
        doc.text('DASHBOARD DE BENEFICIO', textStartX, 15, { align: textAlign });

        doc.setFontSize(14);
        doc.setFont(undefined, 'normal');
        doc.text(beneficio.nombre, textStartX, 25, { align: textAlign });

        doc.setFontSize(10);
        doc.text(`Generado: ${new Date().toLocaleDateString('es-CL')}`, textStartX, 35, { align: textAlign });

        yPos = 55;

        // ESTADÍSTICAS GENERALES
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text('RESUMEN GENERAL', margin, yPos);
        yPos += 8;

        const totalAsignados = asignaciones.length;
        const pagados = asignaciones.filter(a => a.estadoPago === 'pagado').length;
        const parciales = asignaciones.filter(a => a.estadoPago === 'parcial').length;
        const pendientes = asignaciones.filter(a => a.estadoPago === 'pendiente').length;
        const totalEsperado = asignaciones.reduce((sum, a) => sum + a.montoEsperado, 0);
        const totalRecaudado = asignaciones.reduce((sum, a) => sum + a.montoPagado, 0);
        const eficiencia = totalEsperado > 0 ? (totalRecaudado / totalEsperado) * 100 : 0;

        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        
        const stats = [
            { label: 'Total Asignados:', value: totalAsignados },
            { label: 'Pagados:', value: `${pagados} (${((pagados/totalAsignados)*100).toFixed(1)}%)` },
            { label: 'Parciales:', value: `${parciales} (${((parciales/totalAsignados)*100).toFixed(1)}%)` },
            { label: 'Pendientes:', value: `${pendientes} (${((pendientes/totalAsignados)*100).toFixed(1)}%)` }
        ];

        stats.forEach((stat, i) => {
            const col1 = margin + 5;
            const col2 = margin + 100;
            
            if (i % 2 === 0 && i > 0) yPos += 6;
            
            const xPos = i % 2 === 0 ? col1 : col2;
            doc.text(stat.label, xPos, yPos);
            doc.setFont(undefined, 'bold');
            doc.text(String(stat.value), xPos + 45, yPos);
            doc.setFont(undefined, 'normal');
            
            if (i % 2 === 1) yPos += 6;
        });

        yPos += 10;

        // Información financiera
        doc.setFillColor(76, 175, 80);
        doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont(undefined, 'bold');
        doc.text('INFORMACIÓN FINANCIERA', margin + 3, yPos + 5);
        yPos += 12;

        doc.setTextColor(0, 0, 0);
        doc.setFont(undefined, 'normal');
        doc.setFontSize(10);
        
        doc.text(`Total Esperado:`, margin + 5, yPos);
        doc.setFont(undefined, 'bold');
        doc.text(this.formatearMonto(totalEsperado), margin + 70, yPos);
        doc.setFont(undefined, 'normal');
        
        yPos += 6;
        doc.text(`Total Recaudado:`, margin + 5, yPos);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(76, 175, 80);
        doc.text(this.formatearMonto(totalRecaudado), margin + 70, yPos);
        doc.setTextColor(0, 0, 0);
        doc.setFont(undefined, 'normal');
        
        yPos += 6;
        doc.text(`Pendiente de Cobro:`, margin + 5, yPos);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(244, 67, 54);
        doc.text(this.formatearMonto(totalEsperado - totalRecaudado), margin + 70, yPos);
        doc.setTextColor(0, 0, 0);
        doc.setFont(undefined, 'normal');
        
        yPos += 6;
        doc.text(`Eficiencia de Cobro:`, margin + 5, yPos);
        doc.setFont(undefined, 'bold');
        const colorEficiencia = eficiencia >= 80 ? [76, 175, 80] : eficiencia >= 50 ? [255, 152, 0] : [244, 67, 54];
        doc.setTextColor(...colorEficiencia);
        doc.text(`${eficiencia.toFixed(1)}%`, margin + 70, yPos);
        doc.setTextColor(0, 0, 0);
        
        yPos += 15;

        // TABLA DE ASIGNACIONES
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text('LISTA COMPLETA DE ASIGNACIONES', margin, yPos);
        yPos += 5;

        const tableData = asignaciones.map((a, i) => [
            String(i + 1),
            a.nombreBombero,
            a.claveBombero,
            this.obtenerNombreCategoria(a.categoria),
            String(a.tarjetasAsignadas),
            String(a.tarjetasVendidas),
            this.formatearMonto(a.montoEsperado),
            this.formatearMonto(a.montoPagado),
            this.obtenerTextoEstado(a.estadoPago)
        ]);

        doc.autoTable({
            head: [['#', 'Voluntario', 'Clave', 'Categoría', 'Tarjetas', 'Vendidas', 'Esperado', 'Pagado', 'Estado']],
            body: tableData,
            startY: yPos,
            margin: { left: margin, right: margin },
            styles: {
                fontSize: 8,
                cellPadding: 3
            },
            headStyles: {
                fillColor: [26, 26, 26],
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                halign: 'center'
            },
            columnStyles: {
                0: { halign: 'center', cellWidth: 10 },
                1: { cellWidth: 40 },
                2: { halign: 'center', cellWidth: 15 },
                3: { halign: 'center', cellWidth: 20 },
                4: { halign: 'center', cellWidth: 15 },
                5: { halign: 'center', cellWidth: 15 },
                6: { halign: 'right', cellWidth: 20 },
                7: { halign: 'right', cellWidth: 20 },
                8: { halign: 'center', cellWidth: 20 }
            },
            didParseCell: function(data) {
                if (data.section === 'body' && data.column.index === 8) {
                    const estado = data.cell.raw;
                    if (estado === 'Pagado') {
                        data.cell.styles.textColor = [76, 175, 80];
                        data.cell.styles.fontStyle = 'bold';
                    } else if (estado === 'Pendiente') {
                        data.cell.styles.textColor = [244, 67, 54];
                        data.cell.styles.fontStyle = 'bold';
                    } else if (estado === 'Parcial') {
                        data.cell.styles.textColor = [255, 152, 0];
                        data.cell.styles.fontStyle = 'bold';
                    }
                }
            }
        });

        // Footer
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.setFont(undefined, 'normal');
            doc.text(
                `Página ${i} de ${pageCount} | Proyecto SEIS - Sistema de Beneficios`,
                pageWidth / 2,
                doc.internal.pageSize.height - 10,
                { align: 'center' }
            );
        }

        doc.save(`Dashboard_${beneficio.nombre.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
        Utils.mostrarNotificacion('Dashboard exportado a PDF exitosamente', 'success');
        
    } catch (error) {
        console.error('Error al generar PDF:', error);
        Utils.mostrarNotificacion('Error al generar PDF: ' + error.message, 'error');
    }
}

    async exportarDeudores(beneficioId) {
        const beneficio = this.beneficios.find(b => b.id === beneficioId);
        if (!beneficio) return;

        const deudores = this.asignaciones.filter(a => 
            a.beneficioId === beneficioId && 
            (a.estadoPago === 'pendiente' || a.estadoPago === 'parcial')
        );

        if (deudores.length === 0) {
            Utils.mostrarNotificacion('No hay deudores para exportar', 'error');
            return;
        }

        try {
            const datosExcel = deudores.map((d, index) => ({
                'N°': index + 1,
                'Voluntario': d.nombreBombero,
                'Clave': d.claveBombero,
                'Categoría': this.obtenerNombreCategoria(d.categoria),
                'Tarjetas Asignadas': d.tarjetasAsignadas,
                'Tarjetas Vendidas': d.tarjetasVendidas,
                'Monto Esperado': d.montoEsperado,
                'Monto Pagado': d.montoPagado,
                'Deuda': d.montoEsperado - d.montoPagado,
                'Estado': this.obtenerTextoEstado(d.estadoPago)
            }));

            await Utils.exportarAExcel(
                datosExcel,
                `Deudores_${beneficio.nombre.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`,
                'Deudores'
            );

            Utils.mostrarNotificacion('Excel de deudores descargado exitosamente', 'success');
        } catch (error) {
            Utils.mostrarNotificacion('Error al generar Excel: ' + error.message, 'error');
        }
    }

    // ==================== UTILIDADES ====================
    obtenerNombreCategoria(categoria) {
        const nombres = {
            'voluntarios': 'Voluntario',
            'honorariosCia': 'Hon. Compañía',
            'honorariosCuerpo': 'Hon. Cuerpo',
            'insignes': 'Insigne'
        };
        return nombres[categoria] || categoria;
    }

    obtenerTextoEstado(estado) {
        const textos = {
            'pendiente': 'Pendiente',
            'parcial': 'Parcial',
            'pagado': 'Pagado'
        };
        return textos[estado] || estado;
    }

    generarId() {
        return Date.now() + Math.random().toString(36).substr(2, 9);
    }

    guardarDatos() {
        storage.saveBeneficios(this.beneficios);
        storage.saveAsignacionesBeneficios(this.asignaciones);
    }

    formatearMonto(monto) {
        return new Intl.NumberFormat('es-CL', {
            style: 'currency',
            currency: 'CLP',
            minimumFractionDigits: 0
        }).format(monto);
    }

    limpiarFormulario() {
        document.getElementById('formCrearBeneficio').reset();
        document.getElementById('tarjetasVoluntarios').value = 8;
        document.getElementById('tarjetasHonorariosCia').value = 5;
        document.getElementById('tarjetasHonorariosCuerpo').value = 3;
        document.getElementById('tarjetasInsignes').value = 2;
    }

    volverAlSistema() {
        window.location.href = 'sistema.html';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.beneficiosSistema = new SistemaBeneficios();
});