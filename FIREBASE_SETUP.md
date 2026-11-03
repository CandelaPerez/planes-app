# Configurar Firebase para Por Hacer

La aplicación usa Authentication anónima, Cloud Firestore y Cloud Storage.

1. En Firebase Console, crea una aplicación web y activa **Authentication → Anonymous**.
2. Crea una base de datos de **Cloud Firestore** en modo producción.
3. Publica `firestore.rules` en **Firestore → Rules** y `storage.rules` en **Storage → Rules**.
4. Copia `.env.example` a `.env.local`, cambia `VITE_USE_FIREBASE=true` y completa los seis valores de configuración de la aplicación web de Firebase. No subas `.env.local` al repositorio.
5. Inicia con `npm run dev`. En el primer inicio de sesión anónimo, la app crea en Firestore los documentos iniciales del catálogo.

## Datos

- `plans/{planId}` contiene el catálogo público de planes (`isCatalog`, título, ubicación, categoría, presupuesto e imagen). El promedio y la cantidad de valoraciones se calculan desde los documentos `ratings`; no se guardan cifras iniciales inventadas.
- `plans/{planId}/ratings/{uid}` contiene una valoración de 1 a 5 por identidad anónima y plan. Repetir la valoración actualiza el mismo documento.
- `users/{uid}/savedPlans/{planId}` contiene los planes privados guardados por esa identidad, el estado, favorito, recuerdo y valoración personal. Los documentos con `catalogId` apuntan a la propuesta pública original.
- Los archivos de bitácora se guardan en `users/{uid}/plans/{planId}/{fileName}` en Cloud Storage.

Los planes que estaban en `localStorage` se migran una sola vez a `savedPlans` al iniciar sesión y luego se elimina esa copia local. Si `VITE_USE_FIREBASE=false`, la app permanece en modo vista previa y guarda los cambios solo en este navegador.

Las reglas permiten lectura del catálogo y las valoraciones a usuarios autenticados anónimamente, limitan cada lista personal a su UID y exigen un plan marcado como realizado antes de aceptar una valoración. Revisá las reglas antes de desplegar cambios en producción.
