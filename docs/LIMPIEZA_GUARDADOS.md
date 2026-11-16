# Limpieza de guardados: simulación antes de eliminar

Punto de recuperación: `53f5722`. **No se ejecutaron borrados.**

## Alcance y estado

La aplicación tiene 81 planes visibles. Los 129 IDs del catálogo de respaldo no pertenecen al catálogo visible actual. Son IDs conocidos, no 129 documentos encontrados en cuentas reales. El antiguo `cat_3` tenía el título «Recorrido por el Museo del Cine» y el nombre normalizado «Museo del Cine Pablo Ducrós Hicken».

`scripts/audit-saved-cleanup.js` es exclusivamente de lectura. No incluye un modo de eliminación ni se ejecuta al iniciar sesión. No modifica las reglas de seguridad, Auth, Storage, la interfaz o las funcionalidades personales.

## Auditoría administrativa de todas las cuentas

Se requiere acceso IAM de lectura mediante Application Default Credentials o una cuenta de servicio configurada localmente en `GOOGLE_APPLICATION_CREDENTIALS`. No utilizar credenciales de usuarios finales, no poner claves en el repositorio ni compartirlas por chat. La configuración web de Firebase no concede acceso administrativo.

```powershell
node scripts/audit-saved-cleanup.js --project ID_REAL_DEL_PROYECTO --out .browser-check/cleanup-production-01.json
```

El proyecto es explícito. Verificar que corresponde a Por Hacer y que `FIRESTORE_EMULATOR_HOST` no está definido para una auditoría de producción. Para los emuladores se exige un proyecto `demo-*`.

La auditoría pagina los grupos `savedPlans` y `ratings`, sin depender de que exista el documento padre `users/{uid}`. Rechaza rutas de guardados distintas de `users/{uid}/savedPlans/{id}`. Inspecciona referencias entre guardados e itinerarios y registra las subcolecciones de los guardados. Las colecciones desconocidas o referencias externas deben revisarse en el inventario administrativo antes de autorizar la migración; esta herramienta no declara haber inspeccionado datos fuera de esos grupos.

El informe incluye ruta, cuenta, ID de documento, ID de catálogo, título, fecha de actualización, decisión y señales personales/referencias, sin copiar los textos de recuerdos ni imágenes privadas. Los informes contienen identificadores de cuentas: se guardan exclusivamente en `.browser-check/`, ignorado por Git. Una ejecución no sobrescribe un informe anterior. La consola muestra los totales y el SHA-256 del informe.

## Almacenamiento local

Cada origen y perfil de navegador tiene su propio almacenamiento; no puede inspeccionarse el de otros dispositivos desde este equipo. En la consola del navegador de la aplicación, esta expresión permite obtener una exportación de solo lectura:

```js
JSON.stringify(Object.fromEntries(
  ['porhacer_preview_plans', 'porhacer_user_plans'].map(key => [key, localStorage.getItem(key)])
), null, 2)
```

Guardar su resultado en un archivo privado dentro de `.browser-check/` y ejecutar:

```powershell
node scripts/audit-saved-cleanup.js --local-export .browser-check/local-export.json --out .browser-check/cleanup-local-01.json
```

Ambas claves se auditan por separado; un mismo plan en las dos aparece como dos registros de almacenamiento. La exportación y la simulación no modifican claves ni borran respaldos. Los backups históricos no deben restaurarse automáticamente.

## Decisiones del informe

- `keep`: catálogo actual, personalizado, itinerario o procedencia no demostrada. No se decide borrar por título.
- `candidate`: ID del catálogo antiguo reconocido, ausente del catálogo actual, sin señales de datos personales o referencias que requieran revisión. Un favorito o pendiente antiguo puede ser candidato y figura en el listado antes de aprobar.
- `review`: recuerdo, realizado, comentario, valoración, fecha, título personal, fotografía distinta de la original, campo desconocido, subcolección o referencia desde otro guardado/itinerario. También un registro moderno retirado o marcado como catálogo sin ID antiguo confirmado necesita revisión.

Los planes personalizados explícitos se preservan incluso si tienen un nombre o ID igual a un antiguo. Se mantiene la protección de personalizados ambiguos con UUID a los que versiones previas asociaron un `catalogId` por título.

## Procedimiento de eliminación, pendiente de aprobación

1. Obtener y revisar el informe real de Firestore y los informes locales disponibles. Revisar también cualquier colección externa al esquema conocido. Mostrar los candidatos exactos por ruta e ID y los casos bloqueados. La simulación no es una instantánea transaccional de todas las cuentas; repetirla antes de aprobar si hubo cambios.
2. Resolver los casos `review` individualmente. No eliminar un documento que aún sostiene recuerdos, fotografías, valoraciones o fechas sin diseñar y comprobar primero su conservación en una estructura accesible a la aplicación. Un respaldo por sí solo no conserva su funcionamiento en Recuerdos o Calendario.
3. Obtener un respaldo administrativo restaurable y privado de los documentos exactos aprobados y sus tipos de Firestore. Registrar catálogo, proyecto, base de datos, informe y hash aprobados. No respaldar claves administrativas en Git.
4. **Solicitar confirmación del usuario sobre ese listado concreto antes de implementar o ejecutar el borrado.** Esta versión no tiene comando `--apply` y rechaza opciones desconocidas.
5. La implementación posterior deberá limitarse a las rutas aprobadas, volver a comprobar catálogo y procedencia, usar precondiciones de actualización, omitir documentos cambiados, procesar lotes pequeños y producir un registro de resultados reanudable. Nunca usar un borrado recursivo ni borrar fotos de Storage o valoraciones como efecto secundario.
6. Impedir la reimportación de IDs eliminados en cualquier futura sincronización/importación local mediante un registro de migración por cuenta. Actualmente `migrateLegacyPlans` no se invoca: no activarlo para esta limpieza. La eliminación local aprobada debe tratar ambas claves de planes, conservar el backup privado y registrar su versión para no restaurar la clave antigua. La versión todavía no publicada del cliente debe revisarse antes de la migración para evitar clientes antiguos que reescriban datos.
7. Verificar recarga, cierre/reingreso, nuevo guardado, ausencia de duplicados y aislamiento de cuentas; comprobar Favoritos, Pendientes, Realizados, Calendario, Itinerarios y Recuerdos contra el inventario previo. Los datos personales bloqueados deben seguir accesibles.

La eliminación definitiva global permanece pendiente del acceso administrativo, de la auditoría real y de la aprobación explícita. No se publicó en Vercel.

## Simulación y pruebas

Se generó `.browser-check/cleanup-dry-run-fixture.json` con siete registros sintéticos: cuatro antiguos (dos candidatos y dos con revisión), un actual, un personalizado y un itinerario. Eliminados: cero. No son datos ni cantidades de producción.

La auditoría administrativa también se ejecutó contra el emulador: seis guardados en dos cuentas sintéticas, dos antiguos (un candidato y uno bloqueado para revisión), cuatro conservados y cero eliminados. El informe es `.browser-check/cleanup-emulator-01.json`. Se verificaron el nuevo guardado y su recuperación tras salir y volver a ingresar, incluyendo la interfaz de navegador. Las 22 pruebas unitarias, ESLint y la compilación finalizaron correctamente.

```powershell
node --test tests/*.test.js
npm run lint
npm run build
```

`tests/saved-cleanup.test.js` verifica ausencia actual, procedencia, personalizados, referencias, subcolecciones, campos personales y catálogo inválido. `scripts/check-saved-firebase.js` y `scripts/check-saved-firebase-browser.js` comprueban guardado, reingreso y datos personales contra Auth/Firestore emulados; la prueba SDK debe ejecutarse primero para crear sus cuentas sintéticas.

Referencias oficiales: [IAM de Firestore](https://firebase.google.com/docs/firestore/security/iam), [consultas y grupos de colecciones](https://firebase.google.com/docs/firestore/query-data/get-data) y [eliminación de documentos y subcolecciones](https://firebase.google.com/docs/firestore/manage-data/delete-data).
