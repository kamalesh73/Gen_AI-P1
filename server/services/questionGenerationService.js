import Groq from "groq-sdk";
import { buildPrompt, fallbackQuestions, normalizeQuestions } from "../questionService.js";

const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;

export function getQuestionProvider() {
  return groq ? "groqcloud" : "local-fallback";
}

export async function generateQuestions(options) {
  if (!groq) return fallbackQuestions(options);

  const response = await groq.chat.completions.create({
    model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content: "You generate accurate interview practice questions. Always return valid JSON only."
      },
      {
        role: "user",
        content: buildPrompt(options)
      }
    ],
    response_format: { type: "json_object" },
    temperature: 0.7
  });

  return normalizeQuestions(response.choices[0]?.message?.content || "", options.quantity);
}
