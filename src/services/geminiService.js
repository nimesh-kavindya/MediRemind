import { httpsCallable } from 'firebase/functions';
import { functions } from '../utils/firebase';

const fileToBase64 = (fileBlob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(fileBlob);
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = (error) => reject(error);
  });
};

export const analyzePrescription = async (imageFile) => {
  try {
    const analyzeFn = httpsCallable(functions, 'analyzePrescription');
    
    const imageBase64 = await fileToBase64(imageFile);
    
    // Call the Cloud Function
    const result = await analyzeFn({ 
      imageBase64, 
      mimeType: imageFile.type 
    });
    
    const parsedData = result.data;
    
    // Map to our internal schema
    return parsedData.map(med => ({
      id: `gemini_${Math.random().toString(36).substr(2, 9)}`,
      name: med.name || 'Unknown',
      dosage: med.dosage || '1 pill',
      type: 'pill', // Default fallback
      frequency: med.frequency || 'Daily',
      mealTiming: med.mealTiming?.toLowerCase().includes('before') ? 'before_meal' : 
                  med.mealTiming?.toLowerCase().includes('after') ? 'after_meal' : 'anytime',
      reminderTime: med.times && med.times.length > 0 ? med.times[0] : '08:00',
      confidence: 99,
      selected: true,
      notes: med.strength ? `Strength: ${med.strength}. Duration: ${med.duration || 'N/A'}` : ''
    }));

  } catch (error) {
    console.error('Gemini API Error:', error);
    throw new Error('Failed to analyze prescription using AI.');
  }
};
