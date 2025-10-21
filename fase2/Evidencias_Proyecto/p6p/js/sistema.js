// ==================== SISTEMA PRINCIPAL DE BOMBEROS (VERSIÓN SIMPLIFICADA) ====================
class SistemaBomberos {
    constructor() {
        this.bomberos = [];
        this.editandoId = null;
        this.terminoBusqueda = '';
         this.paginationBomberos = null;
        this.init();
    }
aplicarPermisosUI() {
    const permisos = getUserPermissions();
    if (!permisos) return;
    
    const formContainer = document.querySelector('.form-container');
    const registrosButtons = document.querySelector('.registros-buttons');
    
    // Si no puede editar, ocultar formulario y botones de ejemplo
    if (!permisos.canEdit) {
        if (formContainer) {
            // Ocultar todo el contenedor del formulario
            const allElements = formContainer.querySelectorAll('form, .buttons, .modo-edicion');
            allElements.forEach(el => el.style.display = 'none');
            
            // Agregar mensaje informativo
            const mensaje = document.createElement('div');
            mensaje.className = 'info-solo-lectura';
            mensaje.innerHTML = `
                <h3>Bienvenido Tesorero</h3>
            `;
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
        
        // Ocultar botones de ejemplos si existe
        if (registrosButtons) {
            registrosButtons.style.display = 'none';
        }
    }
}

    async init() {
        // Verificar autenticación
        if (!checkAuth()) {
            window.location.href = 'index.html';
            return;
        }

        // Inicializar contadores SIEMPRE
        this.inicializarContadores();
        
        // Cargar datos
        await this.cargarDatos();
        
        // Configurar interfaz
        this.configurarInterfaz();
        
        // Renderizar datos
        this.renderizarBomberos();
        
        // Mostrar información del usuario
        this.mostrarInfoUsuario();
        
        this.aplicarPermisosUI();
        await this.calcularYMostrarDeudores();
    }

    inicializarContadores() {
        // FORZAR inicialización de contadores
        window.idCounter = 1;
        window.sancionIdCounter = 1;
        window.cargoIdCounter = 1;
        
        console.log('✅ Contadores forzados a:', {
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

        // Cargar datos de ejemplo si no hay datos
        if (this.bomberos.length === 0) {
            console.log('🔄 No hay datos, cargando ejemplos...');
            await this.cargarDatosEjemplo();
        }
    }

    async cargarDatosEjemplo() {
        console.log('🎯 Creando ejemplos...');
        
        const hoy = new Date();
        
        // EJEMPLOS MUY SIMPLES
        const ejemplos = [
            {
                id: window.idCounter++,
                claveBombero: "618-A",
                nombre: "Carlos Eduardo Morales Silva",
                fechaNacimiento: "1996-06-15",
                run: "12.345.678-9",
                profesion: "Ingeniero Civil",
                domicilio: "Av. Providencia 1234",
                nroRegistro: "REG-2019-001",
                fechaIngreso: "2019-03-15",
                compania: "Primera Compañía",
                grupoSanguineo: "O+",
                telefono: "+56 9 8765 4321",
                email: "carlos@email.com",
                foto: null,
                otrosCuerpos: "",
                companiaOpcional: "",
                desde: "",
                hasta: "",
                fechaRegistro: new Date().toISOString()
            },
            {
                id: window.idCounter++,
                claveBombero: "425-B",
                nombre: "María Teresa González",
                fechaNacimiento: "1977-09-20",
                run: "11.222.333-4",
                profesion: "Profesora",
                domicilio: "Calle Los Aromos 567",
                nroRegistro: "REG-2002-045",
                fechaIngreso: "2002-03-15",
                compania: "Segunda Compañía",
                grupoSanguineo: "A+",
                telefono: "+56 9 7654 3210",
                email: "maria@email.com",
                foto: null,
                otrosCuerpos: "",
                companiaOpcional: "",
                desde: "",
                hasta: "",
                fechaRegistro: new Date().toISOString()
            }
        ];

        console.log('✅ Ejemplos creados:', ejemplos.length);
        this.bomberos = ejemplos;
        this.guardarDatos();
        
        // Crear algunos cargos de ejemplo
        await this.crearCargosEjemplo();
    }

    async crearCargosEjemplo() {
        const cargos = storage.getCargos();
        
        const ejemplosCargos = [
            {
                id: window.cargoIdCounter++,
                bomberoId: 1,
                añoCargo: 2020,
                tipoCargo: 'Teniente Cuarto',
                fechaInicioCargo: '2020-01-01',
                fechaFinCargo: '2021-12-31',
                premioAñoServicio: 'Medalla 5 Años',
                observacionesCargo: 'Primer cargo de mando',
                fechaRegistro: new Date().toISOString()
            },
            {
                id: window.cargoIdCounter++,
                bomberoId: 2,
                añoCargo: 2022,
                tipoCargo: 'Teniente Primero',
                fechaInicioCargo: '2022-01-01',
                fechaFinCargo: null,
                premioAñoServicio: 'Medalla 20 Años',
                observacionesCargo: 'En ejercicio',
                fechaRegistro: new Date().toISOString()
            }
        ];

        cargos.push(...ejemplosCargos);
        storage.saveCargos(cargos);
        storage.saveCounters({
            bomberoId: window.idCounter,
            sancionId: window.sancionIdCounter,
            cargoId: window.cargoIdCounter
        });
        
        console.log('✅ Cargos de ejemplo creados:', ejemplosCargos.length);
    }

    guardarDatos() {
        storage.saveBomberos(this.bomberos);
        console.log('💾 Datos guardados');
    }
    

    configurarInterfaz() {
        // Configurar buscador
        document.getElementById('buscadorBomberos').addEventListener('input', (e) => {
            this.terminoBusqueda = e.target.value.toLowerCase();
            this.renderizarBomberos();
        });

        // Configurar formulario
        document.getElementById('formBombero').addEventListener('submit', (e) => {
            this.manejarSubmitFormulario(e);
        });

        // Configurar logout
        document.getElementById('logoutBtn').addEventListener('click', () => {
            logout();
        });
    }

mostrarInfoUsuario() {
    const userInfo = document.getElementById('userInfoHeader');
    const userRoleInfo = document.getElementById('userRoleInfo');
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    if (currentUser) {
        userRoleInfo.textContent = `${currentUser.role}: ${currentUser.username}`;
        
        // Mostrar botón de Beneficios para admin
        const btnBeneficios = document.getElementById('btnBeneficios');
        if (btnBeneficios && (currentUser.role === 'Director' || currentUser.role === 'Super Administrador' || currentUser.role === 'Tesorero')) {
            btnBeneficios.style.display = 'inline-block';
            btnBeneficios.onclick = () => {
                this.verBeneficios();
            };
        }
        
        // Mostrar saldo, botón de finanzas y DEUDORES para Tesorero
        if (currentUser.role === 'Tesorero') {
            this.mostrarSaldoEnHeader();
            
            const btnFinanzas = document.getElementById('btnFinanzas');
            if (btnFinanzas) {
                btnFinanzas.style.display = 'inline-block';
                btnFinanzas.onclick = () => {
                    window.location.href = 'finanzas.html';
                };
            }
            
            // NUEVO: Mostrar botón de deudores
            const btnDeudores = document.getElementById('btnDeudores');
            if (btnDeudores) {
                btnDeudores.style.display = 'inline-block';
                btnDeudores.onclick = () => {
                    this.generarPDFDeudores();
                };
            }
        }
    }
}
// Agregar este nuevo método a la clase SistemaBomberos
mostrarSaldoEnHeader() {
    const saldoDiv = document.getElementById('saldoCompaniaHeader');
    const saldoMonto = document.getElementById('saldoMontoHeader');
    
    if (saldoDiv && saldoMonto) {
        // RECARGAR los datos cada vez
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
        
        // Cambiar color según el saldo
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
    async manejarSubmitFormulario(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const datos = Object.fromEntries(formData);
        
        // Validación simple
        if (!datos.nombre || !datos.run) {
            Utils.mostrarNotificacion('Nombre y RUN son obligatorios', 'error');
            return;
        }

        try {
            const bomberoData = {
                ...datos,
                id: window.idCounter++,
                fechaRegistro: new Date().toISOString()
            };

            this.bomberos.push(bomberoData);
            this.guardarDatos();
            
            Utils.mostrarNotificacion('Bombero registrado exitosamente', 'success');
            this.limpiarFormulario();
            this.renderizarBomberos();
        } catch (error) {
            Utils.mostrarNotificacion('Error: ' + error.message, 'error');
        }
    }
renderizarBomberos() {
    const lista = document.getElementById('listaBomberos');
    const total = document.getElementById('totalBomberos');
    
    const bomberosFiltrados = this.terminoBusqueda ? 
        this.bomberos.filter(b => 
            b.nombre.toLowerCase().includes(this.terminoBusqueda) ||
            b.claveBombero.toLowerCase().includes(this.terminoBusqueda) ||
            b.run.toLowerCase().includes(this.terminoBusqueda)
        ) : this.bomberos;
    
    total.textContent = bomberosFiltrados.length;

    if (bomberosFiltrados.length === 0) {
        lista.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">No hay bomberos registrados</p>';
        return;
    }

    // Inicializar o actualizar paginación
    if (!this.paginationBomberos) {
        this.paginationBomberos = new Pagination(bomberosFiltrados, 10);
    } else {
        this.paginationBomberos.updateItems(bomberosFiltrados);
    }

    // Obtener permisos
    const permisos = getUserPermissions();
    const puedeEditar = permisos ? permisos.canEdit : false;
    const puedeEliminar = permisos ? permisos.canDelete : false;
    const puedeVerCargos = permisos ? permisos.canViewCargos : false;
    const puedeVerSanciones = permisos ? permisos.canViewSanciones : false;

    // Renderizar solo items de la página actual
    const itemsPagina = this.paginationBomberos.getCurrentPageItems();
    
    lista.innerHTML = itemsPagina.map(bombero => `
        <div class="registro-card">
            <div class="registro-foto">
                <div class="sin-foto">Sin foto</div>
            </div>
            <div class="registro-contenido">
                <div class="registro-header">
                    <div>
                        <div class="registro-nombre">${bombero.nombre}</div>
                        <div class="registro-run">Clave: ${bombero.claveBombero} | RUN: ${bombero.run}</div>
                    </div>
                    <div class="registro-acciones">
                        <button class="btn-cuotas" onclick="sistema.verCuotas(${bombero.id})">💳 Cuotas</button>
                        <button class="btn-beneficios" onclick="sistema.verPagarBeneficios(${bombero.id})">🎫 Pagar Beneficios</button>
                        ${puedeVerCargos ? `<button class="btn-cargos" onclick="sistema.verCargos(${bombero.id})">Cargos</button>` : ''}
                        ${puedeVerSanciones ? `<button class="btn-sanciones" onclick="sistema.verSanciones(${bombero.id})">Sanciones</button>` : ''}
                        ${puedeEditar ? `<button class="btn-edit" onclick="sistema.editarBombero(${bombero.id})">Editar</button>` : ''}
                        ${puedeEliminar ? `<button class="btn-delete" onclick="sistema.eliminarBombero(${bombero.id})">Eliminar</button>` : ''}
                    </div>
                </div>
                <div class="registro-info">
                    <div><strong>Profesión:</strong> <span>${bombero.profesion}</span></div>
                    <div><strong>Compañía:</strong> <span>${bombero.compania}</span></div>
                    <div><strong>Teléfono:</strong> <span>${bombero.telefono}</span></div>
                </div>
            </div>
        </div>
    `).join('');

    // Renderizar controles de paginación
    this.paginationBomberos.renderControls('paginationControlsBomberos', 'sistema.cambiarPaginaBomberos');
}

// Método para cambiar de página
cambiarPaginaBomberos(pageNumber) {
    if (this.paginationBomberos.goToPage(pageNumber)) {
        this.renderizarBomberos();
        // Scroll al inicio de la lista
        document.getElementById('listaBomberos').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

    limpiarFormulario() {
        document.getElementById('formBombero').reset();
    }

    async eliminarBombero(id) {
        const bombero = this.bomberos.find(b => b.id === id);
        if (!bombero) return;

        const confirmado = await Utils.confirmarAccion(
            `¿Eliminar a ${bombero.nombre}?`
        );

        if (confirmado) {
            this.bomberos = this.bomberos.filter(b => b.id !== id);
            this.guardarDatos();
            this.renderizarBomberos();
            Utils.mostrarNotificacion('Bombero eliminado', 'success');
        }
    }

    editarBombero(id) {
        Utils.mostrarNotificacion('Función de edición en desarrollo', 'info');
    }

    // ==================== NAVEGACIÓN SIMPLIFICADA ====================
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

    // En sistema.js, reemplaza SOLO la función toggleDatosEjemplo:

async toggleDatosEjemplo() {
    const tieneEjemplos = storage.tieneEjemplosActivos();
    
    if (tieneEjemplos) {
        const confirmado = await Utils.confirmarAccion(
            '¿Está seguro de eliminar TODOS los datos de ejemplo? ' +
            'Esto removerá 6 bomberos, 12 sanciones y 18 cargos de ejemplo.'
        );
        
        if (confirmado) {
            const resultado = storage.eliminarEjemplos();
            
            // Recargar datos
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
            
            // Recargar datos
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

    // Método para ver beneficios (SOLO ADMIN)
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

// Método para pagar beneficios
verPagarBeneficios(id) {
    Utils.mostrarNotificacion('Redirigiendo a pago de beneficios...', 'info');
    localStorage.setItem('bomberoPagarBeneficioActual', id);
    setTimeout(() => window.location.href = 'pagar-beneficio.html', 1000);
}
verPagarBeneficios(id) {
    Utils.mostrarNotificacion('Redirigiendo a pago de beneficios...', 'info');
    localStorage.setItem('bomberoPagarBeneficioActual', id);
    setTimeout(() => window.location.href = 'pagar-beneficio.html', 1000);
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


async calcularYMostrarDeudores() {
    // Calcular deudores de cuotas
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
                deudaCuotas += 5000; // Asumiendo cuota regular
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
    
    // Calcular deudores de beneficios
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
    
    // Actualizar contador en el botón del header
    const cantidadElement = document.getElementById('cantidadDeudores');
    if (cantidadElement) {
        cantidadElement.textContent = totalDeudores;
        
        // Cambiar color del botón según cantidad
        const btnDeudores = document.getElementById('btnDeudores');
        if (btnDeudores) {
            if (totalDeudores > 0) {
                btnDeudores.classList.add('tiene-deudores');
            } else {
                btnDeudores.classList.remove('tiene-deudores');
            }
        }
    }
    
    // Mostrar notificación solo si hay deudores
    if (totalDeudores > 0) {
        this.mostrarNotificacionDeudores(totalDeudores, deudoresCuotas, deudoresBeneficios);
    }
    
    // Guardar para uso posterior (PDF)
    window.deudoresData = { deudoresCuotas, deudoresBeneficios };
}

mostrarNotificacionDeudores(total, deudoresCuotas, deudoresBeneficios) {
    const notificacion = document.createElement('div');
    notificacion.className = 'notificacion-deudores';
    notificacion.innerHTML = `
        <div class="notificacion-deudores-contenido">
            <div class="notificacion-deudores-icono">⚠️</div>
            <div class="notificacion-deudores-texto">
                <h3>Hay ${total} deudores en el sistema</h3>
                <p>${deudoresCuotas.length} deudores de cuotas sociales | ${deudoresBeneficios.length} deudores de beneficios</p>
            </div>
            <button class="btn-ver-deudores" onclick="sistema.generarPDFDeudores()">
                📄 Generar Reporte PDF
            </button>
            <button class="btn-cerrar-notif" onclick="this.closest('.notificacion-deudores').remove()">✕</button>
        </div>
    `;
    
    document.body.appendChild(notificacion);
}async generarPDFDeudores() {
    if (typeof window.jspdf === 'undefined') {
        Utils.mostrarNotificacion('Cargando librería PDF...', 'info');
        
        // Cargar jsPDF si no está cargado
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
        
        // Encabezado
        doc.setFontSize(16);
        doc.setTextColor(211, 47, 47);
        doc.text('REPORTE DE DEUDORES', 105, 15, { align: 'center' });
        
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Fecha del reporte: ${new Date().toLocaleDateString('es-CL')}`, 105, 22, { align: 'center' });
        
        let yPos = 35;
        
        // SECCIÓN: DEUDORES DE CUOTAS SOCIALES
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
        
        // SECCIÓN: DEUDORES DE BENEFICIOS (AGRUPADOS POR BENEFICIO)
        if (deudoresBeneficios.length > 0) {
            // Agrupar deudores por beneficio
            const deudoresPorBeneficio = {};
            
            deudoresBeneficios.forEach(d => {
                if (!deudoresPorBeneficio[d.nombreBeneficio]) {
                    deudoresPorBeneficio[d.nombreBeneficio] = [];
                }
                deudoresPorBeneficio[d.nombreBeneficio].push(d);
            });
            
            // Renderizar cada beneficio por separado
            Object.keys(deudoresPorBeneficio).forEach((nombreBeneficio, index) => {
                const deudores = deudoresPorBeneficio[nombreBeneficio];
                
                // Verificar si necesitamos nueva página
                if (yPos > 250) {
                    doc.addPage();
                    yPos = 20;
                }
                
                // Título del beneficio
                doc.setFontSize(13);
                doc.setTextColor(255, 152, 0);
                doc.text(`DEUDORES DE: ${nombreBeneficio.toUpperCase()}`, 20, yPos);
                yPos += 3;
                
                // Subtítulo con cantidad
                doc.setFontSize(10);
                doc.setTextColor(100);
                doc.text(`Total de deudores: ${deudores.length}`, 20, yPos);
                yPos += 2;
                
                // Tabla de deudores de este beneficio
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
                
                // Subtotal del beneficio
                const subtotal = deudores.reduce((sum, d) => sum + d.deuda, 0);
                doc.setFontSize(10);
                doc.setTextColor(0);
                doc.text(`Subtotal ${nombreBeneficio}: ${this.formatearMonto(subtotal)}`, 20, yPos);
                yPos += 15;
            });
        }
        
        // RESUMEN TOTAL (en nueva página si es necesario)
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
        
        // Pie de página en todas las páginas
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
        
        // Descargar
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

}

// Inicializar sistema
document.addEventListener('DOMContentLoaded', () => {
    window.sistema = new SistemaBomberos();
});