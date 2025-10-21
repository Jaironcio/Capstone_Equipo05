// ==================== SISTEMA PRINCIPAL DE BOMBEROS ====================
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

        if (this.bomberos.length === 0) {
            console.log('🔄 No hay datos, cargando ejemplos...');
            await this.cargarDatosEjemplo();
        }
    }

    async cargarDatosEjemplo() {
        console.log('🎯 Creando ejemplos...');
        
        const ejemplos = [
            {
                id: window.idCounter++,
                claveBombero: "618-A",
                nombre: "Carlos Eduardo Morales Silva",
                apellidoPaterno: "Morales",
                apellidoMaterno: "Silva",
                fechaNacimiento: "1996-06-15",
                rut: "12.345.678-9",
                profesion: "Ingeniero Civil",
                domicilio: "Av. Providencia 1234",
                nroRegistro: "REG-2019-001",
                fechaIngreso: "2019-03-15",
                compania: "Primera Compañía",
                grupoSanguineo: "O+",
                telefono: "+56 9 8765 4321",
                email: "carlos@email.com",
                foto: null,
                fechaRegistro: new Date().toISOString()
            },
            {
                id: window.idCounter++,
                claveBombero: "425-B",
                nombre: "María Teresa González",
                apellidoPaterno: "González",
                apellidoMaterno: "Rodríguez",
                fechaNacimiento: "1977-09-20",
                rut: "11.222.333-4",
                profesion: "Profesora",
                domicilio: "Calle Los Aromos 567",
                nroRegistro: "REG-2002-045",
                fechaIngreso: "2002-03-15",
                compania: "Segunda Compañía",
                grupoSanguineo: "A+",
                telefono: "+56 9 7654 3210",
                email: "maria@email.com",
                foto: null,
                fechaRegistro: new Date().toISOString()
            }
        ];

        console.log('✅ Ejemplos creados:', ejemplos);
        this.bomberos = ejemplos;
        this.guardarDatos();
        
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
        document.getElementById('buscadorBomberos').addEventListener('input', (e) => {
            this.terminoBusqueda = e.target.value.toLowerCase();
            this.renderizarBomberos();
        });

        document.getElementById('formBombero').addEventListener('submit', (e) => {
            this.manejarSubmitFormulario(e);
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

    async manejarSubmitFormulario(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const datos = Object.fromEntries(formData);
    
    console.log('📝 Datos capturados:', datos);
    
    if (!datos.nombre || !datos.rut) {
        Utils.mostrarNotificacion('Nombre y RUT son obligatorios', 'error');
        return;
    }

    try {
        // Verificar si estamos editando
        const idEditando = document.getElementById('idEditando').value;
        const esEdicion = idEditando && idEditando !== '';

        // Leer foto
        const inputFoto = document.getElementById('fotoBombero');
        let fotoBase64 = null;
        
        if (inputFoto && inputFoto.files && inputFoto.files[0]) {
            console.log('📸 Leyendo foto nueva:', inputFoto.files[0].name);
            
            fotoBase64 = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    console.log('✅ Foto cargada correctamente');
                    resolve(e.target.result);
                };
                reader.onerror = () => {
                    console.error('❌ Error al leer foto');
                    reject('Error al leer la foto');
                };
                reader.readAsDataURL(inputFoto.files[0]);
            });
        } else if (esEdicion) {
            // Si estamos editando y no se subió nueva foto, mantener la anterior
            const bomberoOriginal = this.bomberos.find(b => b.id == idEditando);
            if (bomberoOriginal) {
                fotoBase64 = bomberoOriginal.foto;
            }
        }

        const bomberoData = {
            id: esEdicion ? parseInt(idEditando) : window.idCounter++,
            claveBombero: datos.claveBombero,
            nombre: datos.nombre,
            apellidoPaterno: datos.apellidoPaterno || '',
            apellidoMaterno: datos.apellidoMaterno || '',
            fechaNacimiento: datos.fechaNacimiento,
            rut: datos.rut,
            profesion: datos.profesion,
            domicilio: datos.domicilio,
            nroRegistro: datos.nroRegistro,
            fechaIngreso: datos.fechaIngreso,
            compania: datos.compania,
            grupoSanguineo: datos.grupoSanguineo,
            telefono: datos.telefono,
            email: datos.email || '',
            foto: fotoBase64,
            otrosCuerpos: datos.otrosCuerpos || '',
            companiaOpcional: datos.companiaOpcional || '',
            desde: datos.desde || '',
            hasta: datos.hasta || '',
            fechaRegistro: esEdicion ? 
                (this.bomberos.find(b => b.id == idEditando)?.fechaRegistro || new Date().toISOString()) : 
                new Date().toISOString()
        };

        if (esEdicion) {
            // ACTUALIZAR bombero existente
            const index = this.bomberos.findIndex(b => b.id == idEditando);
            if (index !== -1) {
                this.bomberos[index] = bomberoData;
                Utils.mostrarNotificacion('Bombero actualizado exitosamente', 'success');
            }
        } else {
            // CREAR nuevo bombero
            this.bomberos.push(bomberoData);
            Utils.mostrarNotificacion('Bombero registrado exitosamente', 'success');
        }

        this.guardarDatos();
        
        storage.saveCounters({
            bomberoId: window.idCounter,
            sancionId: window.sancionIdCounter,
            cargoId: window.cargoIdCounter
        });
        
        this.limpiarFormulario();
        this.cancelarEdicion();
        this.renderizarBomberos();
    } catch (error) {
        console.error('❌ Error:', error);
        Utils.mostrarNotificacion('Error: ' + error.message, 'error');
    }
}

    previsualizarFoto(input) {
        const preview = document.getElementById('previewFoto');
        
        if (!input.files || !input.files[0]) {
            preview.innerHTML = '';
            return;
        }

        const file = input.files[0];
        
        // Validar tamaño (5MB máximo)
        if (file.size > 5 * 1024 * 1024) {
            Utils.mostrarNotificacion('La foto no debe superar 5MB', 'error');
            input.value = '';
            preview.innerHTML = '';
            return;
        }

        // Validar tipo
        if (!file.type.startsWith('image/')) {
            Utils.mostrarNotificacion('Solo se permiten archivos de imagen', 'error');
            input.value = '';
            preview.innerHTML = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            preview.innerHTML = `
                <div style="text-align: center; margin-top: 10px;">
                    <img src="${e.target.result}" 
                         alt="Vista previa" 
                         style="max-width: 150px; max-height: 150px; border-radius: 10px; border: 2px solid #1976d2; object-fit: cover;">
                    <p style="font-size: 0.8rem; color: #666; margin-top: 5px;">✅ Foto cargada</p>
                </div>
            `;
        };
        reader.readAsDataURL(file);
    }

renderizarBomberos() {
    const lista = document.getElementById('listaBomberos');
    const total = document.getElementById('totalBomberos');
    
    const bomberosFiltrados = this.terminoBusqueda ? 
        this.bomberos.filter(b => 
            b.nombre.toLowerCase().includes(this.terminoBusqueda) ||
            b.claveBombero.toLowerCase().includes(this.terminoBusqueda) ||
            (b.rut && b.rut.toLowerCase().includes(this.terminoBusqueda))
        ) : this.bomberos;
    
    // ✅ ORDENAR POR ANTIGÜEDAD (más años de servicio primero)
    const bomberosOrdenados = [...bomberosFiltrados].sort((a, b) => {
        const antiguedadA = Utils.calcularAntiguedadDetallada(a.fechaIngreso);
        const antiguedadB = Utils.calcularAntiguedadDetallada(b.fechaIngreso);
        
        // Comparar años primero
        if (antiguedadB.años !== antiguedadA.años) {
            return antiguedadB.años - antiguedadA.años;
        }
        
        // Si tienen los mismos años, comparar meses
        if (antiguedadB.meses !== antiguedadA.meses) {
            return antiguedadB.meses - antiguedadA.meses;
        }
        
        // Si tienen los mismos años y meses, comparar días
        return antiguedadB.dias - antiguedadA.dias;
    });
    
    total.textContent = bomberosOrdenados.length;

    if (bomberosOrdenados.length === 0) {
        lista.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">No hay bomberos registrados</p>';
        return;
    }

    if (!this.paginationBomberos) {
        this.paginationBomberos = new Pagination(bomberosOrdenados, 10);
    } else {
        this.paginationBomberos.updateItems(bomberosOrdenados);
    }

    const permisos = getUserPermissions();
    const puedeEditar = permisos ? permisos.canEdit : false;
    const puedeEliminar = permisos ? permisos.canDelete : false;
    const puedeVerCargos = permisos ? permisos.canViewCargos : false;
    const puedeVerSanciones = permisos ? permisos.canViewSanciones : false;

    const itemsPagina = this.paginationBomberos.getCurrentPageItems();
    
    // ✅ CALCULAR ÍNDICE GLOBAL (no solo de la página)
    const paginaActual = this.paginationBomberos.currentPage;
    const itemsPorPagina = this.paginationBomberos.itemsPerPage;
    const indiceInicial = (paginaActual - 1) * itemsPorPagina;
    
    lista.innerHTML = itemsPagina.map((bombero, indexLocal) => {
        const indiceGlobal = indiceInicial + indexLocal; // ✅ Índice real
        
        const edad = Utils.calcularEdad(bombero.fechaNacimiento);
        const antiguedad = Utils.calcularAntiguedadDetallada(bombero.fechaIngreso);
        const antiguedadTexto = `${antiguedad.años} años${antiguedad.meses > 0 ? ', ' + antiguedad.meses + (antiguedad.meses === 1 ? ' mes' : ' meses') : ''}${antiguedad.dias > 0 ? ', ' + antiguedad.dias + (antiguedad.dias === 1 ? ' día' : ' días') : ''}`;
        const categoriaInfo = Utils.calcularCategoriaBombero(bombero.fechaIngreso);
        
        return `
            <div class="registro-card-nuevo">
                <div class="registro-header-top">
                    <div class="registro-titulo-info">
                        <div class="registro-foto-inline">
                            ${bombero.foto ? 
                                `<img src="${bombero.foto}" alt="Foto ${bombero.nombre}">` : 
                                `<div class="sin-foto-inline">Sin foto</div>`
                            }
                        </div>
                        <div class="registro-nombre-info">
                            <h2 class="registro-nombre-grande">${bombero.nombre}</h2>
                            <div class="registro-clave-run">
                                <span>Clave: ${bombero.claveBombero}</span>
                                <span class="separador">|</span>
                                <span>RUN: ${bombero.rut || 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="registro-botones-horizontal">
                        ${puedeVerCargos ? `<button class="btn-accion-h btn-cargos" onclick="sistemaBomberos.verCargos(${bombero.id})">Cargos</button>` : ''}
                        ${puedeVerSanciones ? `<button class="btn-accion-h btn-sanciones" onclick="sistemaBomberos.verSanciones(${bombero.id})">Sanciones</button>` : ''}
                        <button class="btn-accion-h btn-cuotas" onclick="sistemaBomberos.verCuotas(${bombero.id})">💳 Cuotas</button>
                        <button class="btn-accion-h btn-beneficios" onclick="sistemaBomberos.verPagarBeneficios(${bombero.id})">🎫 Beneficios</button>
                        ${puedeEditar ? `<button class="btn-accion-h btn-editar" onclick="sistemaBomberos.editarBombero(${bombero.id})">Editar</button>` : ''}
                        ${puedeEliminar ? `<button class="btn-accion-h btn-eliminar" onclick="sistemaBomberos.eliminarBombero(${bombero.id})">Eliminar</button>` : ''}
                    </div>
                </div>
                
                <div class="registro-numero-badge">#${indiceGlobal + 1}</div>
                
                <div class="registro-edad-antiguedad">
                    <span><strong>Edad:</strong> ${edad} años</span>
                    <span class="separador-vertical"></span>
                    <span><strong>Antigüedad:</strong> ${antiguedadTexto}</span>
                </div>
                
                <div class="registro-categoria" style="background-color: ${categoriaInfo.color}15; border-left: 4px solid ${categoriaInfo.color};">
                    <span class="categoria-icono">${categoriaInfo.icono}</span>
                    <span class="categoria-texto" style="color: ${categoriaInfo.color};">${categoriaInfo.categoria}</span>
                </div>
                
                <div class="registro-grid-info">
                    <div class="info-item">
                        <span class="info-label">Profesión:</span>
                        <span class="info-valor">${bombero.profesion || 'N/A'}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Domicilio:</span>
                        <span class="info-valor">${bombero.domicilio || 'N/A'}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Registro Nacional:</span>
                        <span class="info-valor">${bombero.nroRegistro || 'N/A'}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Compañía:</span>
                        <span class="info-valor">${bombero.compania || 'N/A'}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Grupo Sanguíneo:</span>
                        <span class="info-valor">${bombero.grupoSanguineo || 'N/A'}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Fecha Ingreso:</span>
                        <span class="info-valor">${bombero.fechaIngreso ? new Date(bombero.fechaIngreso).toLocaleDateString('es-CL') : 'N/A'}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Teléfono:</span>
                        <span class="info-valor">${bombero.telefono || 'N/A'}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Email:</span>
                        <span class="info-valor">${bombero.email || 'N/A'}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    this.paginationBomberos.renderControls('paginationControlsBomberos', 'sistemaBomberos.cambiarPaginaBomberos');
}
    cambiarPaginaBomberos(pageNumber) {
        if (this.paginationBomberos.goToPage(pageNumber)) {
            this.renderizarBomberos();
            document.getElementById('listaBomberos').scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    limpiarFormulario() {
        document.getElementById('formBombero').reset();
        document.getElementById('previewFoto').innerHTML = '';
        const inputFoto = document.getElementById('fotoBombero');
        if (inputFoto) inputFoto.value = '';
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
        Utils.mostrarNotificacion('No hay voluntarios para exportar', 'error');
        return;
    }

    try {
        if (typeof window.jspdf === 'undefined') {
            Utils.mostrarNotificacion('Error: jsPDF no está cargado', 'error');
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('landscape');
        
        const pageWidth = doc.internal.pageSize.width;
        const pageHeight = doc.internal.pageSize.height;
        const margin = 10;
        
        const logoBase64 = localStorage.getItem('logoCompania');
        
        const agregarHeader = (pageNum) => {
            doc.setFillColor(0, 0, 0);
            doc.rect(0, 0, pageWidth, 35, 'F');
            
            if (logoBase64) {
                try {
                    doc.addImage(logoBase64, 'PNG', 8, 5, 25, 25);
                } catch (error) {
                    console.error('Error al agregar logo:', error);
                }
            }
            
            const textStartX = logoBase64 ? 38 : margin;
            
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(16);
            doc.setFont(undefined, 'bold');
            doc.text('CUERPO DE BOMBEROS', textStartX, 12);
            
            doc.setFontSize(12);
            doc.setFont(undefined, 'normal');
            doc.text('PUERTO MONTT', textStartX, 20);
            
            doc.setFontSize(9);
            doc.text('PUERTO MONTT de Junio 1865', textStartX, 27);
            
            doc.setFontSize(13);
            doc.setFont(undefined, 'bold');
            doc.text('Listado de Voluntarios', pageWidth / 2, 15, { align: 'center' });
            
            doc.setFontSize(10);
            doc.setFont(undefined, 'normal');
            doc.text('Ordenados por Antigüedad', pageWidth / 2, 22, { align: 'center' });
            
            doc.setFontSize(9);
            const infoX = pageWidth - 55;
            doc.text(`Fecha: ${new Date().toLocaleDateString('es-CL')}`, infoX, 15);
            doc.text(`Hora: ${new Date().toLocaleTimeString('es-CL')}`, infoX, 22);
            
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(10);
            doc.setFont(undefined, 'bold');
            doc.text('Descendente', margin, 43);
        };

        agregarHeader(1);
        
        let yPos = 50;
        doc.setFontSize(8);
        doc.setFont(undefined, 'bold');
        
        // ✅ COLUMNAS CON NUMERACIÓN AGREGADA
        const headers = [
            { text: 'N°', x: 12, lines: 1 },  // ✅ NUEVA COLUMNA
            { text: 'Rut', x: 22, lines: 1 },
            { text: 'Nombres', x: 60, lines: 1 },
            { text: 'Clave del', x: 145, lines: 2, line2: 'Bombero' },
            { text: 'Compañía', x: 180, lines: 1 },
            { text: 'Antigüedad', x: 215, lines: 1 },
            { text: 'Fecha', x: 265, lines: 2, line2: 'Ingreso' }
        ];
        
        doc.setDrawColor(0, 0, 0);
        doc.line(margin, yPos + 6, pageWidth - margin, yPos + 6);
        
        headers.forEach(h => {
            if (h.lines === 2) {
                doc.text(h.text, h.x, yPos - 2);
                doc.text(h.line2, h.x, yPos + 2);
            } else {
                doc.text(h.text, h.x, yPos);
            }
        });
        
        yPos += 14;

        doc.setFont(undefined, 'normal');
        doc.setFontSize(7);
        
      // ✅ ORDENAR POR ANTIGÜEDAD (más años de servicio primero)
const bomberosOrdenados = [...this.bomberos].sort((a, b) => {
    const antiguedadA = Utils.calcularAntiguedadDetallada(a.fechaIngreso);
    const antiguedadB = Utils.calcularAntiguedadDetallada(b.fechaIngreso);
    
    // Comparar años primero
    if (antiguedadB.años !== antiguedadA.años) {
        return antiguedadB.años - antiguedadA.años; // Mayor antigüedad primero
    }
    
    // Si tienen los mismos años, comparar meses
    if (antiguedadB.meses !== antiguedadA.meses) {
        return antiguedadB.meses - antiguedadA.meses;
    }
    
    // Si tienen los mismos años y meses, comparar días
    return antiguedadB.dias - antiguedadA.dias;
});

        let pageNum = 1;
        
        bomberosOrdenados.forEach((bombero, index) => {
            if (yPos > pageHeight - 20) {
                doc.addPage();
                pageNum++;
                agregarHeader(pageNum);
                yPos = 50;
                
                doc.setFontSize(8);
                doc.setFont(undefined, 'bold');
                doc.setDrawColor(0, 0, 0);
                doc.line(margin, yPos + 6, pageWidth - margin, yPos + 6);
                
                headers.forEach(h => {
                    if (h.lines === 2) {
                        doc.text(h.text, h.x, yPos - 2);
                        doc.text(h.line2, h.x, yPos + 2);
                    } else {
                        doc.text(h.text, h.x, yPos);
                    }
                });
                
                yPos += 14;
                doc.setFont(undefined, 'normal');
                doc.setFontSize(7);
            }
            
            let antiguedad = { años: 0, meses: 0, dias: 0 };
            let antiguedadTexto = '0 Años - 00 Meses - 00 Días';
            
            if (bombero.fechaIngreso) {
                antiguedad = Utils.calcularAntiguedadDetallada(bombero.fechaIngreso);
                antiguedadTexto = `${antiguedad.años} Años - ${String(antiguedad.meses).padStart(2, '0')} Meses - ${String(antiguedad.dias).padStart(2, '0')} Días`;
            }
            
            let categoria = 'SEXTA';
            if (antiguedad.años < 20) categoria = 'SEXTA';
            else if (antiguedad.años >= 20 && antiguedad.años < 25) categoria = 'QUINTA';
            else if (antiguedad.años >= 25 && antiguedad.años < 50) categoria = 'CUARTA';
            else if (antiguedad.años >= 50) categoria = 'TERCERA';
            
            const nombreCompleto = `${bombero.apellidoPaterno || ''} ${bombero.apellidoMaterno || ''} ${bombero.nombre || ''}`.toUpperCase().trim();
            
            const formatearFecha = (fecha) => {
                if (!fecha) return '/ /';
                try {
                    const partes = fecha.split('-');
                    if (partes.length === 3) {
                        const [año, mes, dia] = partes;
                        return `${dia}-${mes}-${año}`;
                    }
                    return '/ /';
                } catch {
                    return '/ /';
                }
            };
            
            const fechaIngreso = formatearFecha(bombero.fechaIngreso);
            const rutParaMostrar = bombero.rut || 'S/N';
            const claveBombero = bombero.claveBombero || '-';
            
            // ✅ DATOS CON NUMERACIÓN (el más antiguo es el número 1)
            doc.text(String(index + 1), 13, yPos, { align: 'center' });  // ✅ NÚMERO
            doc.text(String(rutParaMostrar), 22, yPos);
            doc.text(nombreCompleto.substring(0, 42), 60, yPos);
            doc.text(claveBombero, 150, yPos, { align: 'center' });
            doc.text(categoria, 185, yPos, { align: 'center' });
            doc.text(antiguedadTexto, 215, yPos);
            doc.text(fechaIngreso, 267, yPos, { align: 'center' });
            
            yPos += 6;
        });

        const totalPages = doc.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            doc.setFontSize(7);
            doc.setTextColor(100);
            doc.text(
                `Proyecto SEIS - Sistema de Gestión Bomberil | Total Voluntarios: ${this.bomberos.length} | Página ${i} de ${totalPages}`,
                pageWidth / 2,
                pageHeight - 5,
                { align: 'center' }
            );
        }

        const nombreArchivo = `Listado_Voluntarios_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(nombreArchivo);
        
        Utils.mostrarNotificacion('PDF generado exitosamente', 'success');
        
    } catch (error) {
        console.error('❌ ERROR al generar PDF:', error);
        Utils.mostrarNotificacion('Error al generar PDF: ' + error.message, 'error');
    }
}
editarBombero(id) {
    const bombero = this.bomberos.find(b => b.id === id);
    if (!bombero) {
        Utils.mostrarNotificacion('Bombero no encontrado', 'error');
        return;
    }

    // Llenar el formulario con los datos del bombero
    document.getElementById('idEditando').value = bombero.id;
    document.getElementById('claveBombero').value = bombero.claveBombero || '';
    document.getElementById('nombre').value = bombero.nombre || '';
    document.getElementById('fechaNacimiento').value = bombero.fechaNacimiento || '';
    document.getElementById('rut').value = bombero.rut || '';
    document.getElementById('profesion').value = bombero.profesion || '';
    document.getElementById('domicilio').value = bombero.domicilio || '';
    document.getElementById('nroRegistro').value = bombero.nroRegistro || '';
    document.getElementById('fechaIngreso').value = bombero.fechaIngreso || '';
    document.getElementById('compania').value = bombero.compania || '';
    document.getElementById('grupoSanguineo').value = bombero.grupoSanguineo || '';
    document.getElementById('telefono').value = bombero.telefono || '';
    document.getElementById('email').value = bombero.email || '';
    document.getElementById('otrosCuerpos').value = bombero.otrosCuerpos || '';
    document.getElementById('companiaOpcional').value = bombero.companiaOpcional || '';
    document.getElementById('desde').value = bombero.desde || '';
    document.getElementById('hasta').value = bombero.hasta || '';

    // Mostrar preview de la foto si existe
    if (bombero.foto) {
        document.getElementById('previewFoto').innerHTML = `
            <div style="text-align: center; margin-top: 10px;">
                <img src="${bombero.foto}" 
                     alt="Foto actual" 
                     style="max-width: 150px; max-height: 150px; border-radius: 10px; border: 2px solid #1976d2; object-fit: cover;">
                <p style="font-size: 0.8rem; color: #666; margin-top: 5px;">📸 Foto actual</p>
            </div>
        `;
    }

    // Cambiar el botón de submit
    const btnSubmit = document.getElementById('btnSubmit');
    btnSubmit.textContent = '✅ Actualizar Bombero';
    btnSubmit.classList.remove('btn-primary');
    btnSubmit.classList.add('btn-warning');

    // Mostrar modo edición
    const modoEdicion = document.getElementById('modoEdicion');
    if (modoEdicion) {
        modoEdicion.style.display = 'block';
        const nombreEditando = document.getElementById('nombreEditando');
        if (nombreEditando) {
            nombreEditando.textContent = bombero.nombre;
        }
    }

    // Scroll al formulario
    document.getElementById('formBombero').scrollIntoView({ behavior: 'smooth', block: 'start' });

    Utils.mostrarNotificacion('Editando bombero: ' + bombero.nombre, 'info');
}

cancelarEdicion() {
    this.limpiarFormulario();
    
    const btnSubmit = document.getElementById('btnSubmit');
    btnSubmit.textContent = 'Registrar Bombero';
    btnSubmit.classList.remove('btn-warning');
    btnSubmit.classList.add('btn-primary');

    const modoEdicion = document.getElementById('modoEdicion');
    if (modoEdicion) {
        modoEdicion.style.display = 'none';
    }

    Utils.mostrarNotificacion('Edición cancelada', 'info');
}
}

// Inicializar sistema
document.addEventListener('DOMContentLoaded', () => {
    window.sistemaBomberos = new SistemaBomberos();
});