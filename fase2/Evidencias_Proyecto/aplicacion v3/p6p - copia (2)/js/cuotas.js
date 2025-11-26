// ==================== SISTEMA DE CUOTAS SOCIALES ====================
class SistemaCuotas {
    constructor() {
        this.bomberoActual = null;
        this.pagosCuotas = [];
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
    const antiguedad = Utils.calcularAntiguedadDetallada(this.bomberoActual.fechaIngreso);
    
    contenedor.innerHTML = `
        <div><strong>Nombre:</strong> <span>${Utils.obtenerNombreCompleto(this.bomberoActual)}</span></div>
        <div><strong>Clave:</strong> <span>${this.bomberoActual.claveBombero}</span></div>
        <div><strong>RUN:</strong> <span>${this.bomberoActual.rut}</span></div>
        <div><strong>Compañía:</strong> <span>${this.bomberoActual.compania}</span></div>
        <div><strong>Antigüedad:</strong> <span>${antiguedad.años} años, ${antiguedad.meses} meses</span></div>
    `;

    document.getElementById('bomberoCuotaId').value = this.bomberoActual.id;
}
    cargarDatos() {
        this.pagosCuotas = storage.getPagosCuotas();
    }

    configurarInterfaz() {
        document.getElementById('formCuotaSocial').addEventListener('submit', (e) => {
            this.manejarSubmitCuota(e);
        });

        const hoy = new Date().toISOString().split('T')[0];
        document.getElementById('fechaPagoCuota').value = hoy;
        document.getElementById('anioCuota').value = this.anioActual;
        
        document.querySelectorAll('input[name="meses"]').forEach(checkbox => {
            checkbox.addEventListener('change', () => this.actualizarTotalAPagar());
        });
    }

    cambioTipoCuota() {
        this.actualizarTotalAPagar();
    }

    actualizarTotalAPagar() {
        const tipo = document.getElementById('tipoCuota').value;
        const checkboxes = document.querySelectorAll('input[name="meses"]:checked');
        const cantidadMeses = checkboxes.length;
        
        let montoPorMes = 0;
        if (tipo === 'regular') {
            montoPorMes = 5000;
        } else if (tipo === 'estudiante') {
            montoPorMes = 3000;
        }
        
        const total = montoPorMes * cantidadMeses;
        document.getElementById('totalAPagar').textContent = this.formatearMonto(total);
    }

    async manejarSubmitCuota(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const datos = Object.fromEntries(formData);
        
        const mesesSeleccionados = Array.from(
            document.querySelectorAll('input[name="meses"]:checked')
        ).map(cb => parseInt(cb.value));
        
        const errores = this.validarDatosCuota(datos, mesesSeleccionados);
        if (errores.length > 0) {
            Utils.mostrarNotificacion('Errores: ' + errores.join(', '), 'error');
            return;
        }

        try {
            for (const mes of mesesSeleccionados) {
                await this.guardarPagoCuota({
                    ...datos,
                    mesCuota: mes
                });
            }
            
            Utils.mostrarNotificacion(`Pago de ${mesesSeleccionados.length} cuota(s) registrado exitosamente`, 'success');
            this.limpiarFormulario();
            this.renderizarTodo();
            
            const montoPorMes = datos.tipoCuota === 'regular' ? 5000 : 3000;
            const montoTotal = montoPorMes * mesesSeleccionados.length;
            const mesesTexto = mesesSeleccionados.map(m => this.obtenerNombreMes(m)).join(', ');
            
            await this.registrarIngresoFinanzas({
                monto: montoTotal,
                tipo: 'Cuotas sociales',
                descripcion: `Pago cuotas sociales (${mesesTexto}) ${datos.anioCuota} - ${this.bomberoActual.nombre}`,
                fecha: datos.fechaPagoCuota
            });
            
        } catch (error) {
            Utils.mostrarNotificacion(error.message, 'error');
        }
    }

    validarDatosCuota(datos, mesesSeleccionados) {
    const errores = [];
    
    if (!datos.tipoCuota) errores.push('Debe seleccionar tipo de cuota');
    if (mesesSeleccionados.length === 0) errores.push('Debe seleccionar al menos un mes');
    if (!datos.anioCuota) errores.push('Debe ingresar el año');
    if (!datos.fechaPagoCuota) errores.push('Debe ingresar la fecha de pago');
    if (!datos.formaPagoCuota) errores.push('Debe seleccionar la forma de pago');
        
        for (const mes of mesesSeleccionados) {
            const yaExiste = this.pagosCuotas.some(p => 
                p.bomberoId == this.bomberoActual.id && 
                p.mes == mes && 
                p.anio == datos.anioCuota
            );
            
            if (yaExiste) {
                errores.push(`Ya existe un pago para ${this.obtenerNombreMes(mes)}`);
            }
        }
        
        return errores;
    }

    async guardarPagoCuota(datos) {
    const montoPorCuota = datos.tipoCuota === 'regular' ? 5000 : 3000;
    
    // Procesar comprobante si existe
    let comprobanteBase64 = null;
    let nombreComprobanteOriginal = null;
    const inputComprobante = document.getElementById('comprobanteCuota');
    
    if (inputComprobante && inputComprobante.files && inputComprobante.files[0]) {
        const archivo = inputComprobante.files[0];
        nombreComprobanteOriginal = archivo.name;
        comprobanteBase64 = await Utils.leerArchivoComoBase64(archivo);
    }
    
    const pagoCuota = {
        id: this.generarId(),
        bomberoId: this.bomberoActual.id,
        tipoCuota: datos.tipoCuota,
        monto: montoPorCuota,
        mes: parseInt(datos.mesCuota),
        anio: parseInt(datos.anioCuota),
        fechaPago: datos.fechaPagoCuota,
        formaPago: datos.formaPagoCuota,
        comprobante: comprobanteBase64,
        nombreComprobanteOriginal: nombreComprobanteOriginal,
        observaciones: datos.observacionesCuota || null,
        registradoPor: JSON.parse(localStorage.getItem('currentUser')).username,
        fechaRegistro: new Date().toISOString()
    };

        this.pagosCuotas.push(pagoCuota);
        this.guardarDatos();
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

    renderizarTodo() {
        this.renderizarGridMeses();
        this.renderizarHistorialCuotas();
    }

    renderizarGridMeses() {
        const grid = document.getElementById('gridMesesCuotas');
        const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

        document.getElementById('anioActualCuotas').textContent = this.anioActual;

        const html = meses.map((mes, index) => {
            const numeroMes = index + 1;
            const pago = this.pagosCuotas.find(p => p.bomberoId == this.bomberoActual.id && p.mes == numeroMes && p.anio == this.anioActual);
            let estadoClass = 'pendiente';
            let estadoTexto = 'Pendiente';
            if (pago) {
                estadoClass = 'pagado';
                estadoTexto = `Pagado: ${this.formatearMonto(pago.monto)}`;
            }
            return `<div class="mes-card ${estadoClass}"><div class="mes-nombre">${mes}</div><div class="mes-estado">${estadoTexto}</div></div>`;
        }).join('');

        grid.innerHTML = html;
    }

    renderizarHistorialCuotas() {
        const lista = document.getElementById('listaCuotas');
        const total = document.getElementById('totalPagosCuotas');
        const pagosBombero = this.pagosCuotas.filter(p => p.bomberoId == this.bomberoActual.id).sort((a, b) => new Date(b.fechaPago) - new Date(a.fechaPago));
        total.textContent = pagosBombero.length;
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
            ${pago.formaPago ? `<div><strong>Forma de pago:</strong> <span>${pago.formaPago}</span></div>` : ''}
            ${pago.comprobante ? `
                <div style="grid-column: 1 / -1;">
                    <strong>Comprobante:</strong>
                    <button onclick="cuotasSistema.verComprobante('${pago.id}')" 
                            class="btn-ver-comprobante"
                            style="margin-left: 10px; padding: 5px 15px; background: #9c27b0; color: white; border: none; border-radius: 5px; cursor: pointer;">
                        👁️ Ver Comprobante
                    </button>
                </div>
            ` : ''}
            ${pago.observaciones ? `<div><strong>Observaciones:</strong> <span>${pago.observaciones}</span></div>` : ''}
            <div><strong>Registrado por:</strong> <span>${pago.registradoPor}</span></div>
        </div>
    </div>
`).join('');
    }

    async exportarExcel() {
        const pagosBombero = this.pagosCuotas.filter(p => p.bomberoId == this.bomberoActual.id);
        if (pagosBombero.length === 0) {
            Utils.mostrarNotificacion('No hay pagos para exportar', 'error');
            return;
        }
        try {
            const datosExcel = pagosBombero.map((pago, index) => ({'N°': index + 1, 'Voluntario': this.bomberoActual.nombre, 'Clave': this.bomberoActual.claveBombero, 'Mes': this.obtenerNombreMes(pago.mes), 'Año': pago.anio, 'Tipo': pago.tipoCuota === 'regular' ? 'Regular' : 'Estudiante', 'Monto': pago.monto, 'Fecha Pago': Utils.formatearFecha(pago.fechaPago), 'Observaciones': pago.observaciones || '-', 'Registrado por': pago.registradoPor}));
            await Utils.exportarAExcel(datosExcel, `Cuotas_${this.bomberoActual.claveBombero}_${new Date().toISOString().split('T')[0]}.xlsx`, 'Cuotas Sociales');
            Utils.mostrarNotificacion('Excel descargado exitosamente', 'success');
        } catch (error) {
            Utils.mostrarNotificacion('Error al generar Excel: ' + error.message, 'error');
        }
    }

    generarId() { return Date.now() + Math.random().toString(36).substr(2, 9); }
    guardarDatos() { storage.savePagosCuotas(this.pagosCuotas); }
    formatearMonto(monto) { return new Intl.NumberFormat('es-CL', {style: 'currency', currency: 'CLP', minimumFractionDigits: 0}).format(monto); }
    obtenerNombreMes(numero) { const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']; return meses[parseInt(numero) - 1]; }

   limpiarFormulario() {
    document.getElementById('formCuotaSocial').reset();
    document.getElementById('bomberoCuotaId').value = this.bomberoActual.id;
    document.getElementById('anioCuota').value = this.anioActual;
    document.getElementById('fechaPagoCuota').value = new Date().toISOString().split('T')[0];
    document.getElementById('totalAPagar').textContent = '$0';
    document.querySelectorAll('input[name="meses"]').forEach(cb => cb.checked = false);
    document.getElementById('previewComprobanteCuota').innerHTML = '';
}

    volverAlSistema() {
        localStorage.removeItem('bomberoCuotasActual');
        window.location.href = 'sistema.html';
    }
    previsualizarComprobante(input) {
    const preview = document.getElementById('previewComprobanteCuota');
    preview.innerHTML = '';
    
    if (input.files && input.files[0]) {
        const file = input.files[0];
        const fileSize = (file.size / 1024 / 1024).toFixed(2);
        
        if (fileSize > 5) {
            Utils.mostrarNotificacion('El archivo no debe superar los 5MB', 'error');
            input.value = '';
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            if (file.type.startsWith('image/')) {
                preview.innerHTML = `
                    <div style="margin-top: 10px;">
                        <img src="${e.target.result}" 
                             style="max-width: 200px; max-height: 200px; border-radius: 8px; border: 2px solid #e0e0e0;">
                        <p style="margin-top: 5px; font-size: 0.85rem; color: #666;">
                            📎 ${file.name} (${fileSize} MB)
                        </p>
                    </div>
                `;
            } else if (file.type === 'application/pdf') {
                preview.innerHTML = `
                    <div style="margin-top: 10px; padding: 10px; background: #f5f5f5; border-radius: 8px;">
                        <p style="font-size: 0.9rem; color: #666;">
                            📄 ${file.name} (${fileSize} MB)
                        </p>
                    </div>
                `;
            }

        };
        reader.readAsDataURL(file);
    }


}verComprobante(pagoId) {
    const pago = this.pagosCuotas.find(p => p.id === pagoId);
    if (!pago || !pago.comprobante) {
        Utils.mostrarNotificacion('No hay comprobante disponible', 'error');
        return;
    }
    
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        padding: 20px;
    `;
    
    const isPDF = pago.nombreComprobanteOriginal && pago.nombreComprobanteOriginal.toLowerCase().endsWith('.pdf');
    
    modal.innerHTML = `
        <div style="background: white; padding: 20px; border-radius: 15px; max-width: 90%; max-height: 90%; overflow: auto; position: relative;">
            <button onclick="this.closest('div').parentElement.remove()" 
                    style="position: absolute; top: 10px; right: 10px; background: #f44336; color: white; border: none; width: 40px; height: 40px; border-radius: 50%; font-size: 20px; cursor: pointer;">
                ✕
            </button>
            <h3 style="margin-bottom: 15px; color: #333;">📎 Comprobante de Pago</h3>
            <p style="margin-bottom: 15px; color: #666;">
                <strong>Archivo:</strong> ${pago.nombreComprobanteOriginal || 'Comprobante'}<br>
                <strong>Mes:</strong> ${this.obtenerNombreMes(pago.mes)} ${pago.anio}<br>
                <strong>Monto:</strong> ${this.formatearMonto(pago.monto)}
            </p>
            ${isPDF ? 
                `<p style="text-align: center; padding: 20px; color: #666;">
                    📄 Archivo PDF - 
                    <a href="${pago.comprobante}" download="${pago.nombreComprobanteOriginal}" 
                       style="color: #9c27b0; text-decoration: underline;">
                        Descargar comprobante
                    </a>
                </p>` :
                `<img src="${pago.comprobante}" 
                      style="max-width: 100%; max-height: 70vh; border-radius: 8px; display: block; margin: 0 auto;">`
            }
        </div>
    `;
    
    document.body.appendChild(modal);
    
    modal.onclick = (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    };
}


}

document.addEventListener('DOMContentLoaded', () => { window.cuotasSistema = new SistemaCuotas(); });