# Veterinaria La Mary 2 — Cuarta entrega

Introducción al Desarrollo Web — UNER, segundo cuatrimestre 2026.

## Integrantes

- Raby, Clara Cecilia Verónica
- Acastello, Vanesa
- Lezcano, Jesica
- Soria, Pablo


##video de exposición- Cuarta entrega
Enlace al video de exposición técnica: https://drive.google.com/file/d/1OraGCVjCd9ketrT_b9suCSa8eP5xlmEz/view?usp=sharing


Abrir la dirección que muestre Vite y mantener la terminal abierta.
Se conserva Vite y el archivo de dependencias de la tercera entrega.
Usar Node.js 22.12 o posterior compatible. Se requiere Internet para instalar
las dependencias y para iniciar sesión con DummyJSON.
También puede utilizarse un servidor estático como Live Server.


Cuenta pública de práctica: usuario `emilys`, contraseña `emilyspass`.

## Funciones

- Portada, información institucional y contacto; se conserva el diseño y el modo oscuro.
- Catálogo público conectado con los veterinarios registrados: nombre, especialización y valor de consulta; búsqueda por nombre o especialización.
- Mascotas y veterinarios: alta, listado, modificación y baja. Foto opcional de la mascota en Base64.
- Turnos: alta, tabla, eliminación con confirmación, filtros por veterinario y fecha.
- Historia clínica: alta de atenciones, tabla y filtro para consultar el historial completo de una mascota, con las más recientes primero.
- Inicio de sesión mediante POST con fetch a `https://dummyjson.com/auth/login`.
- Token en SessionStorage, cierre de sesión, vencimiento a los 30 minutos y redirección al login al intentar acceder a páginas protegidas.
- Menú administrativo oculto para visitantes.
- LocalStorage conserva las cuatro entidades entre recargas.

## Modelo de datos

| Clave LocalStorage | Campos |
| --- | --- |
| `mascotas` | `idMascota`, `nombreMascota`, `nombreDuenio`, `color`, `edad`, `peso`, `imagenMascota` |
| `veterinarios` | `idVeterinario`, `matricula`, `nombre`, `especializacion`, `valorConsulta` |
| `turnos` | `idTurno`, `fechaHora`, `mascota`, `veterinario`, `valorConsulta` |
| `historiaClinica` | `idHistoriaClinica`, `mascota`, `veterinario`, `fechaHora`, `observaciones` |

Los campos `mascota` y `veterinario` contienen identificadores, no objetos ni nombres.
Los identificadores son strings aleatorios; fechaHora es una cadena local `AAAA-MM-DDTHH:mm`.
Edad y matrícula son enteros; peso e importes son valores Number.
`valorConsulta` en el turno es un campo adicional: copia la tarifa del profesional al reservar, para conservar el importe acordado aunque se modifique su tarifa posteriormente.

## Decisiones de funcionamiento

- Se requiere una mascota y un veterinario registrados antes de cargar un turno o atención.
- Los turnos deben ser futuros. Se rechaza otro turno de la misma mascota o del mismo veterinario en la misma fecha y hora. No se presupone una duración de consulta, pues la consigna no la define.
- Las atenciones son hechos ya realizados: se permiten fechas pasadas o actuales y se rechazan fechas futuras. Las observaciones no pueden contener solo espacios.
- No se elimina una mascota o un profesional con turnos o historia clínica asociados. Primero pueden eliminarse sus turnos; las historias se conservan y por ello impiden eliminar la entidad vinculada.
- Los filtros no borran ni modifican registros.
- Los textos se insertan con textContent para evitar interpretar HTML introducido en formularios.
- Ante datos ilegibles o almacenamiento lleno, se informa el error y se evita sobrescribir los datos que no se pudieron leer.
- Las páginas administrativas se recargan si otra pestaña modifica las entidades, para evitar operar sobre una copia anterior.
- No hay datos precargados. Registrar profesionales desde Administración para que aparezcan en Inicio.

## Archivos principales

- `sesion.js`, `login.js`: sesión, navegación y acceso.
- `gestion.js`: almacenamiento y funciones compartidas.
- `mascotas.js`, `foto-mascota.js`, `veterinarios.js`: gestión conservada de la etapa anterior.
- `atenciones.js`: operaciones de Turnos e Historia Clínica; el atributo data-entidad de cada página determina el comportamiento.
- `profesionales.js`: catálogo público.


## Validación

Se comprobó la sintaxis de todos los archivos JavaScript. Pasaron pruebas DOM automatizadas de altas de turnos y atenciones, persistencia al volver a cargar los datos, tarifa, conflictos de horario, fechas inválidas, filtros, eliminación de turnos, orden del historial, texto literal, referencias, rechazo de datos corruptos, catálogo y visibilidad del menú. Estas pruebas usan un DOM simulado, no un navegador visual.

Pendiente de comprobar en un navegador real: diseño responsive, interacción completa con Bootstrap y login real contra DummyJSON. No se pudo instalar el navegador de pruebas en el entorno. La guía incluye el recorrido manual completo.
