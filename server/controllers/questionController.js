import { createSession } from "../services/sessionService.js";
import { generateQuestions, getQuestionProvider } from "../services/questionGenerationService.js";

export async function generate(req, res) {
  try {
    const topic = String(req.body.topic || "").trim();
    const difficulty = String(req.body.difficulty || "intermediate").trim();
    const quantity = Math.min(Math.max(Number(req.body.quantity) || 5, 1), 10);
    const mode = String(req.body.mode || "questions-and-answers").trim();

    if (!topic) {
      return res.status(400).json({ error: "Topic is required." });
    }

    const questions = await generateQuestions({ topic, difficulty, quantity, mode });
    await createSession({
      userId: req.user.id,
      topic,
      difficulty,
      quantity,
      mode,
      questions,
      provider: getQuestionProvider()
    });

    return res.json({
      topic,
      difficulty,
      quantity,
      mode,
      questions,
      provider: getQuestionProvider()
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "Could not generate questions. Check your API key, model, or network connection."
    });
  }
}
