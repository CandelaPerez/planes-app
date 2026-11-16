# Estado de verificación de la entrega

## Hechos verificados

- Código React + Vite, componentes y manejo de estado presentes.
- Catálogo seleccionado: 84 lugares y fotografías verificadas; se preservaron los 81 anteriores y se sumaron tres de Zona Sur.
- Reglas de Firestore y Storage incluidas, sin cambios de permisos durante esta preparación.
- Vista móvil y escritorio con controles compartidos y sin desbordamiento en los anchos probados.
- Las pruebas existentes de Node, navegador y emuladores se vuelven a ejecutar al preparar la entrega. Los resultados finales se registran abajo.

## Firebase emulado

Proyecto: demo-porhacer-tests. Auth 127.0.0.1:9099 y Firestore 127.0.0.1:8080. Los datos son sintéticos y las pruebas no usan las cuentas de producción.

Se verifican tres planes y cinco itinerarios, ocho documentos del servidor con UID coincidente, recarga, cierre/reingreso, edición sin duplicar y borrado/restauración solo de la cuenta sintética. La prueba de entrega comprueba guardar, favorito, estado, calendario, valoración y eliminación con lecturas del servidor.

## Lo que todavía no está verificado

La cuenta real de la estudiante, el conteo real de ocho elementos frente a cuatro documentos, las reglas efectivamente desplegadas, la subida a Storage de producción y la URL final de Vercel. Ningún resultado local o emulado debe rotularse como evidencia de producción.

## Resultado final de esta preparación

Verificaci?n ejecutada durante la preparaci?n del 16/11/2026:

- npm.cmd run check: aprobado (ESLint, 30 pruebas de Node y compilaci?n).
- node scripts/check-responsive-browser.js: aprobado en 375, 390, 430, 768, 1024 y 1366 px, incluidos modales, cr?ditos, foto personal local, memoria y altura reducida.
- node scripts/check-verified-browser.js --isolated-build: aprobado; 84 fotos decodificadas, cr?ditos completos, categor?as/zonas/b?squeda/orden y funciones personales; sin excepciones JavaScript.
- node scripts/check-saved-firebase.js: aprobado en emuladores; guardados, aislamiento de cuentas y valoraciones.
- node scripts/check-firebase-delivery-browser.js: aprobado en emuladores; crear, favorito, estado, calendario, valorar, recargar y eliminar conservando la valoraci?n.
- node scripts/check-eight-records-sync-browser.js --responsive: aprobado; tres planes y cinco itinerarios, ocho documentos, mismo UID entre vistas, perfil, recarga y reingreso, edici?n sin duplicados.
- Documentos Word: paquetes OOXML y XML internos validados. PDF: generado localmente e inspeccionada la presentaci?n del dossier.
- .env, .env.local y .env.production excluidos por Git; .env.example incluido.

Durante esta revisi?n se hicieron m?s robustas dos pruebas de navegador: esperan a que termine la recarga del documento y a que el formulario est? listo. No se cambi? la l?gica de Firebase para resolver una espera del test.

El build conserva el aviso informativo previo por el tama?o del paquete Firebase. No se public? ni se modificaron datos de producci?n.
