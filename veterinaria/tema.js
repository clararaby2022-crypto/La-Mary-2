// Bootstrap 5.3 adapta sus componentes usando data-bs-theme.
// Este archivo se carga en el head para aplicar el tema antes de mostrar la página.
(function () {
    const clave = "la-mary-tema";
    const raiz = document.documentElement;
    let tema = "light";
    try {
        const guardado = localStorage.getItem(clave);
        if (guardado === "dark" || guardado === "light") tema = guardado;
    } catch (error) {
        // El botón sigue funcionando aunque el navegador bloquee el almacenamiento.
    }
    raiz.setAttribute("data-bs-theme", tema);

    document.addEventListener("DOMContentLoaded", function () {
        const boton = document.getElementById("botonTema");
        if (!boton) return;

        function actualizarBoton() {
            const oscuro = raiz.getAttribute("data-bs-theme") === "dark";
            boton.textContent = oscuro ? "Modo claro" : "Modo oscuro";
            boton.setAttribute("aria-pressed", String(oscuro));
            boton.setAttribute("aria-label", oscuro ? "Activar modo claro" : "Activar modo oscuro");
        }

        actualizarBoton();
        boton.addEventListener("click", function () {
            tema = raiz.getAttribute("data-bs-theme") === "dark" ? "light" : "dark";
            raiz.setAttribute("data-bs-theme", tema);
            try {
                localStorage.setItem(clave, tema);
            } catch (error) {
                // Sin almacenamiento disponible, la elección se aplica a esta página.
            }
            actualizarBoton();
        });
    });
})();
