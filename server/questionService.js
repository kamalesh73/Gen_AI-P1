const templates = [
  {
    question: "How would you explain {topic} to a teammate before solving a coding problem?",
    answer: "Start with the core idea, name the tradeoffs, then connect it to a small example."
  },
  {
    question: "What edge cases should you check when using {topic} in an interview solution?",
    answer: "Check empty inputs, duplicate values, boundary sizes, invalid assumptions, and performance limits."
  },
  {
    question: "Design a problem where {topic} is the intended solution pattern.",
    answer: "State the input, output, constraints, and why the chosen pattern improves over brute force."
  },
  {
    question: "Compare {topic} with a simpler brute-force approach.",
    answer: "Describe correctness first, then compare time complexity, space complexity, and readability."
  },
  {
    question: "What common mistake do candidates make with {topic}?",
    answer: "They jump into code before defining state, invariants, termination conditions, or complexity."
  },
  {
    question: "Write the high-level steps for solving a {topic} problem.",
    answer: "Clarify constraints, choose the pattern, define variables or state, run an example, then code."
  },
  {
    question: "How would you test a solution that uses {topic}?",
    answer: "Use simple cases, boundary cases, adversarial cases, and one larger case to validate complexity."
  },
  {
    question: "When should you avoid using {topic}?",
    answer: "Avoid it when it adds unnecessary complexity or when constraints make a simpler method sufficient."
  },
  {
    question: "Explain the time and space complexity of a typical {topic} solution.",
    answer: "Tie each loop, recursion branch, or stored structure directly to the input size."
  },
  {
    question: "How would you improve a first-pass solution involving {topic}?",
    answer: "Look for repeated work, unnecessary memory, unclear state, and opportunities to precompute."
  }
];

export function buildPrompt({ topic, difficulty, quantity, mode }) {
  return `Generate ${quantity} ${difficulty} interview practice items about "${topic}".

Return only valid JSON with this exact shape:
{
  "questions": [
    {
      "question": "string",
      "answer": "string",
      "explanation": "string",
      "tags": ["string"],
      "difficulty": "${difficulty}"
    }
  ]
}

Mode: ${mode}.
Make the questions practical for campus placements and software engineering interviews.
Avoid duplicates. Keep answers accurate, concise, and suitable for revision.`;
}

export function normalizeQuestions(text, quantity) {
  const parsed = parseJson(text);
  const rawQuestions = Array.isArray(parsed?.questions) ? parsed.questions : [];
  const seen = new Set();

  return rawQuestions
    .filter((item) => item?.question)
    .map((item) => ({
      question: clean(item.question),
      answer: clean(item.answer || "Review the concept and explain it with an example."),
      explanation: clean(item.explanation || "Focus on correctness, constraints, and complexity."),
      tags: Array.isArray(item.tags) ? item.tags.slice(0, 4).map(clean) : [],
      difficulty: clean(item.difficulty || "intermediate")
    }))
    .filter((item) => {
      const key = item.question.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, quantity);
}

export function fallbackQuestions({ topic, difficulty, quantity, mode }) {
  return templates.slice(0, quantity).map((template, index) => ({
    question: template.question.replaceAll("{topic}", topic),
    answer: template.answer,
    explanation:
      mode === "questions-only"
        ? "Use this as a prompt for timed practice, then reveal or write your own answer."
        : "In an interview, explain the reasoning before the final answer and mention complexity where relevant.",
    tags: [topic, difficulty, index % 2 === 0 ? "concept" : "practice"],
    difficulty
  }));
}

function parseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

function clean(value) {
  return String(value || "").trim();
}
