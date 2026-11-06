// Turnos e Historia Clínica conservan las claves exactas de la consigna.
(() => {
    if (!obtenerSesion()) return;
    const clave = document.body.dataset.entidad;
    const historial = clave === 'historiaClinica';
    const campoId = historial ? 'idHistoriaClinica' : 'idTurno';
    const form = document.getElementById('form-registro');
    const tabla = document.getElementById('listado');
    const moneda = new Intl.NumberFormat('es-AR', {style: 'currency', currency: 'ARS'});
    const fechaValida = valor => typeof valor === 'string' && /^\d{4}-\d\d-\d\dT\d\d:\d\d$/.test(valor) && Number.isFinite(new Date(valor).getTime());
    const mascotas = cargarRegistros('mascotas', r => r && esTexto(r.idMascota) && esTexto(r.nombreMascota) && esTexto(r.nombreDuenio));
    const veterinarios = cargarRegistros('veterinarios', r => r && esTexto(r.idVeterinario) && esTexto(r.nombre) && esTexto(r.especializacion) && Number.isFinite(r.valorConsulta) && r.valorConsulta >= 0);
    let registros = cargarRegistros(clave, r => r && esTexto(r[campoId]) && esTexto(r.mascota) && esTexto(r.veterinario) && fechaValida(r.fechaHora) && (!historial || esTexto(r.observaciones)));
    if (!mascotas || !veterinarios || !registros) return;
    function opciones(id, lista, campo, etiqueta, inicial) {
        const select = document.getElementById(id);
        select.replaceChildren(new Option(inicial, ''));
        lista.forEach(r => select.add(new Option(etiqueta(r), r[campo])));
    }
    opciones('mascota', mascotas, 'idMascota', r => `${r.nombreMascota} — ${r.nombreDuenio}`, 'Seleccioná una mascota');
    opciones('veterinario', veterinarios, 'idVeterinario', r => `${r.nombre} — ${r.especializacion} — ${moneda.format(r.valorConsulta)}`, 'Seleccioná un veterinario');
    opciones(historial ? 'filtro-mascota' : 'filtro-veterinario', historial ? mascotas : veterinarios, historial ? 'idMascota' : 'idVeterinario', r => historial ? `${r.nombreMascota} — ${r.nombreDuenio}` : r.nombre, historial ? 'Todas las mascotas' : 'Todos los veterinarios');
    if (!mascotas.length || !veterinarios.length) {
        mostrarAviso('Primero registrá al menos una mascota y un veterinario desde el menú de administración.', 'info');
        form.querySelector('button').disabled = true;
    }
    const filtro = document.getElementById(historial ? 'filtro-mascota' : 'filtro-veterinario');
    const filtroFecha = document.getElementById('filtro-fecha');
    function render() {
        tabla.replaceChildren();
        const visibles = registros.filter(r => (!filtro.value || r[historial ? 'mascota' : 'veterinario'] === filtro.value) && (!filtroFecha?.value || r.fechaHora.slice(0,10) === filtroFecha.value)).sort((a,b) => historial ? b.fechaHora.localeCompare(a.fechaHora) : a.fechaHora.localeCompare(b.fechaHora));
        document.getElementById('resultados').textContent = `Mostrando ${visibles.length} de ${registros.length} registros.`;
        visibles.forEach(r => {
            const m = mascotas.find(m => m.idMascota === r.mascota);
            const v = veterinarios.find(v => v.idVeterinario === r.veterinario);
            const fila = document.createElement('tr');
            [new Date(r.fechaHora).toLocaleString('es-AR'), m?.nombreMascota || 'Mascota no disponible', m?.nombreDuenio || '—', v?.nombre || 'Veterinario no disponible', historial ? r.observaciones : moneda.format(r.valorConsulta ?? v?.valorConsulta ?? 0)].forEach(valor => agregarCelda(fila, valor));
            if (historial) { fila.lastChild.style.whiteSpace = 'pre-wrap'; fila.lastChild.style.minWidth = '180px'; }
            else {
                const celda = document.createElement('td');
                const boton = document.createElement('button');
                boton.type = 'button'; boton.className = 'btn btn-outline-danger btn-sm'; boton.textContent = 'Eliminar'; boton.dataset.id = r.idTurno;
                celda.append(boton); fila.append(celda);
            }
            tabla.append(fila);
        });
        if (!visibles.length) {
            const fila = document.createElement('tr'); agregarCelda(fila, 'No hay registros para mostrar.'); fila.firstChild.colSpan = historial ? 5 : 6; tabla.append(fila);
        }
    }
    filtro.addEventListener('change', render);
    filtroFecha?.addEventListener('change', render);
    if (!historial) document.getElementById('veterinario').addEventListener('change', evento => {
        const v = veterinarios.find(v => v.idVeterinario === evento.target.value);
        document.getElementById('costo').textContent = v ? `Costo de consulta: ${moneda.format(v.valorConsulta)}` : 'Seleccioná un veterinario para consultar el costo.';
    });
    form.addEventListener('submit', evento => {
        evento.preventDefault();
        if (!obtenerSesion()) { comprobarAcceso(); return; }
        if (!form.reportValidity()) return;
        const datos = new FormData(form);
        const r = {[campoId]: generarId(), mascota: datos.get('mascota'), veterinario: datos.get('veterinario'), fechaHora: datos.get('fechaHora')};
        const v = veterinarios.find(v => v.idVeterinario === r.veterinario);
        if (!v || !mascotas.some(m => m.idMascota === r.mascota) || !fechaValida(r.fechaHora)) { mostrarAviso('Revisá la mascota, el veterinario y la fecha.', 'warning'); return; }
        const momento = new Date(r.fechaHora).getTime();
        if (historial) {
            r.observaciones = datos.get('observaciones').trim();
            if (!r.observaciones) { mostrarAviso('Completá las observaciones de la atención.', 'warning'); return; }
            if (momento > Date.now()) { mostrarAviso('La atención no puede tener una fecha futura.', 'warning'); return; }
        } else {
            if (momento <= Date.now()) { mostrarAviso('Seleccioná una fecha y hora futuras.', 'warning'); return; }
            if (registros.some(t => t.fechaHora === r.fechaHora && (t.veterinario === r.veterinario || t.mascota === r.mascota))) { mostrarAviso('La mascota o el veterinario ya tiene un turno en ese horario.', 'warning'); return; }
            // Extra: conservar el importe acordado aunque cambie la tarifa luego.
            r.valorConsulta = v.valorConsulta;
        }
        const actualizados = [...registros, r];
        if (!guardarRegistros(clave, actualizados)) return;
        registros = actualizados; form.reset(); filtro.value = historial ? r.mascota : ''; if (filtroFecha) filtroFecha.value = '';
        if (!historial) document.getElementById('costo').textContent = 'Seleccioná un veterinario para consultar el costo.';
        render(); mostrarAviso(historial ? 'Atención incorporada al historial.' : 'Turno registrado.');
    });
    if (!historial) {
        let idEliminar = null;
        const modal = new bootstrap.Modal(document.getElementById('modal-eliminar'));
        tabla.addEventListener('click', evento => {
            const boton = evento.target.closest('button[data-id]'); if (!boton) return;
            idEliminar = boton.dataset.id;
            document.getElementById('detalle-eliminar').textContent = '¿Querés eliminar este turno? La historia clínica se conserva.';
            modal.show(boton);
        });
        document.getElementById('confirmar-eliminar').addEventListener('click', () => {
            if (!idEliminar) return;
            const actualizados = registros.filter(r => r.idTurno !== idEliminar);
            if (!guardarRegistros(clave, actualizados)) { modal.hide(); return; }
            registros = actualizados; render(); modal.hide(); mostrarAviso('Turno eliminado.');
        });
        document.getElementById('modal-eliminar').addEventListener('hidden.bs.modal', () => { idEliminar = null; });
    }
    render();
})();
