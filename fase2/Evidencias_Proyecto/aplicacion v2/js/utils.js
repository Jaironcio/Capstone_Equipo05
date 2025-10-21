// ==================== UTILIDADES COMUNES ====================
class Utils {
    // ==================== VALIDACIONES ====================
    static validarRUN(run) {
        if (!run) return false;
        
        run = run.replace(/\./g, '').replace(/-/g, '');
        if (run.length < 8 || run.length > 9) return false;
        
        let cuerpo = run.slice(0, -1);
        let dv = run.slice(-1).toUpperCase();
        
        if (!/^\d+$/.test(cuerpo)) return false;
        
        let suma = 0;
        let multiplo = 2;
        
        for (let i = cuerpo.length - 1; i >= 0; i--) {
            suma += parseInt(cuerpo[i]) * multiplo;
            multiplo = multiplo < 7 ? multiplo + 1 : 2;
        }
        
        let resto = suma % 11;
        let dvCalculado = 11 - resto;
        
        if (dvCalculado === 11) dvCalculado = '0';
        if (dvCalculado === 10) dvCalculado = 'K';
        
        return dv === dvCalculado.toString();
    }

    static validarTelefono(telefono) {
        if (!telefono) return false;
        const regex = /^(\+56|56)?[2-9]\d{7,8}$/;
        return regex.test(telefono.replace(/\s/g, ''));
    }

    static validarEmail(email) {
        if (!email) return true;
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    }

    static formatearRUN(run) {
        if (!run) return '';
        let valor = run.replace(/\D/g, '');
        if (valor.length > 1) {
            valor = valor.replace(/(\d{1,2})(\d{3})(\d{3})(\d{1})/, '$1.$2.$3-$4');
        }
        return valor;
    }

    // ==================== FECHAS ====================
    static calcularEdad(fechaNacimiento) {
        if (!fechaNacimiento) return 0;
        
        const hoy = new Date();
        const nacimiento = new Date(fechaNacimiento);
        let edad = hoy.getFullYear() - nacimiento.getFullYear();
        const mes = hoy.getMonth() - nacimiento.getMonth();
        
        if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
            edad--;
        }
        return edad;
    }

    // ✅ CORREGIDO: Sin tilde en "dias"
    static calcularAntiguedadDetallada(fechaIngreso) {
        if (!fechaIngreso) return { años: 0, meses: 0, dias: 0 };
        
        const hoy = new Date();
        const ingreso = new Date(fechaIngreso + 'T00:00:00');
        
        let años = hoy.getFullYear() - ingreso.getFullYear();
        let meses = hoy.getMonth() - ingreso.getMonth();
        let dias = hoy.getDate() - ingreso.getDate();
        
        // Ajustar si los días son negativos
        if (dias < 0) {
            meses--;
            const ultimoDiaMesAnterior = new Date(hoy.getFullYear(), hoy.getMonth(), 0).getDate();
            dias += ultimoDiaMesAnterior;
        }
        
        // Ajustar si los meses son negativos
        if (meses < 0) {
            años--;
            meses += 12;
        }
        
        return { años, meses, dias };  // ✅ SIN TILDE
    }

    static calcularCategoriaBombero(fechaIngreso) {
        const antiguedad = this.calcularAntiguedadDetallada(fechaIngreso);
        const anosCompletos = antiguedad.años;
        
        if (anosCompletos < 20) {
            return { categoria: 'Voluntario', color: '#1976d2', icono: '🔰' };
        } else if (anosCompletos >= 20 && anosCompletos <= 24) {
            return { categoria: 'Voluntario Honorario de Compañía', color: '#388e3c', icono: '🏅' };
        } else if (anosCompletos >= 25 && anosCompletos <= 49) {
            return { categoria: 'Voluntario Honorario del Cuerpo', color: '#f57c00', icono: '🎖️' };
        } else {
            return { categoria: 'Voluntario Insigne de Chile', color: '#d32f2f', icono: '🏆' };
        }
    }

    static formatearFecha(fecha) {
        if (!fecha) return '';
        return new Date(fecha).toLocaleDateString('es-CL');
    }

    // ==================== ARCHIVOS E IMÁGENES ====================
    static leerArchivoComoBase64(archivo) {
        return new Promise((resolve, reject) => {
            if (!archivo) {
                resolve(null);
                return;
            }

            if (archivo.size > 5 * 1024 * 1024) {
                reject(new Error('La imagen no debe superar los 5MB'));
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (error) => reject(error);
            reader.readAsDataURL(archivo);
        });
    }

    static validarImagen(archivo) {
        if (!archivo) return true;
        
        const tiposPermitidos = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        const maxSize = 5 * 1024 * 1024;
        
        if (!tiposPermitidos.includes(archivo.type)) {
            return 'Solo se permiten imágenes JPEG, PNG, GIF o WebP';
        }
        
        if (archivo.size > maxSize) {
            return 'La imagen no debe superar los 5MB';
        }
        
        return true;
    }

    // ==================== BÚSQUEDA Y FILTROS ====================
    static filtrarBomberos(bomberos, termino) {
        if (!termino) return bomberos;
        
        const terminoLower = termino.toLowerCase();
        return bomberos.filter(bombero => {
            return Object.values(bombero).some(valor => 
                valor && valor.toString().toLowerCase().includes(terminoLower)
            );
        });
    }

    static ordenarBomberosPorAntiguedad(bomberos, ascendente = false) {
        return [...bomberos].sort((a, b) => {
            const antiguedadA = this.calcularAntiguedadDetallada(a.fechaIngreso).años;
            const antiguedadB = this.calcularAntiguedadDetallada(b.fechaIngreso).años;
            return ascendente ? antiguedadA - antiguedadB : antiguedadB - antiguedadA;
        });
    }

    // ==================== UI Y NOTIFICACIONES ====================
    static mostrarNotificacion(mensaje, tipo = 'success', duracion = 5000) {
        const notificacionExistente = document.getElementById('notificacion-global');
        if (notificacionExistente) {
            notificacionExistente.remove();
        }

        const notificacion = document.createElement('div');
        notificacion.id = 'notificacion-global';
        notificacion.className = `notificacion ${tipo}`;
        
        // Determinar icono según el tipo
        let icono = '✅';
        let color = '#4caf50';
        
        if (tipo === 'error') {
            icono = '❌';
            color = '#f44336';
        } else if (tipo === 'warning') {
            icono = '⚠️';
            color = '#ff9800';
        } else if (tipo === 'info') {
            icono = 'ℹ️';
            color = '#2196f3';
        }
        
        notificacion.innerHTML = `
            <div class="notificacion-contenido">
                <span class="notificacion-icono">${icono}</span>
                <span class="notificacion-mensaje">${mensaje}</span>
                <button class="notificacion-cerrar" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;

        notificacion.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            min-width: 300px;
            max-width: 500px;
            background: ${color};
            color: white;
            padding: 15px;
            border-radius: 10px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
            animation: slideInRight 0.3s ease-out;
        `;

        document.body.appendChild(notificacion);

        if (duracion > 0) {
            setTimeout(() => {
                if (notificacion.parentElement) {
                    notificacion.style.animation = 'slideOutRight 0.3s ease-in';
                    setTimeout(() => notificacion.remove(), 300);
                }
            }, duracion);
        }

        return notificacion;
    }

    static confirmarAccion(mensaje) {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'modal-confirmacion';
            modal.innerHTML = `
                <div class="modal-contenido">
                    <h3>⚠️ Confirmar acción</h3>
                    <p>${mensaje}</p>
                    <div class="modal-botones">
                        <button class="btn btn-secondary" id="cancelarBtn">❌ Cancelar</button>
                        <button class="btn btn-primary" id="confirmarBtn">✅ Confirmar</button>
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
                z-index: 10001;
            `;

            modal.querySelector('.modal-contenido').style.cssText = `
                background: white;
                padding: 30px;
                border-radius: 15px;
                max-width: 400px;
                text-align: center;
                box-shadow: 0 10px 40px rgba(0,0,0,0.3);
            `;

            document.body.appendChild(modal);

            modal.querySelector('#confirmarBtn').onclick = () => {
                modal.remove();
                resolve(true);
            };

            modal.querySelector('#cancelarBtn').onclick = () => {
                modal.remove();
                resolve(false);
            };

            modal.onclick = (e) => {
                if (e.target === modal) {
                    modal.remove();
                    resolve(false);
                }
            };
        });
    }

    // ==================== EXPORTACIÓN ====================
    static exportarAExcel(datos, nombreArchivo, nombreHoja = 'Datos') {
        return new Promise((resolve, reject) => {
            try {
                if (typeof XLSX === 'undefined') {
                    throw new Error('La librería XLSX no está cargada');
                }

                const wb = XLSX.utils.book_new();
                const ws = XLSX.utils.json_to_sheet(datos);
                XLSX.utils.book_append_sheet(wb, ws, nombreHoja);
                
                XLSX.writeFile(wb, nombreArchivo);
                resolve(true);
            } catch (error) {
                reject(error);
            }
        });
    }

    // ==================== MISCELÁNEOS ====================
    static generarId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    static sanitizarHTML(texto) {
        const div = document.createElement('div');
        div.textContent = texto;
        return div.innerHTML;
    }

    // ==================== FORMATEO DE NÚMEROS ====================
    static formatearMonto(monto) {
        return new Intl.NumberFormat('es-CL', {
            style: 'currency',
            currency: 'CLP',
            minimumFractionDigits: 0
        }).format(monto);
    }

    static formatearNumero(numero) {
        return new Intl.NumberFormat('es-CL').format(numero);
    }

// ==================== FUNCIÓN PARA AGREGAR LOGO A PDFs ====================
static agregarLogoAPDF(doc, yPosInicial = 5) {
    const logoBase64 = localStorage.getItem('logoCompania');
    
    if (logoBase64) {
        try {
            // Agregar logo en la esquina superior izquierda
            doc.addImage(logoBase64, 'PNG', 10, yPosInicial, 25, 25);
            return true; // Logo agregado exitosamente
        } catch (error) {
            console.error('Error al agregar logo al PDF:', error);
            return false;
        }
    }
    return false; // No hay logo
}

}

// Añadir estilos CSS para las notificaciones
const estilosNotificaciones = document.createElement('style');
estilosNotificaciones.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    .notificacion-contenido {
        display: flex;
        align-items: center;
        gap: 10px;
    }
    
    .notificacion-mensaje {
        flex: 1;
    }
    
    .notificacion-cerrar {
        background: none;
        border: none;
        color: white;
        font-size: 24px;
        cursor: pointer;
        margin-left: auto;
        padding: 0;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: background 0.2s;
    }
    
    .notificacion-cerrar:hover {
        background: rgba(255,255,255,0.2);
    }
    
    .modal-botones {
        display: flex;
        gap: 10px;
        justify-content: center;
        margin-top: 20px;
    }
    
    .modal-contenido h3 {
        margin: 0 0 15px 0;
        color: #333;
    }
    
    .modal-contenido p {
        margin: 0 0 20px 0;
        color: #666;
        line-height: 1.5;
    }
`;

document.head.appendChild(estilosNotificaciones);