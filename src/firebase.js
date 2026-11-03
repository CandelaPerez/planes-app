import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getDownloadURL, getStorage, ref as storageRef, uploadBytes, uploadString } from 'firebase/storage';
import { collection, collectionGroup, doc, getDoc, getFirestore, onSnapshot, query, runTransaction, serverTimestamp, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const firebaseRequested = import.meta.env.VITE_USE_FIREBASE === 'true';
export const firebaseConfigured = firebaseRequested && Object.values(config).every(Boolean);
const app = firebaseConfigured ? initializeApp(config) : null;
export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;
export const storage = app ? getStorage(app) : null;
let signInInFlight;

export async function startAnonymousSession() {
  if (!auth) throw new Error('Falta configurar Firebase en el archivo .env.local.');
  if (auth.currentUser) return auth.currentUser;
  if (!signInInFlight) {
    signInInFlight = signInAnonymously(auth).then((credential) => credential.user).finally(() => { signInInFlight = null; });
  }
  return signInInFlight;
}

export async function syncCatalog(ideas) {
  await Promise.all(ideas.map((idea) => runTransaction(db, async (transaction) => {
    const ref = doc(db, 'plans', idea.id);
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists()) {
      // Limpia propiedades con valor undefined para que Firestore no rechace el objeto
      const cleanIdea = Object.fromEntries(
        Object.entries(idea).filter(([, value]) => value !== undefined)
      );
      transaction.set(ref, { ...cleanIdea, isCatalog: true, createdAt: serverTimestamp() });
    }
  })));
}

export function watchCatalog(onData, onError) {
  return onSnapshot(collection(db, 'plans'), (snapshot) => {
    onData(snapshot.docs.filter((item) => item.data().isCatalog).map((item) => ({ id: item.id, ...item.data() })));
  }, onError);
}

export function watchSavedPlans(uid, onData, onError) {
  return onSnapshot(collection(db, 'users', uid, 'savedPlans'), (snapshot) => {
    onData(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
  }, onError);
}

export function watchRatings(onData, onError) {
  return onSnapshot(query(collectionGroup(db, 'ratings')), (snapshot) => {
    onData(snapshot.docs.map((item) => ({ ...item.data(), ratingId: item.id, planId: item.ref.parent.parent?.id })));
  }, onError);
}

export async function savePlan(uid, plan) {
  const ref = plan.id
    ? doc(db, 'users', uid, 'savedPlans', plan.id)
    : doc(collection(db, 'users', uid, 'savedPlans'));
  await setDoc(ref, { ...plan, id: ref.id, updatedAt: serverTimestamp() });
  return ref.id;
}

const migrationsInFlight = new Map();
export function migrateLegacyPlans(uid, catalog = []) {
  if (migrationsInFlight.has(uid)) return migrationsInFlight.get(uid);
  const migration = (async () => {
    const legacy = localStorage.getItem('porhacer_user_plans');
    if (!legacy) return;
    const savedRef = collection(db, 'users', uid, 'savedPlans');
    const plans = JSON.parse(legacy);
    for (const plan of plans) {
      const catalogMatch = catalog.find((idea) => idea.title.toLocaleLowerCase('es') === String(plan.title || '').toLocaleLowerCase('es'));
      const id = catalogMatch?.id || plan.id || doc(savedRef).id;
      const ref = doc(savedRef, id);
      if ((await getDoc(ref)).exists()) continue;
      let image = plan.image;
      if (typeof image === 'string' && image.startsWith('data:image/')) {
        const match = image.match(/^data:(image\/[^;]+);/);
        const fileRef = storageRef(storage, `users/${uid}/plans/${id}/legacy`);
        await uploadString(fileRef, image, 'data_url', { contentType: match?.[1] || 'image/jpeg' });
        image = await getDownloadURL(fileRef);
      }
      await runTransaction(db, async (transaction) => {
        const snapshot = await transaction.get(ref);
        if (!snapshot.exists()) transaction.set(ref, { ...plan, image, id, catalogId: plan.catalogId || catalogMatch?.id || null, updatedAt: serverTimestamp() });
      });
    }
    localStorage.removeItem('porhacer_user_plans');
  })();
  migrationsInFlight.set(uid, migration);
  return migration;
}

export async function updateSavedPlan(uid, id, updates) {
  await updateDoc(doc(db, 'users', uid, 'savedPlans', id), { ...updates, updatedAt: serverTimestamp() });
}

export async function removeSavedPlan(uid, id) {
  const planRef = doc(db, 'users', uid, 'savedPlans', id);
  const snapshot = await getDoc(planRef);
  if (snapshot.exists() && !snapshot.data().catalogId) {
    await deleteDoc(doc(db, 'plans', id, 'ratings', uid));
  }
  await deleteDoc(planRef);
}

export async function uploadPlanPhoto(uid, planId, file) {
  if (!file.type.startsWith('image/') || file.size > 8 * 1024 * 1024) {
    throw new Error('Elige una imagen de hasta 8 MB.');
  }
  const fileRef = storageRef(storage, `users/${uid}/plans/${planId}/${crypto.randomUUID()}`);
  await uploadBytes(fileRef, file, { contentType: file.type });
  const imageUrl = await getDownloadURL(fileRef);
  await updateSavedPlan(uid, planId, { image: imageUrl });
}

export async function saveRating(uid, planId, value, savedPlanId = null) {
  const savedPlanRef = savedPlanId ? doc(db, 'users', uid, 'savedPlans', savedPlanId) : null;
  const planRef = savedPlanRef || doc(db, 'plans', planId);
  const ratingPlanRef = savedPlanRef && planId ? doc(db, 'plans', planId) : planRef;
  const ratingRef = doc(collection(ratingPlanRef, 'ratings'), uid);
  await runTransaction(db, async (transaction) => {
    const planSnapshot = await transaction.get(planRef);
    if (!planSnapshot.exists()) throw new Error('No se encontró el plan para guardar la valoración.');
    if (savedPlanId && planSnapshot.data().status !== 'realizado') {
      throw new Error('Primero marca el plan como realizado para poder valorarlo.');
    }
    transaction.set(ratingRef, { userId: uid, value, updatedAt: serverTimestamp() });
    if (savedPlanRef) transaction.update(savedPlanRef, { rating: value, updatedAt: serverTimestamp() });
  });
}