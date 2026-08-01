import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '../utils/firebase';

export const saveScanHistory = async (userId, data) => {
  const prescriptionsRef = collection(db, `users/${userId}/prescriptions`);
  return await addDoc(prescriptionsRef, {
    ...data,
    scanDate: serverTimestamp()
  });
};

export const getScanHistory = async (userId) => {
  const prescriptionsRef = collection(db, `users/${userId}/prescriptions`);
  const q = query(prescriptionsRef, orderBy('scanDate', 'desc'));
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

export const deleteScanHistory = async (userId, scanId) => {
  const scanRef = doc(db, `users/${userId}/prescriptions`, scanId);
  return await deleteDoc(scanRef);
};
