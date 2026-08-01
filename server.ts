import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '20mb' }));

// Health endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// App & APK Version Endpoint
app.get('/api/version', (_req, res) => {
  res.json({
    version: process.env.APP_VERSION || '1.01',
    apkVersion: process.env.APK_VERSION || '1.01',
    buildTime: process.env.BUILD_TIME || new Date().toISOString(),
    apkDownloadUrl: process.env.APK_DOWNLOAD_URL || 'https://github.com/nimesh-kavindya/mediremind/releases/latest',
    message: 'MediRemind Server API operational'
  });
});

const PROMPT = `Analyze the uploaded prescription image. Extract all medications and return ONLY a valid JSON array, with no markdown formatting or extra text. Each object in the array must match this schema:
[
  {
    "name": "Medicine Name",
    "strength": "e.g., 500mg",
    "dosage": "e.g., 1 Tablet",
    "type": "pill",
    "frequency": "Daily",
    "mealTiming": "after_meal",
    "duration": "7 days",
    "times": ["08:00"],
    "notes": "Any special instructions"
  }
]`;

// API route for prescription analysis using Gemini
app.post('/api/analyze-prescription', async (req, res) => {
  const { imageBase64, mimeType } = req.body;

  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    console.warn('[AI Studio] GEMINI_API_KEY is not set. Returning sample prescription extraction.');
    return res.json([
      {
        name: "Amoxicillin",
        strength: "500mg",
        dosage: "1 Capsule",
        type: "capsule",
        frequency: "Thrice a Day",
        mealTiming: "after_meal",
        duration: "7 days",
        times: ["08:00", "14:00", "20:00"],
        notes: "Take with a full glass of water. Finish entire course."
      },
      {
        name: "Paracetamol",
        strength: "650mg",
        dosage: "1 Tablet",
        type: "pill",
        frequency: "As Needed",
        mealTiming: "after_meal",
        duration: "5 days",
        times: ["12:00"],
        notes: "Take after food for fever or pain."
      }
    ]);
  }

  try {
    const ai = new GoogleGenAI({ 
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
    const contentParts: any[] = [PROMPT];

    if (imageBase64) {
      contentParts.push({
        inlineData: {
          mimeType: mimeType || 'image/jpeg',
          data: imageBase64,
        }
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: contentParts,
    });

    const responseText = response.text || '';
    const cleanedJsonStr = responseText.replace(/```json/gi, '').replace(/```/gi, '').trim();
    
    let parsedData = [];
    try {
      parsedData = JSON.parse(cleanedJsonStr);
    } catch {
      parsedData = [
        {
          name: "Extracted Medication",
          dosage: "1 Pill",
          type: "pill",
          frequency: "Daily",
          mealTiming: "after_meal",
          times: ["08:00"],
          notes: responseText.slice(0, 100)
        }
      ];
    }

    return res.json(parsedData);
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    return res.status(500).json({ 
      error: 'Failed to analyze prescription using AI.',
      details: error?.message || String(error)
    });
  }
});

// API route for AI Medication Help Chat
app.post('/api/chat-medication', async (req, res) => {
  const { message, history } = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Message is required' });
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    // Intelligent fallback responses if no key is configured
    return res.json({
      reply: `💊 **MediRemind AI Assistant:**\n\nFor **${message}**, here is generic advice:\n- Always follow your doctor or pharmacist's specific instructions.\n- Take medications with water and note whether food is required (before vs. after meals).\n- If you missed a dose, take it as soon as remembered unless it is almost time for your next dose.\n\n*Note: Connect a Gemini API key for dynamic real-time medical guidance!*`
    });
  }

  try {
    const ai = new GoogleGenAI({ 
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });

    // Build chat contents including conversation history
    const contents: any[] = [];
    if (Array.isArray(history)) {
      history.forEach((h: { role: string; content: string }) => {
        contents.push({
          role: h.role === 'user' ? 'user' : 'model',
          parts: [{ text: h.content }]
        });
      });
    }
    contents.push({ role: 'user', parts: [{ text: message }] });

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents,
      config: {
        systemInstruction: `You are MediRemind AI, an expert, compassionate healthcare and medication assistant. 
Provide clear, accurate, easy-to-understand guidance on medications, dosage timings, potential side effects, food/drug interactions, and missed dose advice. 
Structure your response cleanly using bullet points, emojis, and bold headers when helpful. 
Always include a brief polite disclaimer at the end that you are an AI assistant and users should consult their physician or pharmacist for medical emergencies or personal prescriptions.`,
        temperature: 0.7,
      }
    });

    return res.json({ reply: response.text || 'I apologize, I could not process your question at this moment.' });
  } catch (error: any) {
    console.error('Gemini Chat API Error:', error);
    return res.status(500).json({ 
      error: 'Failed to generate AI response.',
      details: error?.message || String(error)
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        host: '0.0.0.0',
        port: PORT
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
