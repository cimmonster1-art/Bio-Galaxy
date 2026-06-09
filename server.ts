import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized Gemini API client
let aiInstance: GoogleGenAI | null = null;
function getAI(): GoogleGenAI {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is missing. Please set it in your environment or Secrets pane.");
    }
    aiInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiInstance;
}

// API endpoint for interactive bio-computer inquiries
app.post("/api/chat", async (req, res) => {
  try {
    const { message, scale, element } = req.body;
    
    if (!message) {
      res.status(400).json({ error: "Message is required." });
      return;
    }

    const ai = getAI();
    const systemPrompt = `You are "Bio-Nexus", an advanced on-board bio-intelligence exploration assistant on a ship exploring the Biological Galaxy. 
The user is currently positioned at scale magnification level: "${scale || 'unknown'}" and probing the biological structure: "${element || 'general environment'}".
In the "Biological Galaxy", we map the sub-cellular world onto cosmic scales (cell as a solar system, organelles as orbiting planets, proteins as meteorites/satellites, DNA as a giant spiraling galaxy, molecular forces as gravity).
Respond in a highly engaging, scientific, yet poetic and futuristic tone. 
Keep your response concise (maximum 3 brief paragraphs/bullet items), using clean Markdown formatting. Compare biology to cosmology where appropriate to fit this inverted-scale theme.`;

    const prompt = `Current status report requested. Input from user explorer: "${message}"`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.8,
      },
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ 
      error: error.message || "Failed to communicate with the biological computer core." 
    });
  }
});

// Serve frontend assets
async function start() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // Serve HTML
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Biological Galaxy core online at http://localhost:${PORT}`);
  });
}

start();
