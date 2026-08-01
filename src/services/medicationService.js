import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../utils/firebase';

const saveToLocalStorage = (userId, newMed) => {
  const localMeds = JSON.parse(localStorage.getItem(`meds_${userId}`) || '[]');
  // Check if exists
  const index = localMeds.findIndex(m => m.id === newMed.id);
  if (index >= 0) {
    localMeds[index] = { ...localMeds[index], ...newMed };
  } else {
    localMeds.unshift(newMed);
  }
  localStorage.setItem(`meds_${userId}`, JSON.stringify(localMeds));
  window.dispatchEvent(new Event('local_meds_updated'));
};

const removeFromLocalStorage = (userId, medId) => {
  const localMeds = JSON.parse(localStorage.getItem(`meds_${userId}`) || '[]');
  const filtered = localMeds.filter(m => m.id !== medId);
  localStorage.setItem(`meds_${userId}`, JSON.stringify(filtered));
  window.dispatchEvent(new Event('local_meds_updated'));
};

export const addMedication = async (userId, data) => {
  const activeUserId = userId || 'demo_user';
  const tempId = `local_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const localMed = {
    id: tempId,
    ...data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // 1. Immediately persist locally so data is never lost
  saveToLocalStorage(activeUserId, localMed);

  // 2. Try Firestore with a 1.5s timeout so the UI never hangs
  const firestorePromise = (async () => {
    const medicationsRef = collection(db, `users/${activeUserId}/medications`);
    const res = await addDoc(medicationsRef, {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    removeFromLocalStorage(activeUserId, tempId);
    saveToLocalStorage(activeUserId, { ...localMed, id: res.id });
    return res;
  })();

  const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve(localMed), 1500));

  try {
    return await Promise.race([firestorePromise, timeoutPromise]);
  } catch (err) {
    console.warn('Firestore sync error, fallback to local storage:', err);
    return localMed;
  }
};

export const updateMedication = async (userId, medId, data) => {
  const activeUserId = userId || 'demo_user';
  // Update local storage
  saveToLocalStorage(activeUserId, { id: medId, ...data, updatedAt: new Date().toISOString() });

  try {
    const medicationRef = doc(db, `users/${activeUserId}/medications`, medId);
    await updateDoc(medicationRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
  } catch (err) {
    console.warn('Firestore update failed, kept in LocalStorage backup:', err);
  }
};

export const deleteMedication = async (userId, medId) => {
  const activeUserId = userId || 'demo_user';
  // Delete from local storage
  removeFromLocalStorage(activeUserId, medId);

  try {
    const medicationRef = doc(db, `users/${activeUserId}/medications`, medId);
    await deleteDoc(medicationRef);
  } catch (err) {
    console.warn('Firestore delete failed, removed from LocalStorage:', err);
  }
};


