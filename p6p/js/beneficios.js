// ==================== SISTEMA DE ADMINISTRACIÓN DE BENEFICIOS ====================
class SistemaBeneficios {
    constructor() {
        this.beneficios = [];
        this.asignaciones = [];
        this.pagosBeneficios = [];
        this.bomberos = [];
        this.filtro = 'todos';
        this.graficoDeudores = null;
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
        this.renderizarTodo();
        this.actualizarEstadisticas();
        this.renderizarGrafico();
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
        const permisos = getUserPermissions();
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        
        // Solo administradores, directores y tesoreros pueden crear beneficios
        const puedeCrear = currentUser.role === 'Director' || 
                          currentUser.role === 'Super Administrador' || 
                          currentUser.role === 'Tesorero';
        
        if (!puedeCrear) {
            document.querySelector('.form-container').style.display = 'none';
            const mensaje = document.createElement('div');
            mensaje.className = 'info-solo-lectura';
            mensaje.innerHTML = `
                <h3>👁️ Modo Solo Lectura</h3>
                <p>Solo administradores pueden crear beneficios.</p>
            `;
            mensaje.style.cssText = `
                background: rgba(255, 152, 0, 0.1);
                border: 2px solid rgba(255, 152, 0, 0.3);
                border-radius: 15px;
                padding: 20px;
                margin-bottom: 20px;
                text-align: center;
            `;
            document.querySelector('.page-content').insertBefore(
                mensaje, 
                document.querySelector('.estadisticas-generales').nextSibling
            );
        }
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
            Utils.mostrarNotificacion('Beneficio creado y asignado exitosamente a todos los voluntarios', 'success');
            this.limpiarFormulario();
            this.renderizarTodo();
            this.actualizarEstadisticas();
            this.renderizarGrafico();
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
        
        // Validar que haya al menos una categoría con tarjetas
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
        // 1. Crear el beneficio
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

        // 2. Asignar automáticamente a todos los bomberos según su categoría
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
        
        if (anosCompletos < 20) {
            return 'voluntarios';
        } else if (anosCompletos >= 20 && anosCompletos <= 24) {
            return 'honorariosCia';
        } else if (anosCompletos >= 25 && anosCompletos <= 49) {
            return 'honorariosCuerpo';
        } else {
            return 'insignes';
        }
    }

    // ==================== RENDERIZADO ====================
    renderizarTodo() {
        this.renderizarBeneficios();
    }

    aplicarFiltro() {
        this.filtro = document.getElementById('filtroBeneficios').value;
        this.renderizarBeneficios();
    }

    renderizarBeneficios() {
        const lista = document.getElementById('listaBeneficios');
        const total = document.getElementById('totalBeneficios');
        
        let beneficiosFiltrados = [...this.beneficios];
        
        if (this.filtro !== 'todos') {
            beneficiosFiltrados = beneficiosFiltrados.filter(b => b.estado === this.filtro);
        }
        
        beneficiosFiltrados.sort((a, b) => new Date(b.fechaCreacion) - new Date(a.fechaCreacion));
        
        total.textContent = beneficiosFiltrados.length;

        if (beneficiosFiltrados.length === 0) {
            lista.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">No hay beneficios registrados</p>';
            return;
        }

        lista.innerHTML = beneficiosFiltrados.map(b => this.generarHTMLBeneficio(b)).join('');
    }

    generarHTMLBeneficio(beneficio) {
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
        const totalDeudores = asignacionesBeneficio.filter(a => a.estadoPago === 'pendiente' || a.estadoPago === 'parcial').length;
        
        const totalEsperado = asignacionesBeneficio.reduce((sum, a) => sum + a.montoEsperado, 0);
        const totalRecaudado = asignacionesBeneficio.reduce((sum, a) => sum + a.montoPagado, 0);

        return `
            <div class="beneficio-card">
                <div class="beneficio-header">
                    <div class="beneficio-titulo">
                        <div class="beneficio-nombre">${beneficio.nombre}</div>
                        <div class="beneficio-tipo">${beneficio.tipo}</div>
                    </div>
                    <div class="beneficio-estado ${estadoClass}">${estadoTexto}</div>
                </div>

                <div class="beneficio-resumen">
                    <div class="resumen-item">
                        <div class="resumen-item-label">Voluntarios Asignados</div>
                        <div class="resumen-item-valor">${totalAsignados}</div>
                    </div>
                    <div class="resumen-item">
                        <div class="resumen-item-label">Pagaron</div>
                        <div class="resumen-item-valor" style="color: #4caf50;">${totalPagados}</div>
                    </div>
                    <div class="resumen-item">
                        <div class="resumen-item-label">Deudores</div>
                        <div class="resumen-item-valor" style="color: #f44336;">${totalDeudores}</div>
                    </div>
                    <div class="resumen-item">
                        <div class="resumen-item-label">Total Esperado</div>
                        <div class="resumen-item-valor">${this.formatearMonto(totalEsperado)}</div>
                    </div>
                    <div class="resumen-item">
                        <div class="resumen-item-label">Total Recaudado</div>
                        <div class="resumen-item-valor" style="color: #4caf50;">${this.formatearMonto(totalRecaudado)}</div>
                    </div>
                </div>

                <div class="item-info">
                    <div><strong>Fecha evento:</strong> <span>${Utils.formatearFecha(beneficio.fechaEvento)}</span></div>
                    <div><strong>Fecha límite:</strong> <span>${Utils.formatearFecha(beneficio.fechaLimiteRendicion)}</span></div>
                    <div><strong>Precio tarjeta:</strong> <span>${this.formatearMonto(beneficio.precioTarjeta)}</span></div>
                    ${beneficio.descripcion ? `<div class="full-width"><strong>Descripción:</strong> <span>${beneficio.descripcion}</span></div>` : ''}
                </div>

                <div class="beneficio-acciones">
                    <button class="btn-ver-detalle" onclick="beneficiosSistema.toggleDetalle('${beneficio.id}')">
                        📊 Ver Detalle
                    </button>
                    <button class="btn-ver-deudores" onclick="beneficiosSistema.verDeudores('${beneficio.id}')">
                        ⚠️ Ver Deudores (${totalDeudores})
                    </button>
                    ${beneficio.estado === 'activo' ? `
                        <button class="btn-cerrar-beneficio" onclick="beneficiosSistema.cerrarBeneficio('${beneficio.id}')">
                            🔒 Cerrar Beneficio
                        </button>
                    ` : ''}
                </div>

                <div class="beneficio-detalle" id="detalle-${beneficio.id}">
                    ${this.generarDetalleAsignaciones(beneficio.id)}
                </div>
            </div>
        `;
    }

    generarDetalleAsignaciones(beneficioId) {
        const asignaciones = this.asignaciones.filter(a => a.beneficioId === beneficioId);
        
        if (asignaciones.length === 0) {
            return '<p>No hay asignaciones</p>';
        }

        return `
            <div class="detalle-section">
                <h4>Asignaciones por Voluntario</h4>
                <div class="detalle-tabla">
                    <table>
                        <thead>
                            <tr>
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
                            ${asignaciones.map(a => `
                                <tr>
                                    <td>${a.nombreBombero}</td>
                                    <td>${a.claveBombero}</td>
                                    <td>${this.obtenerNombreCategoria(a.categoria)}</td>
                                    <td>${a.tarjetasAsignadas}</td>
                                    <td>${a.tarjetasVendidas}</td>
                                    <td>${this.formatearMonto(a.montoEsperado)}</td>
                                    <td>${this.formatearMonto(a.montoPagado)}</td>
                                    <td><span class="estado-pago ${a.estadoPago}">${this.obtenerTextoEstado(a.estadoPago)}</span></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

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

    toggleDetalle(beneficioId) {
        const detalle = document.getElementById(`detalle-${beneficioId}`);
        detalle.classList.toggle('expanded');
    }

// ==================== ACCIONES DE BENEFICIOS ====================
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

        // Crear modal con lista de deudores
        const modal = document.createElement('div');
        modal.className = 'modal-deudores';
        modal.innerHTML = `
            <div class="modal-contenido">
                <div class="modal-header">
                    <h3>⚠️ Deudores - ${beneficio.nombre}</h3>
                    <button class="btn-cerrar-modal" onclick="this.closest('.modal-deudores').remove()">✕</button>
                </div>
                <div class="lista-deudores">
                    ${deudores.map(d => `
                        <div class="deudor-item">
                            <div class="deudor-info">
                                <h5>${d.nombreBombero}</h5>
                                <p>Clave: ${d.claveBombero}</p>
                                <p>Tarjetas: ${d.tarjetasVendidas}/${d.tarjetasAsignadas}</p>
                                <p>Esperado: ${this.formatearMonto(d.montoEsperado)}</p>
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
        `;

        const contenido = modal.querySelector('.modal-contenido');
        contenido.style.cssText = `
            background: white;
            padding: 30px;
            border-radius: 15px;
            max-width: 600px;
            max-height: 80vh;
            overflow-y: auto;
            width: 90%;
        `;

        document.body.appendChild(modal);
    }

    async cerrarBeneficio(beneficioId) {
        const confirmado = await Utils.confirmarAccion(
            '¿Está seguro de cerrar este beneficio? No se podrán registrar más pagos.'
        );

        if (confirmado) {
            const beneficio = this.beneficios.find(b => b.id === beneficioId);
            if (beneficio) {
                beneficio.estado = 'cerrado';
                beneficio.fechaCierre = new Date().toISOString();
                this.guardarDatos();
                this.renderizarBeneficios();
                this.actualizarEstadisticas();
                Utils.mostrarNotificacion('Beneficio cerrado exitosamente', 'success');
            }
        }
    }

    // ==================== ESTADÍSTICAS ====================
    actualizarEstadisticas() {
        const beneficiosActivos = this.beneficios.filter(b => b.estado === 'activo');
        
        const totalEsperado = this.asignaciones
            .filter(a => {
                const beneficio = this.beneficios.find(b => b.id === a.beneficioId);
                return beneficio && beneficio.estado === 'activo';
            })
            .reduce((sum, a) => sum + a.montoEsperado, 0);
        
        const totalRecaudado = this.asignaciones
            .filter(a => {
                const beneficio = this.beneficios.find(b => b.id === a.beneficioId);
                return beneficio && beneficio.estado === 'activo';
            })
            .reduce((sum, a) => sum + a.montoPagado, 0);
        
        const totalDeudores = this.asignaciones.filter(a => {
            const beneficio = this.beneficios.find(b => b.id === a.beneficioId);
            return beneficio && beneficio.estado === 'activo' && 
                   (a.estadoPago === 'pendiente' || a.estadoPago === 'parcial');
        }).length;

        document.getElementById('totalBeneficiosActivos').textContent = beneficiosActivos.length;
        document.getElementById('totalEsperado').textContent = this.formatearMonto(totalEsperado);
        document.getElementById('totalRecaudado').textContent = this.formatearMonto(totalRecaudado);
        document.getElementById('totalDeudores').textContent = totalDeudores;
    }

    // ==================== GRÁFICO ====================
    renderizarGrafico() {
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
                        backgroundColor: '#4caf50'
                    },
                    {
                        label: 'Deudores',
                        data: dataDeudores,
                        backgroundColor: '#f44336'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
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
                    'Diferencia': totalEsperado - totalRecaudado
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