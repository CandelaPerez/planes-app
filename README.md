# Por Hacer

Aplicación web responsive desarrollada con React, Vite y Firebase para descubrir lugares de Buenos Aires y organizar salidas. Permite guardar planes, crear itinerarios, marcar favoritos y experiencias realizadas, agendar fechas, valorar y conservar recuerdos con fotografías.

## Catálogo actual

La aplicación muestra **84 lugares con fotografías reales verificadas**: 23 de Gastronomía, 21 de Cultura, 23 de Aire Libre y 17 de Íconos de BA. Los filtros visibles son categoría, zona, búsqueda y orden. Los metadatos de autoría y licencias se conservan; los créditos son accesibles desde el pie de Inicio y desde el enlace discreto de los detalles.

Inicio usa la selección incluida en src/data/verifiedCatalog.json y src/data/tourismPlaces.json, junto con los manifiestos baDataPilot.json y baDataPhotos.json. Los 129 identificadores antiguos y el archivo histórico de 6.670 registros no alimentan el catálogo visible. La carga no depende de descargar ese archivo histórico ni de una API externa durante la visita.

## Tecnologías

React 19, Vite 8, JavaScript y CSS responsive. Firebase Authentication gestiona las sesiones, Cloud Firestore almacena los datos personales y Cloud Storage conserva las fotografías subidas. Se utiliza ESLint y pruebas de Node. Requiere Node 20.19 o posterior dentro de la rama 20, o Node 22.12 o superior; se recomienda una versión LTS compatible.

## Instalación rápida

```bash
git clone https://github.com/CandelaPerez/planes-app.git
cd planes-app
npm ci
```

En PowerShell, copiar la plantilla:

```powershell
Copy-Item .env.example .env.local
```

En macOS o Linux: `cp .env.example .env.local`.

Seleccionar el proyecto en Firebase, registrar una aplicación web y habilitar Authentication con correo y contraseña, Cloud Firestore y Cloud Storage. Completar en .env.local las siete variables de .env.example con la configuración web del mismo proyecto. Nunca colocar claves privadas ni cuentas de servicio en variables VITE_: sus valores se incorporan al cliente.

```bash
npm run dev
```

Para comprobar la versión de producción local:

```bash
npm run build
npm run preview
```

## Configuración y ejecución detallada

Requiere una versión de Node compatible con el Vite instalado. La verificación de esta entrega se realizó con Node 24.21.0.

1. Clonar el repositorio e ingresar en la carpeta que contiene package.json.
2. Ejecutar npm ci.
3. Copiar .env.example a .env.local.
4. Completar todas las variables con la configuración web del mismo proyecto de Firebase.
5. Mantener VITE_USE_FIREBASE=true para la entrega.
6. Ejecutar npm run dev y abrir la dirección que indique Vite.

En PowerShell, usar npm.cmd si la política de ejecución bloquea npm.ps1. Reiniciar Vite después de cambiar las variables. .env.local no se comparte ni se sube a GitHub.

Consultar [Configuración de Firebase](docs/FIREBASE_SETUP.md).

## Firebase y persistencia

Se usa Authentication con correo y contraseña; no hace falta acceso anónimo. Cloud Firestore guarda los documentos personales en users/{UID}/savedPlans/{ID}. Los lugares tienen un ID estable de catálogo y los itinerarios un UUID con type: itinerary e items. Favorito, estado, fecha de calendario, comentario y valoración se actualizan en ese mismo documento.

Las valoraciones globales se guardan en plans/{ID}/ratings/{UID}. Cloud Storage guarda fotografías personales en users/{UID}/plans/{ID}/{archivo}. La colección plans también conserva documentos históricos; no se realiza una limpieza automática ni una migración automática desde localStorage.

Los registros antiguos se ocultan en las vistas personales sin borrar sus datos. Los itinerarios muestran actividades vigentes y los planes personalizados se conservan. Con la misma cuenta y el mismo proyecto de Firebase, ambos dispositivos consultan la misma ruta. VITE_USE_FIREBASE=false es únicamente una vista previa local y no demuestra persistencia en Firestore.

## Validación

- npm run check: ESLint, todas las pruebas de Node y compilación con auditoría de fotografías.
- npm run preview: servir la compilación local.
- npm run test:responsive: recorrido de escritorio y móvil en Chrome con datos sintéticos locales.
- node scripts/check-verified-browser.js --isolated-build: catálogo completo, créditos, filtros y funciones personales sobre una compilación aislada.
- node scripts/check-responsive-desktop.js --historical y luego --compare: comparación con la referencia histórica conservada en Git.

Las comprobaciones de navegador requieren Chrome; CHROME_PATH permite indicar otra ruta al ejecutable. Los scripts de Firebase emulado usan únicamente demo-porhacer-tests y requieren Auth en 127.0.0.1:9099 y Firestore en 127.0.0.1:8080. Ver [demostración de Firebase](docs/DEMOSTRACION_FIREBASE.md) y [prueba 3 planes + 5 itinerarios](docs/DIAGNOSTICO_SINCRONIZACION.md).

Las pruebas emuladas no certifican las reglas desplegadas ni la cuenta real. La diferencia reportada entre ocho elementos visibles y cuatro documentos reales continúa pendiente de contrastar con el UID y proyecto de la sesión. El diagnóstico de solo lectura se ejecuta en la consola del navegador mediante window.porHacerDiagnostico().

## Publicar en Vercel

No se ejecutó un despliegue como parte de esta preparación.

1. Subir los commits finales al repositorio GitHub cuando se autorice la publicación. Una integración ya conectada puede generar un despliegue al recibir esos commits.
2. Importar el repositorio en Vercel y usar la raíz que contiene package.json.
3. Usar Vite, npm run build y dist; vercel.json deja esos valores definidos.
4. Cargar en Production las siete variables VITE_ de .env.example con sus valores reales, incluido VITE_USE_FIREBASE=true. Las variables web no son credenciales administrativas.
5. Desplegar o volver a desplegar después de cambiar variables.
6. Verificar por separado las reglas publicadas en Firebase. Vercel no publica reglas de Firestore ni Storage.
7. Desde la URL publicada, repetir CRUD, recarga, inicio de sesión y uso móvil. Registrar URL, fecha, commit y resultado.

Referencia: [documentación oficial de Vite en Vercel](https://vercel.com/docs/frameworks/frontend/vite).

## Entrega TP2

- Repositorio: https://github.com/CandelaPerez/planes-app
- Aplicación publicada: **pendiente de proporcionar/verificar**.
- [Informe breve](docs/entrega/INFORME.md).
- [Bitácora de versiones y decisiones](docs/entrega/BITACORA.md).
- [Guion del video](docs/entrega/GUION_VIDEO.md).
- [Lista final de tareas de la estudiante](docs/entrega/PENDIENTES.md).
- [Pruebas y alcance de la evidencia](docs/entrega/VERIFICACION.md).

La documentación histórica de docs describe etapas anteriores y no debe confundirse con el comportamiento final documentado aquí. Las capturas incluidas en docs/entrega/evidencias provienen de pruebas locales o emuladas, no de cuentas reales.

## Organización

src/AppFirebase.jsx coordina las vistas. components contiene controles compartidos; hooks, filtros; services, Firebase y catálogo; utils, proyecciones no destructivas y utilidades; styles, hojas de estilo. public contiene las fotografías locales, fuentes y recursos. scripts y tests contienen las comprobaciones. docs contiene instrucciones e informes.

No subir .env, .env.local, node_modules, dist, .browser-check ni credenciales administrativas. .env.example y las reglas sí forman parte de la entrega.

## Seguridad del repositorio

Las reglas incluidas en firestore.rules no permiten acceso anónimo general: los documentos personales requieren el UID propietario y las valoraciones verifican identidad y valores permitidos. La lectura del catálogo y de valoraciones requiere autenticación. Las reglas locales no certifican las que están desplegadas en Firebase; verificar ambas por separado. storage.rules también está incluida. Actualizar la web no publica estas reglas.

.gitignore excluye .env, sus variantes locales, node_modules, dist, .browser-check, .vercel y los ZIP de entrega. .env.example contiene ejemplos y debe permanecer versionado. Las fotografías, sus licencias, la documentación y las pruebas forman parte del proyecto.

## Subir la documentación final a GitHub

```bash
git status --short
git diff -- README.md
git add README.md
git commit -m "docs: completar README de Por Hacer para entrega final"
git push origin main
```

Ejecutar el push solo al decidir publicar: si el repositorio está conectado a Vercel puede activar un despliegue automático. Los commits locales anteriores también se enviarán. No es necesario modificar los datos de Firebase para actualizar la documentación.