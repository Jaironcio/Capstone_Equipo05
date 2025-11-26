// ==================== HISTORIAL DE ASISTENCIAS MEJORADO ====================
class HistorialAsistencias {
    constructor() {
        this.asistencias = [];
        this.init();
    }

    async init() {
        try {
            if (typeof checkAuth !== 'undefined' && !checkAuth()) {
                window.location.href = 'index.html';
                return;
            }

            this.cargarAsistencias();
            this.renderizar();
            this.actualizarEstadisticas();
            this.renderizarRanking();

            console.log('✅ Historial de asistencias cargado');
        } catch (error) {
            console.error('❌ Error al cargar historial:', error);
        }
    }

    cargarAsistencias() {
        this.asistencias = JSON.parse(localStorage.getItem('asistenciasEmergencias')) || [];
        // Ordenar por fecha descendente (más reciente primero)
        this.asistencias.sort((a, b) => {
            const fechaA = new Date(a.fecha + ' ' + a.hora);
            const fechaB = new Date(b.fecha + ' ' + b.hora);
            return fechaB - fechaA;
        });
    }

    /**
     * Formatea el cargo del asistente para mostrar
     * @param {object} asistente - Objeto del asistente
     * @returns {string} - HTML del cargo formateado
     */
    formatearCargoAsistente(asistente) {
        if (!asistente.cargo) return '';
        
        // Definir iconos según tipo de cargo
        const iconosCargos = {
            // Comandancia
            'Superintendente': '⭐⭐⭐',
            'Comandante 1': '⭐⭐',
            'Comandante 2': '⭐⭐',
            'Comandante 3': '⭐⭐',
            'Intendente General': '🎖️',
            'Tesorero General': '💰',
            'Secretario General': '📋',
            'Ayudante General': '🎯',
            
            // Compañía
            'Capitán': '👨‍🚒',
            'Teniente Primero': '🔰',
            'Teniente Segundo': '🔰',
            'Teniente Tercero': '🔰',
            'Teniente Cuarto': '🔰',
            'Ayudante': '🎯',
            'Ayudante 1': '🎯',
            'Ayudante 2': '🎯',
            'Ayudante 3': '🎯',
            'Ayudante 4': '🎯',
            'Cabo Primero': '📌',
            'Cabo Segundo': '📌',
            'Cabo': '📌',
            
            // Maquinistas
            'Jefe de Máquinas': '🔧',
            'Primer Maquinista': '⚙️',
            'Segundo Maquinista': '⚙️',
            'Tercer Maquinista': '⚙️',
            
            // Otros cargos administrativos
            'Director': '🎖️',
            'Tesorero': '💰',
            'Intendente': '📊',
            'Secretario': '📝',
            
            'Otro': '🔹'
        };
        
        const icono = iconosCargos[asistente.cargo] || '🎖️';
        const año = asistente.añoCargo || '';
        
        return `<span class="asistente-cargo">${icono} ${asistente.cargo}${año ? ' | ' + año : ''}</span>`;
    }

    /**
     * Formatea fecha de forma amigable
     * @param {string} fecha - Fecha en formato ISO o YYYY-MM-DD
     * @returns {string} - Fecha formateada
     */
    formatearFecha(fecha) {
        try {
            const date = new Date(fecha + 'T00:00:00');
            return date.toLocaleDateString('es-ES', { 
                day: '2-digit', 
                month: 'long', 
                year: 'numeric' 
            });
        } catch (error) {
            return fecha;
        }
    }

    /**
     * Renderiza solo las últimas 10 emergencias
     */
    renderizar() {
        const container = document.getElementById('asistenciasContainer');
        const emptyState = document.getElementById('emptyState');
        const contador = document.getElementById('contadorEmergencias');

        if (this.asistencias.length === 0) {
            container.innerHTML = '';
            emptyState.style.display = 'block';
            contador.textContent = '0 registros';
            return;
        }

        emptyState.style.display = 'none';

        // MOSTRAR SOLO LAS ÚLTIMAS 10 EMERGENCIAS
        const ultimas10 = this.asistencias.slice(0, 10);
        contador.textContent = `${ultimas10.length} de ${this.asistencias.length} emergencias`;

        container.innerHTML = ultimas10.map((asistencia) => `
            <div class="emergencia-card">
                <div class="emergencia-header">
                    <div class="emergencia-fecha">
                        📅 ${this.formatearFecha(asistencia.fecha)}
                        <span class="badge-stats">${asistencia.totalAsistentes} asistentes</span>
                    </div>
                    <div class="emergencia-hora">⏰ ${asistencia.hora}</div>
                </div>
                
                <div class="emergencia-body">
                    <div class="info-row">
                        <div class="info-label">📍 Dirección:</div>
                        <div class="info-value"><strong>${asistencia.direccion}</strong></div>
                    </div>
                    
                    ${asistencia.claveEmergencia && asistencia.claveEmergencia !== 'N/A' ? `
                    <div class="info-row">
                        <div class="info-label">🔑 Clave:</div>
                        <div class="info-value">${asistencia.claveEmergencia}</div>
                    </div>
                    ` : ''}
                    
                    <div class="info-row">
                        <div class="info-label">📊 Estadísticas:</div>
                        <div class="info-value">
                            ${asistencia.totalAsistentes} de ${asistencia.totalPersonas} voluntarios (${asistencia.porcentajeAsistencia}%)
                        </div>
                    </div>
                    
                    ${asistencia.observaciones ? `
                    <div class="info-row">
                        <div class="info-label">📝 Observaciones:</div>
                        <div class="info-value">${asistencia.observaciones}</div>
                    </div>
                    ` : ''}
                    
                    <div class="info-row" style="border-bottom: none; margin-top: 15px;">
                        <div class="info-label">👥 Asistentes:</div>
                    </div>
                    <div class="asistentes-grid">
                        ${asistencia.asistentes.map(a => `
                            <div class="asistente-item">
                                <div class="asistente-nombre">
                                    ${a.nombre}
                                    ${this.formatearCargoAsistente(a)}
                                </div>
                                <div class="asistente-clave">${a.claveBombero}</div>
                            </div>
                        `).join('')}
                    </div>
                    
                    <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #f0f0f0; font-size: 0.8rem; color: #999;">
                        Registrado por: ${asistencia.registradoPor} • ${this.formatearFecha(asistencia.fechaRegistro.split('T')[0])}
                    </div>
                </div>
            </div>
        `).join('');
    }

    /**
     * Calcula y renderiza el ranking de top 10 voluntarios
     */
    renderizarRanking() {
        const container = document.getElementById('rankingLista');
        
        if (this.asistencias.length === 0) {
            container.innerHTML = '<p style="color: #999; text-align: center;">No hay datos</p>';
            return;
        }

        // Calcular asistencias por bombero
        const asistenciasPorBombero = {};
        
        this.asistencias.forEach(emergencia => {
            emergencia.asistentes.forEach(asistente => {
                const id = asistente.bomberoId;
                if (!asistenciasPorBombero[id]) {
                    asistenciasPorBombero[id] = {
                        nombre: asistente.nombre,
                        claveBombero: asistente.claveBombero,
                        totalAsistencias: 0
                    };
                }
                asistenciasPorBombero[id].totalAsistencias++;
            });
        });

        // Convertir a array y ordenar por total de asistencias
        const ranking = Object.values(asistenciasPorBombero)
            .sort((a, b) => b.totalAsistencias - a.totalAsistencias)
            .slice(0, 10); // Top 10

        // Renderizar ranking
        container.innerHTML = ranking.map((bombero, index) => `
            <div class="ranking-item">
                <div class="ranking-position">${index + 1}</div>
                <div class="ranking-info">
                    <div class="ranking-nombre">${bombero.nombre}</div>
                    <div class="ranking-clave">${bombero.claveBombero}</div>
                </div>
                <div class="ranking-asistencias">${bombero.totalAsistencias}</div>
            </div>
        `).join('');

        console.log('🏆 Ranking calculado:', ranking.length, 'voluntarios');
    }

    actualizarEstadisticas() {
        const totalEmergencias = this.asistencias.length;
        
        let totalAsistentesAcumulado = 0;
        let sumaPromedios = 0;

        this.asistencias.forEach(a => {
            totalAsistentesAcumulado += a.totalAsistentes;
            sumaPromedios += a.porcentajeAsistencia;
        });

        const promedioAsistencia = totalEmergencias > 0 ? Math.round(sumaPromedios / totalEmergencias) : 0;

        document.getElementById('totalEmergencias').textContent = totalEmergencias;
        document.getElementById('totalAsistentesHistorico').textContent = totalAsistentesAcumulado;
        document.getElementById('promedioAsistencia').textContent = promedioAsistencia + '%';
    }

    /**
     * Exporta a Excel con información de cargos
     */
    async exportarExcel() {
        if (this.asistencias.length === 0) {
            this.mostrarNotificacion('No hay asistencias para exportar', 'error');
            return;
        }

        try {
            // Hoja 1: Resumen de emergencias
            const datosResumen = this.asistencias.map((a, index) => ({
                'N°': index + 1,
                'Fecha': this.formatearFecha(a.fecha),
                'Hora': a.hora,
                'Clave': a.claveEmergencia || 'N/A',
                'Dirección': a.direccion,
                'Total Asistentes': a.totalAsistentes,
                'Total Voluntarios': a.totalPersonas,
                '% Asistencia': a.porcentajeAsistencia + '%',
                'Observaciones': a.observaciones || '-',
                'Registrado por': a.registradoPor,
                'Fecha Registro': this.formatearFecha(a.fechaRegistro.split('T')[0])
            }));

            // Hoja 2: Detalle de asistentes con cargos
            const datosDetalle = [];
            this.asistencias.forEach((asistencia, idx) => {
                asistencia.asistentes.forEach(asistente => {
                    datosDetalle.push({
                        'N° Emergencia': idx + 1,
                        'Fecha Emergencia': this.formatearFecha(asistencia.fecha),
                        'Hora': asistencia.hora,
                        'Dirección': asistencia.direccion,
                        'Nombre Asistente': asistente.nombre,
                        'Clave': asistente.claveBombero,
                        'Categoría': asistente.categoria,
                        'Cargo': asistente.cargo || 'Sin cargo',
                        'Año Cargo': asistente.añoCargo || '-'
                    });
                });
            });

            // Hoja 3: Ranking de asistencias
            const asistenciasPorBombero = {};
            this.asistencias.forEach(emergencia => {
                emergencia.asistentes.forEach(asistente => {
                    const id = asistente.bomberoId;
                    if (!asistenciasPorBombero[id]) {
                        asistenciasPorBombero[id] = {
                            nombre: asistente.nombre,
                            claveBombero: asistente.claveBombero,
                            totalAsistencias: 0
                        };
                    }
                    asistenciasPorBombero[id].totalAsistencias++;
                });
            });

            const ranking = Object.values(asistenciasPorBombero)
                .sort((a, b) => b.totalAsistencias - a.totalAsistencias);

            const datosRanking = ranking.map((bombero, index) => ({
                'Posición': index + 1,
                'Nombre': bombero.nombre,
                'Clave': bombero.claveBombero,
                'Total Asistencias': bombero.totalAsistencias,
                'Porcentaje': Math.round((bombero.totalAsistencias / this.asistencias.length) * 100) + '%'
            }));

            // Crear libro de Excel con tres hojas
            const wb = XLSX.utils.book_new();
            
            const ws1 = XLSX.utils.json_to_sheet(datosResumen);
            XLSX.utils.book_append_sheet(wb, ws1, 'Resumen');
            
            const ws2 = XLSX.utils.json_to_sheet(datosDetalle);
            XLSX.utils.book_append_sheet(wb, ws2, 'Detalle Asistentes');
            
            const ws3 = XLSX.utils.json_to_sheet(datosRanking);
            XLSX.utils.book_append_sheet(wb, ws3, 'Ranking');
            
            XLSX.writeFile(wb, `Asistencias_Emergencias_${new Date().toISOString().split('T')[0]}.xlsx`);

            this.mostrarNotificacion('Excel exportado exitosamente', 'success');
        } catch (error) {
            console.error('Error al exportar:', error);
            this.mostrarNotificacion('Error al exportar: ' + error.message, 'error');
        }
    }

    mostrarNotificacion(mensaje, tipo) {
        if (typeof Utils !== 'undefined' && Utils.mostrarNotificacion) {
            Utils.mostrarNotificacion(mensaje, tipo);
        } else {
            alert(mensaje);
        }
        console.log(`📢 ${tipo.toUpperCase()}: ${mensaje}`);
    }
}

// Inicializar cuando cargue la página
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Iniciando Historial de Asistencias...');
    window.historialAsistencias = new HistorialAsistencias();
});