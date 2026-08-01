import { GoogleGenerativeAI } from '@google/generative-ai';

const fileToBase64 = (fileBlob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(fileBlob);
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = (error) => reject(error);
  });
};

const PROMPT = `Analyze the uploaded prescription image. Extract the following information and return ONLY a valid JSON array, with no markdown formatting or explanation. Each object in the array must match this structure exactly:
[
  {
    "name": "Medicine Name (String)",
    "strength": "Strength e.g., 500mg (String)",
    "dosage": "Dosage e.g., 1 Tablet (String)",
    "frequency": "Frequency e.g., Twice Daily (String)",
    "mealTiming": "Meal Timing e.g., After Meals (String)",
    "duration": "Duration e.g., 7 days (String)",
    "times": ["HH:MM", "HH:MM"] // Suggested 24-hour reminder times based on frequency
  }
]`;

export const analyzePrescription = async (imageFile) => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Gemini API key is not configured. Please add VITE_GEMINI_API_KEY to your environment variables.');
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    let imageBase64 = null;
    let mimeType = 'image/jpeg';
    
    if (imageFile instanceof Blob || imageFile instanceof File) {
      imageBase64 = await fileToBase64(imageFile);
      mimeType = imageFile.type || 'image/jpeg';
    }

    const imagePart = {
      inlineData: { data: imageBase64, mimeType },
    };
    
    const result = await model.generateContent([PROMPT, imagePart]);
    const responseText = result.response.text();
    
    // Clean up any potential markdown backticks
    const cleanedJsonStr = responseText.replace(/```json/gi, '').replace(/```/gi, '').trim();
    
    const parsedData = JSON.parse(cleanedJsonStr);
    
    // Map to our internal schema
    return (parsedData || []).map(med => ({
      id: `gemini_${Math.random().toString(36).substr(2, 9)}`,
      name: med.name || 'Unknown Medicine',
      dosage: med.dosage || med.strength || '1 pill',
      type: 'pill', // Default fallback
      frequency: med.frequency || 'Daily',
      mealTiming: typeof med.mealTiming === 'string' && med.mealTiming.toLowerCase().includes('before') ? 'before_meal' : 
                  typeof med.mealTiming === 'string' && med.mealTiming.toLowerCase().includes('after') ? 'after_meal' : 'anytime',
      reminderTime: med.times && med.times.length > 0 ? med.times[0] : '08:00',
      confidence: 99,
      selected: true,
      notes: med.notes || (med.strength ? `Strength: ${med.strength}. Duration: ${med.duration || 'N/A'}` : '')
    }));

  } catch (error) {
    console.error('Gemini API Error:', error);
    throw new Error(error.message || 'Failed to analyze prescription using AI. Please check your API key.');
  }
};
