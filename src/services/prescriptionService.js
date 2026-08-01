import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '../utils/firebase';

export const saveScanHistory = async (userId, data) => {
  try {
    const prescriptionsRef = collection(db, `users/${userId}/prescriptions`);
    return await addDoc(prescriptionsRef, {
      ...data,
      scanDate: serverTimestamp()
    });
  } catch (err) {
    const history = JSON.parse(localStorage.getItem(`scans_${userId}`) || '[]');
    const newScan = {
      id: `scan_${Date.now()}`,
      ...data,
      scanDate: { toDate: () => new Date() }
    };
    history.unshift(newScan);
    localStorage.setItem(`scans_${userId}`, JSON.stringify(history));
    return newScan;
  }
};

export const getScanHistory = async (userId) => {
  try {
    const prescriptionsRef = collection(db, `users/${userId}/prescriptions`);
    const q = query(prescriptionsRef, orderBy('scanDate', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (err) {
    const history = JSON.parse(localStorage.getItem(`scans_${userId}`) || '[]');
    return history;
  }
};

export const deleteScanHistory = async (userId, scanId) => {
  try {
    const scanRef = doc(db, `users/${userId}/prescriptions`, scanId);
    return await deleteDoc(scanRef);
  } catch (err) {
    const history = JSON.parse(localStorage.getItem(`scans_${userId}`) || '[]');
    const updated = history.filter(s => s.id !== scanId);
    localStorage.setItem(`scans_${userId}`, JSON.stringify(updated));
  }
};

