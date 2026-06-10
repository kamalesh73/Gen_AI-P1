# Interview Practice Generator

A MERN-style interview question generator for placement practice. Users choose a topic, difficulty, output mode, and quantity; the backend generates a fresh question set with answers and explanations.

## Features

- React interface for topic, difficulty, quantity, and output mode selection.
- Express API endpoint for generated practice sets.
- GroqCloud chat completion integration when `GROQ_API_KEY` is configured.
- Local fallback generator so the demo works offline.
- Optional MongoDB storage for recent generated sessions.
- Duplicate filtering and JSON normalization for model outputs.

## Run Locally

```bash
npm install
npm run dev
```

Open `http://127.0.0.1:5173`.

Copy `.env.example` to `.env` and set values as needed:

```bash
GROQ_API_KEY=your_api_key
GROQ_MODEL=llama-3.3-70b-versatile
MONGODB_URI=mongodb://127.0.0.1:27017/interview-generator
```

If no API key is provided, the server uses local demo-mode questions.

## API

`POST /api/generate`

```json
{
  "topic": "Dynamic Programming",
  "difficulty": "intermediate",
  "quantity": 5,
  "mode": "questions-and-answers"
}
```

Example response:

```json
{
  "topic": "Dynamic Programming",
  "difficulty": "intermediate",
  "quantity": 5,
  "mode": "questions-and-answers",
  "provider": "groqcloud",
  "questions": [
    {
      "question": "How do you identify overlapping subproblems in a DP problem?",
      "answer": "Look for repeated recursive states that can be cached.",
      "explanation": "Define the state, transition, base case, and complexity.",
      "tags": ["Dynamic Programming", "intermediate"],
      "difficulty": "intermediate"
    }
  ]
}
```

## Resume Bullet

Created a GroqCloud-backed interview question generator that accepts topic, difficulty, and quantity inputs, then outputs curated placement practice questions with answers and explanations.

## Demo Talking Points

- Better than static lists because it creates tailored variations on demand.
- Quality is improved through structured JSON prompting, duplicate filtering, and answer/explanation generation.
- The app works without a dataset, with optional MongoDB history and room for future fine-tuning.

## Future Extensions

- Add multi-turn explanations for each answer.
- Record spoken answers and connect with an interview analyzer.
- Add quiz scoring and spaced revision.
