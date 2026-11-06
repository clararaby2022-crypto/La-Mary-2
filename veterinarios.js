// Gestión de veterinarios: alta, listado, edición y baja, siguiendo el ejemplo de clase.
const CLAVE = 'veterinarios';
const formulario = document.getElementById('form-veterinario');
const listado = document.getElementById('listado-veterinarios');
const total = document.getElementById('total');
const busqueda = document.getElementById('busqueda');
const tituloFormulario = document.getElementById('titulo-formulario');
const botonGuardar = document.getElementById('guardar');
const botonCancelar = document.getElementById('cancelar-edicion');
const elementoModal = document.getElementById('modal-eliminar');
const modalEliminar = new bootstrap.Modal(elementoModal);
const numero = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 2 });
const moneda = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' });
let idEditar = null;
let idEliminar = null;

function registroValido(r) {
    return r !== null && typeof r === 'object' && esTexto(r.idVeterinario) &&
        Number.isSafeInteger(r.matricula) && r.matricula > 0 && esTexto(r.nombre) && esTexto(r.especializacion) && typeof r.valorConsulta === 'number' && Number.isFinite(r.valorConsulta) && r.valorConsulta >= 0;
}

let veterinarios = cargarRegistros(CLAVE, registroValido);

function render() {
    listado.replaceChildren();
    if (veterinarios === null) {
        total.textContent = '—';
        document.getElementById('resultados').textContent = 'No se pudieron cargar los registros.';
        return;
    }
    const texto = normalizarTexto(busqueda.value.trim());
    const filtrados = veterinarios.filter(registro =>
        ["matricula", "nombre", "especializacion", "valorConsulta"].some(campo => normalizarTexto(registro[campo]).includes(texto))
    );
    total.textContent = veterinarios.length;
    document.getElementById('resultados').textContent = `Mostrando ${filtrados.length} de ${veterinarios.length} registros`;
    if (filtrados.length === 0) {
        const fila = document.createElement('tr');
        agregarCelda(fila, veterinarios.length === 0 ? 'Todavía no hay registros. Completá el formulario para agregar el primero.' : 'No se encontraron coincidencias.');
        fila.firstChild.colSpan = 5;
        listado.appendChild(fila);
    }
    filtrados.forEach(registro => {
        const fila = document.createElement('tr');
        agregarCelda(fila, registro.matricula);
        agregarCelda(fila, registro.nombre);
        agregarCelda(fila, registro.especializacion);
        agregarCelda(fila, moneda.format(registro.valorConsulta));
        agregarAcciones(fila, registro.idVeterinario, registro.nombre);
        listado.appendChild(fila);
    });
}

function cancelarEdicion() {
    idEditar = null;
    formulario.reset();
    formulario.querySelectorAll('input').forEach(campo => campo.setCustomValidity(''));
    tituloFormulario.textContent = 'Registrar veterinario';
    botonGuardar.textContent = 'Registrar veterinario';
    botonCancelar.classList.add('d-none');
}

function editarVeterinario(id) {
    const registro = veterinarios.find(registro => registro.idVeterinario === id);
    if (!registro) return;
    idEditar = id;
    ["matricula", "nombre", "especializacion", "valorConsulta"].forEach(campo => {
        formulario.elements[campo].value = registro[campo];
        formulario.elements[campo].setCustomValidity('');
    });
    tituloFormulario.textContent = 'Editar veterinario';
    botonGuardar.textContent = 'Guardar cambios';
    botonCancelar.classList.remove('d-none');
    tituloFormulario.focus();
}

formulario.addEventListener('input', evento => evento.target.setCustomValidity(''));
formulario.addEventListener('submit', evento => {
    evento.preventDefault();
    if (veterinarios === null || !validarFormulario(formulario)) return;
    const datos = new FormData(formulario);
    const registro = {
        idVeterinario: idEditar || generarId(),
        matricula: Number(datos.get('matricula')),
        nombre: datos.get('nombre').trim(),
        especializacion: datos.get('especializacion').trim(),
        valorConsulta: Number(datos.get('valorConsulta'))
    };
    if (!registroValido(registro)) {
        mostrarAviso('Revisá los datos: los textos son obligatorios, los enteros deben ser válidos y los valores numéricos deben respetar los mínimos indicados.', 'warning');
        return;
    }
    if (veterinarios.some(v => v.matricula === registro.matricula && v.idVeterinario !== idEditar)) {
        mostrarAviso('Ya existe un veterinario con esa matrícula.', 'warning');
        document.getElementById('matricula').focus();
        return;
    }
    // Una edición conserva el ID; un alta agrega un objeto nuevo.
    const actualizados = idEditar
        ? veterinarios.map(actual => actual.idVeterinario === idEditar ? registro : actual)
        : [...veterinarios, registro];
    if (!guardarRegistros(CLAVE, actualizados)) return;
    const eraEdicion = idEditar !== null;
    veterinarios = actualizados;
    cancelarEdicion();
    busqueda.value = '';
    render();
    mostrarAviso(eraEdicion ? 'Cambios guardados.' : 'Registro agregado correctamente.');
});

// Delegación de eventos: un listener atiende los botones de todas las filas.
listado.addEventListener('click', evento => {
    const boton = evento.target.closest('button[data-accion]');
    if (!boton || veterinarios === null) return;
    if (boton.dataset.accion === 'editar') {
        editarVeterinario(boton.dataset.id);
    } else {
        const registro = veterinarios.find(r => r.idVeterinario === boton.dataset.id);
        if (!registro) return;
        idEliminar = registro.idVeterinario;
        document.getElementById('detalle-eliminar').textContent = `¿Querés eliminar el registro de ${registro.nombre}?`;
        modalEliminar.show(boton);
    }
});

document.getElementById('confirmar-eliminar').addEventListener('click', () => {
    if (!idEliminar || veterinarios === null) return;
    if (tieneReferencias('veterinario', idEliminar)) { modalEliminar.hide(); mostrarAviso('No se puede eliminar: tiene turnos o historia clínica asociados, o no fue posible verificar las relaciones.', 'warning'); return; }
    const actualizados = veterinarios.filter(registro => registro.idVeterinario !== idEliminar);
    if (!guardarRegistros(CLAVE, actualizados)) { modalEliminar.hide(); return; }
    if (idEditar === idEliminar) cancelarEdicion();
    veterinarios = actualizados;
    render();
    modalEliminar.hide();
    mostrarAviso('Registro eliminado.');
});
elementoModal.addEventListener('hidden.bs.modal', () => { idEliminar = null; busqueda.focus(); });
botonCancelar.addEventListener('click', cancelarEdicion);
busqueda.addEventListener('input', render);
render();
