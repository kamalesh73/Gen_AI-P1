import { isDatabaseConnected } from "../config/database.js";
import { getQuestionProvider } from "../services/questionGenerationService.js";

export function getHealth(_req, res) {
  const databaseConnected = isDatabaseConnected();
  return res.json({
    ok: true,
    provider: getQuestionProvider(),
    database: databaseConnected ? "mongodb" : "in-memory",
    auth: databaseConnected ? "mongodb-jwt" : "memory-jwt"
  });
}
