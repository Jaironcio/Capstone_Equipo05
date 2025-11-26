// ==================== SISTEMA PRINCIPAL DE BOMBEROS ====================
class SistemaBomberos {
    constructor() {
        this.bomberos = [];
        this.terminoBusqueda = '';
        this.paginationBomberos = null;
        this.init();
    }

    aplicarPermisosUI() {
        const permisos = getUserPermissions();
        if (!permisos) return;
        
        const formContainer = document.querySelector('.form-container');
        const registrosButtons = document.querySelector('.registros-buttons');
        
        if (!permisos.canEdit) {
            if (formContainer) {
                const allElements = formContainer.querySelectorAll('form, .buttons, .modo-edicion');
                allElements.forEach(el => el.style.display = 'none');
                
                const mensaje = document.createElement('div');
                mensaje.className = 'info-solo-lectura';
                mensaje.innerHTML = `<h3>Bienvenido Tesorero</h3>`;
                mensaje.style.cssText = `
                    background: rgba(33, 150, 243, 0.1);
                    border: 2px solid rgba(33, 150, 243, 0.3);
                    border-radius: 15px;
                    padding: 20px;
                    margin-bottom: 20px;
                    text-align: center;
                `;
                formContainer.insertBefore(mensaje, formContainer.firstChild);
            }
            
            if (registrosButtons) {
                registrosButtons.style.display = 'none';
            }
        }
    }

    async init() {
        if (!checkAuth()) {
            window.location.href = 'index.html';
            return;
        }

        this.inicializarContadores();
        await this.cargarDatos();
        this.configurarInterfaz();
        this.renderizarBomberos();
        this.mostrarInfoUsuario();
        this.aplicarPermisosUI();
        await this.calcularYMostrarDeudores();
    }

    inicializarContadores() {
        window.idCounter = 1;
        window.sancionIdCounter = 1;
        window.cargoIdCounter = 1;
        
        console.log('✅ Contadores inicializados:', {
            idCounter: window.idCounter,
            sancionIdCounter: window.sancionIdCounter,
            cargoIdCounter: window.cargoIdCounter
        });
    }

    async cargarDatos() {
        this.bomberos = storage.getBomberos();
        
        console.log('📊 Datos cargados:', {
            bomberos: this.bomberos.length,
            idCounter: window.idCounter
        });
    }


    guardarDatos() {
        storage.saveBomberos(this.bomberos);
        console.log('💾 Datos guardados');
    }

    configurarInterfaz() {
        document.getElementById('buscadorBomberos').addEventListener('input', (e) => {
            this.terminoBusqueda = e.target.value.toLowerCase();
            this.renderizarBomberos();
        });

        document.getElementById('logoutBtn').addEventListener('click', () => {
            logout();
        });
    }

    mostrarInfoUsuario() {
        const userRoleInfo = document.getElementById('userRoleInfo');
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        
        if (currentUser) {
            userRoleInfo.textContent = `${currentUser.role}: ${currentUser.username}`;
            
            const btnBeneficios = document.getElementById('btnBeneficios');
            if (btnBeneficios && (currentUser.role === 'Director' || currentUser.role === 'Super Administrador' || currentUser.role === 'Tesorero')) {
                btnBeneficios.style.display = 'inline-block';
                btnBeneficios.onclick = () => {
                    this.verBeneficios();
                };
            }
            
            if (currentUser.role === 'Tesorero') {
                this.mostrarSaldoEnHeader();
                
                const btnFinanzas = document.getElementById('btnFinanzas');
                if (btnFinanzas) {
                    btnFinanzas.style.display = 'inline-block';
                    btnFinanzas.onclick = () => {
                        window.location.href = 'finanzas.html';
                    };
                }
                
                const btnDeudores = document.getElementById('btnDeudores');
                if (btnDeudores) {
                    btnDeudores.style.display = 'inline-block';
                    btnDeudores.onclick = () => {
                        this.toggleNotificacionDeudores();
                    };
                }
            }
            
            // Botones de Asistencia (visibles para todos)
            const btnRegistroAsistencia = document.getElementById('btnRegistroAsistencia');
            if (btnRegistroAsistencia) {
                btnRegistroAsistencia.style.display = 'inline-block';
                btnRegistroAsistencia.onclick = () => {
                    this.verRegistroAsistencia();
                };
            }
            
            const btnHistorialAsistencias = document.getElementById('btnHistorialAsistencias');
            if (btnHistorialAsistencias) {
                btnHistorialAsistencias.style.display = 'inline-block';
                btnHistorialAsistencias.onclick = () => {
                    this.verHistorialAsistencias();
                };
            }
        }
    }

    mostrarSaldoEnHeader() {
        const saldoDiv = document.getElementById('saldoCompaniaHeader');
        const saldoMonto = document.getElementById('saldoMontoHeader');
        
        if (saldoDiv && saldoMonto) {
            const movimientos = storage.getMovimientosFinancieros();
            
            const ingresos = movimientos
                .filter(m => m.tipo === 'ingreso')
                .reduce((sum, m) => sum + parseFloat(m.monto), 0);
            
            const egresos = movimientos
                .filter(m => m.tipo === 'egreso')
                .reduce((sum, m) => sum + parseFloat(m.monto), 0);
            
            const saldo = ingresos - egresos;
            
            saldoMonto.textContent = new Intl.NumberFormat('es-CL', {
                style: 'currency',
                currency: 'CLP',
                minimumFractionDigits: 0
            }).format(saldo);
            
            if (saldo < 0) {
                saldoMonto.style.color = '#f44336';
            } else if (saldo === 0) {
                saldoMonto.style.color = '#ff9800';
            } else {
                saldoMonto.style.color = '#4caf50';
            }
            
            saldoDiv.style.display = 'flex';
        }
    }

    // ==================== REDIRIGIR A CREAR VOLUNTARIO ====================
    irACrear() {
        Utils.mostrarNotificacion('Redirigiendo a crear nuevo voluntario...', 'info');
        setTimeout(() => {
            window.location.href = 'crear-bombero.html';
        }, 800);
    }

renderizarBomberos() {
    // Filtrar bomberos
    let bomberosFiltrados = this.terminoBusqueda ? 
        Utils.filtrarBomberos(this.bomberos, this.terminoBusqueda) : 
        this.bomberos;
    
    // Aplicar paginación
    const bomberosToShow = this.paginationBomberos ? 
        this.paginationBomberos.getCurrentPageItems() : 
        bomberosFiltrados;

    const listaBomberos = document.getElementById('listaBomberos');
    
    // Actualizar contador
    const totalElement = document.getElementById('totalBomberos');
    if (totalElement) {
        totalElement.textContent = `Total de bomberos registrados: ${this.bomberos.length}`;
    }
    
    if (bomberosToShow.length === 0) {
        listaBomberos.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #999;">
                <h3>No se encontraron bomberos</h3>
                <p>Intenta con otro término de búsqueda</p>
            </div>
        `;
        return;
    }

    const permisos = getUserPermissions();
    const puedeEditar = permisos && permisos.canEdit;
    const puedeEliminar = permisos && permisos.canDelete;
    const puedeVerCargos = permisos && permisos.canViewCargos;
    const puedeVerSanciones = permisos && permisos.canViewSanciones;

    listaBomberos.innerHTML = bomberosToShow.map(bombero => {
        const nombreCompleto = Utils.obtenerNombreCompleto(bombero);
        const antiguedad = Utils.calcularAntiguedadDetallada(bombero.fechaIngreso);
        const edad = Utils.calcularEdad(bombero.fechaNacimiento);
        const categoria = Utils.calcularCategoriaBombero(bombero.fechaIngreso);

        return `
            <div class="bombero-card">
                <!-- Número -->
                <div class="bombero-numero">#${bombero.id}</div>
                
                <!-- Foto izquierda -->
                <div class="bombero-foto-wrapper">
                    ${bombero.foto ? `
                        <img src="${bombero.foto}" alt="${nombreCompleto}" class="bombero-foto">
                    ` : `
                        <div class="bombero-sin-foto">Sin foto</div>
                    `}
                </div>
                
                <!-- Contenido -->
                <div class="bombero-contenido">
                    <!-- Header: Nombre + Botones -->
                    <div class="bombero-top">
                        <div>
                            <h2 class="bombero-nombre">${nombreCompleto}</h2>
                            <p class="bombero-clave">Clave: ${bombero.claveBombero} | RUN: ${bombero.rut}</p>
                        </div>
                        
                        <div class="bombero-botones">
                            <button class="btn btn-cuotas" onclick="sistemaBomberos.verCuotas(${bombero.id})">💳 Cuotas</button>
                            <button class="btn btn-beneficios" onclick="sistemaBomberos.verPagarBeneficios(${bombero.id})">🎫 Beneficios</button>
                            ${puedeEditar ? `<button class="btn btn-editar" onclick="sistemaBomberos.editarBombero(${bombero.id})">Editar</button>` : ''}
                            ${puedeEliminar ? `<button class="btn btn-eliminar" onclick="sistemaBomberos.eliminarBombero(${bombero.id})">Eliminar</button>` : ''}
                            ${puedeVerCargos ? `<button class="btn btn-cargos" onclick="sistemaBomberos.verCargos(${bombero.id})">Cargos</button>` : ''}
                            ${puedeVerSanciones ? `<button class="btn btn-sanciones" onclick="sistemaBomberos.verSanciones(${bombero.id})">Sanciones</button>` : ''}
                        </div>
                    </div>
                    
                    <!-- Edad y Antigüedad -->
                    <div class="bombero-edad-antiguedad">
                        <strong>Edad:</strong> ${edad} años
                        <span class="separador">|</span>
                        <strong>Antigüedad:</strong> ${antiguedad.años} años, ${antiguedad.meses} meses, ${antiguedad.dias} días
                    </div>
                    
                    <!-- Badge Categoría -->
<div class="categoria-box" style="border-left-color: ${categoria.color}; background-color: ${categoria.color}10; display: block; width: 100%; max-width: 400px;">                        ${categoria.icono} ${categoria.categoria}
                    </div>
                    
                    <!-- Grid Info -->
                    <div class="info-grid">
                        <div class="info-col">
                            <span class="info-label">Profesión:</span>
                            <span class="info-value">${bombero.profesion || 'N/A'}</span>
                        </div>
                        <div class="info-col">
                            <span class="info-label">Domicilio:</span>
                            <span class="info-value">${bombero.domicilio || 'N/A'}</span>
                        </div>
                        <div class="info-col">
                            <span class="info-label">Registro Nacional:</span>
                            <span class="info-value">${bombero.nroRegistro || 'N/A'}</span>
                        </div>
                        <div class="info-col">
                            <span class="info-label">Compañía:</span>
                            <span class="info-value">${bombero.compania || 'N/A'}</span>
                        </div>
                        <div class="info-col">
                            <span class="info-label">Grupo Sanguíneo:</span>
                            <span class="info-value">${bombero.grupoSanguineo || 'N/A'}</span>
                        </div>
                        <div class="info-col">
                            <span class="info-label">Fecha Ingreso:</span>
                            <span class="info-value">${Utils.formatearFecha(bombero.fechaIngreso)}</span>
                        </div>
                        <div class="info-col">
                            <span class="info-label">Teléfono:</span>
                            <span class="info-value">${bombero.telefono || 'N/A'}</span>
                        </div>
                        <div class="info-col">
                            <span class="info-label">Email:</span>
                            <span class="info-value">${bombero.email || 'N/A'}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    if (this.paginationBomberos) {
        this.paginationBomberos.renderControls('paginationControlsBomberos', 'sistemaBomberos.cambiarPagina');
    }
}

    cambiarPaginaBomberos(pageNumber) {
        if (this.paginationBomberos.goToPage(pageNumber)) {
            this.renderizarBomberos();
            document.getElementById('listaBomberos').scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }


async eliminarBombero(id) {
    const bombero = this.bomberos.find(b => b.id === id);
    if (!bombero) return;

    const nombreCompleto = Utils.obtenerNombreCompleto(bombero);
    const confirmado = await Utils.confirmarAccion(
        `¿Eliminar a ${nombreCompleto}?`
    );

    if (confirmado) {
        this.bomberos = this.bomberos.filter(b => b.id !== id);
        this.guardarDatos();
        this.renderizarBomberos();
        Utils.mostrarNotificacion('Bombero eliminado', 'success');
    }
}

    editarBombero(id) {
        const bombero = this.bomberos.find(b => b.id === id);
        if (!bombero) {
            Utils.mostrarNotificacion('Bombero no encontrado', 'error');
            return;
        }

        localStorage.setItem('bomberoEditarActual', id);
        Utils.mostrarNotificacion('Redirigiendo a editar voluntario...', 'info');
        setTimeout(() => {
            window.location.href = 'editar-bombero.html';
        }, 800);
    }

    verSanciones(id) {
        Utils.mostrarNotificacion('Redirigiendo a sanciones...', 'info');
        localStorage.setItem('bomberoSancionActual', id);
        setTimeout(() => window.location.href = 'sanciones.html', 1000);
    }

    verCargos(id) {
        Utils.mostrarNotificacion('Redirigiendo a cargos...', 'info');
        localStorage.setItem('bomberoCargoActual', id);
        setTimeout(() => window.location.href = 'cargos.html', 1000);
    }

    verCuotas(id) {
        Utils.mostrarNotificacion('Redirigiendo a cuotas y beneficios...', 'info');
        localStorage.setItem('bomberoCuotasActual', id);
        setTimeout(() => window.location.href = 'cuotas-beneficios.html', 1000);
    }

    verRegistroAsistencia() {
        Utils.mostrarNotificacion('Redirigiendo a registro de asistencias...', 'info');
        setTimeout(() => window.location.href = 'registro-asistencia.html', 800);
    }

    verHistorialAsistencias() {
        Utils.mostrarNotificacion('Redirigiendo a historial de asistencias...', 'info');
        setTimeout(() => window.location.href = 'historial-asistencias.html', 800);
    }

    async toggleDatosEjemplo() {
        const tieneEjemplos = storage.tieneEjemplosActivos();
        
        if (tieneEjemplos) {
            const confirmado = await Utils.confirmarAccion(
                '¿Está seguro de eliminar TODOS los datos de ejemplo? ' +
                'Esto removerá 6 bomberos, 12 sanciones y 18 cargos de ejemplo.'
            );
            
            if (confirmado) {
                const resultado = storage.eliminarEjemplos();
                
                this.bomberos = storage.getBomberos();
                this.terminoBusqueda = '';
                document.getElementById('buscadorBomberos').value = '';
                this.renderizarBomberos();
                
                Utils.mostrarNotificacion(
                    `Ejemplos eliminados: ${resultado.bomberosEliminados} bomberos, ` +
                    `${resultado.sancionesEliminadas} sanciones, ` +
                    `${resultado.cargosEliminados} cargos`,
                    'success'
                );
            }
        } else {
            const confirmado = await Utils.confirmarAccion(
                '¿Cargar datos de ejemplo completos? ' +
                'Esto incluirá 6 bomberos con diferentes categorías, ' +
                '12 sanciones disciplinarias y 18 cargos históricos.'
            );
            
            if (confirmado) {
                const resultado = storage.cargarEjemplosCompletos();
                
                this.bomberos = storage.getBomberos();
                this.renderizarBomberos();
                
                Utils.mostrarNotificacion(
                    `Ejemplos cargados: ${resultado.bomberos} bomberos, ` +
                    `${resultado.sanciones} sanciones, ` +
                    `${resultado.cargos} cargos`,
                    'success'
                );
            }
        }
    }

    toggleInfoCategorias() {
        const info = document.getElementById('infoCategorias');
        info.style.display = info.style.display === 'none' ? 'block' : 'none';
    }

    verBeneficios() {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        const puedeVer = currentUser.role === 'Director' || 
                         currentUser.role === 'Super Administrador' || 
                         currentUser.role === 'Tesorero';
        
        if (puedeVer) {
            window.location.href = 'beneficios.html';
        } else {
            Utils.mostrarNotificacion('No tienes permisos para acceder a esta sección', 'error');
        }
    }

    verPagarBeneficios(id) {
        Utils.mostrarNotificacion('Redirigiendo a pago de beneficios...', 'info');
        localStorage.setItem('bomberoPagarBeneficioActual', id);
        setTimeout(() => window.location.href = 'pagar-beneficio.html', 1000);
    }

    async calcularYMostrarDeudores() {
        const pagosCuotas = storage.getPagosCuotas();
        const hoy = new Date();
        const mesActual = hoy.getMonth() + 1;
        const anioActual = hoy.getFullYear();
        
        let deudoresCuotas = [];
        
        this.bomberos.forEach(bombero => {
            let mesesPendientes = 0;
            let deudaCuotas = 0;
            
            for (let mes = 1; mes <= mesActual; mes++) {
                const pagado = pagosCuotas.find(p => 
                    p.bomberoId == bombero.id && 
                    p.mes == mes && 
                    p.anio == anioActual
                );
                
                if (!pagado) {
                    mesesPendientes++;
                    deudaCuotas += 5000;
                }
            }
            
            if (mesesPendientes > 0) {
                deudoresCuotas.push({
                    bombero: bombero,
                    tipo: 'Cuota Social',
                    mesesPendientes: mesesPendientes,
                    deuda: deudaCuotas
                });
            }
        });
        
        const asignaciones = storage.getAsignacionesBeneficios();
        const beneficios = storage.getBeneficios();
        
        let deudoresBeneficios = [];
        
        asignaciones.forEach(asignacion => {
            const beneficio = beneficios.find(b => b.id === asignacion.beneficioId);
            if (!beneficio || beneficio.estado !== 'activo') return;
            
            if (asignacion.estadoPago === 'pendiente' || asignacion.estadoPago === 'parcial') {
                const bombero = this.bomberos.find(b => b.id == asignacion.bomberoId);
                if (bombero) {
                    const deuda = asignacion.montoEsperado - asignacion.montoPagado;
                    deudoresBeneficios.push({
                        bombero: bombero,
                        tipo: 'Beneficio',
                        nombreBeneficio: beneficio.nombre,
                        deuda: deuda,
                        vencido: new Date(beneficio.fechaLimiteRendicion) < hoy
                    });
                }
            }
        });
        
        const totalDeudores = deudoresCuotas.length + deudoresBeneficios.length;
        
        const cantidadElement = document.getElementById('cantidadDeudores');
        if (cantidadElement) {
            cantidadElement.textContent = totalDeudores;
            
            const btnDeudores = document.getElementById('btnDeudores');
            if (btnDeudores) {
                if (totalDeudores > 0) {
                    btnDeudores.classList.add('tiene-deudores');
                } else {
                    btnDeudores.classList.remove('tiene-deudores');
                }
            }
        }
        
        window.deudoresData = { deudoresCuotas, deudoresBeneficios };
    }

    toggleNotificacionDeudores() {
        const notifExistente = document.querySelector('.notificacion-deudores');
        
        if (notifExistente) {
            notifExistente.style.animation = 'slideOutRight 0.4s ease-in';
            setTimeout(() => notifExistente.remove(), 400);
            return;
        }
        
        const { deudoresCuotas, deudoresBeneficios } = window.deudoresData || { deudoresCuotas: [], deudoresBeneficios: [] };
        const totalDeudores = deudoresCuotas.length + deudoresBeneficios.length;
        
        if (totalDeudores === 0) {
            Utils.mostrarNotificacion('No hay deudores en el sistema', 'success');
            return;
        }
        
        this.mostrarNotificacionDeudores(totalDeudores, deudoresCuotas, deudoresBeneficios);
    }

    mostrarNotificacionDeudores(total, deudoresCuotas, deudoresBeneficios) {
        const notificacion = document.createElement('div');
        notificacion.className = 'notificacion-deudores';
        
        const totalDeudaCuotas = deudoresCuotas.reduce((sum, d) => sum + d.deuda, 0);
        const totalDeudaBeneficios = deudoresBeneficios.reduce((sum, d) => sum + d.deuda, 0);
        const totalGeneral = totalDeudaCuotas + totalDeudaBeneficios;
        
        notificacion.innerHTML = `
            <div class="notificacion-deudores-card">
                <button class="btn-cerrar-notif-top" onclick="this.closest('.notificacion-deudores').remove()">✕</button>
                
                <div class="notificacion-deudores-header">
                    <div class="notif-icono-principal">⚠️</div>
                    <div class="notif-titulo">
                        <h3>Atención: Deudores Detectados</h3>
                        <p class="notif-subtitulo">Se requiere revisión de pagos pendientes</p>
                    </div>
                </div>

                <div class="notificacion-deudores-stats">
                    <div class="stat-deuda">
                        <div class="stat-deuda-label">Total Deudores</div>
                        <div class="stat-deuda-valor">${total}</div>
                        <div class="stat-deuda-desc">voluntarios con pagos pendientes</div>
                    </div>
                    
                    <div class="stat-deuda-separador"></div>
                    
                    <div class="stat-deuda">
                        <div class="stat-deuda-label">Monto Total Adeudado</div>
                        <div class="stat-deuda-valor-dinero">${this.formatearMonto(totalGeneral)}</div>
                        <div class="stat-deuda-desc">suma de todas las deudas</div>
                    </div>
                </div>

                <div class="notificacion-deudores-detalle">
                    <div class="detalle-item">
                        <div class="detalle-icono">💳</div>
                        <div class="detalle-info">
                            <div class="detalle-titulo">Cuotas Sociales</div>
                            <div class="detalle-numeros">
                                <span class="detalle-cantidad">${deudoresCuotas.length} deudores</span>
                                <span class="detalle-monto">${this.formatearMonto(totalDeudaCuotas)}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="detalle-item">
                        <div class="detalle-icono">🎫</div>
                        <div class="detalle-info">
                            <div class="detalle-titulo">Beneficios</div>
                            <div class="detalle-numeros">
                                <span class="detalle-cantidad">${deudoresBeneficios.length} deudores</span>
                                <span class="detalle-monto">${this.formatearMonto(totalDeudaBeneficios)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="notificacion-deudores-footer">
                    <button class="btn-generar-reporte" onclick="sistemaBomberos.generarPDFDeudores()">
                        <span class="btn-icono">📄</span>
                        <span class="btn-texto">Generar Reporte PDF</span>
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(notificacion);
    }
    async exportarExcel() {
    if (this.bomberos.length === 0) {
        Utils.mostrarNotificacion('No hay bomberos para exportar', 'error');
        return;
    }

    try {
        const datosExcel = this.bomberos.map((bombero, index) => {
            const nombreCompleto = Utils.obtenerNombreCompleto(bombero);
            const antiguedad = Utils.calcularAntiguedadDetallada(bombero.fechaIngreso);
            const edad = Utils.calcularEdad(bombero.fechaNacimiento);
            const categoria = Utils.calcularCategoriaBombero(bombero.fechaIngreso);

            return {
                'N°': index + 1,
                'Clave': bombero.claveBombero,
                'Nombre': nombreCompleto,
                'RUT': bombero.rut,
                'Edad': edad,
                'Fecha Nacimiento': Utils.formatearFecha(bombero.fechaNacimiento),
                'Profesión': bombero.profesion,
                'Domicilio': bombero.domicilio,
                'N° Registro': bombero.nroRegistro,
                'Fecha Ingreso': Utils.formatearFecha(bombero.fechaIngreso),
                'Antigüedad (años)': antiguedad.años,
                'Compañía': bombero.compania,
                'Categoría': categoria.categoria,
                'Grupo Sanguíneo': bombero.grupoSanguineo,
                'Teléfono': bombero.telefono,
                'Email': bombero.email
            };
        });

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(datosExcel);
        
        // Ajustar ancho de columnas
        const columnWidths = [
            { wch: 5 },  // N°
            { wch: 10 }, // Clave
            { wch: 35 }, // Nombre
            { wch: 15 }, // RUT
            { wch: 8 },  // Edad
            { wch: 15 }, // Fecha Nac
            { wch: 25 }, // Profesión
            { wch: 35 }, // Domicilio
            { wch: 15 }, // N° Registro
            { wch: 15 }, // Fecha Ingreso
            { wch: 15 }, // Antigüedad
            { wch: 20 }, // Compañía
            { wch: 35 }, // Categoría
            { wch: 15 }, // Grupo Sang
            { wch: 15 }, // Teléfono
            { wch: 30 }  // Email
        ];
        ws['!cols'] = columnWidths;

        XLSX.utils.book_append_sheet(wb, ws, 'Bomberos');
        XLSX.writeFile(wb, `Listado_Bomberos_${new Date().toISOString().split('T')[0]}.xlsx`);

        Utils.mostrarNotificacion('Excel exportado exitosamente', 'success');
    } catch (error) {
        console.error('Error al exportar:', error);
        Utils.mostrarNotificacion('Error al exportar: ' + error.message, 'error');
    }
}

    async generarPDFDeudores() {
        if (typeof window.jspdf === 'undefined') {
            Utils.mostrarNotificacion('Cargando librería PDF...', 'info');
            
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
            document.head.appendChild(script);
            
            script.onload = () => {
                const scriptAutoTable = document.createElement('script');
                scriptAutoTable.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.28/jspdf.plugin.autotable.min.js';
                document.head.appendChild(scriptAutoTable);
                scriptAutoTable.onload = () => this.generarPDFDeudoresReal();
            };
            return;
        }
        
        this.generarPDFDeudoresReal();
    }

    generarPDFDeudoresReal() {
        const { deudoresCuotas, deudoresBeneficios } = window.deudoresData || { deudoresCuotas: [], deudoresBeneficios: [] };
        
        if (deudoresCuotas.length === 0 && deudoresBeneficios.length === 0) {
            Utils.mostrarNotificacion('No hay deudores registrados', 'info');
            return;
        }
        
        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            doc.setFontSize(16);
            doc.setTextColor(211, 47, 47);
            doc.text('REPORTE DE DEUDORES', 105, 15, { align: 'center' });
            
            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text(`Fecha del reporte: ${new Date().toLocaleDateString('es-CL')}`, 105, 22, { align: 'center' });
            
            let yPos = 35;
            
            if (deudoresCuotas.length > 0) {
                doc.setFontSize(13);
                doc.setTextColor(156, 39, 176);
                doc.text('DEUDORES DE CUOTAS SOCIALES', 20, yPos);
                yPos += 5;
                
                const datosCuotas = deudoresCuotas.map(d => [
                    d.bombero.claveBombero,
                    d.bombero.nombre,
                    d.mesesPendientes,
                    this.formatearMonto(d.deuda)
                ]);
                
                doc.autoTable({
                    head: [['Clave', 'Nombre', 'Meses Pendientes', 'Deuda']],
                    body: datosCuotas,
                    startY: yPos,
                    headStyles: { 
                        fillColor: [156, 39, 176],
                        textColor: 255,
                        fontStyle: 'bold'
                    },
                    margin: { left: 20, right: 20 }
                });
                
                yPos = doc.lastAutoTable.finalY + 15;
            }
            
            if (deudoresBeneficios.length > 0) {
                const deudoresPorBeneficio = {};
                
                deudoresBeneficios.forEach(d => {
                    if (!deudoresPorBeneficio[d.nombreBeneficio]) {
                        deudoresPorBeneficio[d.nombreBeneficio] = [];
                    }
                    deudoresPorBeneficio[d.nombreBeneficio].push(d);
                });
                
                Object.keys(deudoresPorBeneficio).forEach((nombreBeneficio) => {
                    const deudores = deudoresPorBeneficio[nombreBeneficio];
                    
                    if (yPos > 250) {
                        doc.addPage();
                        yPos = 20;
                    }
                    
                    doc.setFontSize(13);
                    doc.setTextColor(255, 152, 0);
                    doc.text(`DEUDORES DE: ${nombreBeneficio.toUpperCase()}`, 20, yPos);
                    yPos += 3;
                    
                    doc.setFontSize(10);
                    doc.setTextColor(100);
                    doc.text(`Total de deudores: ${deudores.length}`, 20, yPos);
                    yPos += 2;
                    
                    const datosDeudores = deudores.map(d => [
                        d.bombero.claveBombero,
                        d.bombero.nombre,
                        d.bombero.compania,
                        this.formatearMonto(d.deuda),
                        d.vencido ? 'VENCIDO' : 'Pendiente'
                    ]);
                    
                    doc.autoTable({
                        head: [['Clave', 'Nombre', 'Compañía', 'Deuda', 'Estado']],
                        body: datosDeudores,
                        startY: yPos,
                        headStyles: { 
                            fillColor: [255, 152, 0],
                            textColor: 255,
                            fontStyle: 'bold',
                            fontSize: 9
                        },
                        bodyStyles: {
                            fontSize: 9
                        },
                        columnStyles: {
                            4: { 
                                textColor: function(data) {
                                    return data.cell.text[0] === 'VENCIDO' ? [244, 67, 54] : [100, 100, 100];
                                },
                                fontStyle: 'bold'
                            }
                        },
                        margin: { left: 20, right: 20 }
                    });
                    
                    yPos = doc.lastAutoTable.finalY + 12;
                    
                    const subtotal = deudores.reduce((sum, d) => sum + d.deuda, 0);
                    doc.setFontSize(10);
                    doc.setTextColor(0);
                    doc.text(`Subtotal ${nombreBeneficio}: ${this.formatearMonto(subtotal)}`, 20, yPos);
                    yPos += 15;
                });
            }
            
            if (yPos > 240) {
                doc.addPage();
                yPos = 20;
            }
            
            const totalDeudaCuotas = deudoresCuotas.reduce((sum, d) => sum + d.deuda, 0);
            const totalDeudaBeneficios = deudoresBeneficios.reduce((sum, d) => sum + d.deuda, 0);
            const totalGeneral = totalDeudaCuotas + totalDeudaBeneficios;
            
            doc.setFontSize(14);
            doc.setTextColor(0);
            doc.text('RESUMEN GENERAL', 20, yPos);
            yPos += 10;
            
            doc.setFontSize(10);
            doc.setDrawColor(200);
            doc.line(20, yPos, 190, yPos);
            yPos += 8;
            
            doc.text(`Total deudores de cuotas sociales: ${deudoresCuotas.length}`, 25, yPos);
            yPos += 6;
            doc.text(`Deuda total de cuotas: ${this.formatearMonto(totalDeudaCuotas)}`, 25, yPos);
            yPos += 10;
            
            doc.text(`Total deudores de beneficios: ${deudoresBeneficios.length}`, 25, yPos);
            yPos += 6;
            doc.text(`Deuda total de beneficios: ${this.formatearMonto(totalDeudaBeneficios)}`, 25, yPos);
            yPos += 12;
            
            doc.setDrawColor(200);
            doc.line(20, yPos, 190, yPos);
            yPos += 8;
            
            doc.setFontSize(12);
            doc.setTextColor(244, 67, 54);
            doc.setFont(undefined, 'bold');
            doc.text(`DEUDA TOTAL GENERAL: ${this.formatearMonto(totalGeneral)}`, 25, yPos);
            
            const pageCount = doc.internal.getNumberOfPages();
            for(let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setTextColor(100);
                doc.setFont(undefined, 'normal');
                doc.text(
                    `Página ${i} de ${pageCount} | Generado por Sistema SEIS`,
                    105, 
                    doc.internal.pageSize.height - 10,
                    { align: 'center' }
                );
            }
            
            doc.save(`Reporte_Deudores_${new Date().toISOString().split('T')[0]}.pdf`);
            Utils.mostrarNotificacion('PDF de deudores generado exitosamente', 'success');
            
        } catch (error) {
            console.error('Error al generar PDF:', error);
            Utils.mostrarNotificacion('Error al generar PDF: ' + error.message, 'error');
        }
    }

    formatearMonto(monto) {
        return new Intl.NumberFormat('es-CL', {
            style: 'currency',
            currency: 'CLP',
            minimumFractionDigits: 0
        }).format(monto);
    }


    // ==================== MÉTODO PARA CARGAR LOGO ====================
async cargarLogoCompania(input) {
    if (!input.files || !input.files[0]) return;
    
    const file = input.files[0];
    
    // Validar tamaño (máximo 2MB)
    if (file.size > 2 * 1024 * 1024) {
        Utils.mostrarNotificacion('El logo no debe superar 2MB', 'error');
        input.value = '';
        return;
    }
    
    // Validar tipo
    if (!file.type.startsWith('image/')) {
        Utils.mostrarNotificacion('Solo se permiten archivos de imagen', 'error');
        input.value = '';
        return;
    }
    
    try {
        // Leer imagen como Base64
        const logoBase64 = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = () => reject('Error al leer el logo');
            reader.readAsDataURL(file);
        });
        
        // Guardar en localStorage
        localStorage.setItem('logoCompania', logoBase64);
        
        Utils.mostrarNotificacion('Logo de la compañía cargado exitosamente', 'success');
        
        // Previsualizar (opcional)
        console.log('✅ Logo guardado, tamaño:', (logoBase64.length / 1024).toFixed(2), 'KB');
        
    } catch (error) {
        console.error('Error al cargar logo:', error);
        Utils.mostrarNotificacion('Error al cargar el logo', 'error');
    }
}
async generarPDFConsultaVoluntarios() {
    if (this.bomberos.length === 0) {
        Utils.mostrarNotificacion('No hay bomberos para exportar', 'error');
        return;
    }

    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('landscape');
        const pageWidth = doc.internal.pageSize.width;
        const pageHeight = doc.internal.pageSize.height;
        const margin = 15;

        // ==================== HEADER NEGRO (MÁS COMPACTO) ====================
        doc.setFillColor(0, 0, 0);
        doc.rect(0, 0, pageWidth, 38, 'F'); // Reducido de 45 a 38

        // Logo (si existe)
        const logoCompania = localStorage.getItem('logoCompania');
        if (logoCompania) {
            try {
                doc.addImage(logoCompania, 'PNG', margin, 5, 28, 28); // Más pequeño
            } catch (error) {
                console.warn('Error al cargar logo:', error);
            }
        }

        // Texto IZQUIERDA del header (más compacto)
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(15);
        doc.setFont(undefined, 'bold');
        doc.text('CUERPO DE BOMBEROS', 48, 12);
        
        doc.setFontSize(13);
        doc.text('PUERTO MONTT', 48, 20);
        
        doc.setFontSize(8);
        doc.setFont(undefined, 'normal');
        doc.text('PUERTO MONTT de Junio 1865', 48, 27);

        // Texto CENTRO del header (más compacto)
        doc.setFontSize(15);
        doc.setFont(undefined, 'bold');
        doc.text('Listado de Voluntarios', pageWidth / 2, 16, { align: 'center' });
        
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text('Ordenados por Antigüedad', pageWidth / 2, 24, { align: 'center' });

        // Texto DERECHA del header (más compacto)
        const ahora = new Date();
        const fecha = ahora.toLocaleDateString('es-CL', { 
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
        const hora = ahora.toLocaleTimeString('es-CL', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        });
        
        doc.setFontSize(8);
        doc.setFont(undefined, 'normal');
        doc.text(`Fecha: ${fecha}`, pageWidth - margin, 14, { align: 'right' });
        doc.text(`Hora: ${hora}`, pageWidth - margin, 21, { align: 'right' });

        // ==================== TABLA (MÁS COMPACTA) ====================
        let yPos = 45; // Reducido de 55 a 45
        doc.setTextColor(0, 0, 0);

        // Texto "Descendente" (más cerca)
        doc.setFontSize(10);
        doc.setFont(undefined, 'bold');
        doc.text('Descendente', margin, yPos);
        yPos += 6; // Reducido de 10 a 6

        // Ordenar por antigüedad DESCENDENTE
        const bomberosOrdenados = [...this.bomberos].sort((a, b) => {
            const fechaA = new Date(a.fechaIngreso);
            const fechaB = new Date(b.fechaIngreso);
            return fechaA - fechaB;
        });

        // ENCABEZADOS DE TABLA (MÁS COMPACTOS)
        const headerY = yPos;
        doc.setDrawColor(0);
        doc.setLineWidth(0.5);
        doc.line(margin, headerY, pageWidth - margin, headerY);
        
        yPos += 5; // Reducido de 7 a 5
        
        // Headers
        doc.setFontSize(8);
        doc.setFont(undefined, 'bold');
        doc.text('Nº', margin + 2, yPos);
        doc.text('Rut', 22, yPos);
        doc.text('Nombres', 52, yPos);
        doc.text('Clave del', 135, yPos);
        doc.text('Bombero', 135, yPos + 3);
        doc.text('Compañía', 160, yPos);
        doc.text('Antigüedad', 195, yPos);
        doc.text('Fecha', 253, yPos);
        doc.text('Ingreso', 253, yPos + 3);
        
        yPos += 4; // Reducido de 5 a 4
        doc.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 4; // Reducido de 6 a 4

        // ==================== FILAS DE DATOS (MÁS COMPACTAS) ====================
        doc.setFont(undefined, 'normal');
        doc.setFontSize(8);

        bomberosOrdenados.forEach((bombero, index) => {
            // Verificar si necesitamos nueva página
            if (yPos > pageHeight - 20) {
                doc.addPage();
                yPos = 15;
                
                // Repetir encabezados
                doc.setDrawColor(0);
                doc.setLineWidth(0.5);
                doc.line(margin, yPos, pageWidth - margin, yPos);
                yPos += 5;
                
                doc.setFont(undefined, 'bold');
                doc.setFontSize(8);
                doc.text('Nº', margin + 2, yPos);
                doc.text('Rut', 22, yPos);
                doc.text('Nombres', 52, yPos);
                doc.text('Clave del', 135, yPos);
                doc.text('Bombero', 135, yPos + 3);
                doc.text('Compañía', 160, yPos);
                doc.text('Antigüedad', 195, yPos);
                doc.text('Fecha', 253, yPos);
                doc.text('Ingreso', 253, yPos + 3);
                
                yPos += 4;
                doc.line(margin, yPos, pageWidth - margin, yPos);
                yPos += 4;
                
                doc.setFont(undefined, 'normal');
                doc.setFontSize(8);
            }

            // Datos del bombero
            const nombreCompleto = Utils.obtenerNombreCompleto(bombero).toUpperCase();
            const antiguedad = Utils.calcularAntiguedadDetallada(bombero.fechaIngreso);
            const claveBombero = bombero.claveBombero || 'N/A';
            const compania = bombero.compania || 'N/A';
            const fechaIngreso = bombero.fechaIngreso ? 
                new Date(bombero.fechaIngreso + 'T00:00:00').toLocaleDateString('es-CL', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                }) : 'N/A';
            
            // Formato antigüedad: "3 Años - 09 Meses - 24 Días"
            const antiguedadTexto = `${antiguedad.años} Años - ${String(antiguedad.meses).padStart(2, '0')} Meses - ${String(antiguedad.dias).padStart(2, '0')} Días`;

            // Imprimir fila
            doc.text(String(index + 1), margin + 2, yPos);
            doc.text(bombero.rut || 'N/A', 22, yPos);
            
            // Nombre más largo permitido
            const nombreMostrar = nombreCompleto.length > 50 ? 
                nombreCompleto.substring(0, 47) + '...' : 
                nombreCompleto;
            doc.text(nombreMostrar, 52, yPos);
            
            doc.text(claveBombero, 140, yPos, { align: 'center' });
            
            // Compañía
            const companiaMostrar = compania.length > 22 ? 
                compania.substring(0, 19) + '...' : 
                compania;
            doc.text(companiaMostrar, 160, yPos);
            
            doc.text(antiguedadTexto, 195, yPos);
            doc.text(fechaIngreso, 258, yPos, { align: 'center' });
            
            yPos += 5; // Reducido de 6 a 5
            
            // Línea horizontal más fina
            doc.setDrawColor(230);
            doc.setLineWidth(0.1);
            doc.line(margin, yPos - 1, pageWidth - margin, yPos - 1);
        });

        // ==================== PIE DE PÁGINA ====================
        const totalPages = doc.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            doc.setFontSize(7);
            doc.setTextColor(150);
            doc.setFont(undefined, 'normal');
            doc.text(
                `Sistema SEIS - Proyecto de Gestión Bomberil | Página ${i} de ${totalPages}`,
                pageWidth / 2,
                pageHeight - 6,
                { align: 'center' }
            );
        }

        // ==================== GUARDAR PDF ====================
        const nombreArchivo = `Listado_Voluntarios_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(nombreArchivo);
        
        Utils.mostrarNotificacion('PDF generado exitosamente', 'success');
        
    } catch (error) {
        console.error('❌ ERROR al generar PDF:', error);
        Utils.mostrarNotificacion('Error al generar PDF: ' + error.message, 'error');
    }
}




} // Fin de la clase SistemaBomberos

// Inicializar sistema
document.addEventListener('DOMContentLoaded', () => {
    window.sistemaBomberos = new SistemaBomberos();
});