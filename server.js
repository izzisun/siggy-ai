import express from "express";
import Groq from "groq-sdk";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config(); // baca .env

const app = express();
app.use(express.json());
app.use(express.static("."));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Halaman utama
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Inisialisasi Groq AI
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

// Chat history per session (multi-session sederhana)
let sessions = {};

app.post("/chat", async (req, res) => {
  try {
    const { message, sessionId } = req.body;
    if (!sessionId) return res.status(400).json({ error: "sessionId required" });

    if (!sessions[sessionId]) sessions[sessionId] = [];

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
    sessions[sessionId].push({ role: "assistant", content: reply });

    res.json({ reply });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "AI error" });
  }
});

// Port mengikuti Replit
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Siggy AI running on port ${PORT}`);
});