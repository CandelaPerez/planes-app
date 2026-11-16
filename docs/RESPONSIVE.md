# Por Hacer: escritorio y móvil

Punto de recuperación previo a estos cambios: 0617920.

## Implementación

Una sola web y los mismos componentes. _mobile.css se carga después de las hojas existentes. Las reglas para teléfonos se limitan a max-width:760px; entre 761 y 1024 px se reorganizan la cabecera y el calendario para tablet. A partir de 1025 px se conserva la disposición de escritorio.

El menú existente se transforma en una barra inferior con las cuatro secciones, iconos y etiquetas. No hay navegación ni datos duplicados. El menú indica la sección activa mediante aria-current, respeta el área segura inferior y deja espacio al final del contenido. En celular, cambiar de sección desde el menú vuelve al inicio de esa sección.

Las tarjetas usan una columna, las imágenes conservan el archivo original y se ajustan al contenedor. Los filtros, favoritos, estrellas y acciones principales tienen superficies táctiles de al menos 44 px. Los campos usan 16 px en móvil para evitar el zoom automático habitual al enfocarlos en iPhone. Los modales usan la altura dinámica del viewport, desplazamiento interno y botones accesibles con altura reducida; el contenido del fondo no se desplaza mientras están abiertos.

Se conservó Shadows Into Light en escritorio. Los encabezados y la marca usan Zeyada solo en móvil, con la fuente servida localmente y su licencia SIL OFL incluida en public/fonts/Zeyada-OFL.txt. Colores y componentes existentes reutilizados.

No se modificaron servicios ni reglas de Firebase, estructura de documentos, catálogo de 84 lugares, fotografías de catálogo ni APIs. Las escrituras siguen usando el UID de Firebase Authentication y las mismas rutas users/{UID}/savedPlans. Si se usa la vista previa local, sus datos siguen siendo solo de ese navegador, tal como antes: para compartir datos entre dispositivos hay que iniciar sesión con la misma cuenta en la versión conectada a Firebase.

## Cómo probar desde la computadora

1. Abrir una terminal en el proyecto y ejecutar npm.cmd run dev.
2. Abrir la dirección que indique Vite, habitualmente http://localhost:5173.
3. En Chrome, presionar F12 y después Ctrl+Shift+M para activar el modo de dispositivos. En Edge funciona el mismo atajo.
4. Elegir Responsive y probar anchos 375, 390 y 430 px, con altura 844 px y zoom del navegador al 100%. También se puede seleccionar un perfil de iPhone.
5. Probar 768 y 1024 px para tablet. Desactivar la barra de dispositivos para volver a escritorio y comprobar 1366 o 1440 px.
6. Recorrer Inicio, Mis planes, Calendario y Recuerdos usando el menú inferior. Cambiar categoría y zona, buscar, abrir detalles y probar los formularios.
7. Con una cuenta de prueba conectada a Firebase, guardar un lugar, marcar favorito y realizado, asignarle una fecha y, desde Recuerdos, valorar, escribir un comentario y seleccionar una fotografía. Crear y editar un itinerario. Recargar y volver a entrar con la misma cuenta para comprobar persistencia. Eliminar únicamente registros propios creados para esta prueba.
8. Reducir la altura a 480 px mientras un formulario está abierto: desplazarse dentro del modal hasta Guardar y Cancelar. Comprobar que no se necesita desplazamiento horizontal.

El modo de dispositivos de Chrome aproxima el tamaño y la interacción táctil; no sustituye una prueba física de Safari/iOS y su teclado. La prueba automática incluyó una altura reducida, pero no un teclado nativo de iPhone.

## Verificación realizada

- 30 pruebas unitarias aprobadas, ESLint y compilación aprobados. El build conserva el aviso previo sobre el tamaño del paquete Firebase.
- Chrome recorrió seis anchos: 375, 390, 430, 768, 1024 y 1366 px. Sin desbordamiento horizontal en las cuatro secciones y formularios.
- Se verificaron detalles, edición de plan, agenda, edición de itinerario, creación y eliminación de un plan de prueba, favoritos, valoración, comentario y selección/carga de una fotografía real en la vista previa local. Se comprobó también un formulario con viewport de 390 x 480.
- Comparación del DOM y los estilos calculados contra el código del punto de recuperación: escritorio idéntico en geometría, colores y familias/tamaños tipográficos a 1366 y 1440 px, con las animaciones desactivadas únicamente durante la prueba para comparar estados estables.
- Auth y Firestore emulados: formularios de acceso/registro sin desbordamiento; tres planes y cinco itinerarios confirmados por el servidor bajo el mismo UID en móvil y escritorio. Persistencia al recargar y volver a entrar, edición sin duplicados y eliminación/restauración únicamente de documentos sintéticos.
- No se verificó la cuenta real del usuario ni la subida a Storage de producción; sus servicios y reglas permanecen sin cambios. No se escribieron datos de producción ni se publicó en Vercel.

## Repetir las pruebas

- node scripts/check-responsive-browser.js
- node scripts/check-responsive-desktop.js --historical, luego node scripts/check-responsive-desktop.js --compare
- Con Auth/Firestore emulados en demo-porhacer-tests: node scripts/check-eight-records-sync-browser.js --responsive
- node --test tests/*.test.js
- npm.cmd run lint
- npm.cmd run build

Las capturas y resultados están en .browser-check, ignorado por Git: responsive-results.json, responsive-desktop-baseline.json, eight-records-sync-result.json y capturas responsive-{ancho}-{sección}.png. Las capturas con autenticación emulada se llaman responsive-firebase-390-home.png, responsive-firebase-390-itineraries.png y responsive-firebase-390-register.png.

Ajuste posterior: botones y separaciones mas compactos solo en movil. Cerrar sesion y Crear plan se alinean en una sola fila sin superponerse con la marca en 375, 390 y 430 px. Se elimino el desplegable Todos los lugares en Inicio para ambos dispositivos; el tipo queda fijado internamente en Todos, respetando categoria, zona, busqueda y orden. No se modificaron datos ni servicios. La regresion de navegador y las 30 pruebas, ESLint y build pasaron.

## Ajuste de densidad y cuenta movil

Las cinco categorias se mantienen en una sola fila sin desplazamiento horizontal, con fuente y separacion proporcionales al ancho (375, 390 y 430 px comprobados). El selector de compania del itinerario conserva sus cuatro opciones y usa un ancho maximo de 172 px y alto de 34 px. Se compactaron encabezados, subtitulos, tarjetas, etiquetas y modales solo en movil, manteniendo los campos de texto a 16 px.

La cabecera movil tiene 20 px de margen interior horizontal, mas espacio entre la marca y las acciones, Crear plan con su texto original e icono de cuenta. El cierre de sesion esta dentro de su desplegable: alterna al tocar el icono y se cierra al tocar afuera, pulsar Escape, cambiar a escritorio o cerrar sesion. Desktop conserva el boton Cerrar sesion original. No se modifico Firebase Authentication: ambos controles llaman a logoutAccount.

Chrome verifico los tres anchos moviles, ausencia de texto cortado y solapamientos, y las cuatro secciones. Con Auth/Firestore emulados se verifico el menu y el cierre de sesion real mediante su opcion, reingreso y persistencia de los ocho documentos sinteticos. Comparacion de escritorio con las medidas, colores y fuentes anteriores: aprobada en 1366 y 1440 px. Las 30 pruebas unitarias, ESLint y build aprobaron. Sin cambios en produccion ni publicacion. Capturas adicionales: responsive-375-categories.png y responsive-firebase-390-profile-menu.png dentro de .browser-check.

Ajuste final de equilibrio movil: cabecera con padding vertical de 1.1rem y horizontal de 1.5rem, separacion de 1.25rem entre marca y acciones y 0.8rem entre acciones. Los desplegables de compania, zona y orden comparten el mismo ancho de hasta 172 px, alto de 34 px, tipografia, padding, borde y alineacion. Las categorias aumentan a 40 px de alto y tipografia proporcional, manteniendo las cinco opciones en una fila sin cortes. Verificado en 375, 390 y 430 px; comparacion de escritorio aprobada en 1366 y 1440 px. ESLint y build aprobados; sin cambios en servicios, datos ni catalogo.

Cabecera fija en movil: position sticky, top 0 y z-index 1000 dentro del media query movil, conservando altura, padding, controles y fondo. Sombra de separacion sutil y scroll-padding-top para que la navegacion a titulos no los deje debajo de la barra. Chrome verifico la posicion al desplazar Inicio, Mis planes, Calendario y Recuerdos; los modales permanecen por encima de la cabecera. Comparacion de escritorio aprobada a 1366 y 1440 px.
