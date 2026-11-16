# Firebase setup for Por Hacer

The project configuration is already present in `.env.local`. Keep that file private and do not commit it.

## Firebase Console

1. Open the Firebase project whose web app values are in `.env.local`.
2. In **Authentication > Sign-in method**, enable **Email/Password**.
3. Create a **Cloud Firestore** database (production mode is fine).
4. Create the **Cloud Storage** bucket.
5. Publish this repository's `firestore.rules` in **Firestore > Rules**.
6. Publish this repository's `storage.rules` in **Storage > Rules**.
7. In **Project settings > Your apps**, confirm the web app config matches `.env.local`.

## Run the app

Restart the Vite dev server after changing `.env.local` (`npm run dev`). The app should first show sign-in and registration. Register with an email and a password of at least 6 characters. After authentication, it creates the catalog documents and opens the home screen and menu.

If you see `auth/operation-not-allowed`, enable Email/Password in Authentication. If Firestore shows `permission-denied`, publish `firestore.rules`. If photo uploads fail, check that Storage is enabled and `storage.rules` are published.

## Data

- `plans/{planId}` stores the shared plan catalog.
- `plans/{planId}/ratings/{uid}` stores a user's rating for a plan.
- `users/{uid}/savedPlans/{planId}` stores that user's saved plans, status, favorites, memories, and personal rating.
- `users/{uid}/plans/{planId}/{fileName}` stores photos in Cloud Storage.

The app migrates saved plans from this browser's legacy local storage on sign-in. Existing data attached to an old anonymous Firebase account will not automatically transfer to a new email/password account.
