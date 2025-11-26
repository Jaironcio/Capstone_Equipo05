// Sistema de Edición de Bomberos
class EditarBomberoSistema {
    constructor() {
        this.bomberoActual = null;
        this.fotoNueva = null;
        this.init();
    }

    async init() {
        if (!checkAuth()) {
            window.location.href = 'index.html';
            return;
        }
        this.mostrarInfoUsuario();
        this.configurarEventos();
        await this.cargarBombero();
    }

    mostrarInfoUsuario() {
        const userRoleInfo = document.getElementById('userRoleInfo');
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (currentUser) {
            userRoleInfo.textContent = `${currentUser.role}: ${currentUser.username}`;
        }
        document.getElementById('logoutBtn').addEventListener('click', () => logout());
    }

    configurarEventos() {
        const form = document.getElementById('formEditarBombero');
        if (form) form.addEventListener('submit', (e) => this.manejarSubmit(e));

        const rutInput = document.getElementById('rut');
        if (rutInput) {
            rutInput.addEventListener('input', (e) => {
                e.target.value = Utils.formatearRUN(e.target.value);
            });
        }
    }

    async cargarBombero() {
        const bomberoId = localStorage.getItem('bomberoEditarActual');
        if (!bomberoId) {
            Utils.mostrarNotificacion('No se ha seleccionado ningún bombero para editar', 'error');
            setTimeout(() => this.volver(), 2000);
            return;
        }

        const bomberos = storage.getBomberos();
        this.bomberoActual = bomberos.find(b => b.id == bomberoId);

        if (!this.bomberoActual) {
            Utils.mostrarNotificacion('Bombero no encontrado', 'error');
            setTimeout(() => this.volver(), 2000);
            return;
        }

        this.mostrarInfoActual();
        this.llenarFormulario();
    }

    mostrarInfoActual() {
        const contenedor = document.getElementById('infoBomberoActual');
        const antiguedad = Utils.calcularAntiguedadDetallada(this.bomberoActual.fechaIngreso);
        const edad = Utils.calcularEdad(this.bomberoActual.fechaNacimiento);
        const nombreCompleto = Utils.obtenerNombreCompleto(this.bomberoActual);

        contenedor.innerHTML = `
            <div><strong>Nombre:</strong> ${nombreCompleto}</div>
            <div><strong>Clave:</strong> ${this.bomberoActual.claveBombero}</div>
            <div><strong>RUT:</strong> ${this.bomberoActual.rut}</div>
            <div><strong>Edad:</strong> ${edad} años</div>
            <div><strong>Compañía:</strong> ${this.bomberoActual.compania}</div>
            <div><strong>Antigüedad:</strong> ${antiguedad.años} años, ${antiguedad.meses} meses</div>
        `;

        const fotoPreview = document.getElementById('fotoActualPreview');
        if (this.bomberoActual.foto) {
            fotoPreview.innerHTML = `
                <p style="font-weight: 600; color: #666; margin-bottom: 10px;">📸 Foto Actual:</p>
                <img src="${this.bomberoActual.foto}" alt="Foto actual">
            `;
        } else {
            fotoPreview.innerHTML = `<p style="color: #999;">Sin foto registrada</p>`;
        }
    }

    llenarFormulario() {
        document.getElementById('idBombero').value = this.bomberoActual.id;
        document.getElementById('claveBombero').value = this.bomberoActual.claveBombero || '';
        
        // Campos de nombre nuevos
        document.getElementById('primerNombre').value = this.bomberoActual.primerNombre || '';
        document.getElementById('segundoNombre').value = this.bomberoActual.segundoNombre || '';
        document.getElementById('tercerNombre').value = this.bomberoActual.tercerNombre || '';
        document.getElementById('primerApellido').value = this.bomberoActual.primerApellido || '';
        document.getElementById('segundoApellido').value = this.bomberoActual.segundoApellido || '';
        
        // Padrinos
        document.getElementById('nombrePrimerPadrino').value = this.bomberoActual.nombrePrimerPadrino || '';
        document.getElementById('nombreSegundoPadrino').value = this.bomberoActual.nombreSegundoPadrino || '';
        
        // Resto de campos
        document.getElementById('fechaNacimiento').value = this.bomberoActual.fechaNacimiento || '';
        document.getElementById('rut').value = this.bomberoActual.rut || '';
        document.getElementById('profesion').value = this.bomberoActual.profesion || '';
        document.getElementById('domicilio').value = this.bomberoActual.domicilio || '';
        document.getElementById('nroRegistro').value = this.bomberoActual.nroRegistro || '';
        document.getElementById('fechaIngreso').value = this.bomberoActual.fechaIngreso || '';
        document.getElementById('compania').value = this.bomberoActual.compania || '';
        document.getElementById('grupoSanguineo').value = this.bomberoActual.grupoSanguineo || '';
        document.getElementById('telefono').value = this.bomberoActual.telefono || '';
        document.getElementById('email').value = this.bomberoActual.email || '';
        document.getElementById('otrosCuerpos').value = this.bomberoActual.otrosCuerpos || '';
        document.getElementById('companiaOpcional').value = this.bomberoActual.companiaOpcional || '';
        document.getElementById('desde').value = this.bomberoActual.desde || '';
        document.getElementById('hasta').value = this.bomberoActual.hasta || '';
    }

    previsualizarFoto(input) {
        const preview = document.getElementById('previewFotoNueva');
        if (!input.files || !input.files[0]) {
            preview.innerHTML = '';
            this.fotoNueva = null;
            return;
        }

        const file = input.files[0];
        if (file.size > 5 * 1024 * 1024) {
            Utils.mostrarNotificacion('La foto no debe superar 5MB', 'error');
            input.value = '';
            preview.innerHTML = '';
            this.fotoNueva = null;
            return;
        }

        if (!file.type.startsWith('image/')) {
            Utils.mostrarNotificacion('Solo se permiten archivos de imagen', 'error');
            input.value = '';
            preview.innerHTML = '';
            this.fotoNueva = null;
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            this.fotoNueva = e.target.result;
            preview.innerHTML = `
                <div style="text-align: center; margin-top: 10px;">
                    <p style="font-weight: 600; color: #ff9800; margin-bottom: 10px;">📸 Nueva Foto (Vista Previa):</p>
                    <img src="${e.target.result}" alt="Vista previa" 
                         style="max-width: 200px; max-height: 200px; border-radius: 10px; border: 3px solid #ff9800; object-fit: cover;">
                    <p style="font-size: 0.8rem; color: #666; margin-top: 5px;">✅ Nueva foto cargada</p>
                </div>
            `;
        };
        reader.readAsDataURL(file);
    }

    async manejarSubmit(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const datos = Object.fromEntries(formData);

        if (!datos.primerNombre || !datos.primerApellido || !datos.segundoApellido || !datos.rut) {
            Utils.mostrarNotificacion('Primer nombre, apellidos y RUT son obligatorios', 'error');
            return;
        }

        if (!datos.nombrePrimerPadrino || !datos.nombreSegundoPadrino) {
            Utils.mostrarNotificacion('Los dos padrinos son obligatorios', 'error');
            return;
        }

        if (!Utils.validarRUN(datos.rut)) {
            Utils.mostrarNotificacion('RUT inválido', 'error');
            return;
        }

        try {
            const inputFoto = document.getElementById('fotoBombero');
            let fotoFinal = this.bomberoActual.foto;

            if (inputFoto && inputFoto.files && inputFoto.files[0]) {
                fotoFinal = await this.leerFotoComoBase64(inputFoto.files[0]);
            }

            const bomberoActualizado = {
                id: parseInt(datos.idBombero),
                claveBombero: datos.claveBombero,
                primerNombre: datos.primerNombre,
                segundoNombre: datos.segundoNombre || '',
                tercerNombre: datos.tercerNombre || '',
                primerApellido: datos.primerApellido,
                segundoApellido: datos.segundoApellido,
                nombrePrimerPadrino: datos.nombrePrimerPadrino,
                nombreSegundoPadrino: datos.nombreSegundoPadrino,
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
                foto: fotoFinal,
                otrosCuerpos: datos.otrosCuerpos || '',
                companiaOpcional: datos.companiaOpcional || '',
                desde: datos.desde || '',
                hasta: datos.hasta || '',
                fechaRegistro: this.bomberoActual.fechaRegistro
            };

            const bomberos = storage.getBomberos();
            const index = bomberos.findIndex(b => b.id == bomberoActualizado.id);

            if (index !== -1) {
                bomberos[index] = bomberoActualizado;
                storage.saveBomberos(bomberos);
                Utils.mostrarNotificacion('✅ Bombero actualizado exitosamente', 'success');
                setTimeout(() => this.volver(), 1500);
            } else {
                throw new Error('No se encontró el bombero en la base de datos');
            }
        } catch (error) {
            console.error('❌ Error:', error);
            Utils.mostrarNotificacion('Error al actualizar: ' + error.message, 'error');
        }
    }

    leerFotoComoBase64(archivo) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = () => reject(new Error('Error al leer la foto'));
            reader.readAsDataURL(archivo);
        });
    }

    volver() {
        localStorage.removeItem('bomberoEditarActual');
        window.location.href = 'sistema.html';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.editarBomberoSistema = new EditarBomberoSistema();
});