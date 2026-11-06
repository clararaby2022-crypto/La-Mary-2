// Gestión de mascotas: alta, listado, edición y baja, siguiendo el ejemplo de clase.
const CLAVE = 'mascotas';
const formulario = document.getElementById('form-mascota');
const listado = document.getElementById('listado-mascotas');
const total = document.getElementById('total');
const busqueda = document.getElementById('busqueda');
const tituloFormulario = document.getElementById('titulo-formulario');
const botonGuardar = document.getElementById('guardar');
const botonCancelar = document.getElementById('cancelar-edicion');
const elementoModal = document.getElementById('modal-eliminar');
const modalEliminar = new bootstrap.Modal(elementoModal);
const numero = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 2 });
let idEditar = null;
let idEliminar = null;

function registroValido(r) {
    return r !== null && typeof r === 'object' && esTexto(r.idMascota) &&
        (r.imagenMascota === undefined || r.imagenMascota === '' || (typeof r.imagenMascota === 'string' && /^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(r.imagenMascota) && r.imagenMascota.length <= 350000)) && esTexto(r.nombreMascota) && esTexto(r.nombreDuenio) && esTexto(r.color) && Number.isSafeInteger(r.edad) && r.edad >= 0 && typeof r.peso === 'number' && Number.isFinite(r.peso) && r.peso > 0;
}

let mascotas = cargarRegistros(CLAVE, registroValido);

function render() {
    listado.replaceChildren();
    if (mascotas === null) {
        total.textContent = '—';
        document.getElementById('resultados').textContent = 'No se pudieron cargar los registros.';
        return;
    }
    const texto = normalizarTexto(busqueda.value.trim());
    const filtrados = mascotas.filter(registro =>
        ["nombreMascota", "nombreDuenio", "color", "edad", "peso"].some(campo => normalizarTexto(registro[campo]).includes(texto))
    );
    total.textContent = mascotas.length;
    document.getElementById('resultados').textContent = `Mostrando ${filtrados.length} de ${mascotas.length} registros`;
    if (filtrados.length === 0) {
        const fila = document.createElement('tr');
        agregarCelda(fila, mascotas.length === 0 ? 'Todavía no hay registros. Completá el formulario para agregar el primero.' : 'No se encontraron coincidencias.');
        fila.firstChild.colSpan = 7;
        listado.appendChild(fila);
    }
    filtrados.forEach(registro => {
        const fila = document.createElement('tr');
        const celdaFoto = document.createElement('td');
        if (registro.imagenMascota) {
            const foto = document.createElement('img');
            foto.src = registro.imagenMascota;
            foto.alt = `Foto de ${registro.nombreMascota}`;
            foto.className = 'foto-tabla';
            celdaFoto.appendChild(foto);
        } else {
            celdaFoto.textContent = 'Sin foto';
        }
        fila.appendChild(celdaFoto);
        agregarCelda(fila, registro.nombreMascota);
        agregarCelda(fila, registro.nombreDuenio);
        agregarCelda(fila, registro.color);
        agregarCelda(fila, registro.edad);
        agregarCelda(fila, numero.format(registro.peso));
        agregarAcciones(fila, registro.idMascota, registro.nombreMascota);
        listado.appendChild(fila);
    });
}

function cancelarEdicion() {
    idEditar = null;
    formulario.reset();
    cargarFoto();
    formulario.querySelectorAll('input').forEach(campo => campo.setCustomValidity(''));
    tituloFormulario.textContent = 'Registrar mascota';
    botonGuardar.textContent = 'Registrar mascota';
    botonCancelar.classList.add('d-none');
}

function editarMascota(id) {
    const registro = mascotas.find(registro => registro.idMascota === id);
    if (!registro) return;
    idEditar = id;
    cargarFoto(registro.imagenMascota || "");
    ["nombreMascota", "nombreDuenio", "color", "edad", "peso"].forEach(campo => {
        formulario.elements[campo].value = registro[campo];
        formulario.elements[campo].setCustomValidity('');
    });
    tituloFormulario.textContent = 'Editar mascota';
    botonGuardar.textContent = 'Guardar cambios';
    botonCancelar.classList.remove('d-none');
    tituloFormulario.focus();
}

formulario.addEventListener('input', evento => evento.target.setCustomValidity(''));
formulario.addEventListener('submit', evento => {
    evento.preventDefault();
    if (mascotas === null || procesandoFoto || !validarFormulario(formulario)) return;
    const datos = new FormData(formulario);
    const registro = {
        idMascota: idEditar || generarId(),
        nombreMascota: datos.get('nombreMascota').trim(),
        nombreDuenio: datos.get('nombreDuenio').trim(),
        color: datos.get('color').trim(),
        edad: Number(datos.get('edad')),
        peso: Number(datos.get('peso')),
        imagenMascota: imagenActual
    };
    if (!registroValido(registro)) {
        mostrarAviso('Revisá los datos: los textos son obligatorios, los enteros deben ser válidos y los valores numéricos deben respetar los mínimos indicados.', 'warning');
        return;
    }
    // Una edición conserva el ID; un alta agrega un objeto nuevo.
    const actualizados = idEditar
        ? mascotas.map(actual => actual.idMascota === idEditar ? registro : actual)
        : [...mascotas, registro];
    if (!guardarRegistros(CLAVE, actualizados)) return;
    const eraEdicion = idEditar !== null;
    mascotas = actualizados;
    cancelarEdicion();
    busqueda.value = '';
    render();
    mostrarAviso(eraEdicion ? 'Cambios guardados.' : 'Registro agregado correctamente.');
});

// Delegación de eventos: un listener atiende los botones de todas las filas.
listado.addEventListener('click', evento => {
    const boton = evento.target.closest('button[data-accion]');
    if (!boton || mascotas === null) return;
    if (boton.dataset.accion === 'editar') {
        editarMascota(boton.dataset.id);
    } else {
        const registro = mascotas.find(r => r.idMascota === boton.dataset.id);
        if (!registro) return;
        idEliminar = registro.idMascota;
        document.getElementById('detalle-eliminar').textContent = `¿Querés eliminar el registro de ${registro.nombreMascota}?`;
        modalEliminar.show(boton);
    }
});

document.getElementById('confirmar-eliminar').addEventListener('click', () => {
    if (!idEliminar || mascotas === null) return;
    if (tieneReferencias('mascota', idEliminar)) { modalEliminar.hide(); mostrarAviso('No se puede eliminar: tiene turnos o historia clínica asociados, o no fue posible verificar las relaciones.', 'warning'); return; }
    const actualizados = mascotas.filter(registro => registro.idMascota !== idEliminar);
    if (!guardarRegistros(CLAVE, actualizados)) { modalEliminar.hide(); return; }
    if (idEditar === idEliminar) cancelarEdicion();
    mascotas = actualizados;
    render();
    modalEliminar.hide();
    mostrarAviso('Registro eliminado.');
});
elementoModal.addEventListener('hidden.bs.modal', () => { idEliminar = null; busqueda.focus(); });
botonCancelar.addEventListener('click', cancelarEdicion);
busqueda.addEventListener('input', render);
render();
