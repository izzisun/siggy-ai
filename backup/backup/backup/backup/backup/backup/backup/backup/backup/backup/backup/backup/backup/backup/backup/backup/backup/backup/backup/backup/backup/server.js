// server.js
import express from "express";
import Groq from "groq-sdk";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// ========================
// Setup path & load .env
// ========================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });

// Debug: pastikan API key terbaca
console.log("Loaded GROQ KEY:", process.env.GROQ_API_KEY);

const app = express();
app.use(express.json());
app.use(express.static("."));

// ========================
// Halaman utama
// ========================
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// ========================
// Inisialisasi Groq AI
// ========================
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

// ========================
// Chat history per session
// ========================
let sessions = {};

app.post("/chat", async (req, res) => {
  try {
    const { message, sessionId } = req.body;
    if (!sessionId) return res.status(400).json({ error: "sessionId required" });

    if (!sessions[sessionId]) sessions[sessionId] = [];

    // Push message user
    sessions[sessionId].push({ role: "user", content: message });

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content: "Your name is Siggy. You are a friendly AI assistant that helps users with coding, crypto, web3, and general questions."
        },
        ...sessions[sessionId]
      ]
    });

    const reply = completion.choices[0].message.content;

    // Push reply AI
    sessions[sessionId].push({ role: "assistant", content: reply });

    res.json({ reply });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "AI error" });
  }
});

// ========================
// Start server
// ========================
app.listen(3000, () => {
  console.log("Siggy AI running on http://localhost:3000");
});