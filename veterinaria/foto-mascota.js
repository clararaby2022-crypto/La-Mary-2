// Foto opcional: se convierte a una imagen pequeña en formato Data URL.
// El texto resultante puede guardarse dentro del objeto de la mascota en JSON.
const campoFoto = document.getElementById('imagenMascota');
const vistaFoto = document.getElementById('vista-foto');
const quitarFoto = document.getElementById('quitar-foto');
const estadoFoto = document.getElementById('estado-foto');
let imagenActual = '';
let procesandoFoto = false;
let versionFoto = 0;

function actualizarVistaFoto() {
    vistaFoto.classList.toggle('d-none', !imagenActual);
    quitarFoto.classList.toggle('d-none', !imagenActual);
    if (imagenActual) vistaFoto.src = imagenActual;
    else vistaFoto.removeAttribute('src');
}

function cargarFoto(datos = '') {
    // Invalidar una lectura pendiente si se cambia de registro o se cancela.
    versionFoto += 1;
    procesandoFoto = false;
    document.getElementById('guardar').disabled = false;
    campoFoto.value = '';
    imagenActual = datos;
    estadoFoto.textContent = datos ? 'Foto guardada. Podés conservarla, cambiarla o quitarla.' : 'Foto opcional. JPG, PNG o WebP; hasta 5 MB.';
    actualizarVistaFoto();
}

function leerArchivoComoURL(archivo) {
    return new Promise((resolve, reject) => {
        const lector = new FileReader();
        lector.onload = () => resolve(lector.result);
        lector.onerror = () => reject(new Error('No se pudo leer el archivo.'));
        lector.readAsDataURL(archivo);
    });
}

async function reducirFoto(archivo) {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(archivo.type)) {
        throw new Error('Elegí una imagen JPG, PNG o WebP.');
    }
    if (archivo.size > 5 * 1024 * 1024) throw new Error('La foto supera los 5 MB. Elegí una más pequeña.');
    const origen = await leerArchivoComoURL(archivo);
    const imagen = new Image();
    await new Promise((resolve, reject) => {
        imagen.onload = resolve;
        imagen.onerror = () => reject(new Error('El archivo no contiene una imagen válida.'));
        imagen.src = origen;
    });
    if (!imagen.naturalWidth || !imagen.naturalHeight) throw new Error('La imagen no tiene dimensiones válidas.');
    const escala = Math.min(1, 480 / Math.max(imagen.naturalWidth, imagen.naturalHeight));
    const lienzo = document.createElement('canvas');
    lienzo.width = Math.max(1, Math.round(imagen.naturalWidth * escala));
    lienzo.height = Math.max(1, Math.round(imagen.naturalHeight * escala));
    const contexto = lienzo.getContext('2d');
    contexto.fillStyle = '#ffffff';
    contexto.fillRect(0, 0, lienzo.width, lienzo.height);
    contexto.drawImage(imagen, 0, 0, lienzo.width, lienzo.height);
    const resultado = lienzo.toDataURL('image/jpeg', 0.75);
    if (resultado.length > 350000) throw new Error('No se pudo reducir suficientemente la foto. Probá con otra imagen.');
    return resultado;
}

campoFoto.addEventListener('change', async () => {
    const archivo = campoFoto.files[0];
    if (!archivo) return;
    const version = ++versionFoto;
    procesandoFoto = true;
    document.getElementById('guardar').disabled = true;
    estadoFoto.textContent = 'Preparando foto…';
    try {
        const resultado = await reducirFoto(archivo);
        if (version !== versionFoto) return;
        imagenActual = resultado;
        actualizarVistaFoto();
        estadoFoto.textContent = 'Foto lista. Se guardará al registrar o guardar los cambios.';
    } catch (error) {
        if (version !== versionFoto) return;
        campoFoto.value = '';
        estadoFoto.textContent = error.message + (imagenActual ? ' Se conserva la foto anterior.' : ' Podés continuar sin foto.');
    } finally {
        if (version === versionFoto) {
            procesandoFoto = false;
            document.getElementById('guardar').disabled = false;
        }
    }
});
quitarFoto.addEventListener('click', () => cargarFoto());
