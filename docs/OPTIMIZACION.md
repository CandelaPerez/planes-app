# Organización y peso del proyecto

Se reorganizó el código sin modificar el diseño ni la estructura visual de la
página. Se conservan los 129 planes y sus imágenes.

## Peso antes y después

Mediciones en bytes de los archivos, expresadas aquí en KB/MB decimales:

| Elemento | Antes | Después |
| --- | ---: | ---: |
| JavaScript principal de producción | 900,9 KB | 86,6 KB |
| JavaScript total de producción | 900,9 KB | 900,1 KB |
| Dependencia sin usar lucide-react, instalada | 36,34 MB | Eliminada |
| Perfil temporal antiguo de Chrome en el proyecto | 134,98 MB | Eliminado |
| Recursos de plantilla sin referencias | 25,9 KB | Eliminados |

La limpieza retiró aproximadamente **171,35 MB** de archivos locales. No se
comprimieron ni reemplazaron las imágenes originales.

El JavaScript principal disminuyó cerca del 90 %, pero eso **no significa que
la primera visita descargue un 90 % menos**: Firebase y React continúan siendo
necesarios. Ahora tienen archivos separados para que el navegador pueda
reutilizar esas bibliotecas en caché cuando cambie el código de la aplicación.
El total de JavaScript se mantiene prácticamente igual.

Firebase queda en un archivo independiente de unos 594,7 KB y React en otro de
218,8 KB. Se mantiene Firebase unido para preservar el orden de inicialización
de sus módulos. La advertencia de Vite sobre un archivo mayor de 500 KB puede
seguir apareciendo; la compilación termina correctamente.

## Carpetas organizadas

- `src/data/`: `catalog.js` y `catalog-extra.js`, ambos del catálogo original.
- `src/services/`: `firebase.js` y `planPhotos.js`.
- `src/components/`, `src/hooks/`, `src/styles/` y `src/utils/`: mantienen sus funciones.
- `docs/`: configuración de Firebase e informes de entrega y optimización.
- `tests/`: pruebas portables del catálogo y filtros, sin requerir el historial Git.
- `scripts/`: comprobación de navegador en un perfil temporal aislado.
- `public/`: recursos públicos originales.

Se actualizaron las importaciones y referencias a los archivos movidos. Se
retiró el archivo vacío `src/App.jsx`, los recursos de plantilla sin referencias
de `src/assets/` y las carpetas vacías que quedaron de la integración retirada.
`README.md` ahora explica cómo instalar, comprobar y ejecutar Por Hacer.

## Archivos principales de esta intervención

- `vite.config.js`: separación del JavaScript de React, Firebase y aplicación.
- `package.json` y `package-lock.json`: retirada de lucide-react, sin usos en el código.
- `src/AppFirebase.jsx`: solo cambiaron las rutas de las dos importaciones movidas.
- `src/data/catalog.js`: solo cambió la ruta de importación de catalog-extra.js.
- Los archivos trasladados a `src/services/`, `src/data/` y `docs/`.
- `tests/local-catalog.test.js`, `scripts/check-browser.js` y documentación.

No se editaron .env, credenciales, reglas de seguridad, el contenido de Firebase,
el contenido del catálogo ni la lógica de la página. No se publicó en Vercel.

## Comprobaciones

Se compararon las huellas antes/después del CSS compilado y del cuerpo de
AppFirebase: son idénticas. También son idénticos los archivos trasladados de
Firebase, fotografías y catálogo adicional, junto con .env.local y .env.example.

Pasaron:

- `npm run build`, `npm run lint` y las pruebas del catálogo y filtros.
- La revisión de dependencias instaladas, sin paquetes faltantes.
- Chrome: 129 planes y 129 detalles, crear/editar/eliminar planes personales en
  modo local, favoritos, calendario, recuerdos e itinerarios.
- Chrome: móvil de 390 px sin desbordamiento y escritorio de 1366 px con tres columnas.
- Chrome sobre la compilación de producción: acceso de Firebase visible y
  ninguna excepción JavaScript detectada.

No se probó iniciar sesión con una cuenta real ni escribir en Firestore/Storage.
Las pruebas personales se realizaron con datos locales aislados. Los recursos
HTTPS se bloquean intencionalmente en esas pruebas; no validan la disponibilidad
de cada fotografía remota en Internet.

## Repetir las pruebas

Desde la raíz:

```powershell
npm.cmd run dev
npm.cmd run lint
npm.cmd run build
node --test tests/local-catalog.test.js
node scripts/check-browser.js
node scripts/check-browser.js --production
```

La prueba de navegador requiere Chrome y una versión de Node con WebSocket
global; se ejecutó con Node 24. Para otro ejecutable de Chrome, usar CHROME_PATH.

Para entregar código fuente, no hace falta incluir node_modules, dist ni
.browser-check; node_modules se restaura con `npm ci` y dist se genera con
`npm run build`. El historial .git no es necesario para ejecutar las pruebas.
No incluir .env.local en una entrega pública; configurar Firebase siguiendo
[FIREBASE_SETUP.md](FIREBASE_SETUP.md).
