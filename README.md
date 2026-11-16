# Por Hacer

Aplicación de planes con React, Vite y Firebase. Conserva el catálogo original de 129 planes.

## Ejecutar

Desde la raíz del proyecto:

```powershell
npm ci
npm run dev
```

En PowerShell, si la ejecución de scripts bloquea npm, usar `npm.cmd`.
La configuración existente se mantiene en `.env.local`; no incluir ese archivo al compartir el proyecto.
Consultar [Configuración de Firebase](docs/FIREBASE_SETUP.md).

## Comprobar

```powershell
npm run lint
npm run build
node --test tests/local-catalog.test.js
npm run preview
```

La comprobación de navegador requiere Chrome y usa un perfil temporal aislado:

```powershell
node scripts/check-browser.js
node scripts/check-browser.js --production
```

El primer comando comprueba los 129 detalles y las funciones personales en vista previa local.
El segundo comprueba la pantalla de acceso de la compilación de producción; no inicia sesión ni escribe en Firebase.

## Carpetas

```text
src/
  AppFirebase.jsx     Aplicación y vistas existentes
  main.jsx            Inicio de React
  App.css             Entrada de los estilos existentes
  components/         Componentes compartidos
  data/               Catálogo original y datos adicionales del mismo catálogo
  hooks/              Filtros
  services/           Firebase y fotografías
  styles/             Estilos por sección
  utils/              Utilidades
public/               Recursos públicos
scripts/              Comprobación del navegador
tests/                Pruebas del catálogo
docs/                 Configuración e informes
```

`src/services/firebase.js` conserva la implementación de Authentication, Firestore y Storage.
El catálogo principal muestra únicamente planes con fotografías reales verificadas y alojadas localmente. Conserva los 6.670 registros de BA Data y los 129 originales; ante un fallo muestra un error sin sustituir las tarjetas. Ver [catálogo fotográfico y procesamiento por lotes](docs/CATALOGO_FOTOGRAFICO.md).

## Entrega

Compartir el código y `package-lock.json`. Se regeneran con los comandos anteriores:

- `node_modules/`: dependencias instaladas.
- `dist/`: compilación lista para hosting.
- `.browser-check/`: capturas de las pruebas.

No incluir `.env.local`, perfiles temporales de Chrome ni credenciales en una entrega pública.
La carpeta `.git/` contiene el historial y no es necesaria para ejecutar la aplicación.

Ver [Versión del catálogo original](docs/VERSION_ENTREGA.md) y [Organización y peso](docs/OPTIMIZACION.md).
