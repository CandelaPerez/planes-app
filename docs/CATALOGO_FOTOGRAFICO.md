# Catálogo fotográfico verificado

**Actualización:** el catálogo actual tiene 81 planes y filtros de tres zonas y cuatro tipos. Ver [estado vigente, fuentes y pruebas](VARIEDAD_Y_ZONAS.md). El contenido que sigue documenta la etapa anterior.


**Estado anterior: 53 planes, con mínimo de 12 en las cuatro categorías.** Ver [ampliación y verificación](AMPLIACION_CATALOGO.md). El resultado de 21 planes que sigue es el informe histórico previo a la ampliación.

Punto de recuperación anterior a estos cambios: `38b9b37`.

## Resultado del 16 de noviembre de 2026

- Base íntegra: 6.670 registros en `public/data/ba-data.json`; no se eliminó ninguno.
- 122 registros con búsqueda registrada: 12 del piloto y 110 de los lotes (100 del primer lote y 10 del segundo). Esto no significa que los 6.670 hayan sido buscados individualmente.
- 26 registros con revisión visual documentada: los 12 del piloto y 14 candidatos del primer lote.
- 21 fotografías aprobadas: 8 conservadas del piloto y 13 adicionales.
- 21 planes visibles: Gastronomía 8, Cultura 9, Aire Libre 4, Viajes 0. La categoría Viajes aparecerá cuando tenga resultados verificados de las paradas exactas.
- 6.649 registros excluidos de Descubrir por no tener fotografía aprobada, incluidos los todavía no procesados.
- Usina del Arte queda pendiente: imagen inspeccionada, descripción insuficiente para publicar. No se tomó una URL funcional como prueba de identidad.

Los nombres originales, IDs, direcciones y referencias BA Data se conservan. Los títulos nuevos usan el nombre real con una invitación según categoría. Las descripciones no agregan precios, horarios ni servicios inventados.

## Publicación y visitas

`toPlanCards` acepta solamente entradas del piloto aprobado o del manifiesto revisado, con nombre, dirección, categoría y coordenadas coincidentes. Requiere evidencia, autor, licencia, procedencia y archivo local. No acepta las URLs presentes en el registro como verificación.

Las fotografías y los datos se sirven desde el mismo sitio. No se consulta Commons durante las visitas. El contador y las categorías usan exclusivamente el catálogo aprobado. Una fotografía que falla se retira de Descubrir con aviso. Un error de carga del catálogo se muestra explícitamente, sin recurrir a ilustraciones ni a los 129 originales. Estos siguen conservados en sus archivos.

`npm run build` ejecuta primero una auditoría que valida metadatos, correspondencia con BA Data, licencia admitida, bytes y SHA-256 de todos los archivos aprobados. La auditoría de integridad no sustituye la revisión visual de identidad.

## Continuar por lotes

```sh
node scripts/update-ba-data-photos.js --limit=10
```

Reanuda el segundo lote; quedan 90 búsquedas en su cola. Cada ejecución procesa como máximo diez registros. Tras completar esa cola:

```sh
node scripts/update-ba-data-photos.js --next-batch --limit=10
```

Agrega hasta cien registros nuevos sin perder búsquedas anteriores ni repetir IDs del piloto. Guarda cada respuesta y reutiliza consultas idénticas. Espera al menos seis segundos entre solicitudes, usa `maxlag`, timeout, bloqueo de ejecución simultánea y cooldown para errores HTTP con `Retry-After`. Un fallo detiene la ejecución; no hay bucle automático de reintentos. Configurar `WIKIMEDIA_USER_AGENT` con identificación y contacto del operador para uso sostenido.

Los candidatos quedan pendientes y nunca se publican automáticamente. Para revisar, elegir archivos en `data/photo-batches/reviews.json` y ejecutar:

```sh
node scripts/review-ba-data-photos.js
```

Descarga candidatos a `.browser-check/photo-batch/`. Inspeccionar cada imagen, descripción, nombre, dirección y GPS cuando exista. Descartar homónimos y registrar la justificación. Agregar `evidence` y `approvedSha256` solamente después de aprobar la imagen exacta. Después:

```sh
node scripts/review-ba-data-photos.js --publish
npm run photos:audit
npm run build
```

Aquí `--publish` significa incorporar archivos al catálogo local del proyecto; no despliega en Vercel. El manifiesto conserva autor, licencia, URL original, ficha Commons, descripción, GPS disponible, evidencia y huella del archivo. Las tarjetas muestran autor y enlaces a fuente y licencia.

## Verificación y límites

- Build y lint correctos; siete pruebas automatizadas pasan.
- Chrome: las 21 imágenes locales se decodifican; búsqueda, categorías, Ver más y guardado local pasan. Tres columnas en escritorio, sin desborde a 390 px, sin excepciones JavaScript.
- Chrome: al bloquear la carga del catálogo aparece un error sin tarjetas de respaldo; el plan guardado previamente sigue en almacenamiento local.
- Se verificó que catálogo original, implementación Firebase y reglas Firestore conservan sus huellas anteriores. Authentication, Firestore y Storage no se modificaron. No se hicieron pruebas remotas autenticadas ni escrituras en Firebase; no se afirma una validación integral del servicio remoto.
- La revisión de una foto de archivo identifica el lugar, pero no confirma que el establecimiento siga abierto ni su aspecto actual.
- Capturas locales: `.browser-check/verified-desktop.png` y `.browser-check/verified-mobile.png`.

No se publicó en Vercel.
