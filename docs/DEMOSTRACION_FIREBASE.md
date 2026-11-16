# Entrega y demostración de Firebase — Por Hacer

Punto de recuperación previo: 398c4a2.

## Alcance comprobado

La aplicación mantiene los 84 lugares verificados, sus fotos, filtros y diseño. No se modificaron las reglas, credenciales ni servicios de Firebase. No se escribieron ni borraron documentos de producción. No se publicó en Vercel.

Las operaciones se probaron con el SDK real de Firebase conectado a Auth y Firestore emulados, proyecto demo-porhacer-tests. La prueba scripts/check-firebase-delivery-browser.js ejecuta las acciones desde Chrome y consulta el servidor con getDocsFromServer/getDocFromServer. Esto comprueba integración y persistencia del emulador; no confirma las reglas desplegadas, credenciales ni permisos del proyecto real. No hay acceso administrativo configurado para inventariar los datos reales de todas las cuentas.

## Qué queda almacenado y qué se muestra

- Inicio usa verifiedCatalog.json, tourismPlaces.json y los manifiestos fotográficos. Sus 84 lugares no se leen de la colección plans.
- users/{uid}/savedPlans/{id} conserva el documento completo del guardado: catálogo, favorito, estado, fecha, comentario, valoración y foto personal.
- Los guardados cat_* y coverage_* identificados como antiguos se ocultan en Mis planes, Calendario y Recuerdos. También se ocultan los lugares identificados como catálogo actual cuyo ID ya no pertenece a la selección vigente.
- Los planes personalizados o sin procedencia confirmada se conservan visibles: un nombre parecido no basta para clasificarlos como antiguos.
- Los itinerarios muestran solo actividades cuyo vínculo pertenece al catálogo actual, con su fotografía y ubicación actuales. Si no quedan actividades válidas, el itinerario completo se oculta. Los personalizados independientes siguen visibles; una actividad personalizada dentro de un itinerario queda almacenada, pero no se presenta como lugar verificado.
- No se escriben estas proyecciones sobre Firestore. Al renombrar un itinerario o quitar actividades visibles, los elementos históricos ocultos permanecen almacenados. No se borran automáticamente itinerarios, fechas, comentarios, fotos ni valoraciones.
- Las fotos personales de los planes válidos se conservan en Recuerdos.
- plans todavía tiene una suscripción de lectura heredada y aloja subcolecciones ratings usadas para puntuaciones. syncCatalog y migrateLegacyPlans no se invocan desde el cliente actual.

No se ha inventariado qué documentos antiguos concretos siguen referenciados en producción. Pueden aparecer como catalogId/externalId de un guardado o dentro de items de un itinerario; también pueden tener subcolecciones ratings. Conservar plans y todas sus valoraciones hasta tener un inventario de solo lectura y una decisión posterior de limpieza. Las reglas locales no permiten eliminar documentos padre de plans desde el cliente.

## Preparar la prueba manual en Cloud Firestore real

1. Usar una cuenta exclusiva para la demostración, preferentemente en un proyecto de pruebas. No usar datos personales previos ni editar documentos desde la consola. La prueba de eliminación debe afectar solo al guardado recién creado por esa cuenta.
2. Ejecutar la aplicación local con npm.cmd run dev y su configuración Firebase existente. Iniciar sesión. En modo de vista previa local los datos van a localStorage y eso NO demuestra Cloud Firestore.
3. En Firebase Console, seleccionar exactamente el proyecto correspondiente a VITE_FIREBASE_PROJECT_ID. Abrir Authentication → Users y copiar el UID de la cuenta de demostración. No mostrar contraseñas ni credenciales en el video.
4. Abrir Firestore Database → Data → users → UID → savedPlans. El documento padre users/UID puede no tener campos: los datos personales están en la subcolección savedPlans. No es necesario crear manualmente ese documento padre.
5. Para una ruta predecible, elegir El Progreso: Inicio → Gastronomía → Zona Sur y buscar El Progreso. Confirmar que aún no está guardado en la cuenta de demostración. ID del lugar: badata-food-905.

## Guion exacto para grabar CRUD

Mantener abiertas la aplicación y la consola. Las rutas siguientes usan UID como el UID real de la cuenta de demostración.

| Paso | Acción en la aplicación | Documento a abrir y evidencia |
| --- | --- | --- |
| Crear | Agregar El Progreso a Mis planes | users/UID/savedPlans/badata-food-905: id y catalogId = badata-food-905; savedOrigin = verified-catalog; status = pendiente; favorite = false; updatedAt con fecha del servidor. |
| Leer | Actualizar la página, abrir Mis planes | La tarjeta sigue presente y coincide con ese documento de Firestore. Esto demuestra lectura persistida, no solo estado temporal de React. |
| Modificar favorito | Presionar el corazón | Mismo documento: favorite = true. Actualizar y comprobar que el corazón sigue activo. |
| Modificar estado | Presionar Realizado | Mismo documento: status = realizado y photoDate. Actualizar; la tarjeta sigue realizada y aparece en Recuerdos. |
| Agendar | Agregar a calendario y elegir fecha y hora | Mismo documento: scheduledAt contiene la fecha en formato ISO UTC. La interfaz la muestra en hora local. Actualizar y comprobar el evento en Calendario. |
| Valorar | Recuerdos → tarjeta El Progreso → Mi puntuación → 4 estrellas | users/UID/savedPlans/badata-food-905: rating = 4. Abrir además plans/badata-food-905/ratings/UID: userId = UID, value = 4 y updatedAt. Actualizar la aplicación y comprobar las 4 estrellas. |
| Eliminar | Mis planes → El Progreso → Eliminar y confirmar | Desaparece users/UID/savedPlans/badata-food-905. Actualizar y comprobar que no reaparece en Mis planes, Calendario ni Recuerdos. |

El documento padre plans/badata-food-905 puede aparecer sin campos o como inexistente: Firestore permite subcolecciones bajo esa ruta y la aplicación no necesita crear un documento de catálogo allí. La valoración está en ratings/UID. No crear el padre manualmente para el video.

Eliminar un guardado actual NO elimina su valoración global: plans/badata-food-905/ratings/UID queda almacenado. Esto es el comportamiento actual y evita borrar valoraciones como efecto secundario. No borrar esa valoración ni documentos cat_* desde la consola.

Para mostrar itinerarios, generar uno nuevo desde Inicio y guardarlo. En users/UID/savedPlans buscar su UUID: type = itinerary, items contiene las actividades, y favorite/status/scheduledAt se actualizan en ese mismo documento. Los planes personalizados también tienen su propio UUID y permanecen separados del catálogo.

## Resultado y diagnóstico manual

Marcar cada paso como aprobado solo si se ve el cambio en Firestore y persiste después de recargar. Si la interfaz parece guardar pero no aparece ningún documento, comprobar primero que no esté en vista previa local, que el proyecto de la consola sea el mismo y que el UID coincida.

Si aparece permission-denied u otro error, registrar la acción y el error y detener ese paso: las reglas desplegadas pueden diferir de firestore.rules. No abrir permisos públicos ni cambiar reglas para grabar el video. La valoración requiere que el plan esté realizado. Los 84 documentos de lugares no tienen por qué existir en plans, porque Inicio usa el catálogo local verificado.

## Verificación automática reproducible

Con Auth/Firestore emulados en demo-porhacer-tests:

1. node scripts/check-saved-firebase.js prepara cuentas y documentos sintéticos y comprueba aislamiento.
2. node scripts/check-saved-firebase-browser.js comprueba guardados y proyección visual después de recargar y cambiar de cuenta.
3. node scripts/check-firebase-delivery-browser.js comprueba el CRUD completo desde Chrome con lecturas del servidor y conservación de los demás documentos.
4. node scripts/check-itinerary-browser.js comprueba creación y edición del mismo itinerario, cancelación, elementos históricos conservados, recarga e aislamiento de cuentas.

Las credenciales sintéticas y resultados están en .browser-check, ignorado por Git. Nunca conectar estos scripts a un proyecto real. Complementar con node --test tests/*.test.js, npm.cmd run lint y npm.cmd run build.

Resultado de esta entrega: 30 pruebas unitarias aprobadas, ESLint y compilacion aprobados. Chrome verifico las 84 fotografias y las cuatro categorias. Las pruebas locales y emuladas comprobaron ocultacion de historicos sin modificar los documentos originales, conservacion de fotos personales, CRUD con persistencia tras recarga, aislamiento entre cuentas y edicion de itinerarios sin eliminar actividades ocultas. La comprobacion del proyecto real queda pendiente del guion manual anterior.
