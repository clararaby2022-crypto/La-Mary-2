// El catálogo público refleja los profesionales registrados por administración.
(() => {
    const contenedor = document.getElementById('catalogo-profesionales');
    const estado = document.getElementById('estado-profesionales');
    const buscar = document.getElementById('buscar-profesional');
    const normalizar = s => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    function render() {
        contenedor.replaceChildren();
        try {
            const datos = JSON.parse(localStorage.getItem('veterinarios') || '[]');
            if (!Array.isArray(datos) || !datos.every(v => v && typeof v.nombre === 'string' && typeof v.especializacion === 'string' && Number.isFinite(v.valorConsulta))) throw new Error();
            const visibles = datos.filter(v => normalizar(v.nombre + ' ' + v.especializacion).includes(normalizar(buscar.value.trim())));
            estado.textContent = datos.length ? `${visibles.length} profesionales encontrados.` : 'Todavía no hay profesionales registrados.';
            visibles.forEach(v => {
                const columna = document.createElement('div'); columna.className = 'col-12 col-md-6 col-xl-3';
                const card = document.createElement('article'); card.className = 'card profesional h-100 shadow-sm';
                const cuerpo = document.createElement('div'); cuerpo.className = 'card-body';
                const nombre = document.createElement('h3'); nombre.className = 'h5'; nombre.textContent = v.nombre;
                const especializacion = document.createElement('p'); especializacion.textContent = v.especializacion;
                const valor = document.createElement('p'); valor.className = 'fw-bold'; valor.textContent = 'Consulta: ' + new Intl.NumberFormat('es-AR', {style:'currency',currency:'ARS'}).format(v.valorConsulta);
                cuerpo.append(nombre,especializacion,valor); card.append(cuerpo); columna.append(card); contenedor.append(columna);
            });
        } catch (error) { estado.textContent = 'No se pudo cargar el listado de profesionales.'; }
    }
    buscar.addEventListener('input', render); window.addEventListener('storage', render); render();
})();
