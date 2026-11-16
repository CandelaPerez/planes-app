# Mis planes: catálogo actual y conservación de datos

Punto de recuperación anterior al cambio: `cc509cb`.

## Origen de los registros

Con Firebase configurado, se leen los documentos de `users/{uid}/savedPlans` mediante la suscripción existente. Sin Firebase se utiliza `porhacer_preview_plans`, con lectura de respaldo de `porhacer_user_plans`. No se precargan planes al abrir Mis planes.

Se identificaron **129 identificadores del catálogo anterior**: 45 `cat_*` y 84 `coverage_*`, conservados explícitamente en `src/data/legacyCatalogIds.json`. Esta cifra describe el catálogo de respaldo, no la cantidad guardada por una persona. También se reconoce la marca explícita `isCatalog` de los registros precargados. No se identifica un registro por su título.

## Filtrado reversible

`src/utils/savedPlans.js` construye una vista que oculta los registros antiguos únicamente en Mis planes. No elimina ni migra automáticamente documentos de Firestore. La interfaz indica la cantidad real de antiguos ocultos para la cuenta que inició sesión.

Los registros `badata-*` y `tourism-wikidata-*`, los planes personalizados y los itinerarios se conservan. Los registros ambiguos sin evidencia de pertenecer al catálogo anterior se conservan por seguridad. Se protege además el caso de planes personalizados con UUID a los que versiones anteriores asignaban un identificador antiguo por coincidencia de título.

El almacenamiento local conserva los registros completos, incluidos los ocultos. Antes de la primera escritura se crea `porhacer_saved_plans_backup_v1`, con los valores originales de ambas claves. Si falla el respaldo, esa escritura no se realiza. No se elimina la clave antigua.

Calendario y Recuerdos siguen utilizando los registros originales: no se pierden fechas, fotos personales, comentarios ni valoraciones. Los itinerarios y sus elementos permanecen intactos.

## Sincronización y duplicados

Los nuevos guardados usan el identificador estable del catálogo como identificador del documento y conservan una copia de sus datos públicos. Una transacción crea el documento solamente si todavía no existe; volver a agregarlo, incluso concurrentemente, no reinicia su estado personal.

La vista actualiza fotografía, descripción, categoría y ubicación desde el catálogo vigente sin escribir esos cambios automáticamente en Firebase. Conserva el identificador del documento y los títulos editados por el usuario. Un lugar moderno que deja de publicarse conserva su copia guardada. Las fotografías propias de los personalizados y las fotografías personales de Recuerdos no se reemplazan.

Para fotografías modernas no se utiliza la antigua caché de imágenes genéricas. Si no hay una fotografía actual ni una copia con evidencia de verificación, se indica que la fotografía no está disponible.

Las copias históricas del mismo lugar se agrupan visualmente por identificador estable. Se prefiere el documento con ese identificador y, en su ausencia, el primero por identificador ordenado. No se fusionan ni borran los documentos duplicados ni sus datos personales.

Al cambiar de cuenta se limpia el estado anterior y se descartan las respuestas tardías de sus suscripciones.

## Validación

- `node --test tests/*.test.js`: 18 pruebas aprobadas.
- `npm run lint`: aprobado.
- `npm run build`: aprobado; permanece el aviso informativo de tamaño del paquete Firebase.
- `scripts/check-verified-browser.js --ba-data-home`: catálogo de 81 fotografías, filtros y funcionalidades existentes.
- `scripts/check-saved-local-browser.js`: seis registros de prueba conservados, dos antiguos ocultos, un duplicado agrupado, dos tarjetas actuales/personalizadas y un itinerario conservado; respaldo, calendario y recuerdos comprobados.
- `scripts/check-saved-firebase.js`: SDK y reglas reales contra emuladores Auth/Firestore, guardado concurrente, valoraciones, persistencia tras cerrar y abrir sesión y aislamiento entre cuentas.
- `scripts/check-saved-firebase-browser.js`: mismos casos desde la interfaz, incluida edición, fotografías actuales, imágenes personales y recarga con sesión persistente.

Las pruebas Firebase utilizan exclusivamente el proyecto emulado `demo-porhacer-tests`, Auth en `127.0.0.1:9099` y Firestore en `127.0.0.1:8080`, con cuentas sintéticas. La prueba SDK prepara los datos que utiliza la prueba de navegador. Los archivos temporales y resultados se guardan en `.browser-check`, fuera del control de versiones. Los emuladores requieren Firebase CLI y Java 21; las pruebas de navegador requieren Chrome local.

En la prueba emulada se conservaron cinco documentos: dos antiguos ocultos, un lugar actual, un personalizado y un itinerario. **No son cifras de una cuenta real**. No se accedió a cuentas de producción ni se modificaron sus datos; su cantidad exacta se calcula al iniciar sesión en la aplicación. No se publicó en Vercel.
