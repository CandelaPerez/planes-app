# Fotografias y detalles de los planes

La ventana Ver detalles conserva imagen principal y datos del lugar. Se retiro la representacion de BaDataSource en esa ventana, incluidos los textos fotograficos, verificacion, origen y enlaces tecnicos. El componente y todos los metadatos se mantienen en el repositorio; no se modificaron fotos, catalogo, APIs, Firebase ni documentos.

Revision del manifiesto: 84 fotografias con autor, fuente y licencia identificados. 73 usan CC BY o CC BY-SA (versiones 2.0, 2.5, 3.0, 4.0 y versiones argentinas indicadas por cada registro); 11 constan como Public domain. Se revisaron los resumenes oficiales de esas licencias. Las licencias de atribucion exigen conservar el credito y el enlace de licencia; las versiones anteriores a 4.0 tambien exigen el titulo si se proporciona. Las condiciones permiten una presentacion razonable segun el medio.

Solucion visual: boton discreto Creditos al final de los detalles, sin mostrar autor o procedencia en el contenido principal. Abre un dialogo independiente con la fotografia exacta que esta en pantalla, su autor, titulo de archivo Commons, fuente, licencia, enlace al original y aviso de presentacion del archivo. Cerrar Creditos devuelve al detalle. La seccion general Creditos y fuentes conserva los 84 registros y las fuentes de los datos. Los IDs de dialogos son independientes para que ambas entradas no se confundan. Para una imagen personal sin correspondencia con el manifiesto no se inventa atribucion.

Referencias oficiales revisadas:
- https://creativecommons.org/licenses/by/4.0/
- https://creativecommons.org/licenses/by-sa/4.0/
- https://creativecommons.org/licenses/by-sa/3.0/
- https://creativecommons.org/licenses/by/3.0/
- https://creativecommons.org/licenses/by/2.0/
- https://creativecommons.org/licenses/by-sa/2.0/
- https://creativecommons.org/licenses/by-sa/2.5/
- https://creativecommons.org/licenses/by/2.5/ar/
- https://creativecommons.org/licenses/by-sa/2.5/ar/

Verificacion: Chrome a 375, 390, 430, 768, 1024 y 1366 px, con apertura/cierre de los creditos, atribucion y enlaces de la foto seleccionada y conservacion de la imagen del detalle. Regresion de catalogo: 84 fotos cargadas, creditos generales completos y funciones personales aprobadas. Las 30 pruebas, ESLint y build aprobaron. No se publico en Vercel.
