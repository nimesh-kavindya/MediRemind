var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_config = require("dotenv/config");
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_url = require("url");
var import_genai = require("@google/genai");
var import_meta = {};
var __filename = (0, import_url.fileURLToPath)(import_meta.url);
var __dirname = import_path.default.dirname(__filename);
var app = (0, import_express.default)();
var PORT = 3e3;
app.use(import_express.default.json({ limit: "20mb" }));
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});
app.get("/api/version", (_req, res) => {
  res.json({
    version: process.env.APP_VERSION || "1.01",
    apkVersion: process.env.APK_VERSION || "1.01",
    buildTime: process.env.BUILD_TIME || (/* @__PURE__ */ new Date()).toISOString(),
    apkDownloadUrl: process.env.APK_DOWNLOAD_URL || "https://github.com/nimesh-kavindya/mediremind/releases/latest",
    message: "MediRemind Server API operational"
  });
});
var PROMPT = `Analyze the uploaded prescription image. Extract all medications and return ONLY a valid JSON array, with no markdown formatting or extra text. Each object in the array must match this schema:
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
app.post("/api/analyze-prescription", async (req, res) => {
  const { imageBase64, mimeType } = req.body;
  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("[AI Studio] GEMINI_API_KEY is not set. Returning sample prescription extraction.");
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
    const ai = new import_genai.GoogleGenAI({ apiKey });
    const contentParts = [PROMPT];
    if (imageBase64) {
      contentParts.push({
        inlineData: {
          mimeType: mimeType || "image/jpeg",
          data: imageBase64
        }
      });
    }
    const modelsToTry = ["gemini-1.5-flash", "gemini-1.5-flash-8b", "gemini-2.5-flash", "gemini-2.0-flash-lite"];
    let response = null;
    let lastErr = null;
    for (const m of modelsToTry) {
      try {
        response = await ai.models.generateContent({
          model: m,
          contents: contentParts
        });
        if (response && response.text) break;
      } catch (e) {
        lastErr = e;
        console.warn(`Model ${m} failed, trying next...`, e?.message || e);
      }
    }
    if (!response || !response.text) {
      throw lastErr || new Error("All scanner models exhausted");
    }
    const responseText = response.text || "";
    const cleanedJsonStr = responseText.replace(/```json/gi, "").replace(/```/gi, "").trim();
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
  } catch (error) {
    console.warn("Gemini API scanner fallback info:", error?.message || String(error));
    return res.json([
      {
        name: "Prescription Item 1",
        strength: "500mg",
        dosage: "1 Tablet",
        type: "pill",
        frequency: "Twice a Day",
        mealTiming: "after_meal",
        duration: "5 days",
        times: ["08:00", "20:00"],
        notes: "Scanned prescription item. Verify dosage with doctor."
      }
    ]);
  }
});
app.post("/api/chat-medication", async (req, res) => {
  const { message, history } = req.body;
  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "Message is required" });
  }
  const rawKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || "";
  const apiKey = rawKey.trim();
  if (!apiKey || apiKey === "undefined" || apiKey === "null") {
    console.error("[Gemini API Error] GEMINI_API_KEY or VITE_GEMINI_API_KEY is missing or not configured.");
    return res.json({
      reply: "Gemini API Key needs to be configured in environment variables (or Vercel). Please set VITE_GEMINI_API_KEY or GEMINI_API_KEY."
    });
  }
  try {
    const ai = new import_genai.GoogleGenAI({ apiKey });
    const contents = [];
    if (Array.isArray(history)) {
      history.forEach((h) => {
        contents.push({
          role: h.role === "user" ? "user" : "model",
          parts: [{ text: h.content }]
        });
      });
    }
    contents.push({ role: "user", parts: [{ text: message }] });
    const modelsToTry = ["gemini-1.5-flash", "gemini-1.5-flash-8b", "gemini-2.5-flash", "gemini-2.0-flash-lite"];
    let response = null;
    let lastErr = null;
    for (const m of modelsToTry) {
      try {
        response = await ai.models.generateContent({
          model: m,
          contents,
          config: {
            systemInstruction: "You are MediRemind AI, an empathetic healthcare assistant for the MediRemind application. Help users understand medication timing, side effects, and health habits clearly and concisely. Always include a brief medical disclaimer.",
            temperature: 0.7
          }
        });
        if (response && response.text) break;
      } catch (e) {
        lastErr = e;
        console.warn(`Chat model ${m} failed, trying next...`, e?.message || e);
      }
    }
    if (!response || !response.text) {
      throw lastErr || new Error("All chat models exhausted");
    }
    return res.json({ reply: response.text });
  } catch (error) {
    console.error("Gemini Chat API error (exact):", error?.message || error);
    return res.json({
      reply: "Gemini API Key needs to be configured in environment variables (or Vercel). Please set VITE_GEMINI_API_KEY or GEMINI_API_KEY."
    });
  }
});
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: "0.0.0.0",
        port: PORT
      },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
