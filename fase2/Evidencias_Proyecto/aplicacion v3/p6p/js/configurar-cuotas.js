// ==================== CONFIGURACIÓN DE PRECIOS DE CUOTAS ====================
class ConfiguracionCuotas {
    constructor() {
        this.init();
    }

    async init() {
        if (!checkAuth()) {
            window.location.href = 'index.html';
            return;
        }

        // Verificar permisos (solo Tesorero)
        const permisos = getUserPermissions();
        if (!permisos || !permisos.canEditFinanzas) {
            Utils.mostrarNotificacion('No tiene permisos para configurar cuotas', 'error');
            setTimeout(() => window.location.href = 'sistema.html', 2000);
            return;
        }

        this.cargarConfiguracionActual();
        this.configurarEventos();
        this.actualizarVistaPrevia();
    }

    cargarConfiguracionActual() {
        const config = this.obtenerConfiguracion();
        document.getElementById('precioRegular').value = config.precioRegular;
        document.getElementById('precioEstudiante').value = config.precioEstudiante;
    }

    obtenerConfiguracion() {
        const configGuardada = localStorage.getItem('configuracionCuotas');
        if (configGuardada) {
            return JSON.parse(configGuardada);
        }
        // Valores por defecto
        return {
            precioRegular: 5000,
            precioEstudiante: 3000
        };
    }

    configurarEventos() {
        document.getElementById('formConfigCuotas').addEventListener('submit', (e) => {
            this.guardarConfiguracion(e);
        });

        // Actualizar vista previa en tiempo real
        document.getElementById('precioRegular').addEventListener('input', () => {
            this.actualizarVistaPrevia();
        });

        document.getElementById('precioEstudiante').addEventListener('input', () => {
            this.actualizarVistaPrevia();
        });
    }

    actualizarVistaPrevia() {
        const precioRegular = parseInt(document.getElementById('precioRegular').value) || 5000;
        const precioEstudiante = parseInt(document.getElementById('precioEstudiante').value) || 3000;

        const formatearPrecio = (precio) => {
            return new Intl.NumberFormat('es-CL', {
                style: 'currency',
                currency: 'CLP',
                minimumFractionDigits: 0
            }).format(precio);
        };

        document.getElementById('previewRegular').textContent = 
            `Cuota Regular - ${formatearPrecio(precioRegular)}`;
        
        document.getElementById('previewEstudiante').textContent = 
            `Cuota Estudiante - ${formatearPrecio(precioEstudiante)}`;
    }

    async guardarConfiguracion(event) {
        event.preventDefault();

        const precioRegular = parseInt(document.getElementById('precioRegular').value);
        const precioEstudiante = parseInt(document.getElementById('precioEstudiante').value);

        if (precioRegular < 1000) {
            Utils.mostrarNotificacion('El precio regular debe ser al menos $1.000', 'warning');
            return;
        }

        if (precioEstudiante < 0) {
            Utils.mostrarNotificacion('El precio estudiante no puede ser negativo', 'warning');
            return;
        }

        const confirmacionMsg = `¿Está seguro de cambiar los precios de las cuotas?<br><br>` +
            `<strong>Cuota Regular:</strong> $${precioRegular.toLocaleString('es-CL')}<br>` +
            `<strong>Cuota Estudiante:</strong> $${precioEstudiante.toLocaleString('es-CL')}<br><br>` +
            `Los nuevos precios se aplicarán a partir de ahora.`;

        const confirmado = await Utils.confirmarAccion(confirmacionMsg);

        if (confirmado) {
            const configuracion = {
                precioRegular: precioRegular,
                precioEstudiante: precioEstudiante,
                fechaActualizacion: new Date().toISOString(),
                actualizadoPor: JSON.parse(localStorage.getItem('currentUser')).username
            };

            localStorage.setItem('configuracionCuotas', JSON.stringify(configuracion));

            Utils.mostrarNotificacion('✅ Configuración de cuotas guardada exitosamente', 'success');
            setTimeout(() => window.location.href = 'sistema.html', 2000);
        }
    }
}

// Inicializar cuando cargue la página
window.addEventListener('DOMContentLoaded', () => {
    new ConfiguracionCuotas();
});
