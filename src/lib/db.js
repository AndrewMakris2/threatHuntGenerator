/**
 * Firestore database helpers
 * Each user's data lives under /users/{userId}/...
 */
import {
  collection, doc, getDocs, setDoc, deleteDoc,
  query, orderBy, serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';

// ── Companies ─────────────────────────────────────────────────────────────────

export async function dbLoadCompanies(userId) {
  const ref = collection(db, 'users', userId, 'companies');
  const snap = await getDocs(query(ref, orderBy('updatedAt', 'desc')));
  return snap.docs.map(d => ({ ...d.data(), id: d.id }));
}

export async function dbSaveCompany(userId, company) {
  const ref = doc(db, 'users', userId, 'companies', company.id);
  await setDoc(ref, { ...company, updatedAt: serverTimestamp() }, { merge: true });
}

export async function dbDeleteCompany(companyId, userId) {
  const ref = doc(db, 'users', userId, 'companies', companyId);
  await deleteDoc(ref);
}

// ── Saved Hunts ───────────────────────────────────────────────────────────────

export async function dbLoadSavedHunts(userId) {
  const ref = collection(db, 'users', userId, 'savedHunts');
  const snap = await getDocs(query(ref, orderBy('savedAt', 'desc')));
  return snap.docs.map(d => ({ ...d.data(), id: d.id }));
}

export async function dbSaveHunt(userId, hunt) {
  const ref = doc(db, 'users', userId, 'savedHunts', hunt.id);
  await setDoc(ref, { ...hunt, savedAt: serverTimestamp() }, { merge: true });
}

export async function dbUnsaveHunt(huntId, userId) {
  const ref = doc(db, 'users', userId, 'savedHunts', huntId);
  await deleteDoc(ref);
}

// ── User Settings ─────────────────────────────────────────────────────────────

export async function dbLoadSettings(userId) {
  const snap = await getDocs(collection(db, 'users', userId, 'settings'));
  const settingsDoc = snap.docs.find(d => d.id === 'ai');
  return settingsDoc ? settingsDoc.data() : null;
}

export async function dbSaveSettings(userId, settings) {
  const ref = doc(db, 'users', userId, 'settings', 'ai');
  await setDoc(ref, { ...settings, updatedAt: serverTimestamp() }, { merge: true });
}
