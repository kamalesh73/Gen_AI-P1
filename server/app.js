import express from "express";
import cors from "cors";
import { getHealth } from "./controllers/healthController.js";
import authRoutes from "./routes/authRoutes.js";
import questionRoutes from "./routes/questionRoutes.js";
import sessionRoutes from "./routes/sessionRoutes.js";

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", getHealth);
app.use("/api/auth", authRoutes);
app.use("/api", questionRoutes);
app.use("/api", sessionRoutes);

export default app;
