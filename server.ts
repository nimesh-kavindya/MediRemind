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
    return res.status(500).json({ error: 'Server configuration error: Gemini API key missing.' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
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
      model: 'gemini-1.5-flash',
      contents: contentParts,
    });

    if (!response || !response.text) {
      throw new Error('No response from AI model');
    }

    const responseText = response.text || '';
    const cleanedJsonStr = responseText.replace(/```json/gi, '').replace(/```/gi, '').trim();
    
    let parsedData = [];
    try {
      parsedData = JSON.parse(cleanedJsonStr);
    } catch {
      throw new Error('Failed to parse AI response into JSON');
    }

    return res.json(parsedData);
  } catch (error: any) {
    console.error('Gemini API scanner error:', error?.message || String(error));
    return res.status(500).json({ error: 'Failed to analyze prescription. Please try again.' });
  }
});

// API route for AI Medication Help Chat
app.post('/api/chat-medication', async (req, res) => {
  const { message, history } = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Message is required' });
  }

  const rawKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';
  const apiKey = rawKey.trim();

  if (!apiKey || apiKey === 'undefined' || apiKey === 'null') {
    return res.status(500).json({ error: 'Server configuration error: Gemini API key missing.' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

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
      model: 'gemini-1.5-flash',
      contents,
      config: {
        systemInstruction: "You are MediRemind AI, an empathetic healthcare assistant for the MediRemind application. Help users understand medication timing, side effects, and health habits clearly and concisely. Always include a brief medical disclaimer.",
        temperature: 0.7,
      }
    });

    if (!response || !response.text) {
      throw new Error('No response from AI model');
    }

    return res.json({ reply: response.text });
  } catch (error: any) {
    console.error('Gemini Chat API error:', error?.message || String(error));
    return res.status(500).json({ error: 'Failed to communicate with AI assistant. Please try again.' });
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
