// Sesión de práctica, siguiendo el ejemplo de clase con SessionStorage.
// Es un control de navegación del frontend, no una autorización de servidor.
function obtenerSesion() {
    try {
        const token = sessionStorage.getItem('accessToken');
        const vence = Number(sessionStorage.getItem('sesionVence'));
        if (!token || !Number.isFinite(vence) || vence <= Date.now()) return null;
        return { token, vence, usuario: sessionStorage.getItem('usuario') || 'Usuario' };
    } catch (error) { return null; }
}

function cerrarSesion() {
    try {
        ['accessToken', 'usuario', 'sesionVence'].forEach(clave => sessionStorage.removeItem(clave));
    } catch (error) { /* La redirección funciona aunque el almacenamiento esté bloqueado. */ }
    window.location.replace('login.html');
}

function comprobarAcceso() {
    const protegida = document.documentElement.hasAttribute('data-requiere-sesion');
    if (!protegida) return;
    const sesion = obtenerSesion();
    if (!sesion) {
        document.documentElement.classList.remove('sesion-valida');
        const pagina = window.location.pathname.split('/').pop();
        window.location.replace('login.html?destino=' + encodeURIComponent(pagina));
    } else {
        document.documentElement.classList.add('sesion-valida');
    }
}
comprobarAcceso();
window.addEventListener('pageshow', comprobarAcceso);

document.addEventListener('DOMContentLoaded', () => {
    const sesion = obtenerSesion();
    document.querySelectorAll('[data-admin]').forEach(item => item.classList.toggle('d-none', !sesion));
    const enlace = document.getElementById('enlace-login');
    const cerrar = document.getElementById('cerrar-sesion');
    if (enlace) enlace.classList.toggle('d-none', Boolean(sesion));
    if (cerrar) {
        cerrar.classList.toggle('d-none', !sesion);
        cerrar.addEventListener('click', cerrarSesion);
    }
    if (sesion && document.documentElement.hasAttribute('data-requiere-sesion')) {
        // La sesión del ejemplo dura 30 minutos.
        window.setTimeout(cerrarSesion, Math.max(0, sesion.vence - Date.now()));
    }
});
