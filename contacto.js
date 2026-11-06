// Validación nativa del navegador; no hay servidor de correo en este TP.
document.getElementById("formConsulta").addEventListener("submit", function (evento) {
    evento.preventDefault();
    const resultado = document.getElementById("resultadoConsulta");
    resultado.classList.remove("d-none");
    resultado.focus();
});
