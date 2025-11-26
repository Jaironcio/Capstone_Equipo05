// ==================== SISTEMA DE ALMACENAMIENTO ====================
class StorageManager {
    constructor() {
        this.bomberosKey = 'bomberosData';
        this.sancionesKey = 'sancionesData';
        this.cargosKey = 'cargosData';
        this.countersKey = 'countersData';
    }

    // ==================== BOMBEROS ====================
    getBomberos() {
        try {
            const data = localStorage.getItem(this.bomberosKey);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error al cargar bomberos:', error);
            return [];
        }
    }

    saveBomberos(bomberos) {
        try {
            localStorage.setItem(this.bomberosKey, JSON.stringify(bomberos));
            return true;
        } catch (error) {
            console.error('Error al guardar bomberos:', error);
            return false;
        }
    }

    // ==================== SANCIONES ====================
    getSanciones() {
        try {
            const data = localStorage.getItem(this.sancionesKey);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error al cargar sanciones:', error);
            return [];
        }
    }

    saveSanciones(sanciones) {
        try {
            localStorage.setItem(this.sancionesKey, JSON.stringify(sanciones));
            return true;
        } catch (error) {
            console.error('Error al guardar sanciones:', error);
            return false;
        }
    }

    // ==================== CARGOS ====================
    getCargos() {
        try {
            const data = localStorage.getItem(this.cargosKey);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error al cargar cargos:', error);
            return [];
        }
    }

    saveCargos(cargos) {
        try {
            localStorage.setItem(this.cargosKey, JSON.stringify(cargos));
            return true;
        } catch (error) {
            console.error('Error al guardar cargos:', error);
            return false;
        }
    }

    // ==================== CONTADORES ====================
    getCounters() {
        try {
            const data = localStorage.getItem(this.countersKey);
            return data ? JSON.parse(data) : { 
                bomberoId: 1, 
                sancionId: 1, 
                cargoId: 1 
            };
        } catch (error) {
            console.error('Error al cargar contadores:', error);
            return { bomberoId: 1, sancionId: 1, cargoId: 1 };
        }
    }

    saveCounters(counters) {
        try {
            localStorage.setItem(this.countersKey, JSON.stringify(counters));
            return true;
        } catch (error) {
            console.error('Error al guardar contadores:', error);
            return false;
        }
    }

  // ==================== INICIALIZACIÓN ====================
    inicializarContadores() {
        const counters = this.getCounters();
        // Aseguramos la inicialización de las variables globales de window
        if (!window.idCounter) window.idCounter = counters.bomberoId || 1;
        if (!window.sancionIdCounter) window.sancionIdCounter = counters.sancionId || 1;
        if (!window.cargoIdCounter) window.cargoIdCounter = counters.cargoId || 1;
        
        console.log('Contadores sincronizados:', {
            bomberoId: window.idCounter,
            sancionId: window.sancionIdCounter,
            cargoId: window.cargoIdCounter
        });
    }
    // ==================== BACKUP Y RESTAURACIÓN ====================
    exportBackup() {
        try {
            const backup = {
                bomberos: this.getBomberos(),
                sanciones: this.getSanciones(),
                cargos: this.getCargos(),
                counters: this.getCounters(),
                fecha: new Date().toISOString(),
                version: '1.0'
            };
            
            const blob = new Blob([JSON.stringify(backup, null, 2)], { 
                type: 'application/json' 
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `backup_proyecto_seis_${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
            
            return true;
        } catch (error) {
            console.error('Error al exportar backup:', error);
            return false;
        }
    }

    importBackup(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const backup = JSON.parse(e.target.result);
                    
                    if (!backup.bomberos || !backup.sanciones || !backup.cargos || !backup.counters) {
                        throw new Error('Formato de backup inválido');
                    }

                    this.saveBomberos(backup.bomberos);
                    this.saveSanciones(backup.sanciones);
                    this.saveCargos(backup.cargos);
                    this.saveCounters(backup.counters);
                    
                    resolve(true);
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = () => reject(new Error('Error al leer el archivo'));
            reader.readAsText(file);
        });
    }

    // ==================== LIMPIAR DATOS ====================
    clearAll() {
        try {
            localStorage.removeItem(this.bomberosKey);
            localStorage.removeItem(this.sancionesKey);
            localStorage.removeItem(this.cargosKey);
            localStorage.removeItem(this.countersKey);
            return true;
        } catch (error) {
            console.error('Error al limpiar datos:', error);
            return false;
        }
    }

    // ==================== ESTADÍSTICAS ====================
    getStats() {
        const bomberos = this.getBomberos();
        const sanciones = this.getSanciones();
        const cargos = this.getCargos();
        
        return {
            totalBomberos: bomberos.length,
            totalSanciones: sanciones.length,
            totalCargos: cargos.length,
            ultimaActualizacion: new Date().toISOString()
        };
    }

    // ==================== MOVIMIENTOS FINANCIEROS ====================
    getMovimientosFinancieros() {
        try {
            const data = localStorage.getItem('movimientosFinancieros');
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error al cargar movimientos financieros:', error);
            return [];
        }
    }

    saveMovimientosFinancieros(movimientos) {
        try {
            localStorage.setItem('movimientosFinancieros', JSON.stringify(movimientos));
            return true;
        } catch (error) {
            console.error('Error al guardar movimientos financieros:', error);
            return false;
        }
    }

    // ==================== BENEFICIOS ====================
    getBeneficios() {
        try {
            const data = localStorage.getItem('beneficios');
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error al cargar beneficios:', error);
            return [];
        }
    }

    saveBeneficios(beneficios) {
        try {
            localStorage.setItem('beneficios', JSON.stringify(beneficios));
            return true;
        } catch (error) {
            console.error('Error al guardar beneficios:', error);
            return false;
        }
    }

    // ==================== PAGOS DE CUOTAS ====================
    getPagosCuotas() {
        try {
            const data = localStorage.getItem('pagosCuotas');
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error al cargar pagos de cuotas:', error);
            return [];
        }
    }

    savePagosCuotas(pagos) {
        try {
            localStorage.setItem('pagosCuotas', JSON.stringify(pagos));
            return true;
        } catch (error) {
            console.error('Error al guardar pagos de cuotas:', error);
            return false;
        }
    }

    // ==================== PAGOS DE BENEFICIOS ====================
    getPagosBeneficios() {
        try {
            const data = localStorage.getItem('pagosBeneficios');
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error al cargar pagos de beneficios:', error);
            return [];
        }
    }

    savePagosBeneficios(pagos) {
        try {
            localStorage.setItem('pagosBeneficios', JSON.stringify(pagos));
            return true;
        } catch (error) {
            console.error('Error al guardar pagos de beneficios:', error);
            return false;
        }
    }

    // ==================== ASIGNACIONES DE BENEFICIOS ====================
    getAsignacionesBeneficios() {
        try {
            const data = localStorage.getItem('asignacionesBeneficios');
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error al cargar asignaciones de beneficios:', error);
            return [];
        }
    }

    saveAsignacionesBeneficios(asignaciones) {
        try {
            localStorage.setItem('asignacionesBeneficios', JSON.stringify(asignaciones));
            return true;
        } catch (error) {
            console.error('Error al guardar asignaciones de beneficios:', error);
            return false;
        }
    }
}

// Instancia global del storage manager
const storage = new StorageManager();