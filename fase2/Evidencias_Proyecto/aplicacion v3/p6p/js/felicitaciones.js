// ==================== SISTEMA DE FELICITACIONES ====================
class SistemaFelicitaciones {
    constructor() {
        this.bomberoActual = null;
        this.felicitaciones = [];
        this.init();
    }

    async init() {
        // Verificar autenticación
        if (!checkAuth()) {
            window.location.href = 'index.html';
            return;
        }

        // Verificar permisos
        const permisos = getUserPermissions();
        if (!permisos || !permisos.canViewSanciones) { // Usa el mismo permiso que sanciones
            Utils.mostrarNotificacion('No tienes permisos para acceder a este módulo', 'error');
            setTimeout(() => window.location.href = 'sistema.html', 2000);
            return;
        }

        // Cargar datos del bombero
        await this.cargarBomberoActual();
        
        // Cargar felicitaciones
        this.felicitaciones = storage.getFelicitaciones();
        
        // Configurar interfaz
        this.configurarInterfaz();
        
        // Renderizar felicitaciones
        this.renderizarFelicitaciones();
        
        // Mostrar logo de compañía si existe
        this.mostrarLogoGuardado();
    }

    mostrarLogoGuardado() {
        const logoCompania = localStorage.getItem('logoCompania');
        if (logoCompania) {
            const preview = document.getElementById('previewLogoCompania');
            const img = document.getElementById('imgPreviewLogo');
            img.src = logoCompania;
            preview.style.display = 'block';
        }
    }

    async cargarBomberoActual() {
        const bomberoId = localStorage.getItem('bomberoFelicitacionActual');
        if (!bomberoId) {
            Utils.mostrarNotificacion('No se ha seleccionado ningún bombero', 'error');
            setTimeout(() => this.volverAlSistema(), 2000);
            return;
        }

        const bomberos = storage.getBomberos();
        // Convertir a número para comparación exacta
        this.bomberoActual = bomberos.find(b => b.id === parseInt(bomberoId));
        
        if (!this.bomberoActual) {
            Utils.mostrarNotificacion('Bombero no encontrado', 'error');
            setTimeout(() => this.volverAlSistema(), 2000);
            return;
        }

        this.mostrarInfoBombero();
    }

    mostrarInfoBombero() {
        const contenedor = document.getElementById('bomberoDatosFelicitaciones');
        const antiguedad = Utils.calcularAntiguedadDetallada(this.bomberoActual.fechaIngreso);
        const estadoBadge = Utils.obtenerBadgeEstado(this.bomberoActual.estadoBombero);
        
        // Validar si puede recibir felicitaciones
        const validacion = Utils.puedeRecibirCargosOFelicitaciones(this.bomberoActual);
        if (!validacion.puede) {
            contenedor.innerHTML = `
                <div style="background: #fee2e2; border-left: 4px solid #dc2626; padding: 20px; border-radius: 8px;">
                    <h3 style="color: #dc2626; margin-top: 0;">⚠️ No se pueden registrar felicitaciones</h3>
                    <p style="color: #991b1b; margin: 10px 0; font-size: 16px;">${validacion.mensaje}</p>
                    <p style="color: #666; margin: 0;">Solo se puede consultar el historial de felicitaciones de este voluntario.</p>
                </div>
            `;
            
            // Deshabilitar formulario
            const formulario = document.getElementById('formFelicitacion');
            if (formulario) {
                const inputs = formulario.querySelectorAll('input, select, textarea, button[type="submit"]');
                inputs.forEach(input => {
                    input.disabled = true;
                    input.style.opacity = '0.5';
                });
            }
            return;
        }
        
        contenedor.innerHTML = `
            <div><strong>Nombre Completo:</strong> <span>${Utils.obtenerNombreCompleto(this.bomberoActual)}</span></div>
            <div><strong>Clave Bombero:</strong> <span>${this.bomberoActual.claveBombero}</span></div>
            <div><strong>RUN:</strong> <span>${this.bomberoActual.rut}</span></div>
            <div><strong>Compañía:</strong> <span>${this.bomberoActual.compania}</span></div>
            <div><strong>Estado:</strong> <span style="font-weight: bold;">${estadoBadge}</span></div>
            <div><strong>Antigüedad:</strong> <span>${antiguedad.años} años, ${antiguedad.meses} meses</span></div>
            <div><strong>Fecha Ingreso:</strong> <span>${Utils.formatearFecha(this.bomberoActual.fechaIngreso)}</span></div>
        `;

        document.getElementById('bomberoFelicitacionId').value = this.bomberoActual.id;
    }

    configurarInterfaz() {
        // Configurar formulario
        document.getElementById('formFelicitacion').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.manejarSubmitFormulario(e);
        });

        // Configurar fecha de oficio automática
        const hoy = new Date().toISOString().split('T')[0];
        document.getElementById('fechaOficioFelicitacion').value = hoy;

        // Configurar previsualización de archivo
        document.getElementById('documentoFelicitacion').addEventListener('change', (e) => {
            this.previsualizarArchivo(e.target);
        });
    }

    async previsualizarArchivo(input) {
        const preview = document.getElementById('previewDocumento');
        const previewImage = document.getElementById('previewImageDocumento');
        const previewFileName = document.getElementById('previewFileNameDocumento');

        if (input.files && input.files[0]) {
            const file = input.files[0];
            
            // Validar tamaño
            if (file.size > 10 * 1024 * 1024) { // 10MB
                Utils.mostrarNotificacion('El archivo no debe superar los 10MB', 'error');
                input.value = '';
                return;
            }

            preview.style.display = 'block';
            
            // Mostrar previsualización según tipo de archivo
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
        } else {
            preview.style.display = 'none';
        }
    }

    async manejarSubmitFormulario(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const datos = Object.fromEntries(formData);
        
        console.log('📝 Datos de felicitación capturados:', datos);
        
        // Validar campos obligatorios
        if (!datos.bomberoFelicitacionId) {
            Utils.mostrarNotificacion('Error: No se ha seleccionado un bombero', 'error');
            return;
        }
        
        if (!datos.tipoFelicitacion) {
            Utils.mostrarNotificacion('Debe seleccionar el tipo de felicitación', 'error');
            return;
        }
        
        if (!datos.fechaFelicitacion) {
            Utils.mostrarNotificacion('Debe ingresar la fecha de felicitación', 'error');
            return;
        }
        
        if (!datos.oficioNumeroFelicitacion) {
            Utils.mostrarNotificacion('Debe ingresar el número de documento', 'error');
            return;
        }
        
        if (!datos.motivo) {
            Utils.mostrarNotificacion('Debe describir el mérito o motivo', 'error');
            return;
        }

        try {
            await this.guardarFelicitacion(datos);
            this.limpiarFormulario();
            this.renderizarFelicitaciones();
            Utils.mostrarNotificacion('✅ Felicitación registrada exitosamente', 'success');
        } catch (error) {
            console.error('❌ Error al registrar felicitación:', error);
            Utils.mostrarNotificacion('Error al registrar felicitación: ' + error.message, 'error');
        }
    }

    async guardarFelicitacion(datos) {
        // Procesar documento adjunto si existe
        let documentoData = null;
        let documentoNombreOriginal = null;
        const archivoInput = document.getElementById('documentoFelicitacion');
        
        if (archivoInput.files && archivoInput.files[0]) {
            const archivo = archivoInput.files[0];
            documentoData = await Utils.leerArchivoComoBase64(archivo);
            documentoNombreOriginal = archivo.name;
        }

        const felicitacionData = {
            id: window.felicitacionIdCounter++,
            bomberoId: parseInt(datos.bomberoFelicitacionId),
            tipoFelicitacion: datos.tipoFelicitacion,
            companiaOtorgante: datos.companiaOtorgante || null,
            autoridadOtorgante: datos.autoridadOtorgante || null,
            fechaFelicitacion: datos.fechaFelicitacion,
            oficioNumero: datos.oficioNumeroFelicitacion,
            fechaOficio: datos.fechaOficioFelicitacion,
            motivo: datos.motivo,
            documentoFelicitacion: documentoData,
            documentoNombreOriginal: documentoNombreOriginal,
            registradoPor: JSON.parse(localStorage.getItem('currentUser')).username,
            fechaRegistro: new Date().toISOString()
        };

        this.felicitaciones.push(felicitacionData);
        this.guardarDatos();
    }

    guardarDatos() {
        storage.saveFelicitaciones(this.felicitaciones);
        
        // Guardar contadores
        storage.saveCounters({
            bomberoId: window.idCounter,
            sancionId: window.sancionIdCounter,
            cargoId: window.cargoIdCounter,
            felicitacionId: window.felicitacionIdCounter
        });
        
        console.log('💾 Datos y contadores guardados');
    }

    renderizarFelicitaciones() {
        const lista = document.getElementById('listaFelicitaciones');
        const total = document.getElementById('totalFelicitaciones');
        
        const felicitacionesBombero = this.felicitaciones.filter(f => f.bomberoId == this.bomberoActual.id);
        const felicitacionesOrdenadas = felicitacionesBombero.sort((a, b) => 
            new Date(b.fechaRegistro) - new Date(a.fechaRegistro)
        );
        
        total.textContent = felicitacionesBombero.length;

        if (felicitacionesBombero.length === 0) {
            lista.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">No hay felicitaciones registradas para este bombero</p>';
            return;
        }

        lista.innerHTML = felicitacionesOrdenadas.map(felicitacion => this.generarHTMLFelicitacion(felicitacion)).join('');
    }

    generarHTMLFelicitacion(felicitacion) {
        const iconos = {
            'destacado': '⭐',
            'merito': '🏅',
            'valor': '💪',
            'servicio': '🎖️',
            'antiguedad': '📅',
            'otra': '📌'
        };

        const colores = {
            'destacado': '#2196f3',
            'merito': '#ff9800',
            'valor': '#9c27b0',
            'servicio': '#4caf50',
            'antiguedad': '#00bcd4',
            'otra': '#607d8b'
        };

        const tipoTexto = felicitacion.tipoFelicitacion.charAt(0).toUpperCase() + felicitacion.tipoFelicitacion.slice(1);
        const icono = iconos[felicitacion.tipoFelicitacion] || '🏆';
        const color = colores[felicitacion.tipoFelicitacion] || '#28a745';
        
        return `
            <div class="item-card felicitacion-card" style="border-left-color: ${color};">
                <div class="item-header">
                    <div class="item-tipo" style="color: ${color};">
                        ${icono} ${tipoTexto}
                    </div>
                    <div class="item-fecha">
                        Registrado: ${Utils.formatearFecha(felicitacion.fechaRegistro)}
                    </div>
                </div>
                <div class="item-info">
                    <div><strong>Fecha de felicitación:</strong> <span>${Utils.formatearFecha(felicitacion.fechaFelicitacion)}</span></div>
                    
                    ${felicitacion.companiaOtorgante ? `
                        <div><strong>Compañía otorgante:</strong> <span>${felicitacion.companiaOtorgante}</span></div>
                    ` : ''}
                    
                    ${felicitacion.autoridadOtorgante ? `
                        <div><strong>Autoridad otorgante:</strong> <span>${felicitacion.autoridadOtorgante}</span></div>
                    ` : ''}
                    
                    <div><strong>Documento N°:</strong> <span>${felicitacion.oficioNumero}</span></div>
                    <div><strong>Fecha del documento:</strong> <span>${Utils.formatearFecha(felicitacion.fechaOficio)}</span></div>
                    
                    ${felicitacion.documentoFelicitacion ? `
                        <div class="full-width" style="margin-top: 10px;">
                            <strong>📎 Documento adjunto:</strong>
                            <a href="${felicitacion.documentoFelicitacion}" 
                               target="_blank" 
                               download="${felicitacion.documentoNombreOriginal}"
                               class="documento-link"
                               style="display: inline-block; margin-top: 5px; padding: 8px 15px; background: ${color}; color: white; border-radius: 5px; text-decoration: none; transition: all 0.3s;">
                                📄 Ver/Descargar ${felicitacion.documentoNombreOriginal}
                            </a>
                        </div>
                    ` : ''}
                    
                    <div class="full-width" style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #e0e0e0;">
                        <strong>Descripción del Mérito:</strong><br>
                        <span style="white-space: pre-wrap;">${felicitacion.motivo}</span>
                    </div>
                    
                    <div style="margin-top: 10px; font-size: 0.85rem; color: #999;">
                        <strong>Registrado por:</strong> ${felicitacion.registradoPor}
                    </div>
                </div>
            </div>
        `;
    }

    limpiarFormulario() {
        document.getElementById('formFelicitacion').reset();
        
        // Restaurar fecha de oficio a hoy
        const hoy = new Date().toISOString().split('T')[0];
        document.getElementById('fechaOficioFelicitacion').value = hoy;
        
        // Restaurar ID del bombero
        document.getElementById('bomberoFelicitacionId').value = this.bomberoActual.id;
        
        // Limpiar previsualización de archivo
        const preview = document.getElementById('previewDocumento');
        if (preview) {
            preview.style.display = 'none';
        }
    }

    async cargarLogoCompania(input) {
        if (input.files && input.files[0]) {
            const file = input.files[0];
            
            // Validar tamaño (máx 2MB para logo)
            if (file.size > 2 * 1024 * 1024) {
                Utils.mostrarNotificacion('El logo no debe superar 2MB', 'error');
                input.value = '';
                return;
            }

            // Validar que sea imagen
            if (!file.type.startsWith('image/')) {
                Utils.mostrarNotificacion('El archivo debe ser una imagen', 'error');
                input.value = '';
                return;
            }

            try {
                const logoBase64 = await Utils.leerArchivoComoBase64(file);
                localStorage.setItem('logoCompania', logoBase64);
                
                // Mostrar preview
                const preview = document.getElementById('previewLogoCompania');
                const img = document.getElementById('imgPreviewLogo');
                img.src = logoBase64;
                preview.style.display = 'block';
                
                Utils.mostrarNotificacion('Logo de compañía guardado exitosamente', 'success');
            } catch (error) {
                Utils.mostrarNotificacion('Error al cargar el logo: ' + error.message, 'error');
            }
        }
    }

    verLogoActual() {
        const logoCompania = localStorage.getItem('logoCompania');
        
        if (!logoCompania) {
            Utils.mostrarNotificacion('No hay logo de compañía guardado', 'info');
            return;
        }

        const preview = document.getElementById('previewLogoCompania');
        const img = document.getElementById('imgPreviewLogo');
        img.src = logoCompania;
        preview.style.display = 'block';
        
        Utils.mostrarNotificacion('Mostrando logo actual', 'success');
    }

    async exportarExcel() {
        if (!this.bomberoActual) {
            Utils.mostrarNotificacion('Error: No hay un bombero seleccionado', 'error');
            return;
        }

        const felicitacionesBombero = this.felicitaciones.filter(f => f.bomberoId == this.bomberoActual.id);
        
        if (felicitacionesBombero.length === 0) {
            Utils.mostrarNotificacion('No hay felicitaciones registradas para exportar', 'error');
            return;
        }

        try {
            const datosExcel = felicitacionesBombero.map((felicitacion, index) => ({
                'N°': index + 1,
                'Bombero': Utils.obtenerNombreCompleto(this.bomberoActual),
                'Clave': this.bomberoActual.claveBombero,
                'RUN': this.bomberoActual.rut,
                'Tipo de Felicitación': felicitacion.tipoFelicitacion.charAt(0).toUpperCase() + felicitacion.tipoFelicitacion.slice(1),
                'Fecha': Utils.formatearFecha(felicitacion.fechaFelicitacion),
                'Compañía': felicitacion.companiaOtorgante || 'N/A',
                'Autoridad': felicitacion.autoridadOtorgante || 'N/A',
                'Documento N°': felicitacion.oficioNumero,
                'Fecha Documento': Utils.formatearFecha(felicitacion.fechaOficio),
                'Descripción': felicitacion.motivo,
                'Tiene Documento': felicitacion.documentoFelicitacion ? 'Sí' : 'No',
                'Registrado por': felicitacion.registradoPor,
                'Fecha Registro': Utils.formatearFecha(felicitacion.fechaRegistro)
            }));

            await Utils.exportarAExcel(
                datosExcel,
                `Felicitaciones_${this.bomberoActual.claveBombero}_${new Date().toISOString().split('T')[0]}.xlsx`,
                'Felicitaciones'
            );

            Utils.mostrarNotificacion('Excel de felicitaciones descargado exitosamente', 'success');
        } catch (error) {
            Utils.mostrarNotificacion('Error al generar Excel: ' + error.message, 'error');
        }
    }

    async generarPDF() {
        if (!this.bomberoActual) {
            Utils.mostrarNotificacion('Error: No hay un bombero seleccionado', 'error');
            return;
        }

        const felicitacionesBombero = this.felicitaciones.filter(f => f.bomberoId == this.bomberoActual.id);
        
        if (felicitacionesBombero.length === 0) {
            Utils.mostrarNotificacion('No hay felicitaciones registradas para generar PDF', 'error');
            return;
        }

        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.width;
            const pageHeight = doc.internal.pageSize.height;
            const margin = 20;
            let yPos = 20;
            let currentPage = 1;

            // Obtener logo de compañía
            const logoCompania = localStorage.getItem('logoCompania');

            // Función para agregar encabezado
            const addHeader = () => {
                // Fondo verde para el encabezado
                doc.setFillColor(40, 167, 69); // Verde
                doc.rect(0, 0, pageWidth, 55, 'F');
                
                // FOTO DEL VOLUNTARIO (izquierda)
                if (this.bomberoActual.foto) {
                    try {
                        doc.addImage(this.bomberoActual.foto, 'JPEG', 12, 13, 28, 28);
                    } catch (error) {
                        console.warn('No se pudo cargar la foto del voluntario');
                    }
                }
                
                // LOGO DE LA COMPAÑÍA (derecha)
                if (logoCompania) {
                    try {
                        doc.addImage(logoCompania, 'PNG', pageWidth - 40, 13, 28, 28);
                    } catch (error) {
                        console.warn('No se pudo cargar el logo de la compañía');
                    }
                }
                
                // Título principal (centro)
                doc.setTextColor(255, 255, 255);
                doc.setFontSize(22);
                doc.setFont(undefined, 'bold');
                doc.text('CERTIFICADO DE RECONOCIMIENTOS', pageWidth / 2, 22, { align: 'center' });
                
                // Subtítulo
                doc.setFontSize(13);
                doc.setFont(undefined, 'normal');
                doc.text('Cuerpo de Bomberos', pageWidth / 2, 33, { align: 'center' });
                
                // Fecha
                doc.setFontSize(10);
                doc.text(new Date().toLocaleDateString('es-CL', { 
                    day: 'numeric', 
                    month: 'long', 
                    year: 'numeric' 
                }), pageWidth / 2, 45, { align: 'center' });
                
                return 65;
            };

            // Función para agregar footer
            const addFooter = (pageNum, totalPages) => {
                doc.setFontSize(9);
                doc.setFont(undefined, 'italic');
                doc.setTextColor(120, 120, 120);
                doc.text('Este certificado acredita las felicitaciones y reconocimientos otorgados al voluntario', pageWidth / 2, pageHeight - 15, { align: 'center' });
                doc.text('en el Cuerpo de Bomberos', pageWidth / 2, pageHeight - 10, { align: 'center' });
                doc.setFont(undefined, 'normal');
                doc.text(`Página ${pageNum} de ${totalPages}`, pageWidth / 2, pageHeight - 5, { align: 'center' });
            };

            // Calcular páginas necesarias
            const itemsPerPage = 4;
            const totalPages = Math.ceil(felicitacionesBombero.length / itemsPerPage) || 1;

            // Primera página - Encabezado y datos del bombero
            yPos = addHeader();
            
            // DATOS DEL VOLUNTARIO
            doc.setTextColor(0, 0, 0);
            
            // Título de sección con fondo verde
            yPos += 10;
            doc.setFillColor(40, 167, 69);
            doc.rect(margin, yPos, pageWidth - 2 * margin, 10, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(14);
            doc.setFont(undefined, 'bold');
            doc.text('DATOS DEL VOLUNTARIO', pageWidth / 2, yPos + 7, { align: 'center' });
            
            yPos += 20;
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(11);
            doc.setFont(undefined, 'normal');
            
            // Datos centrados
            const antiguedad = Utils.calcularAntiguedadDetallada(this.bomberoActual.fechaIngreso);
            doc.text(`Nombre: ${Utils.obtenerNombreCompleto(this.bomberoActual)}`, pageWidth / 2, yPos, { align: 'center' });
            yPos += 6;
            doc.text(`Clave Bombero: ${this.bomberoActual.claveBombero}`, pageWidth / 2, yPos, { align: 'center' });
            yPos += 6;
            doc.text(`N° Registro: ${this.bomberoActual.nroRegistro || 'N/A'}`, pageWidth / 2, yPos, { align: 'center' });
            yPos += 6;
            doc.text(`RUN: ${this.bomberoActual.rut}`, pageWidth / 2, yPos, { align: 'center' });
            yPos += 6;
            doc.text(`Compañía: ${this.bomberoActual.compania}`, pageWidth / 2, yPos, { align: 'center' });
            
            yPos += 15;

            // FELICITACIONES Y RECONOCIMIENTOS
            doc.setFillColor(40, 167, 69);
            doc.rect(margin, yPos, pageWidth - 2 * margin, 10, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(14);
            doc.setFont(undefined, 'bold');
            doc.text('FELICITACIONES Y RECONOCIMIENTOS', pageWidth / 2, yPos + 7, { align: 'center' });
            
            yPos += 18;
            doc.setTextColor(0, 0, 0);

            // Listado de felicitaciones
            felicitacionesBombero.forEach((felicitacion, index) => {
                // Verificar si necesitamos nueva página
                if (yPos > pageHeight - 60) {
                    addFooter(currentPage, totalPages);
                    doc.addPage();
                    currentPage++;
                    yPos = addHeader();
                    yPos += 10;
                }

                const tipoTexto = felicitacion.tipoFelicitacion.charAt(0).toUpperCase() + felicitacion.tipoFelicitacion.slice(1);
                const año = new Date(felicitacion.fechaFelicitacion).getFullYear();

                // Barra verde lateral
                doc.setFillColor(40, 167, 69);
                doc.rect(margin, yPos - 3, 4, 22, 'F');

                // Número y título
                doc.setFontSize(12);
                doc.setFont(undefined, 'bold');
                doc.text(`${index + 1}. ${tipoTexto} (${año})`, margin + 8, yPos + 3);

                yPos += 8;
                doc.setFontSize(10);
                doc.setFont(undefined, 'normal');
                
                // Fecha
                doc.text(`Fecha: ${Utils.formatearFecha(felicitacion.fechaFelicitacion)}`, margin + 8, yPos);
                yPos += 5;

                // Documento
                doc.text(`Documento N°: ${felicitacion.oficioNumero}`, margin + 8, yPos);
                yPos += 5;

                // Autoridad si existe
                if (felicitacion.autoridadOtorgante) {
                    doc.text(`Otorgado por: ${felicitacion.autoridadOtorgante}`, margin + 8, yPos);
                    yPos += 5;
                }

                // Descripción (truncada)
                if (felicitacion.motivo) {
                    const motivoCorto = felicitacion.motivo.length > 80 
                        ? felicitacion.motivo.substring(0, 80) + '...' 
                        : felicitacion.motivo;
                    doc.text(`Mérito: ${motivoCorto}`, margin + 8, yPos);
                    yPos += 5;
                }

                yPos += 8; // Espaciado entre felicitaciones
            });

            // Footer de la última página
            addFooter(currentPage, totalPages);

            doc.save(`Certificado_Felicitaciones_${this.bomberoActual.claveBombero}_${new Date().toISOString().split('T')[0]}.pdf`);
            Utils.mostrarNotificacion('PDF generado exitosamente', 'success');
        } catch (error) {
            console.error('Error:', error);
            Utils.mostrarNotificacion('Error al generar PDF: ' + error.message, 'error');
        }
    }

    volverAlSistema() {
        localStorage.removeItem('bomberoFelicitacionActual');
        window.location.href = 'sistema.html';
    }
}

// Inicializar sistema cuando se cargue la página
document.addEventListener('DOMContentLoaded', () => {
    window.felicitacionesSistema = new SistemaFelicitaciones();
});
