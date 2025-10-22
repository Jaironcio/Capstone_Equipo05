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
        if (!window.idCounter) window.idCounter = counters.bomberoId || 1;
        if (!window.sancionIdCounter) window.sancionIdCounter = counters.sancionId || 1;
        if (!window.cargoIdCounter) window.cargoIdCounter = counters.cargoId || 1;
        
        console.log('Contadores inicializados:', {
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
                    
                    // Validar estructura del backup
                    if (!backup.bomberos || !backup.sanciones || !backup.cargos || !backup.counters) {
                        throw new Error('Formato de backup inválido');
                    }

                    // Restaurar datos
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

    // ==================== SISTEMA DE EJEMPLOS ====================
    cargarEjemplosCompletos() {
        console.log('🔄 Cargando ejemplos completos...');
        
        // Limpiar datos existentes primero
        this.clearAll();
        
        // Inicializar contadores
        this.inicializarContadores();
        
        const hoy = new Date();
        
        // ==================== BOMBEROS DE EJEMPLO ====================
        const bomberosEjemplo = [
            {
                id: window.idCounter++,
                claveBombero: "618-A",
                nombre: "Carlos Eduardo Morales Silva",
                apellidoPaterno: "Morales",
                apellidoMaterno: "Silva",
                fechaNacimiento: new Date(hoy.getFullYear() - 28, 5, 15).toISOString().split('T')[0],
                rut: "12.345.678-9",  // ✅ CAMBIADO DE run A rut
                profesion: "Ingeniero Civil",
                domicilio: "Av. Providencia 1234, Providencia",
                nroRegistro: "REG-2019-001",
                fechaIngreso: new Date(hoy.getFullYear() - 5, hoy.getMonth(), hoy.getDate()).toISOString().split('T')[0],
                compania: "Primera Compañía",
                grupoSanguineo: "O+",
                telefono: "+56 9 8765 4321",
                email: "carlos.morales@email.com",
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
                nombre: "María Teresa González Rodríguez",
                apellidoPaterno: "González",
                apellidoMaterno: "Rodríguez",
                fechaNacimiento: new Date(hoy.getFullYear() - 47, 8, 20).toISOString().split('T')[0],
                rut: "11.222.333-4",  // ✅ CAMBIADO DE run A rut
                profesion: "Profesora de Educación Básica",
                domicilio: "Calle Los Aromos 567, Las Condes",
                nroRegistro: "REG-2002-045",
                fechaIngreso: new Date(hoy.getFullYear() - 22, hoy.getMonth(), hoy.getDate()).toISOString().split('T')[0],
                compania: "Segunda Compañía",
                grupoSanguineo: "A+",
                telefono: "+56 9 7654 3210",
                email: "maria.gonzalez@email.com",
                foto: null,
                otrosCuerpos: "",
                companiaOpcional: "",
                desde: "",
                hasta: "",
                fechaRegistro: new Date().toISOString()
            },
            {
                id: window.idCounter++,
                claveBombero: "123-C",
                nombre: "Roberto Antonio Fernández López",
                apellidoPaterno: "Fernández",
                apellidoMaterno: "López",
                fechaNacimiento: new Date(hoy.getFullYear() - 55, 3, 10).toISOString().split('T')[0],
                rut: "13.456.789-0",  // ✅ CAMBIADO DE run A rut
                profesion: "Contador Auditor",
                domicilio: "Pasaje San Martín 890, Ñuñoa",
                nroRegistro: "REG-1994-023",
                fechaIngreso: new Date(hoy.getFullYear() - 30, hoy.getMonth(), hoy.getDate()).toISOString().split('T')[0],
                compania: "Tercera Compañía",
                grupoSanguineo: "B+",
                telefono: "+56 9 6543 2109",
                email: "roberto.fernandez@email.com",
                foto: null,
                otrosCuerpos: "Cuerpo de Bomberos de Valparaíso",
                companiaOpcional: "Quinta Compañía",
                desde: "1990-03-15",
                hasta: "1994-08-20",
                fechaRegistro: new Date().toISOString()
            },
            {
                id: window.idCounter++,
                claveBombero: "001-D",
                nombre: "Manuel Alejandro Peña Morales",
                apellidoPaterno: "Peña",
                apellidoMaterno: "Morales",
                fechaNacimiento: new Date(hoy.getFullYear() - 75, 11, 5).toISOString().split('T')[0],
                rut: "8.765.432-1",  // ✅ CAMBIADO DE run A rut
                profesion: "Médico Cirujano (Jubilado)",
                domicilio: "Av. Las Flores 234, Vitacura",
                nroRegistro: "REG-1972-001",
                fechaIngreso: new Date(hoy.getFullYear() - 52, hoy.getMonth(), hoy.getDate()).toISOString().split('T')[0],
                compania: "Primera Compañía",
                grupoSanguineo: "AB+",
                telefono: "+56 9 5432 1098",
                email: "manuel.pena@email.com",
                foto: null,
                otrosCuerpos: "",
                companiaOpcional: "",
                desde: "",
                hasta: "",
                fechaRegistro: new Date().toISOString()
            },
            {
                id: window.idCounter++,
                claveBombero: "789-E",
                nombre: "Francisca Alejandra Soto Vargas",
                apellidoPaterno: "Soto",
                apellidoMaterno: "Vargas",
                fechaNacimiento: new Date(hoy.getFullYear() - 25, 8, 8).toISOString().split('T')[0],
                rut: "21.987.654-3",  // ✅ CAMBIADO DE run A rut
                profesion: "Diseñadora Gráfica",
                domicilio: "Calle Nueva 456, Santiago Centro",
                nroRegistro: "REG-2022-078",
                fechaIngreso: new Date(hoy.getFullYear() - 2, hoy.getMonth(), hoy.getDate()).toISOString().split('T')[0],
                compania: "Cuarta Compañía",
                grupoSanguineo: "O-",
                telefono: "+56 9 4321 0987",
                email: "francisca.soto@email.com",
                foto: null,
                otrosCuerpos: "",
                companiaOpcional: "",
                desde: "",
                hasta: "",
                fechaRegistro: new Date().toISOString()
            },
            {
                id: window.idCounter++,
                claveBombero: "345-F",
                nombre: "Luis Fernando Castro Muñoz",
                apellidoPaterno: "Castro",
                apellidoMaterno: "Muñoz",
                fechaNacimiento: new Date(hoy.getFullYear() - 60, 6, 18).toISOString().split('T')[0],
                rut: "10.111.222-3",  // ✅ CAMBIADO DE run A rut
                profesion: "Técnico en Electrónica",
                domicilio: "Villa Los Pinos 123, Maipú",
                nroRegistro: "REG-1989-056",
                fechaIngreso: new Date(hoy.getFullYear() - 35, hoy.getMonth(), hoy.getDate()).toISOString().split('T')[0],
                compania: "Quinta Compañía",
                grupoSanguineo: "A-",
                telefono: "+56 9 3210 9876",
                email: "luis.castro@email.com",
                foto: null,
                otrosCuerpos: "Cuerpo de Bomberos de Melipilla",
                companiaOpcional: "Segunda Compañía",
                desde: "1985-01-10",
                hasta: "1989-06-30",
                fechaRegistro: new Date().toISOString()
            }
        ];

        this.saveBomberos(bomberosEjemplo);
        console.log('✅ Bomberos de ejemplo cargados:', bomberosEjemplo.length);

        // ==================== SANCIONES DE EJEMPLO ====================
        const sancionesEjemplo = [
            // Sanciones para Carlos Eduardo Morales Silva (ID 1)
            {
                id: window.sancionIdCounter++,
                bomberoId: 1,
                tipo: '⏸️ Suspensión',
                companiaAutoridad: 'Primera Compañía',
                autoridadSancionatoria: 'Consejo de Disciplina de Cía',
                fechaDesde: '2023-03-15',
                fechaHasta: '2023-03-22',
                diasSancion: 7,
                oficioNumero: 'OF-2023-045',
                fechaOficio: '2023-03-10',
                motivo: 'Inasistencia reiterada a servicios ordinarios sin justificación durante el mes de febrero 2023.',
                fechaRegistro: new Date('2023-03-10').toISOString()
            },
            {
                id: window.sancionIdCounter++,
                bomberoId: 1,
                tipo: '📝 Renuncia',
                companiaAutoridad: '',
                autoridadSancionatoria: 'Consejo Superior de Disciplina',
                fechaDesde: '2024-06-01',
                fechaHasta: null,
                diasSancion: null,
                oficioNumero: 'CS-2024-128',
                fechaOficio: hoy.toISOString().split('T')[0],
                motivo: 'Renuncia voluntaria presentada por motivos personales y cambio de residencia a otra región.',
                fechaRegistro: new Date().toISOString()
            },
            
            // Sanciones para María Teresa González Rodríguez (ID 2)
            {
                id: window.sancionIdCounter++,
                bomberoId: 2,
                tipo: '⏸️ Suspensión',
                companiaAutoridad: 'Segunda Compañía',
                autoridadSancionatoria: 'Consejo de Disciplina de Cía',
                fechaDesde: '2010-05-20',
                fechaHasta: '2010-05-27',
                diasSancion: 7,
                oficioNumero: 'OF-2010-089',
                fechaOficio: '2010-05-15',
                motivo: 'Retraso en entrega de informes trimestrales de tesorería por tercera vez consecutiva.',
                fechaRegistro: new Date('2010-05-15').toISOString()
            },
            {
                id: window.sancionIdCounter++,
                bomberoId: 2,
                tipo: '⏸️ Suspensión',
                companiaAutoridad: 'Segunda Compañía',
                autoridadSancionatoria: 'Consejo de Disciplina de Cía',
                fechaDesde: '2022-08-10',
                fechaHasta: '2022-08-24',
                diasSancion: 14,
                oficioNumero: 'OF-2022-233',
                fechaOficio: '2022-08-05',
                motivo: 'Incumplimiento de protocolo de seguridad durante emergencia vehicular en Av. Providencia.',
                fechaRegistro: new Date('2022-08-05').toISOString()
            },
            
            // Sanciones para Roberto Antonio Fernández López (ID 3)
            {
                id: window.sancionIdCounter++,
                bomberoId: 3,
                tipo: '⏸️ Suspensión',
                companiaAutoridad: 'Tercera Compañía',
                autoridadSancionatoria: 'Consejo de Disciplina de Cía',
                fechaDesde: '2005-11-10',
                fechaHasta: '2005-11-24',
                diasSancion: 14,
                oficioNumero: 'OF-2005-201',
                fechaOficio: '2005-11-05',
                motivo: 'Negligencia en mantenimiento de equipos resultando en falla durante emergencia nocturna.',
                fechaRegistro: new Date('2005-11-05').toISOString()
            },
            {
                id: window.sancionIdCounter++,
                bomberoId: 3,
                tipo: '↗️ Separación',
                companiaAutoridad: '',
                autoridadSancionatoria: 'Consejo Superior de Disciplina',
                fechaDesde: '2020-11-30',
                fechaHasta: '2021-11-30',
                diasSancion: 365,
                oficioNumero: 'CD-2020-089',
                fechaOficio: '2020-11-25',
                motivo: 'Conducta impropia en acto oficial y representación inadecuada de la institución en evento público.',
                fechaRegistro: new Date('2020-11-25').toISOString()
            },
            
            // Sanciones para Manuel Alejandro Peña Morales (ID 4)
            {
                id: window.sancionIdCounter++,
                bomberoId: 4,
                tipo: '⏸️ Suspensión',
                companiaAutoridad: 'Primera Compañía',
                autoridadSancionatoria: 'Consejo de Disciplina de Cía',
                fechaDesde: '1983-07-15',
                fechaHasta: '1983-07-22',
                diasSancion: 7,
                oficioNumero: 'OF-1983-034',
                fechaOficio: '1983-07-10',
                motivo: 'Ausencia no justificada durante ejercicio de entrenamiento regional de rescate.',
                fechaRegistro: new Date('1983-07-10').toISOString()
            },
            
            // Sanciones para Francisca Alejandra Soto Vargas (ID 5)
            {
                id: window.sancionIdCounter++,
                bomberoId: 5,
                tipo: '⏸️ Suspensión',
                companiaAutoridad: 'Cuarta Compañía',
                autoridadSancionatoria: 'Consejo de Disciplina de Cía',
                fechaDesde: '2024-02-10',
                fechaHasta: '2024-02-17',
                diasSancion: 7,
                oficioNumero: 'OF-2024-034',
                fechaOficio: hoy.toISOString().split('T')[0],
                motivo: 'Inasistencia a capacitación obligatoria de primeros auxilios sin justificación médica.',
                fechaRegistro: new Date().toISOString()
            },
            
            // Sanciones para Luis Fernando Castro Muñoz (ID 6)
            {
                id: window.sancionIdCounter++,
                bomberoId: 6,
                tipo: '↗️ Separación',
                companiaAutoridad: '',
                autoridadSancionatoria: 'Consejo Superior de Disciplina',
                fechaDesde: '2022-06-15',
                fechaHasta: '2023-06-15',
                diasSancion: 365,
                oficioNumero: 'CS-2022-091',
                fechaOficio: '2022-06-10',
                motivo: 'Falta grave: alteración de documentos oficiales y falsificación de horas de servicio reportadas.',
                fechaRegistro: new Date('2022-06-10').toISOString()
            }
        ];

        this.saveSanciones(sancionesEjemplo);
        console.log('✅ Sanciones de ejemplo cargadas:', sancionesEjemplo.length);

        // ==================== CARGOS DE EJEMPLO ====================
        const cargosEjemplo = [
            // Cargos para Carlos Eduardo Morales Silva (ID 1) - 5 años de servicio
            {
                id: window.cargoIdCounter++,
                bomberoId: 1,
                añoCargo: 2020,
                tipoCargo: 'Teniente Cuarto',
                fechaInicioCargo: '2020-01-01',
                fechaFinCargo: '2021-12-31',
                premioAñoServicio: 'Medalla 5 Años de Servicio',
                observacionesCargo: 'Primer cargo de mando. Período de 2 años con desempeño satisfactorio.',
                fechaRegistro: new Date('2020-01-15').toISOString()
            },
            {
                id: window.cargoIdCounter++,
                bomberoId: 1,
                añoCargo: 2022,
                tipoCargo: 'Teniente Tercero',
                fechaInicioCargo: '2022-01-01',
                fechaFinCargo: '2023-12-31',
                premioAñoServicio: null,
                observacionesCargo: 'También ejerció como Instructor de nuevos voluntarios.',
                fechaRegistro: new Date('2022-01-10').toISOString()
            },

            // Cargos para María Teresa González Rodríguez (ID 2) - 22 años de servicio
            {
                id: window.cargoIdCounter++,
                bomberoId: 2,
                añoCargo: 2004,
                tipoCargo: 'Secretario',
                fechaInicioCargo: '2004-01-01',
                fechaFinCargo: '2006-12-31',
                premioAñoServicio: 'Medalla 5 Años de Servicio',
                observacionesCargo: 'Modernizó el sistema de archivo. Período completo de 3 años como Secretario.',
                fechaRegistro: new Date('2004-01-15').toISOString()
            },
            {
                id: window.cargoIdCounter++,
                bomberoId: 2,
                añoCargo: 2014,
                tipoCargo: 'Tesorero',
                fechaInicioCargo: '2014-01-01',
                fechaFinCargo: '2016-12-31',
                premioAñoServicio: 'Medalla 15 Años de Servicio',
                observacionesCargo: 'Gestionó exitosamente presupuesto para renovación completa de equipos.',
                fechaRegistro: new Date('2014-01-12').toISOString()
            },
            {
                id: window.cargoIdCounter++,
                bomberoId: 2,
                añoCargo: 2022,
                tipoCargo: 'Teniente Primero',
                fechaInicioCargo: '2022-01-01',
                fechaFinCargo: null,
                premioAñoServicio: 'Medalla 20 Años de Servicio',
                observacionesCargo: 'En ejercicio. Responsable de operaciones nocturnas y entrenamientos.',
                fechaRegistro: new Date('2022-01-10').toISOString()
            },

            // Cargos para Roberto Antonio Fernández López (ID 3) - 30 años de servicio
            {
                id: window.cargoIdCounter++,
                bomberoId: 3,
                añoCargo: 1996,
                tipoCargo: 'Tesorero',
                fechaInicioCargo: '1996-01-01',
                fechaFinCargo: '1998-12-31',
                premioAñoServicio: null,
                observacionesCargo: 'Implementó primer sistema computarizado de contabilidad durante 3 años.',
                fechaRegistro: new Date('1996-01-12').toISOString()
            },
            {
                id: window.cargoIdCounter++,
                bomberoId: 3,
                añoCargo: 2014,
                tipoCargo: 'Capitán',
                fechaInicioCargo: '2014-01-01',
                fechaFinCargo: '2015-12-31',
                premioAñoServicio: 'Medalla 15 Años de Servicio',
                observacionesCargo: 'Período de 2 años como Capitán dirigiendo construcción de nueva sede.',
                fechaRegistro: new Date('2014-01-05').toISOString()
            },

            // Cargos para Manuel Alejandro Peña Morales (ID 4) - 52 años de servicio (Insigne)
            {
                id: window.cargoIdCounter++,
                bomberoId: 4,
                añoCargo: 1977,
                tipoCargo: 'Teniente Cuarto',
                fechaInicioCargo: '1977-01-01',
                fechaFinCargo: '1978-12-31',
                premioAñoServicio: 'Medalla 5 Años de Servicio',
                observacionesCargo: 'Primer cargo administrativo. Período de 2 años en época de grandes incendios.',
                fechaRegistro: new Date('1977-01-20').toISOString()
            },
            {
                id: window.cargoIdCounter++,
                bomberoId: 4,
                añoCargo: 1992,
                tipoCargo: 'Capitán',
                fechaInicioCargo: '1992-01-01',
                fechaFinCargo: '1993-12-31',
                premioAñoServicio: 'Medalla 20 Años de Servicio',
                observacionesCargo: 'Primer período como Capitán. Modernizó equipos durante 2 años.',
                fechaRegistro: new Date('1992-01-08').toISOString()
            },
            {
                id: window.cargoIdCounter++,
                bomberoId: 4,
                añoCargo: 2002,
                tipoCargo: 'Director',
                fechaInicioCargo: '2002-01-01',
                fechaFinCargo: '2006-12-31',
                premioAñoServicio: 'Medalla 30 Años de Servicio',
                observacionesCargo: 'Primer período como Director durante 5 años. Expansión regional.',
                fechaRegistro: new Date('2002-01-05').toISOString()
            },
            {
                id: window.cargoIdCounter++,
                bomberoId: 4,
                añoCargo: 2022,
                tipoCargo: 'Intendente',
                fechaInicioCargo: '2022-01-01',
                fechaFinCargo: null,
                premioAñoServicio: 'Medalla de Oro 50 Años de Servicio',
                observacionesCargo: 'En ejercicio. Cargo honorífico por trayectoria excepcional.',
                fechaRegistro: new Date('2022-01-05').toISOString()
            },

            // Cargos para Francisca Alejandra Soto Vargas (ID 5) - 2 años de servicio
            {
                id: window.cargoIdCounter++,
                bomberoId: 5,
                añoCargo: 2023,
                tipoCargo: 'Secretario',
                fechaInicioCargo: '2023-06-01',
                fechaFinCargo: null,
                premioAñoServicio: null,
                observacionesCargo: 'En ejercicio. Implementando modernización digital.',
                fechaRegistro: new Date('2023-06-05').toISOString()
            },

            // Cargos para Luis Fernando Castro Muñoz (ID 6) - 35 años de servicio
            {
                id: window.cargoIdCounter++,
                bomberoId: 6,
                añoCargo: 1991,
                tipoCargo: 'Jefe de Máquinas',
                fechaInicioCargo: '1991-01-01',
                fechaFinCargo: '1993-12-31',
                premioAñoServicio: null,
                observacionesCargo: 'Especialista en mantenimiento. Período de 3 años supervisando equipos.',
                fechaRegistro: new Date('1991-01-20').toISOString()
            },
            {
                id: window.cargoIdCounter++,
                bomberoId: 6,
                añoCargo: 2014,
                tipoCargo: 'Capitán',
                fechaInicioCargo: '2014-01-01',
                fechaFinCargo: '2015-12-31',
                premioAñoServicio: 'Medalla 25 Años de Servicio',
                observacionesCargo: 'Período de 2 años como Capitán modernizando protocolos operacionales.',
                fechaRegistro: new Date('2014-01-05').toISOString()
            },
            {
                id: window.cargoIdCounter++,
                bomberoId: 6,
                añoCargo: 2019,
                tipoCargo: 'Intendente',
                fechaInicioCargo: '2019-01-01',
                fechaFinCargo: null,
                premioAñoServicio: 'Medalla 30 Años de Servicio',
                observacionesCargo: 'En ejercicio. Administra recursos y logística.',
                fechaRegistro: new Date('2019-01-10').toISOString()
            }
        ];

        this.saveCargos(cargosEjemplo);
        console.log('✅ Cargos de ejemplo cargados:', cargosEjemplo.length);

        // Guardar contadores actualizados
        this.saveCounters({
            bomberoId: window.idCounter,
            sancionId: window.sancionIdCounter,
            cargoId: window.cargoIdCounter
        });

        console.log('🎉 Ejemplos completos cargados exitosamente!');
        console.log('📊 Resumen:', {
            bomberos: bomberosEjemplo.length,
            sanciones: sancionesEjemplo.length,
            cargos: cargosEjemplo.length
        });

        return {
            bomberos: bomberosEjemplo.length,
            sanciones: sancionesEjemplo.length,
            cargos: cargosEjemplo.length
        };
    }

    tieneEjemplosActivos() {
        const bomberos = this.getBomberos();
        const clavesEjemplo = ["618-A", "425-B", "123-C", "001-D", "789-E", "345-F"];
        return bomberos.some(b => clavesEjemplo.includes(b.claveBombero));
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

    eliminarEjemplos() {
        console.log('🗑️ Eliminando ejemplos...');
        
        const bomberos = this.getBomberos();
        const clavesEjemplo = ["618-A", "425-B", "123-C", "001-D", "789-E", "345-F"];
        
        // Filtrar bomberos que NO son ejemplos
        const bomberosReales = bomberos.filter(b => !clavesEjemplo.includes(b.claveBombero));
        
        // Obtener IDs de bomberos de ejemplo para eliminar sus sanciones y cargos
        const idsEjemplo = bomberos
            .filter(b => clavesEjemplo.includes(b.claveBombero))
            .map(b => b.id);
        
        // Filtrar sanciones y cargos que NO pertenecen a ejemplos
        const sanciones = this.getSanciones().filter(s => !idsEjemplo.includes(s.bomberoId));
        const cargos = this.getCargos().filter(c => !idsEjemplo.includes(c.bomberoId));
        
        // Guardar datos filtrados
        this.saveBomberos(bomberosReales);
        this.saveSanciones(sanciones);
        this.saveCargos(cargos);
        
        const resultado = {
            bomberosEliminados: idsEjemplo.length,
            sancionesEliminadas: this.getSanciones().length - sanciones.length,
            cargosEliminados: this.getCargos().length - cargos.length
        };
        
        console.log('✅ Ejemplos eliminados:', resultado);
        
        return resultado;
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