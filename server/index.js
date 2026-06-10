import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import Groq from "groq-sdk";
import { buildPrompt, fallbackQuestions, normalizeQuestions } from "./questionService.js";

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: "1mb" }));

let Session = null;

async function connectMongo() {
  if (!process.env.MONGODB_URI) return;

  await mongoose.connect(process.env.MONGODB_URI);
  const questionSchema = new mongoose.Schema(
    {
      topic: String,
      difficulty: String,
      quantity: Number,
      mode: String,
      questions: Array
    },
    { timestamps: true }
  );
  Session = mongoose.models.Session || mongoose.model("Session", questionSchema);
}

const groq = process.env.GROQ_API_KEY
  ? new Groq({ apiKey: process.env.GROQ_API_KEY })
  : null;

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    provider: groq ? "groqcloud" : "local-fallback",
    database: Session ? "mongodb" : "in-memory"
  });
});

app.post("/api/generate", async (req, res) => {
  try {
    const topic = String(req.body.topic || "").trim();
    const difficulty = String(req.body.difficulty || "intermediate").trim();
    const quantity = Math.min(Math.max(Number(req.body.quantity) || 5, 1), 10);
    const mode = String(req.body.mode || "questions-and-answers").trim();

    if (!topic) {
      return res.status(400).json({ error: "Topic is required." });
    }

    let questions;
    let provider = "local-fallback";

    if (groq) {
      const response = await groq.chat.completions.create({
        model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content:
              "You generate accurate interview practice questions. Always return valid JSON only."
          },
          {
            role: "user",
            content: buildPrompt({ topic, difficulty, quantity, mode })
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7
      });

      questions = normalizeQuestions(response.choices[0]?.message?.content || "", quantity);
      provider = "groqcloud";
    } else {
      questions = fallbackQuestions({ topic, difficulty, quantity, mode });
    }

    const payload = { topic, difficulty, quantity, mode, questions, provider };

    if (Session) {
      await Session.create(payload);
    }

    res.json(payload);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Could not generate questions. Check your API key, model, or network connection."
    });
  }
});

app.get("/api/sessions", async (_req, res) => {
  if (!Session) return res.json([]);
  const sessions = await Session.find().sort({ createdAt: -1 }).limit(8).lean();
  res.json(sessions);
});

connectMongo()
  .catch((error) => {
    console.warn("MongoDB disabled:", error.message);
  })
  .finally(() => {
    app.listen(port, () => {
      console.log(`API running on http://127.0.0.1:${port}`);
    });
  });
