import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Create Express application
const app = express();
const PORT = 3000;

// Body parser middleware for handling chat messages
app.use(express.json({ limit: "5mb" }));

// Helper to safely initialize and use Gemini SDK
let aiInstance: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not defined. Please add your key in Settings > Secrets.");
  }
  
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        }
      }
    });
  }
  return aiInstance;
}

// API Health route
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    apiKeyAvailable: !!process.env.GEMINI_API_KEY,
    timestamp: new Date().toISOString()
  });
});

// Chat endpoint proxying requests to Gemini API
app.post("/api/chat", async (req, res) => {
  try {
    const { messages, systemInstruction, temperature } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Invalid 'messages' parameter. It must be an array of messages." });
    }

    if (messages.length === 0) {
      return res.status(400).json({ error: "The 'messages' array cannot be empty." });
    }

    // Lazy load the Gemini Client to avoid crash-on-startup issues if API key is initially missing.
    const ai = getGeminiClient();

    // Map client messages to Gemini content format
    // Roles: 'user' and 'model'
    const formattedContents = messages.map((msg: any) => {
      const allowedRole = msg.role === "assistant" || msg.role === "model" ? "model" : "user";
      return {
        role: allowedRole,
        parts: [{ text: msg.content || "" }]
      };
    });

    // Run generateContent calling 'gemini-3.5-flash' for chatbot task
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: formattedContents,
      config: {
        systemInstruction: systemInstruction || "You are a helpful, friendly, and intelligent AI companion.",
        temperature: typeof temperature === "number" ? temperature : 0.7,
      }
    });

    // Extract raw text response
    const botReply = response.text || "No response generated.";

    return res.json({
      content: botReply
    });

  } catch (error: any) {
    console.error("Gemini API Error in /api/chat:", error);
    return res.status(500).json({
      error: error.message || "An error occurred while communicating with Gemini."
    });
  }
});

// Setup development or production environment
async function setupVite() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Setting up Vite server middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Setting up Production static folder serving...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

setupVite().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
