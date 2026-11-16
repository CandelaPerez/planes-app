# Configuración de Firebase para Por Hacer

## Configuración local

Copiar .env.example a .env.local y completar la configuración WEB obtenida en Project settings → Your apps del proyecto correcto. Mantener VITE_USE_FIREBASE=true. El cliente requiere API_KEY, AUTH_DOMAIN, PROJECT_ID, STORAGE_BUCKET, MESSAGING_SENDER_ID y APP_ID. No usar cuentas de servicio ni claves privadas en variables VITE_. Reiniciar Vite después de cambiar el archivo.

En la consola, verificar Authentication → Sign-in method → Email/Password. La aplicación ofrece registro e inicio de sesión con correo y contraseña. Usa Cloud Firestore en la base (default), y Cloud Storage para fotos personales. Las fotografías de los 84 lugares se sirven desde la web y no necesitan Storage.

## Reglas

Comparar las reglas desplegadas con firestore.rules y storage.rules del repositorio. Las reglas de Firestore limitan los documentos personales al UID autenticado y validan las valoraciones. La lectura del catálogo heredado y de las valoraciones requiere autenticación. Las reglas de Storage restringen las fotos a su propietario y al formato/tamaño configurados. No cambiar a reglas públicas para resolver un error.

No se publicaron reglas ni se modificaron documentos reales durante esta preparación. Si hace falta actualizar las reglas desplegadas, revisar primero qué cambia y publicar desde la consola con la cuenta propietaria. Desplegar en Vercel no modifica las reglas de Firebase.

## Rutas utilizadas

- users/{uid}/savedPlans/{id}: cada plan personal o itinerario.
- plans/{id}/ratings/{uid}: valoración global y referencia del usuario.
- users/{uid}/savedPlans/{id}/ratings/{ratingUid}: estructura de valoraciones contemplada por compatibilidad en las reglas.
- Cloud Storage users/{uid}/plans/{id}/{archivo}: fotografías personales.

Los itinerarios usan type: itinerary e items dentro del mismo savedPlans. El documento padre users/{uid} puede no tener campos aunque existan sus subcolecciones. No buscar savedPlans directamente debajo de users sin seleccionar antes el UID.

El cliente actual no ejecuta syncCatalog ni migrateLegacyPlans al iniciar sesión. Inicio no lee los 84 lugares desde plans: usa la selección fotográfica incluida en la aplicación. No eliminar cat_* ni coverage_* ni sus valoraciones durante la entrega. La visualización de datos antiguos se filtra sin borrar registros.

## Comprobar la base real

1. Iniciar sesión en la aplicación con una cuenta de prueba.
2. En Authentication → Users, comparar su UID con window.porHacerDiagnostico().uid.
3. Confirmar projectId y database del diagnóstico y abrir users/UID/savedPlans.
4. Crear un guardado, confirmar el documento y recargar; cambiar favorito/estado/fecha y comprobar esos campos.
5. Marcar realizado y valorar desde Recuerdos. Confirmar rating en el guardado y value en plans/ID/ratings/UID.
6. Eliminar únicamente el guardado de prueba desde la aplicación y verificar que no reaparezca al recargar. Su valoración global se conserva por diseño.
7. Repetir desde la URL publicada y desde el otro dispositivo con la misma cuenta.

Ver [guion completo](DEMOSTRACION_FIREBASE.md). Si el diagnóstico indica local-preview, los datos son de ese navegador y la prueba no demuestra Firestore. Si serverConfirmed no es true, no afirmar que el servidor confirmó el conteo. Un error de permisos debe investigarse contrastando UID, ruta y reglas, sin borrar datos ni abrir permisos globales.

## Producción

Repetir las mismas variables en Vercel, entorno Production, y redeplegar después de modificarlas. No se exporta .env.local. La cuenta de Firebase y la configuración del proyecto publicado deben coincidir con las que se consultan en la consola.
