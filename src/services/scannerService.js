import { analyzePrescription } from './geminiService';

export const extractMedicationsFromImage = async (imageFileOrUrl) => {
  // If it's a URL, we need to fetch it as a blob first (in a real scenario, you'd pass the file blob directly to Gemini before upload, or download it here).
  // For simplicity, we assume imageFileOrUrl is the File object if called before upload, 
  // but if it's the downloadURL, we need to fetch the blob.
  
  let blob = imageFileOrUrl;
  if (typeof imageFileOrUrl === 'string') {
    const response = await fetch(imageFileOrUrl);
    blob = await response.blob();
  }

  // Call the Gemini service to parse it
  return await analyzePrescription(blob);
};
