import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import Groq from "groq-sdk";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { buildPrompt, fallbackQuestions, normalizeQuestions } from "./questionService.js";

const app = express();
const port = process.env.PORT || 5000;
const jwtSecret = process.env.JWT_SECRET || "dev-only-change-this-secret";

app.use(cors());
app.use(express.json({ limit: "1mb" }));

let Session = null;
let User = null;
const memoryUsers = new Map();
const memorySessions = [];

async function connectMongo() {
  if (!process.env.MONGODB_URI) return;

  await mongoose.connect(process.env.MONGODB_URI);
  const userSchema = new mongoose.Schema(
    {
      name: { type: String, required: true, trim: true },
      email: { type: String, required: true, unique: true, lowercase: true, trim: true },
      passwordHash: { type: String, required: true }
    },
    { timestamps: true }
  );
  const questionSchema = new mongoose.Schema(
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      topic: String,
      difficulty: String,
      quantity: Number,
      mode: String,
      questions: Array
    },
    { timestamps: true }
  );
  User = mongoose.models.User || mongoose.model("User", userSchema);
  Session = mongoose.models.Session || mongoose.model("Session", questionSchema);
}

const groq = process.env.GROQ_API_KEY
  ? new Groq({ apiKey: process.env.GROQ_API_KEY })
  : null;

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    provider: groq ? "groqcloud" : "local-fallback",
    database: Session ? "mongodb" : "in-memory",
    auth: User ? "mongodb-jwt" : "memory-jwt"
  });
});

app.post("/api/auth/signup", async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");

    if (!name || !email || password.length < 6) {
      return res.status(400).json({ error: "Name, email, and a 6+ character password are required." });
    }

    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: "An account with this email already exists." });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await createUser({ name, email, passwordHash });

    res.status(201).json(buildAuthPayload(user));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Could not create account." });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    const user = await findUserByEmail(email);

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    res.json(buildAuthPayload(user));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Could not log in." });
  }
});

app.get("/api/auth/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});

app.post("/api/generate", requireAuth, async (req, res) => {
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

    const payload = { userId: req.user.id, topic, difficulty, quantity, mode, questions, provider };

    if (Session) {
      await Session.create(payload);
    } else {
      memorySessions.unshift({
        ...payload,
        _id: cryptoId(),
        createdAt: new Date().toISOString()
      });
    }

    res.json({ ...payload, userId: undefined });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Could not generate questions. Check your API key, model, or network connection."
    });
  }
});

app.get("/api/sessions", requireAuth, async (req, res) => {
  if (!Session) {
    return res.json(
      memorySessions
        .filter((session) => session.userId === req.user.id)
        .slice(0, 8)
        .map(({ userId: _userId, ...session }) => session)
    );
  }
  const sessions = await Session.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(8).lean();
  res.json(sessions);
});

async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";

    if (!token) return res.status(401).json({ error: "Authentication required." });

    const payload = jwt.verify(token, jwtSecret);
    const user = await findUserById(payload.sub);

    if (!user) return res.status(401).json({ error: "Account not found." });

    req.user = publicUser(user);
    next();
  } catch {
    res.status(401).json({ error: "Session expired. Please log in again." });
  }
}

async function findUserByEmail(email) {
  if (User) return User.findOne({ email }).lean();
  return memoryUsers.get(email) || null;
}

async function findUserById(id) {
  if (User) return User.findById(id).lean();
  return [...memoryUsers.values()].find((user) => user.id === id) || null;
}

async function createUser({ name, email, passwordHash }) {
  if (User) {
    const user = await User.create({ name, email, passwordHash });
    return user.toObject();
  }

  const user = { id: cryptoId(), name, email, passwordHash, createdAt: new Date().toISOString() };
  memoryUsers.set(email, user);
  return user;
}

function buildAuthPayload(user) {
  const safeUser = publicUser(user);
  const token = jwt.sign({ sub: safeUser.id, email: safeUser.email }, jwtSecret, { expiresIn: "7d" });
  return { user: safeUser, token };
}

function publicUser(user) {
  return {
    id: String(user._id || user.id),
    name: user.name,
    email: user.email
  };
}

function cryptoId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

connectMongo()
  .catch((error) => {
    console.warn("MongoDB disabled:", error.message);
  })
  .finally(() => {
    app.listen(port, () => {
      console.log(`API running on http://127.0.0.1:${port}`);
    });
  });
