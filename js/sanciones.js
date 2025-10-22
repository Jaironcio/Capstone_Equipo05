// ==================== SISTEMA DE FINANZAS ====================
class SistemaFinanzas {
    constructor() {
        this.movimientos = [];
        this.filtroTipo = 'todos';
        this.init();
    }

    async init() {
        if (!checkAuth()) {
            window.location.href = 'index.html';
            return;
        }

        this.cargarMovimientos();
        this.configurarEventos();
        this.aplicarPermisosUI();
        this.actualizarResumen();
        this.renderizarMovimientos();
    }

    cargarMovimientos() {
        this.movimientos = storage.getMovimientosFinancieros();
    }

    configurarEventos() {
        document.getElementById('formIngreso').addEventListener('submit', (e) => {
            this.manejarSubmitIngreso(e);
        });

        document.getElementById('formEgreso').addEventListener('submit', (e) => {
            this.manejarSubmitEgreso(e);
        });

        const hoy = new Date().toISOString().split('T')[0];
        document.getElementById('fechaIngreso').value = hoy;
        document.getElementById('fechaEgreso').value = hoy;
    }

    aplicarPermisosUI() {
        const permisos = getUserPermissions();
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        
        if (!permisos || !permisos.canEditFinanzas) {
            document.querySelector('.botones-principales').style.display = 'none';
            
            const mensaje = document.createElement('div');
            mensaje.className = 'info-solo-lectura';
            mensaje.innerHTML = `
                <h3>👁️ Modo Solo Lectura</h3>
                <p>Como <strong>${currentUser.role}</strong>, puedes visualizar los movimientos financieros pero no registrar nuevos.</p>
            `;
            mensaje.style.cssText = `
                background: rgba(76, 175, 80, 0.1);
                border: 2px solid rgba(76, 175, 80, 0.3);
                border-radius: 15px;
                padding: 20px;
                margin-bottom: 20px;
                text-align: center;
            `;
            document.querySelector('.page-content').insertBefore(
                mensaje, 
                document.querySelector('.resumen-financiero').nextSibling
            );
        }
    }

    mostrarFormulario(tipo) {
        this.cerrarFormulario();
        
        if (tipo === 'ingreso') {
            document.getElementById('formContainerIngreso').style.display = 'block';
        } else {
            document.getElementById('formContainerEgreso').style.display = 'block';
        }
        
        setTimeout(() => {
            const form = document.getElementById(`formContainer${tipo.charAt(0).toUpperCase() + tipo.slice(1)}`);
            form.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    }

    cerrarFormulario() {
        document.getElementById('formContainerIngreso').style.display = 'none';
        document.getElementById('formContainerEgreso').style.display = 'none';
        this.limpiarFormularios();
    }

    cambioTipoIngreso() {
        const tipo = document.getElementById('tipoIngreso').value;
        const grupoDonante = document.getElementById('grupoNombreDonante');
        const grupoOtro = document.getElementById('grupoOtroMotivo');
        const inputDonante = document.getElementById('nombreDonante');
        const inputOtro = document.getElementById('otroMotivoIngreso');

        grupoDonante.style.display = 'none';
        grupoOtro.style.display = 'none';
        inputDonante.removeAttribute('required');
        inputOtro.removeAttribute('required');

        if (tipo === 'Donación') {
            grupoDonante.style.display = 'block';
            inputDonante.setAttribute('required', 'required');
        } else if (tipo === 'Otro') {
            grupoOtro.style.display = 'block';
            inputOtro.setAttribute('required', 'required');
        }
    }

    async previsualizarArchivo(tipo) {
        const input = document.getElementById(`comprobante${tipo.charAt(0).toUpperCase() + tipo.slice(1)}`);
        const preview = document.getElementById(`preview${tipo.charAt(0).toUpperCase() + tipo.slice(1)}`);
        const previewImage = document.getElementById(`previewImage${tipo.charAt(0).toUpperCase() + tipo.slice(1)}`);
        const previewFileName = document.getElementById(`previewFileName${tipo.charAt(0).toUpperCase() + tipo.slice(1)}`);

        if (input.files && input.files[0]) {
            const file = input.files[0];
            
            if (file.size > 5 * 1024 * 1024) {
                Utils.mostrarNotificacion('El archivo no debe superar los 5MB', 'error');
                input.value = '';
                return;
            }

            preview.style.display = 'block';
            
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    previewImage.src = e.target.result;
                    previewImage.style.display = 'block';
                };
                reader.readAsDataURL(file);
                previewFileName.textContent = file.name;
            } else {
                previewImage.style.display = 'none';
                previewFileName.textContent = `📄 ${file.name}`;
            }
        }
    }

    async manejarSubmitIngreso(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const datos = {
            monto: formData.get('montoIngreso'),
            tipoIngreso: formData.get('tipoIngreso'),
            nombreDonante: formData.get('nombreDonante'),
            otroMotivo: formData.get('otroMotivoIngreso'),
            fecha: formData.get('fechaIngreso'),
            descripcion: formData.get('descripcionIngreso'),
            comprobante: document.getElementById('comprobanteIngreso').files[0]
        };

        try {
            await this.guardarIngreso(datos);
            Utils.mostrarNotificacion('Ingreso registrado exitosamente', 'success');
            this.cerrarFormulario();
            this.actualizarResumen();
            this.renderizarMovimientos();
        } catch (error) {
            Utils.mostrarNotificacion(error.message, 'error');
        }
    }

    async manejarSubmitEgreso(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const datos = {
            monto: formData.get('montoEgreso'),
            motivo: formData.get('motivoEgreso'),
            fecha: formData.get('fechaEgreso'),
            numeroDocumento: formData.get('numeroDocumentoEgreso'),
            descripcion: formData.get('descripcionEgreso'),
            comprobante: document.getElementById('comprobanteEgreso').files[0]
        };

        try {
            await this.guardarEgreso(datos);
            Utils.mostrarNotificacion('Egreso registrado exitosamente', 'success');
            this.cerrarFormulario();
            this.actualizarResumen();
            this.renderizarMovimientos();
        } catch (error) {
            Utils.mostrarNotificacion(error.message, 'error');
        }
    }

    async guardarIngreso(datos) {
        let comprobanteData = null;
        if (datos.comprobante) {
            comprobanteData = await Utils.leerArchivoComoBase64(datos.comprobante);
        }

        let detalleIngreso = datos.tipoIngreso;
        if (datos.tipoIngreso === 'Donación' && datos.nombreDonante) {
            detalleIngreso += ` - ${datos.nombreDonante}`;
        } else if (datos.tipoIngreso === 'Otro' && datos.otroMotivo) {
            detalleIngreso += ` - ${datos.otroMotivo}`;
        }

        const movimiento = {
            id: this.generarId(),
            tipo: 'ingreso',
            monto: parseFloat(datos.monto),
            categoria: datos.tipoIngreso,
            detalle: detalleIngreso,
            fecha: datos.fecha,
            descripcion: datos.descripcion,
            comprobante: comprobanteData,
            nombreComprobanteOriginal: datos.comprobante ? datos.comprobante.name : null,
            registradoPor: JSON.parse(localStorage.getItem('currentUser')).username,
            fechaRegistro: new Date().toISOString()
        };

        this.movimientos.push(movimiento);
        this.guardarDatos();
    }

    async guardarEgreso(datos) {
        const saldoActual = this.calcularSaldo();
        if (parseFloat(datos.monto) > saldoActual) {
            throw new Error('No hay suficiente saldo para realizar este egreso');
        }

        let comprobanteData = null;
        if (datos.comprobante) {
            comprobanteData = await Utils.leerArchivoComoBase64(datos.comprobante);
        }

        const movimiento = {
            id: this.generarId(),
            tipo: 'egreso',
            monto: parseFloat(datos.monto),
            categoria: datos.motivo,
            numeroDocumento: datos.numeroDocumento || null,
            fecha: datos.fecha,
            descripcion: datos.descripcion,
            comprobante: comprobanteData,
            nombreComprobanteOriginal: datos.comprobante ? datos.comprobante.name : null,
            registradoPor: JSON.parse(localStorage.getItem('currentUser')).username,
            fechaRegistro: new Date().toISOString()
        };

        this.movimientos.push(movimiento);
        this.guardarDatos();
    }

    generarId() {
        return Date.now() + Math.random().toString(36).substr(2, 9);
    }

    guardarDatos() {
        storage.saveMovimientosFinancieros(this.movimientos);
    }

    calcularSaldo() {
        const ingresos = this.movimientos
            .filter(m => m.tipo === 'ingreso')
            .reduce((sum, m) => sum + m.monto, 0);
        
        const egresos = this.movimientos
            .filter(m => m.tipo === 'egreso')
            .reduce((sum, m) => sum + m.monto, 0);
        
        return ingresos - egresos;
    }

    actualizarResumen() {
        const ingresos = this.movimientos
            .filter(m => m.tipo === 'ingreso')
            .reduce((sum, m) => sum + m.monto, 0);
        
        const egresos = this.movimientos
            .filter(m => m.tipo === 'egreso')
            .reduce((sum, m) => sum + m.monto, 0);
        
        const saldo = ingresos - egresos;

        document.getElementById('saldoActual').textContent = this.formatearMonto(saldo);
        document.getElementById('totalIngresos').textContent = this.formatearMonto(ingresos);
        document.getElementById('totalEgresos').textContent = this.formatearMonto(egresos);
        
        const saldoElement = document.getElementById('saldoActual');
        const cardBalance = saldoElement.closest('.resumen-card');
        
        if (saldo < 0) {
            cardBalance.style.background = 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)';
        } else if (saldo === 0) {
            cardBalance.style.background = 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)';
        } else {
            cardBalance.style.background = 'linear-gradient(135deg, #2196f3 0%, #1565c0 100%)';
        }
    }

    formatearMonto(monto) {
        return new Intl.NumberFormat('es-CL', {
            style: 'currency',
            currency: 'CLP',
            minimumFractionDigits: 0
        }).format(monto);
    }

    aplicarFiltros() {
        this.filtroTipo = document.getElementById('filtroTipo').value;
        this.renderizarMovimientos();
    }

    renderizarMovimientos() {
        const lista = document.getElementById('listaMovimientos');
        const total = document.getElementById('totalMovimientos');
        
        let movimientosFiltrados = [...this.movimientos];
        
        if (this.filtroTipo !== 'todos') {
            movimientosFiltrados = movimientosFiltrados.filter(m => m.tipo === this.filtroTipo);
        }
        
        movimientosFiltrados.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
        
        total.textContent = movimientosFiltrados.length;

        if (movimientosFiltrados.length === 0) {
            lista.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">No hay movimientos registrados</p>';
            return;
        }

        lista.innerHTML = movimientosFiltrados.map(mov => this.generarHTMLMovimiento(mov)).join('');
    }

    generarHTMLMovimiento(mov) {
        const tipoTexto = mov.tipo === 'ingreso' ? '📥 Ingreso' : '📤 Egreso';
        const tipoClass = mov.tipo;
        
        return `
            <div class="movimiento-card ${tipoClass}">
                <div class="movimiento-header">
                    <div class="movimiento-tipo">${tipoTexto}</div>
                    <div class="movimiento-monto">${this.formatearMonto(mov.monto)}</div>
                </div>
                <div class="item-info">
                    <div><strong>Fecha:</strong> <span>${Utils.formatearFecha(mov.fecha)}</span></div>
                    <div><strong>Categoría:</strong> <span>${mov.categoria}</span></div>
                    ${mov.detalle ? `<div><strong>Detalle:</strong> <span>${mov.detalle}</span></div>` : ''}
                    ${mov.numeroDocumento ? `<div><strong>N° Documento:</strong> <span>${mov.numeroDocumento}</span></div>` : ''}
                    <div class="full-width"><strong>Descripción:</strong> <span>${mov.descripcion}</span></div>
                    ${mov.comprobante ? `
                        <div class="full-width">
                            <strong>Comprobante:</strong>
                            <a href="${mov.comprobante}" target="_blank" class="comprobante-link" download="${mov.nombreComprobanteOriginal}">
                                📎 Ver/Descargar ${mov.nombreComprobanteOriginal}
                            </a>
                        </div>
                    ` : ''}
                    <div><strong>Registrado por:</strong> <span>${mov.registradoPor}</span></div>
                    <div><strong>Fecha registro:</strong> <span>${Utils.formatearFecha(mov.fechaRegistro)}</span></div>
                </div>
            </div>
        `;
    }

    limpiarFormularios() {
        document.getElementById('formIngreso').reset();
        document.getElementById('formEgreso').reset();
        
        document.getElementById('grupoNombreDonante').style.display = 'none';
        document.getElementById('grupoOtroMotivo').style.display = 'none';
        document.getElementById('nombreDonante').removeAttribute('required');
        document.getElementById('otroMotivoIngreso').removeAttribute('required');
        
        document.getElementById('previewIngreso').style.display = 'none';
        document.getElementById('previewEgreso').style.display = 'none';
        
        const hoy = new Date().toISOString().split('T')[0];
        document.getElementById('fechaIngreso').value = hoy;
        document.getElementById('fechaEgreso').value = hoy;
    }

    async exportarExcel() {
        if (this.movimientos.length === 0) {
            Utils.mostrarNotificacion('No hay movimientos para exportar', 'error');
            return;
        }

        try {
            const datosExcel = this.movimientos.map((mov, index) => ({
                'N°': index + 1,
                'Tipo': mov.tipo === 'ingreso' ? 'Ingreso' : 'Egreso',
                'Fecha': Utils.formatearFecha(mov.fecha),
                'Monto (CLP)': mov.monto,
                'Categoría': mov.categoria,
                'Detalle': mov.detalle || '-',
                'N° Documento': mov.numeroDocumento || '-',
                'Descripción': mov.descripcion,
                'Registrado por': mov.registradoPor,
                'Fecha Registro': Utils.formatearFecha(mov.fechaRegistro)
            }));

            const ingresos = this.movimientos.filter(m => m.tipo === 'ingreso').reduce((sum, m) => sum + m.monto, 0);
            const egresos = this.movimientos.filter(m => m.tipo === 'egreso').reduce((sum, m) => sum + m.monto, 0);
            
            datosExcel.push({});
            datosExcel.push({ 'N°': '', 'Tipo': 'RESUMEN' });
            datosExcel.push({ 'N°': '', 'Tipo': 'Total Ingresos', 'Monto (CLP)': ingresos });
            datosExcel.push({ 'N°': '', 'Tipo': 'Total Egresos', 'Monto (CLP)': egresos });
            datosExcel.push({ 'N°': '', 'Tipo': 'SALDO ACTUAL', 'Monto (CLP)': ingresos - egresos });

            await Utils.exportarAExcel(
                datosExcel,
                `Finanzas_Compañia_${new Date().toISOString().split('T')[0]}.xlsx`,
                'Movimientos Financieros'
            );

            Utils.mostrarNotificacion('Excel descargado exitosamente', 'success');
        } catch (error) {
            Utils.mostrarNotificacion('Error al generar Excel: ' + error.message, 'error');
        }
    }

    volverAlSistema() {
        window.location.href = 'sistema.html';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.finanzasSistema = new SistemaFinanzas();
});