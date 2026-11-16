import { collection, getDocsFromServer } from 'firebase/firestore';
import { firebaseConfigured, auth, db } from './firebase.js';

// Explicit, read-only diagnostic. Never imports local plans or changes an account.
export async function inspectSavedPlansSync() {
  const local = ['porhacer_preview_plans', 'porhacer_user_plans'].map(key => {
    try {
      const value = localStorage.getItem(key);
      const records = value ? JSON.parse(value) : [];
      return { key, total: Array.isArray(records) ? records.length : null,
        itineraries: Array.isArray(records) ? records.filter(plan => plan.type === 'itinerary').length : null };
    } catch { return { key, error: 'No se pudo leer el almacenamiento local.' }; }
  });
  const result = { mode: firebaseConfigured ? 'firestore' : 'local-preview',
    projectId: db?.app.options.projectId || import.meta.env.VITE_FIREBASE_PROJECT_ID || null,
    database: '(default)', uid: auth?.currentUser?.uid || null,
    email: auth?.currentUser?.email || null, local };
  if (!firebaseConfigured || !result.uid) return { ...result, serverConfirmed: false };
  const path = `users/${result.uid}/savedPlans`;
  const snapshot = await getDocsFromServer(collection(db, 'users', result.uid, 'savedPlans'));
  if (auth.currentUser?.uid !== result.uid) throw Error('La cuenta cambió durante el diagnóstico.');
  const documents = snapshot.docs.map(record => ({ id: record.id,
    storedId: record.data().id || null, type: record.data().type || 'plan',
    path: record.ref.path, pendingWrites: record.metadata.hasPendingWrites }));
  return { ...result, path, serverConfirmed: !snapshot.metadata.fromCache && !snapshot.metadata.hasPendingWrites,
    total: snapshot.size, plans: documents.filter(record => record.type !== 'itinerary').length,
    itineraries: documents.filter(record => record.type === 'itinerary').length, documents };
}
