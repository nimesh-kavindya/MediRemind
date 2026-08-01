import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../utils/firebase';

const compressImage = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200;
        const scaleSize = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scaleSize;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          resolve(new File([blob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now()
          }));
        }, 'image/jpeg', 0.7); // 70% quality
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};

export const uploadPrescriptionImage = async (userId, file) => {
  try {
    const compressedFile = await compressImage(file);
    
    // Generate a unique file name
    const extension = 'jpg';
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${extension}`;
    
    try {
      const storageRef = ref(storage, `users/${userId}/prescriptions/${fileName}`);
      const snapshot = await uploadBytes(storageRef, compressedFile);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      return {
        downloadURL,
        fileName,
        uploadedAt: new Date().toISOString()
      };
    } catch (storageErr) {
      console.warn('Firebase Storage offline/unconfigured, using local data URL fallback', storageErr);
      const dataUrl = await new Promise((res) => {
        const reader = new FileReader();
        reader.onload = e => res(e.target.result);
        reader.readAsDataURL(compressedFile);
      });
      return {
        downloadURL: dataUrl,
        fileName,
        uploadedAt: new Date().toISOString()
      };
    }
  } catch (error) {
    console.error('Image compression or upload error:', error);
    throw new Error('Image process/upload failed');
  }
};

