"""
Utilidades para el sistema de bomberos
Migrado desde utils.js a Python
"""
import re
from datetime import date, datetime
from decimal import Decimal
import unicodedata


class ValidacionesUtils:
    """Clase con métodos de validación migrados desde JS"""

    @staticmethod
    def validar_run(run):
        """
        Valida un RUT chileno
        Migrado desde validarRUN() en utils.js
        """
        if not run:
            return False

        # Limpiar el RUT
        run = run.replace('.', '').replace('-', '').strip().upper()

        if len(run) < 8 or len(run) > 9:
            return False

        # Separar cuerpo y dígito verificador
        cuerpo = run[:-1]
        dv = run[-1]

        # Validar que el cuerpo sea numérico
        if not cuerpo.isdigit():
            return False

        # Calcular dígito verificador
        suma = 0
        multiplo = 2

        for digito in reversed(cuerpo):
            suma += int(digito) * multiplo
            multiplo = 2 if multiplo == 7 else multiplo + 1

        resto = suma % 11
        dv_calculado = 11 - resto

        if dv_calculado == 11:
            dv_calculado = '0'
        elif dv_calculado == 10:
            dv_calculado = 'K'
        else:
            dv_calculado = str(dv_calculado)

        return dv == dv_calculado

    @staticmethod
    def formatear_run(run):
        """
        Formatea un RUT al formato XX.XXX.XXX-X
        Migrado desde formatearRUN() en utils.js
        """
        if not run:
            return ''

        # Limpiar el RUT
        run = re.sub(r'[^\dkK]', '', run)

        if len(run) < 2:
            return run

        # Separar cuerpo y dígito verificador
        cuerpo = run[:-1]
        dv = run[-1]

        # Formatear con puntos
        cuerpo_formateado = ''
        for i, digito in enumerate(reversed(cuerpo)):
            if i > 0 and i % 3 == 0:
                cuerpo_formateado = '.' + cuerpo_formateado
            cuerpo_formateado = digito + cuerpo_formateado

        return f"{cuerpo_formateado}-{dv}"

    @staticmethod
    def validar_telefono(telefono):
        """
        Valida un número de teléfono chileno
        Migrado desde validarTelefono() en utils.js
        """
        if not telefono:
            return False

        # Limpiar espacios
        telefono = telefono.replace(' ', '')

        # Patrón para teléfonos chilenos
        patron = r'^(\+56|56)?[2-9]\d{7,8}$'
        return bool(re.match(patron, telefono))

    @staticmethod
    def validar_email(email):
        """
        Valida un email
        Migrado desde validarEmail() en utils.js
        """
        if not email:
            return True  # Email opcional

        patron = r'^[^\s@]+@[^\s@]+\.[^\s@]+$'
        return bool(re.match(patron, email))


class FechasUtils:
    """Clase con métodos de manejo de fechas"""

    @staticmethod
    def calcular_edad(fecha_nacimiento):
        """
        Calcula la edad en años
        Migrado desde calcularEdad() en utils.js
        """
        if not fecha_nacimiento:
            return 0

        if isinstance(fecha_nacimiento, str):
            fecha_nacimiento = datetime.strptime(fecha_nacimiento, '%Y-%m-%d').date()

        hoy = date.today()
        edad = hoy.year - fecha_nacimiento.year

        # Ajustar si aún no ha cumplido años este año
        if hoy.month < fecha_nacimiento.month or \
           (hoy.month == fecha_nacimiento.month and hoy.day < fecha_nacimiento.day):
            edad -= 1

        return edad

    @staticmethod
    def calcular_antiguedad_detallada(fecha_ingreso):
        """
        Calcula la antigüedad en años, meses y días
        Migrado desde calcularAntiguedadDetallada() en utils.js
        """
        if not fecha_ingreso:
            return {'anos': 0, 'meses': 0, 'dias': 0}

        if isinstance(fecha_ingreso, str):
            fecha_ingreso = datetime.strptime(fecha_ingreso, '%Y-%m-%d').date()

        from dateutil.relativedelta import relativedelta
        hoy = date.today()
        delta = relativedelta(hoy, fecha_ingreso)

        return {
            'anos': delta.years,
            'meses': delta.months,
            'dias': delta.days
        }

    @staticmethod
    def calcular_categoria_bombero(fecha_ingreso):
        """
        Calcula la categoría del bombero según antigüedad
        Migrado desde calcularCategoriaBombero() en utils.js
        """
        if not fecha_ingreso:
            return 'Voluntario'

        antiguedad = FechasUtils.calcular_antiguedad_detallada(fecha_ingreso)
        anos = antiguedad['anos']

        if anos < 20:
            return 'Voluntario'
        elif 20 <= anos < 25:
            return 'Voluntario Honorario de Compañía'
        elif 25 <= anos < 50:
            return 'Voluntario Honorario del Cuerpo'
        else:
            return 'Voluntario Insigne de Chile'

    @staticmethod
    def formatear_fecha(fecha):
        """Formatea una fecha al formato DD/MM/YYYY"""
        if not fecha:
            return ''

        if isinstance(fecha, str):
            fecha = datetime.strptime(fecha, '%Y-%m-%d').date()

        return fecha.strftime('%d/%m/%Y')


class EstadosUtils:
    """
    Clase con métodos de validación de estados de voluntarios
    Migrado desde utils.js
    """

    @staticmethod
    def puede_pagar_cuotas(bombero):
        """
        Verifica si el voluntario puede pagar cuotas
        Migrado desde puedePagarCuotas() en utils.js
        """
        # Solo bomberos activos pueden pagar cuotas
        if bombero.estado_bombero != 'activo':
            return False

        # Los honorarios e insignes están exentos
        if bombero.antiguedad_anos >= 20:
            return False

        return True

    @staticmethod
    def puede_recibir_uniformes(bombero):
        """Solo bomberos activos pueden recibir uniformes"""
        return bombero.estado_bombero == 'activo'

    @staticmethod
    def puede_ser_sancionado(bombero):
        """Solo bomberos activos pueden ser sancionados"""
        return bombero.estado_bombero == 'activo'

    @staticmethod
    def puede_registrar_asistencia(bombero):
        """Solo bomberos activos pueden registrar asistencias"""
        return bombero.estado_bombero == 'activo'

    @staticmethod
    def puede_recibir_cargos_felicitaciones(bombero):
        """Solo bomberos activos pueden recibir cargos o felicitaciones"""
        return bombero.estado_bombero == 'activo'

    @staticmethod
    def participa_en_ranking(bombero):
        """Solo bomberos activos participan en el ranking"""
        return bombero.estado_bombero == 'activo'

    @staticmethod
    def puede_reintegrarse(bombero):
        """Solo bomberos renunciados o separados pueden reintegrarse"""
        return bombero.estado_bombero in ['renunciado', 'separado']

    @staticmethod
    def obtener_badge_estado(estado):
        """
        Retorna el estilo del badge para el estado
        Migrado desde obtenerBadgeEstado() en utils.js
        """
        badges = {
            'activo': {'text': 'Activo', 'class': 'success'},
            'renunciado': {'text': 'Renunciado', 'class': 'warning'},
            'separado': {'text': 'Separado', 'class': 'danger'},
            'expulsado': {'text': 'Expulsado', 'class': 'dark'},
            'mártir': {'text': 'Mártir', 'class': 'primary'},
            'fallecido': {'text': 'Fallecido', 'class': 'secondary'},
        }
        return badges.get(estado, {'text': estado, 'class': 'light'})


class FormateoUtils:
    """Clase con métodos de formateo"""

    @staticmethod
    def formatear_monto(monto):
        """
        Formatea un monto en pesos chilenos
        Migrado desde formatearMonto() en utils.js
        """
        if monto is None:
            return '$0'

        if isinstance(monto, str):
            monto = Decimal(monto)

        # Formatear con separador de miles
        return f"${monto:,.0f}".replace(',', '.')

    @staticmethod
    def formatear_numero(numero):
        """Formatea un número con separador de miles"""
        if numero is None:
            return '0'

        return f"{numero:,.0f}".replace(',', '.')

    @staticmethod
    def limpiar_texto(texto):
        """Limpia y normaliza un texto"""
        if not texto:
            return ''

        # Normalizar unicode
        texto = unicodedata.normalize('NFKD', texto)
        texto = texto.encode('ASCII', 'ignore').decode('ASCII')

        # Limpiar espacios
        texto = ' '.join(texto.split())

        return texto.strip()


class BusquedaUtils:
    """Clase con métodos de búsqueda y filtrado"""

    @staticmethod
    def filtrar_bomberos(bomberos, termino):
        """
        Filtra bomberos por término de búsqueda
        Migrado desde filtrarBomberos() en utils.js
        """
        if not termino:
            return bomberos

        termino = termino.lower().strip()
        resultado = []

        for bombero in bomberos:
            # Buscar en nombre completo
            if termino in bombero.nombre_completo.lower():
                resultado.append(bombero)
                continue

            # Buscar en RUT
            if bombero.rut and termino in bombero.rut.replace('.', '').replace('-', '').lower():
                resultado.append(bombero)
                continue

            # Buscar en compañía
            if bombero.compania and termino in bombero.compania.lower():
                resultado.append(bombero)
                continue

        return resultado

    @staticmethod
    def ordenar_bomberos_por_antiguedad(bomberos, descendente=True):
        """
        Ordena bomberos por antigüedad
        Migrado desde ordenarBomberosPorAntiguedad() en utils.js
        """
        return sorted(
            bomberos,
            key=lambda b: b.fecha_ingreso,
            reverse=not descendente  # Fecha más antigua primero si descendente=True
        )


# Exportar todas las clases de utilidades
__all__ = [
    'ValidacionesUtils',
    'FechasUtils',
    'EstadosUtils',
    'FormateoUtils',
    'BusquedaUtils',
]
