import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../utils/firebase';

export const addMedication = async (userId, data) => {
  const medicationsRef = collection(db, `users/${userId}/medications`);
  return await addDoc(medicationsRef, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
};

export const updateMedication = async (userId, medId, data) => {
  const medicationRef = doc(db, `users/${userId}/medications`, medId);
  return await updateDoc(medicationRef, {
    ...data,
    updatedAt: serverTimestamp()
  });
};

export const deleteMedication = async (userId, medId) => {
  const medicationRef = doc(db, `users/${userId}/medications`, medId);
  return await deleteDoc(medicationRef);
};
