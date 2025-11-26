// ==================== SIDEBAR DINÁMICO ====================
function initSidebar() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        // Si no hay usuario, redirigir al login
        window.location.href = 'index.html';
        return;
    }

    const permisos = getUserPermissions();
    if (!permisos) {
        console.error('No se pudieron cargar los permisos');
        return;
    }

    // Actualizar info de usuario
    const roleElement = document.getElementById('sidebarUserRole');
    const nameElement = document.getElementById('sidebarUserName');
    
    if (roleElement) roleElement.textContent = currentUser.role;
    if (nameElement) nameElement.textContent = `@${currentUser.username}`;

    // Generar menú según permisos
    const sidebarNav = document.getElementById('sidebarNav');
    if (sidebarNav) {
        sidebarNav.innerHTML = generarMenuSegunRol(permisos, currentUser.role);
    }

    // Actualizar saldo de compañía si el rol puede verlo
    if (permisos.canViewFinanzas) {
        actualizarSaldoCompania();
        actualizarBadgeDeudores();
    }

    console.log('✅ Sidebar inicializado para:', currentUser.role);
}

function actualizarBadgeDeudores() {
    const badge = document.getElementById('badgeDeudoresSidebar');
    if (!badge) return;

    // Calcular deudores (lógica similar a sistema.js)
    const bomberos = storage.getBomberos();
    const pagosCuotas = storage.getPagosCuotas();
    const pagosBeneficios = storage.getPagosBeneficios();
    const beneficios = storage.getBeneficios();

    const hoy = new Date();
    const mesActual = hoy.getMonth() + 1;
    const anioActual = hoy.getFullYear();

    const deudores = new Set();

    // Deudores de cuotas
    bomberos.forEach(bombero => {
        // Verificar si está exento de cuotas
        const categoria = Utils.calcularCategoriaBombero(bombero.fechaIngreso);
        const esHonorario = categoria.categoria && categoria.categoria.toLowerCase().includes('honorario');
        const esInsigne25 = categoria.categoria && categoria.categoria.toLowerCase().includes('insigne') && categoria.categoria.includes('25');
        const esMartir = bombero.estadoBombero === 'martir';
        
        // Si está exento, no verificar deudas
        if (esHonorario || esInsigne25 || esMartir) {
            return;
        }
        
        for (let mes = 1; mes <= mesActual; mes++) {
            const pagado = pagosCuotas.some(p => 
                p.bomberoId == bombero.id && 
                p.mes == mes && 
                p.anio == anioActual
            );
            if (!pagado) {
                deudores.add(bombero.id);
                break;
            }
        }
    });

    // Deudores de beneficios
    const beneficiosActivos = beneficios.filter(b => b.estado === 'activo');
    beneficiosActivos.forEach(beneficio => {
        bomberos.forEach(bombero => {
            const pago = pagosBeneficios.find(p => 
                p.bomberoId == bombero.id && 
                p.beneficioId === beneficio.id
            );
            const montoEsperado = beneficio.cantidadTarjetas * beneficio.precioTarjeta;
            const montoPagado = pago ? pago.montoPagado : 0;
            if (montoPagado < montoEsperado) {
                deudores.add(bombero.id);
            }
        });
    });

    const totalDeudores = deudores.size;
    
    if (totalDeudores > 0) {
        badge.textContent = totalDeudores;
        badge.style.display = 'inline-block';
    } else {
        badge.style.display = 'none';
    }
}

function mostrarNotificacionDeudores() {
    // Llamar a la función de sistema.js si existe
    if (typeof sistemaBomberos !== 'undefined' && typeof sistemaBomberos.toggleNotificacionDeudores === 'function') {
        sistemaBomberos.toggleNotificacionDeudores();
    } else {
        // Si no estamos en sistema.html, redirigir
        localStorage.setItem('mostrarDeudoresAlCargar', 'true');
        window.location.href = 'sistema.html';
    }
}

function actualizarSaldoCompania() {
    const saldoSidebar = document.getElementById('saldoSidebar');
    if (!saldoSidebar) return;

    const movimientos = storage.getMovimientosFinancieros();
    
    const ingresos = movimientos
        .filter(m => m.tipo === 'ingreso')
        .reduce((sum, m) => sum + parseFloat(m.monto), 0);
    
    const egresos = movimientos
        .filter(m => m.tipo === 'egreso')
        .reduce((sum, m) => sum + parseFloat(m.monto), 0);
    
    const saldo = ingresos - egresos;
    
    const saldoFormateado = new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP',
        minimumFractionDigits: 0
    }).format(saldo);
    
    saldoSidebar.textContent = saldoFormateado;
    
    // Cambiar color según saldo
    if (saldo < 0) {
        saldoSidebar.style.color = '#f44336';
    } else if (saldo === 0) {
        saldoSidebar.style.color = '#ff9800';
    } else {
        saldoSidebar.style.color = '#4caf50';
    }
}

function generarMenuSegunRol(permisos, role) {
    let menuHTML = '';

    // SALDO Y NOTIFICACIONES (solo para Tesorero)
    if (permisos.canViewFinanzas && permisos.canEditFinanzas) {
        menuHTML += `
            <div class="sidebar-section-title">Finanzas</div>
            <div style="padding: 15px; background: rgba(76, 175, 80, 0.1); margin: 5px 15px; border-radius: 8px; border-left: 3px solid #4caf50;">
                <div style="font-size: 0.75rem; color: rgba(255,255,255,0.7); margin-bottom: 4px;">SALDO COMPAÑÍA</div>
                <div style="font-size: 1.3rem; font-weight: 700; color: #4caf50;" id="saldoSidebar">$0</div>
            </div>
            
            <a href="javascript:void(0)" class="sidebar-nav-item" onclick="mostrarNotificacionDeudores()" style="position: relative;">
                <span class="sidebar-nav-item-icon">🔔</span>
                <span class="sidebar-nav-item-text">Notificación Deudores</span>
                <span id="badgeDeudoresSidebar" style="position: absolute; right: 15px; top: 50%; transform: translateY(-50%); background: #f44336; color: white; border-radius: 12px; padding: 2px 8px; font-size: 0.75rem; font-weight: 700; display: none;">0</span>
            </a>
        `;
    }

    // MÓDULO VOLUNTARIOS
    if (permisos.canViewVoluntarios) {
        menuHTML += `
            <div class="sidebar-section-title">Gestión</div>
            <a href="sistema.html" class="sidebar-nav-item">
                <span class="sidebar-nav-item-icon">👥</span>
                <span class="sidebar-nav-item-text">Voluntarios</span>
            </a>
        `;
    }

    // MÓDULO CARGOS
    if (permisos.canViewCargos) {
        menuHTML += `
            <a href="javascript:void(0)" class="sidebar-nav-item" onclick="alert('Seleccione un voluntario desde la lista para gestionar sus cargos')">
                <span class="sidebar-nav-item-icon">📋</span>
                <span class="sidebar-nav-item-text">Cargos</span>
            </a>
        `;
    }

    // MÓDULO SANCIONES (aparece solo si no está en Asistencia)
    if (permisos.canViewSanciones && !permisos.canEditAsistencia) {
        const textoSanciones = permisos.canOnlySuspensions ? 'Suspensiones' : 'Sanciones';
        menuHTML += `
            <a href="javascript:void(0)" class="sidebar-nav-item" onclick="alert('Seleccione un voluntario desde la lista para gestionar ${textoSanciones.toLowerCase()}')">
                <span class="sidebar-nav-item-icon">⚖️</span>
                <span class="sidebar-nav-item-text">${textoSanciones}</span>
            </a>
        `;
    }

    // MÓDULO FELICITACIONES
    if (permisos.canViewFelicitaciones) {
        menuHTML += `
            <a href="javascript:void(0)" class="sidebar-nav-item" onclick="alert('Seleccione un voluntario desde la lista para gestionar felicitaciones')">
                <span class="sidebar-nav-item-icon">🏆</span>
                <span class="sidebar-nav-item-text">Felicitaciones</span>
            </a>
        `;
    }

    // SECCIÓN ASISTENCIA
    if (permisos.canViewAsistencia || permisos.canEditAsistencia) {
        if (!menuHTML.includes('sidebar-section-title')) {
            menuHTML += `<div class="sidebar-section-title">Asistencia</div>`;
        }
        
        if (permisos.canEditAsistencia) {
            menuHTML += `
                <a href="tipos-asistencia.html" class="sidebar-nav-item">
                    <span class="sidebar-nav-item-icon">📋</span>
                    <span class="sidebar-nav-item-text">Registrar Asistencia</span>
                </a>
            `;
        }
        
        if (permisos.canViewHistorialAsistencia) {
            menuHTML += `
                <a href="historial-asistencias.html" class="sidebar-nav-item">
                    <span class="sidebar-nav-item-icon">📊</span>
                    <span class="sidebar-nav-item-text">Historial</span>
                </a>
                <a href="historial-emergencias.html" class="sidebar-nav-item">
                    <span class="sidebar-nav-item-icon">🚨</span>
                    <span class="sidebar-nav-item-text">Detalle Emergencias</span>
                </a>
            `;
        }
        
        // PDF Voluntarios para Capitán, Ayudante y otros roles con permiso
        if (permisos.canGeneratePDFVoluntarios) {
            menuHTML += `
                <a href="javascript:void(0)" class="sidebar-nav-item" onclick="generarPDFVoluntariosAntiguedad()">
                    <span class="sidebar-nav-item-icon">📄</span>
                    <span class="sidebar-nav-item-text">PDF Voluntarios (Antigüedad)</span>
                </a>
            `;
        }
    }
    
    // MÓDULO UNIFORMES (no mostrar para Capitán, accede desde tarjetas)
    if (permisos.canViewUniformes && !permisos.canEditAsistencia) {
        if (!menuHTML.includes('Asistencia')) {
            menuHTML += `<div class="sidebar-section-title">Operaciones</div>`;
        }
        menuHTML += `
            <a href="uniformes.html" class="sidebar-nav-item">
                <span class="sidebar-nav-item-icon">👔</span>
                <span class="sidebar-nav-item-text">Uniformes</span>
            </a>
        `;
    }

    // SECCIÓN FINANZAS  
    if (permisos.canViewFinanzas) {
        if (!menuHTML.includes('sidebar-section-title')) {
            menuHTML += `<div class="sidebar-section-title">Finanzas</div>`;
        }
        
        menuHTML += `
            <a href="finanzas.html" class="sidebar-nav-item">
                <span class="sidebar-nav-item-icon">💰</span>
                <span class="sidebar-nav-item-text">Finanzas</span>
            </a>
        `;
        
        if (permisos.canEditFinanzas) {
            menuHTML += `
                <a href="beneficios.html" class="sidebar-nav-item">
                    <span class="sidebar-nav-item-icon">🎪</span>
                    <span class="sidebar-nav-item-text">Beneficios</span>
                </a>
                <a href="configurar-cuotas.html" class="sidebar-nav-item">
                    <span class="sidebar-nav-item-icon">⚙️</span>
                    <span class="sidebar-nav-item-text">Configurar Cuotas</span>
                </a>
            `;
        }
    }

    // SECCIÓN ADMIN (Solo Super Admin)
    if (permisos.canViewAdminModules) {
        menuHTML += `
            <div class="sidebar-section-title">Administración</div>
            <a href="admin-ciclos.html" class="sidebar-nav-item">
                <span class="sidebar-nav-item-icon">⚙️</span>
                <span class="sidebar-nav-item-text">Admin Ciclos</span>
            </a>
            <a href="generar-datos-prueba.html" class="sidebar-nav-item">
                <span class="sidebar-nav-item-icon">🔧</span>
                <span class="sidebar-nav-item-text">Datos Prueba</span>
            </a>
            <a href="limpiar-datos.html" class="sidebar-nav-item">
                <span class="sidebar-nav-item-icon">🗑️</span>
                <span class="sidebar-nav-item-text">Limpiar Datos</span>
            </a>
        `;
    }

    return menuHTML;
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('show');
}

// Función para generar PDF de voluntarios desde el menú
function generarPDFVoluntariosDesdeMenu() {
    if (typeof sistemaBomberos !== 'undefined' && typeof sistemaBomberos.generarPDFConsultaVoluntarios === 'function') {
        sistemaBomberos.generarPDFConsultaVoluntarios();
    } else {
        // Si no está en sistema.html, redirigir
        window.location.href = 'sistema.html';
    }
}

// Función global para generar PDF de voluntarios ordenados por antigüedad
function generarPDFVoluntariosAntiguedad() {
    // Verificar si estamos en sistema.html donde existe sistemaBomberos
    if (typeof sistemaBomberos !== 'undefined') {
        sistemaBomberos.generarPDFConsultaVoluntarios();
    } else {
        // Si no estamos en sistema.html, redirigir primero
        localStorage.setItem('generarPDFAlCargar', 'true');
        window.location.href = 'sistema.html';
    }
}

// Inicializar sidebar cuando cargue el DOM
document.addEventListener('DOMContentLoaded', function() {
    // Esperar un poco para que auth.js termine de cargar
    setTimeout(() => {
        if (document.getElementById('sidebar')) {
            initSidebar();
        }
    }, 100);
});
