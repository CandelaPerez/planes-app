# Diagnóstico de sincronización de la cuenta

Punto de recuperación: 3900126. La configuración local activa Firebase y apunta a por-hacer-f2867, base (default). Eso no confirma la configuración de una versión publicada ni el UID de la sesión del usuario.

Planes e itinerarios se guardan en users/{UID}/savedPlans. Los lugares usan su ID de catálogo (por ejemplo badata-food-905); los itinerarios usan UUID y type: itinerary, con sus actividades en items. Cada itinerario ocupa UN documento, no un documento por actividad. Tres planes independientes y cinco itinerarios guardados deben producir al menos ocho documentos bajo el mismo UID. Las valoraciones son subcolecciones aparte.

En modo Firebase, userPlans se carga desde watchSavedPlans y no desde localStorage. Guardar, editar y eliminar itinerarios usa savePlan, updateSavedPlan y removeSavedPlan en esa misma ruta. En vista previa se usan porhacer_preview_plans y porhacer_user_plans: recargar la página puede conservar esos registros locales sin que existan en Cloud Firestore. No se migraron registros automáticamente y no se cambió el comportamiento de escritura.

## Comprobar la sesión real sin escribir datos

Con esta versión abierta, esperar que termine la carga, abrir las herramientas del navegador → Console y ejecutar:

    await window.porHacerDiagnostico()

La función solo lee: no guarda, importa, migra, elimina ni modifica documentos. Devuelve:

- mode: firestore o local-preview.
- projectId y database: proyecto y base realmente usados por esa sesión.
- uid y email: usuario de Authentication activo; no incluye contraseña, token ni claves.
- path: ruta exacta users/UID/savedPlans.
- serverConfirmed: true solo si la lectura del servidor no proviene de caché ni contiene escrituras pendientes.
- total, plans, itineraries y documents: conteos y rutas del servidor. type: itinerary distingue cada itinerario.
- screen: UID, documentos recibidos por la aplicación y conteos visibles.
- local: cantidades de las claves locales por separado; su existencia no implica que esos datos pertenezcan a la cuenta actual.

Si la función no existe, esa pestaña está ejecutando una versión anterior. Para probar esta versión local usar npm.cmd run dev y entrar nuevamente con la misma cuenta. No se publicó ningún cambio en Vercel.

## Comparar en Firebase Console

1. Seleccionar el projectId del informe, no deducirlo por el nombre comercial del proyecto.
2. Authentication → Users: buscar el email y verificar que su User UID coincida exactamente con uid.
3. Firestore Database → base (default) → Data → users → ese UID → savedPlans. No es una ruta users/savedPlans sin UID.
4. Comprobar los documents[].id y documents[].path del informe. Los UUID con type = itinerary deben estar junto a los planes.
5. Repetir el diagnóstico tras recargar y tras cerrar sesión y volver a entrar. Comparar IDs, no solamente títulos.

Interpretación:

- Si serverConfirmed = true, total = 8 y screen muestra 3 y 5, pero la consola muestra 4: contrastar proyecto, base, UID y filtros/paginación de la consola. La aplicación sí está leyendo ocho documentos del servidor.
- Si mode = local-preview: los registros de esa pestaña no se están sincronizando con Firestore. Conservar el navegador y sus datos; no borrar localStorage ni hacer una migración sin identificar propietario, IDs y conflictos.
- Si total = 4 y screen.rawDocuments = 4: el cliente no ha recibido ocho guardados de esa cuenta. Distinguir los cinco itinerarios guardados de las actividades dentro de itinerarios o de una sugerencia aún sin guardar.
- Si serverConfirmed = false o la consulta falla: no afirmar sincronización. Comprobar conexión, escrituras pendientes y el error concreto; no cambiar reglas ni borrar registros para resolver una discrepancia de conteos.
- Si hay IDs internos distintos de documents[].id, conservar ambos y revisar individualmente; no renombrar documentos automáticamente.

Todavía no se ha podido inspeccionar la sesión real del usuario. Para atribuir una causa concreta hacen falta el informe de esa pestaña y el UID que se está consultando en la consola. No se borraron ni sobrescribieron sus datos y no se modificaron las reglas, el diseño ni el catálogo de 84 lugares.

## Prueba autom?tica del caso 3 + 5

Con emuladores Auth/Firestore locales, ejecutar node scripts/check-eight-records-sync-browser.js. Crea su propia cuenta sint?tica, guarda tres lugares desde Inicio y cinco itinerarios desde la interfaz. Verifica ocho documentos del servidor, UID de pantalla coincidente, recarga, cierre y reingreso con la misma cuenta, edici?n del mismo documento sin duplicarlo y eliminaci?n ?nicamente de un itinerario sint?tico. Restaura ese registro de prueba con el mismo ID y termina con ocho documentos. Esta prueba pas?, sin acceso ni cambios a producci?n. No demuestra el estado de la cuenta real del usuario. Resultado privado: .browser-check/eight-records-sync-result.json.
