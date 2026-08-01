const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { GoogleGenerativeAI } = require('@google/generative-ai');

admin.initializeApp();

const PROMPT = `Analyze the uploaded prescription image. Extract the following information and return ONLY a valid JSON array, with no markdown formatting or explanation. Each object in the array must match this structure exactly:
[
  {
    "name": "Medicine Name (String)",
    "strength": "Strength e.g., 500mg (String)",
    "dosage": "Dosage e.g., 1 Tablet (String)",
    "frequency": "Frequency e.g., Twice Daily (String)",
    "mealTiming": "Meal Timing e.g., After Meals (String)",
    "duration": "Duration e.g., 7 days (String)",
    "times": ["HH:MM", "HH:MM"]
  }
]`;

exports.analyzePrescription = functions.https.onCall(async (data, context) => {
  // 1. Authenticate Request
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'You must be signed in to analyze a prescription.'
    );
  }

  const { imageBase64, mimeType } = data;

  if (!imageBase64) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'No image data provided.'
    );
  }

  // 2. Initialize Gemini securely (using Firebase env config or Secrets Manager in prod)
  // For demo, assuming config variable: firebase functions:config:set gemini.key="YOUR_KEY"
  const apiKey = functions.config().gemini?.key || process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new functions.https.HttpsError(
      'failed-precondition',
      'Server configuration error: Gemini API key missing.'
    );
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const imagePart = {
      inlineData: {
        data: imageBase64,
        mimeType: mimeType || 'image/jpeg',
      },
    };

    const result = await model.generateContent([PROMPT, imagePart]);
    const responseText = result.response.text();
    
    // Clean markdown
    const cleanedJsonStr = responseText.replace(/```json/gi, '').replace(/```/gi, '').trim();
    const parsedData = JSON.parse(cleanedJsonStr);

    return parsedData;
  } catch (error) {
    console.error('Error analyzing prescription:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Failed to analyze prescription.',
      error.message
    );
  }
});
