# Filtros de Descubrir planes

**Actualización:** el catálogo actual tiene 81 planes y filtros de tres zonas y cuatro tipos. Ver [estado vigente, fuentes y pruebas](VARIEDAD_Y_ZONAS.md). El contenido que sigue documenta la etapa anterior.


Punto de recuperación anterior al cambio: `f5a3504`.

Los 53 planes, sus nombres, fotos y fuentes no se modificaron. Tampoco se modificaron Firebase, sus reglas, archivos CSS ni los catálogos de respaldo.

- **Todas las zonas** ofrece 14 barrios con registros visibles. Normaliza espacios, mayúsculas y San Nicolás. Usa exclusivamente el campo `barrio` publicado. Los 14 atractivos de Wikidata sin barrio informado siguen en Todas las zonas; no se infiere su barrio por nombre, dirección ni coordenadas.
- **Todos los lugares** ofrece 20 tipos presentes en el catálogo. Agrupa códigos publicados equivalentes (por ejemplo PARQUE/PLAZA) y tipos explícitos en las descripciones de Wikidata. No clasifica por fotografías ni por suposiciones. Conserva el tipo de la fuente incluso si parece poco específico: Café Tortoni está publicado como RESTAURANTE; Güerrín como CAFE. Un registro sin tipo queda disponible en Todos los lugares.
- **Ordenar por** permite Recomendados, Nombre A-Z y Nombre Z-A. La selección inicial conserva Recomendados y su orden destacado anterior. Los órdenes alfabéticos usan el título visible y se aplican al conjunto completo antes de paginar.

Las opciones proceden del catálogo completo de 53 planes, no de las primeras seis tarjetas. Cada opción tiene al menos un registro en ese catálogo. Es posible combinar opciones sin coincidencias; en ese caso aparecen contador cero, mensaje claro y Limpiar filtros.

Barrio, tipo, orden, categoría y búsqueda funcionan juntos. Cambiar cualquiera reinicia la paginación, incluso si se vuelve a una combinación expandida anteriormente. El contador principal y el de resultados reflejan el conjunto filtrado. Ver más mantiene la carga progresiva de seis tarjetas en la página principal.

La vista previa BA Data utiliza los mismos filtros y conserva su paginación previa de 24 tarjetas.

## Validación

- `node --test tests/*.test.js`: 11 pruebas correctas.
- `npm run lint`: sin errores.
- `npm run build`: correcto, incluida la auditoría de los 53 archivos fotográficos.
- Chrome: probados los 14 barrios y los 20 tipos individualmente; todos coinciden con los registros esperados.
- Chrome: probados filtros combinados con categoría y búsqueda, ambos órdenes sobre las 53 tarjetas, conservación de Recomendados, contador, ausencia de resultados y reinicio de paginación al volver a un filtro anterior.
- Chrome: carga de las 53 fotos, guardado, favoritos, calendario, recuerdos, planes personalizados e itinerarios correctos en modo local. Se conservan tres columnas y no hay desborde a 390 px ni excepciones JavaScript.
- La implementación y reglas de Firebase se verificaron sin cambios. No se realizaron pruebas remotas autenticadas ni despliegues.

No se publicó en Vercel.
