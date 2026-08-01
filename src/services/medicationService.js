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
  try {
    const localMeds = JSON.parse(localStorage.getItem(`meds_${userId}`) || '[]');
    // Check if exists
    const index = localMeds.findIndex(m => m.id === newMed.id);
    
    const resolvedMed = { ...newMed };
    // Synchronize all supply fields so the app is 100% robust and compatible
    let supply = parseInt(resolvedMed.totalSupply, 10) || 30;
    if (resolvedMed.remainingSupply !== undefined && resolvedMed.remainingSupply !== null) {
      supply = parseInt(resolvedMed.remainingSupply, 10);
    } else if (resolvedMed.dosesLeft !== undefined && resolvedMed.dosesLeft !== null) {
      supply = parseInt(resolvedMed.dosesLeft, 10);
    } else if (resolvedMed.remainingDoses !== undefined && resolvedMed.remainingDoses !== null) {
      supply = parseInt(resolvedMed.remainingDoses, 10);
    } else if (index >= 0) {
      const existing = localMeds[index];
      if (existing.remainingSupply !== undefined) supply = parseInt(existing.remainingSupply, 10);
      else if (existing.dosesLeft !== undefined) supply = parseInt(existing.dosesLeft, 10);
      else if (existing.remainingDoses !== undefined) supply = parseInt(existing.remainingDoses, 10);
    }
      
    resolvedMed.remainingSupply = supply;
    resolvedMed.dosesLeft = supply;
    resolvedMed.remainingDoses = supply;

    if (index >= 0) {
      localMeds[index] = { ...localMeds[index], ...resolvedMed };
    } else {
      localMeds.unshift(resolvedMed);
    }
    localStorage.setItem(`meds_${userId}`, JSON.stringify(localMeds));
    window.dispatchEvent(new Event('local_meds_updated'));
  } catch (e) {
    console.error('saveToLocalStorage failed', e);
  }
};

const removeFromLocalStorage = (userId, medId) => {
  try {
    const localMeds = JSON.parse(localStorage.getItem(`meds_${userId}`) || '[]');
    const filtered = localMeds.filter(m => m.id !== medId);
    localStorage.setItem(`meds_${userId}`, JSON.stringify(filtered));
    window.dispatchEvent(new Event('local_meds_updated'));
  } catch (e) {
    console.error('removeFromLocalStorage failed', e);
  }
};

export const addMedication = async (userId, data) => {
  const activeUserId = userId || 'demo_user';
  // Generate unique ID strictly matching the requested format
  const medId = String(Date.now() + Math.random());
  const localMed = {
    id: medId,
    ...data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // 1. Immediately persist locally so data is never lost
  saveToLocalStorage(activeUserId, localMed);

  // 2. Try Firestore with a 1.5s timeout so the UI never hangs
  const firestorePromise = (async () => {
    try {
      const { doc, setDoc } = await import('firebase/firestore');
      const medicationRef = doc(db, `users/${activeUserId}/medications`, medId);
      await setDoc(medicationRef, {
        id: medId,
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (e) {
      console.warn('Firestore setDoc failed:', e);
    }
    return { id: medId };
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


