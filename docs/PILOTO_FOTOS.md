# Piloto de doce tarjetas

Punto de recuperación Git: `f6c8fec`. Solo doce registros reciben títulos y descripciones editoriales; ocho reciben fotografías verificadas. Los otros 6.658 no se transforman. Se conservan los 6.670 IDs, categorías, direcciones, coordenadas y fuentes. El catálogo de 129 originales sigue intacto como respaldo.

## Revisión de fuentes

Los recursos originales descargados de BA Data no publican campos de fotografía: se revisaron los encabezados de ambos CSV de establecimientos y cultura, el CSV de paradas y las propiedades del GeoJSON de espacios verdes. Cultura publica WEB y redes sociales, pero eso no equivale a una fotografía reutilizable con licencia conocida.

Se consultó la API pública de Wikimedia Commons por nombre y ciudad; se contrastó dirección, descripción, coordenadas cuando existen y contenido visible. Se rechazó un resultado de un museo de Ciudad de México y se buscaron alternativas al primer resultado del Botánico, que era una planta aislada. No se seleccionaron imágenes por categoría ni por cercanía solamente.

Las ocho fotos se inspeccionaron visualmente antes de aprobarlas. Son fotografías de archivo, no fotografías actuales. Las fechas se muestran en los créditos. La verificación acredita la correspondencia con el lugar, no que conserve hoy su aspecto o siga abierto.

| ID estable | Lugar / dirección BA Data | Resultado y fuente | Autor y condiciones |
| --- | --- | --- | --- |
| badata-food-1362 | CAFÉ TORTONI · Av. de Mayo 825 | [Foto de fachada, 2021](https://commons.wikimedia.org/wiki/File:Frente_Caf%C3%A9_Tortoni.jpg). Nombre visible y GPS a unos metros del registro. | Danideicas · CC BY-SA 4.0 |
| badata-food-638 | LAS VIOLETAS · Rivadavia 3899 | [Foto de Medrano y Rivadavia, 2007](https://commons.wikimedia.org/wiki/File:Las_Violetas_Medrano.JPG). Esquina, nombre y coordenadas coincidentes. | Autor consignado: “Yo mismo”; usuario que subió el archivo: Thanos · dominio público según ficha |
| badata-food-1573 | LAS VIOLETAS · Uspallata 2801 | Sin fotografía verificada. Búsqueda exacta por nombre y calle sin resultados. Se rechazó la del homónimo de Rivadavia. | Ilustración local |
| badata-culture-2601 | Museo de Arte Moderno · San Juan 350 | [Fachada, 2017](https://commons.wikimedia.org/wiki/File:FachadaModerno.jpg). Nombre y dirección visibles, GPS coincidente. | Ada Naval · CC BY-SA 4.0 |
| badata-culture-2694 | Museo Nacional Bellas Artes · Libertador 1473 | [Fachada, 2007](https://commons.wikimedia.org/wiki/File:Museo_Nacional_de_Bellas_Artes_(12407).jpg). Nombre completo visible y ficha que identifica Buenos Aires. La foto no publica GPS. | Beatrice Murch · CC BY-SA 2.0 |
| badata-culture-2568 | MALBA · Figueroa Alcorta 3415 | [Fachada, 2006](https://commons.wikimedia.org/wiki/File:Buenos_Aires_-_Palermo_-_Malba.jpg). Cartel MALBA, descripción y GPS coincidentes. | Galio · dominio público según ficha |
| badata-green-871 | Parque Centenario | [Lago, 2007](https://commons.wikimedia.org/wiki/File:Buenos_Aires_-_Caballito_-_Parque_Centenario.jpg). Descripción, GPS y revisión visual. | Galio · CC BY-SA 3.0 |
| badata-green-1490 | El Rosedal (Plaza Holanda) | [Vista del rosedal, 2006](https://commons.wikimedia.org/wiki/File:RosedalBuenosAires.JPG). Identificación explícita como Rosedal de Buenos Aires y revisión visual. La foto no publica GPS. | Fulviusbsas · dominio público según ficha |
| badata-green-1330 | Carlos Thays (Jardín Botánico) | [Vista del jardín y edificio, 2007](https://commons.wikimedia.org/wiki/File:Buenos_Aires_Entrada_al_Jardin_Botanico_Carlos_Thays.jpg). Descripción y GPS correspondientes al jardín. | Arcibel · dominio público según ficha |
| badata-bus-1 | Parada 0 Diagonal Norte · Diagonal Norte 728 | Sin foto verificable de esa parada. La búsqueda por bus turístico y Diagonal Norte no devolvió candidatos. | Ilustración local |
| badata-bus-2 | Parada Recoleta · Quintana 591 | Sin foto verificable de esa parada. La búsqueda por bus turístico y Quintana no devolvió candidatos. | Ilustración local |
| badata-bus-3 | Parada 9 de Julio – Teatro Colón · Cerrito 890 | Sin foto verificable de esa parada. La búsqueda por bus turístico y Cerrito no devolvió candidatos. No se sustituye por el teatro. | Ilustración local |

“Sin foto verificada” describe el resultado de esta búsqueda acotada, no demuestra que no exista ninguna fotografía.

## Archivos y actualización

- `scripts/ba-data/pilot-places.js`: lista cerrada de doce IDs, ocho archivos Commons aprobados, evidencia y SHA-256 de cada imagen revisada.
- `scripts/update-ba-data-pilot.js`: actualización manual separada. Una consulta de metadatos en lote, luego ocho imágenes secuenciales con pausas de 1,2 segundos; timeout de 20 segundos, sin reintentos automáticos. Se detiene ante errores, licencias no aprobadas o cambios en los archivos que requieran revisión visual.
- `src/data/baDataPilot.json`: títulos, descripciones, nombres originales, URLs, autor, usuario de subida, licencia, fecha de fotografía, fecha de verificación, evidencia y huellas de los archivos. Es información persistente que se incorpora a la compilación.
- `public/images/ba-data-pilot/`: ocho JPEG locales, aproximadamente 2,1 MB en total, con sus condiciones de reutilización verificadas antes de descargarlos. Se usan miniaturas oficiales sin editar el archivo; CSS adapta su encuadre al tamaño actual de la tarjeta.
- `PlacePhotoCredit.jsx` y `BaDataSource.jsx`: créditos, enlaces de fuente y licencia, fecha y nombre original. No se insertan los metadatos HTML de terceros como HTML ejecutable.

Las visitas no llaman a la API de Commons ni a CKAN. Si falla una foto, se usa la ilustración de su categoría y se corrige el rótulo. Si cambia el nombre, dirección o categoría del registro BA Data, no se aplica la foto revisada automáticamente.

Actualizar únicamente las ocho fotos aprobadas:

```powershell
node scripts/update-ba-data-pilot.js
```

No amplía la muestra ni decide nuevos emparejamientos automáticamente. Un archivo que cambie de contenido debe volver a inspeccionarse antes de actualizar su huella aprobada.

## Revisión local

```powershell
npm.cmd run dev
```

En la página principal, usar “Todas”, “Todas las zonas”, “Todos los presupuestos” y “Recomendados”. Las primeras seis tarjetas pertenecen al piloto; pulsar “Ver más” una vez para ver las doce. Cada una conserva detalles, guardado y el identificador original. Los títulos editoriales son invitaciones, no eventos programados ni certificaciones de apertura.

Pasaron nueve pruebas de Node, ESLint y build. Chrome comprobó las ocho fotos locales, las cuatro ilustraciones, filtros, búsqueda, paginación, caída de una imagen, guardado local, favoritos, calendario y recuerdos con HTTPS externo bloqueado, sin excepciones JavaScript. Se inspeccionó una captura de las doce tarjetas manteniendo tres columnas y el diseño responsive. No se probaron escrituras autenticadas en Firestore ni se publicó en Vercel.

Documentación de reutilización consultada: [Commons: First steps/Reuse](https://commons.wikimedia.org/wiki/Commons:First_steps/Reuse) y [metadatos de archivos](https://commons.wikimedia.org/wiki/Commons:Machine-readable_data). Los enlaces y las condiciones específicas de cada foto se conservan en el manifiesto; la atribución de BA Data se mantiene separada de la licencia fotográfica.
