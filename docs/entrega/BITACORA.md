# Bitácora del proceso — Por Hacer

Registro basado en el historial Git, las instrucciones de trabajo y las comprobaciones conservadas. Las fechas de los commits se tomaron del repositorio. Un punto de recuperación prueba un estado local del código; no prueba un despliegue de Vercel.

## Versión 1 — Primera aplicación funcional

Referencia: a583714, 03/11/2026. Mensaje del historial: Primer commit: Aplicación de planes conectada a Firebase.

Se definió una aplicación para descubrir y organizar salidas, con React y Firebase como base. Esa primera referencia permite reconocer el punto de partida. La existencia del código no se presenta como prueba retrospectiva de que todas las operaciones remotas hayan sido comprobadas ese día.

Durante la evolución inicial se usó un catálogo de ideas genéricas. Más adelante se decidió reemplazar la experiencia de descubrimiento por lugares reales con fotos identificables. La versión final no recupera ese catálogo antiguo en Inicio.

## Versión 2 — Lugares verificados y filtros más claros

Referencias: f5a3504, 16/11/2026, selección de 53 fotografías; cc509cb, 16/11/2026, catálogo seleccionado de 81 lugares.

Se procesaron fuentes abiertas y se revisó que cada fotografía correspondiera al lugar. No se publicaron automáticamente todos los registros del archivo original de BA Data: la presencia de una foto verificada pasó a ser una condición para aparecer en el catálogo visible.

Se ampliaron las cuatro categorías y se organizaron las zonas de CABA. Las comprobaciones incluyeron identidad de registros, direcciones, licencias, hashes de imágenes y filtros combinados. La dificultad principal fue evitar fotos genéricas, duplicados y atribuciones a lugares homónimos. Se investigó comparando fuentes, coordenadas y las imágenes antes de aprobarlas.

## Versión 3 — Catálogo de 84 lugares y organización personal estable

Referencias: 8897b75 y 398c4a2, 16/11/2026. Comparación estructurada: data/photo-batches/catalog-recovery-comparison.json.

Se sumaron El Progreso, La Flor de Barracas y El Estaño 1880, conservando los 81 lugares previos. La comparación de objetos completos comprobó que no faltaba ni había cambiado ningún plan anterior.

Ante el reporte de un Inicio vacío, se encontró una fragilidad: la selección dependía de una petición separada al archivo histórico de BA Data. Se incluyó la selección verificada dentro de la compilación y se probó el catálogo con aquella petición bloqueada. No se afirmó que esa fuera la causa confirmada de la sesión real de la estudiante.

Los planes antiguos se ocultaron en Mis planes, Calendario y Recuerdos sin borrar documentos. Los itinerarios muestran actividades vigentes; los elementos históricos ocultos permanecen almacenados. La edición se simplificó a nombre y eliminación de actividades visibles, conservando el ID.

## Versión final de interfaz — Responsive y detalles limpios

Referencia de partida: 0617920, 16/11/2026. Punto de recuperación de la interfaz completa: 59d61e3, 16/11/2026.

La estudiante pidió conservar el escritorio y refinar el móvil en varias iteraciones: menú inferior, cabecera con espacio, perfil desplegable, controles compactos, categorías en una sola línea, selectores del mismo tamaño y cabecera sticky. La tipografía móvil usa Zeyada sin cambiar la familia del escritorio.

Se revisó la licencia de las 84 fotografías. El bloque técnico dejó de aparecer en Ver detalles; un acceso discreto abre la atribución de la imagen exacta, y la sección general conserva todos los créditos. Los metadatos y los archivos de imágenes no se modificaron.

Se compararon geometría, colores y tipografías de escritorio con el estado previo a 1366 y 1440 px. El recorrido móvil cubrió 375, 390 y 430 px, tablet y formularios con altura reducida. También se comprobaron favoritos, recuerdos, valoración y selección de foto personal.

## Integración Firebase y dificultad pendiente

La aplicación distingue Firestore de la vista previa local. Se preparó un diagnóstico de solo lectura para mostrar proyecto, UID, ruta y conteo confirmado por servidor.

El reporte de tres planes y cinco itinerarios visibles frente a cuatro documentos reales todavía no se pudo contrastar con la sesión de la estudiante. Se reprodujo el mismo escenario con una cuenta sintética en Auth/Firestore emulados: ocho documentos persistieron tras recarga y reingreso. No se migraron ni duplicaron datos reales para intentar corregir una causa no confirmada.

## Uso de IA e investigación de errores

Codex ayudó a localizar selectores CSS que se anulaban entre sí, comparar catálogos, recorrer el código de Firebase, automatizar pruebas de navegador y revisar licencias. Las instrucciones limitaron repetidamente los cambios para conservar el diseño de escritorio y los datos personales.

También se corrigieron pruebas que aún esperaban filtros o mensajes técnicos ya eliminados. Algunas esperas de navegador necesitaron distinguir la carga diferida de fotos y las escrituras pendientes de fallos de la aplicación. Los resultados emulados se identificaron como tales, sin presentarlos como comprobación de producción.

## Evidencias incluidas

- Historial de Git con las referencias anteriores.
- Reporte de comparación del catálogo 81 → 84.
- Capturas de la versión final en evidencias/.
- VERIFICACION.md con comandos y alcance de las pruebas.
- DEMOSTRACION_FIREBASE.md y GUION_VIDEO.md para la comprobación real.

Las capturas finales se obtuvieron con perfiles de navegador aislados y datos sintéticos. Los recursos HTTPS externos se bloquearon durante las pruebas; las fotografías del catálogo se cargaron desde archivos locales. No contienen documentos de cuentas reales.

## Registro de despliegues por completar

La consigna también pide demostrar que una actualización de GitHub se refleja en un nuevo despliegue de Vercel. No se inventan evidencias de esa etapa.

Despliegue inicial documentado: PENDIENTE de URL, fecha, commit y captura del panel de Vercel.
Actualización de la versión final: PENDIENTE de commit publicado, resultado del build y captura de la web actualizada.
Prueba CRUD desde la URL publicada: PENDIENTE de registro y evidencias.

Antes de entregar, completar estos tres puntos con los datos reales y agregar las capturas. No hace falta reconstruir manualmente una versión antigua en producción: conservar las evidencias de despliegue que ya existan y documentar la actualización real que se realice.
