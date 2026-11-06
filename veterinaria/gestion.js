// Utilidades compartidas por las dos páginas de administración.
// Los registros son objetos; LocalStorage solo acepta texto, por eso usamos JSON.
function mostrarAviso(mensaje, tipo = 'success') {
    const aviso = document.getElementById('aviso');
    aviso.className = `alert alert-${tipo}`;
    aviso.textContent = mensaje;
}

function cargarRegistros(clave, validarRegistro) {
    try {
        const texto = localStorage.getItem(clave);
        if (texto === null) return [];
        const registros = JSON.parse(texto);
        if (!Array.isArray(registros) || !registros.every(validarRegistro)) {
            throw new Error('Formato de datos no válido');
        }
        const identificadores = registros.map(r => r.idMascota || r.idVeterinario || r.idTurno || r.idHistoriaClinica);
        if (new Set(identificadores).size !== registros.length) throw new Error('Identificadores repetidos');
        return registros;
    } catch (error) {
        mostrarAviso('No se pudieron leer los registros guardados. No se modificaron los datos. Revisá el almacenamiento del navegador y recargá la página.', 'danger');
        // No sobrescribir datos que no se pudieron leer.
        document.querySelectorAll('form input, form select, form textarea, form button').forEach(campo => campo.disabled = true);
        return null;
    }
}

function guardarRegistros(clave, registros) {
    if (!obtenerSesion()) { comprobarAcceso(); return false; }
    try {
        localStorage.setItem(clave, JSON.stringify(registros));
        return true;
    } catch (error) {
        mostrarAviso('No se pudo guardar. El navegador puede tener el almacenamiento bloqueado o lleno. Los cambios no se aplicaron; conservamos el formulario para que puedas reintentar.', 'danger');
        return false;
    }
}

function generarId() {
    if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
    // Alternativa para navegadores que no exponen randomUUID.
    return Array.from(crypto.getRandomValues(new Uint8Array(16)), n => n.toString(16).padStart(2, '0')).join('');
}

function esTexto(valor) {
    return typeof valor === 'string' && valor.trim().length > 0;
}

function validarFormulario(formulario) {
    // required no rechaza una cadena compuesta solo por espacios.
    formulario.querySelectorAll('input[type="text"]').forEach(campo => {
        campo.value = campo.value.trim();
        campo.setCustomValidity(campo.value ? '' : 'Completá este campo con texto.');
    });
    return formulario.reportValidity();
}

function agregarCelda(fila, valor) {
    const celda = document.createElement('td');
    // textContent muestra los datos como texto, sin interpretar etiquetas HTML.
    celda.textContent = valor;
    fila.appendChild(celda);
}

function agregarAcciones(fila, id, nombre) {
    const celda = document.createElement('td');
    const grupo = document.createElement('div');
    grupo.className = 'd-flex gap-2';
    ['editar', 'eliminar'].forEach(accion => {
        const boton = document.createElement('button');
        boton.type = 'button';
        boton.className = 'btn btn-sm ' + (accion === 'editar' ? 'btn-outline-primary' : 'btn-outline-danger');
        boton.textContent = accion === 'editar' ? 'Editar' : 'Eliminar';
        boton.dataset.accion = accion;
        boton.dataset.id = id;
        boton.setAttribute('aria-label', `${boton.textContent} ${nombre}`);
        grupo.appendChild(boton);
    });
    celda.appendChild(grupo);
    fila.appendChild(celda);
}

function normalizarTexto(texto) {
    return String(texto).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

// Conservamos las relaciones: no borrar una entidad con turnos o atenciones.
function tieneReferencias(campo, id) {
    try {
        return ['turnos', 'historiaClinica'].some(clave => {
            const registros = JSON.parse(localStorage.getItem(clave) || '[]');
            if (!Array.isArray(registros) || registros.some(r => !r || typeof r[campo] !== 'string')) throw new Error();
            return registros.some(r => r[campo] === id);
        });
    } catch (error) { return true; }
}
// Evita que una segunda pestaña siga trabajando con una copia desactualizada.
window.addEventListener('storage', evento => {
    if (evento.key === null || ['mascotas', 'veterinarios', 'turnos', 'historiaClinica'].includes(evento.key)) window.location.reload();
});
