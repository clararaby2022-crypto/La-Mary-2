// /users lista cuentas ficticias; /auth/login valida sus credenciales.
const AUTH_URL = 'https://dummyjson.com/auth/login';
const formularioSesion = document.getElementById('form-sesion');
const mensajeError = document.getElementById('mensajeError');
const botonSesion = document.getElementById('botonIniciarSesion');
const destinoPedido = new URLSearchParams(window.location.search).get('destino');
const destino = ['mascotas.html', 'veterinarios.html', 'turnos.html', 'historia-clinica.html'].includes(destinoPedido) ? destinoPedido : 'mascotas.html';
if (obtenerSesion()) window.location.replace(destino);

formularioSesion.addEventListener('submit', async evento => {
    evento.preventDefault();
    if (!formularioSesion.reportValidity()) return;
    mensajeError.textContent = '';
    mensajeError.classList.add('d-none');
    botonSesion.disabled = true;
    botonSesion.textContent = 'Iniciando sesión…';
    const controlador = new AbortController();
    const limite = setTimeout(() => controlador.abort(), 15000);
    try {
        const datos = new FormData(formularioSesion);
        const respuesta = await fetch(AUTH_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: datos.get('nombreUsuario').trim(),
                password: datos.get('contrasenia'),
                expiresInMins: 30
            }),
            signal: controlador.signal
        });
        if (!respuesta.ok) {
            throw new Error(respuesta.status === 400 || respuesta.status === 401
                ? 'Usuario o contraseña incorrectos.'
                : 'DummyJSON no está disponible en este momento. Probá nuevamente.');
        }
        const usuario = await respuesta.json();
        if (typeof usuario.accessToken !== 'string' || !usuario.accessToken) throw new Error('La respuesta de DummyJSON no contiene una sesión válida.');
        try {
            sessionStorage.setItem('accessToken', usuario.accessToken);
            sessionStorage.setItem('usuario', usuario.firstName || usuario.username);
            sessionStorage.setItem('sesionVence', String(Date.now() + 30 * 60 * 1000));
        } catch (error) {
            throw new Error('El navegador no permite guardar la sesión. Habilitá el almacenamiento del sitio y volvé a intentar.');
        }
        formularioSesion.reset();
        window.location.replace(destino);
    } catch (error) {
        mensajeError.textContent = error.name === 'AbortError'
            ? 'El servicio tardó demasiado. Revisá la conexión e intentá nuevamente.'
            : error instanceof TypeError
                ? 'No se pudo conectar con DummyJSON. Revisá tu conexión a Internet.'
                : error.message;
        mensajeError.classList.remove('d-none');
    } finally {
        clearTimeout(limite);
        botonSesion.disabled = false;
        botonSesion.textContent = 'Iniciar sesión';
    }
});
