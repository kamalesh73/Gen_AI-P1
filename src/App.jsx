import { useEffect, useMemo, useState } from "react";
import {
  Brain,
  CheckCircle2,
  Copy,
  Database,
  GraduationCap,
  History,
  Loader2,
  Sparkles
} from "lucide-react";
import "./styles.css";

const topics = ["Data Structures", "Algorithms", "DBMS", "Operating Systems", "JavaScript", "System Design"];
const difficulties = ["easy", "intermediate", "hard"];

export default function App() {
  const [form, setForm] = useState({
    topic: "Data Structures",
    difficulty: "intermediate",
    quantity: 5,
    mode: "questions-and-answers"
  });
  const [result, setResult] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/health")
      .then((res) => res.json())
      .then(setHealth)
      .catch(() => setHealth({ provider: "unknown", database: "unknown" }));
    loadSessions();
  }, []);

  const providerLabel = useMemo(() => {
    if (!health) return "Checking";
    return health.provider === "groqcloud" ? "GroqCloud enabled" : "Local demo mode";
  }, [health]);

  async function loadSessions() {
    const response = await fetch("/api/sessions");
    setSessions(await response.json());
  }

  async function generateQuestions(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Generation failed.");

      setResult(data);
      loadSessions();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function copySet() {
    if (!result) return;
    const text = result.questions
      .map((item, index) => `${index + 1}. ${item.question}\nAnswer: ${item.answer}`)
      .join("\n\n");
    navigator.clipboard.writeText(text);
  }

  return (
    <main className="app-shell">
      <section className="workspace">
        <aside className="control-panel">
          <div className="brand-row">
            <div className="brand-mark">
              <GraduationCap size={22} />
            </div>
            <div>
              <h1>Interview Practice Generator</h1>
              <p>{providerLabel}</p>
            </div>
          </div>

          <form onSubmit={generateQuestions} className="generator-form">
            <label>
              Topic
              <input
                list="topic-list"
                value={form.topic}
                onChange={(event) => updateField("topic", event.target.value)}
                placeholder="e.g. Dynamic Programming"
              />
              <datalist id="topic-list">
                {topics.map((topic) => (
                  <option key={topic} value={topic} />
                ))}
              </datalist>
            </label>

            <label>
              Difficulty
              <div className="segmented">
                {difficulties.map((level) => (
                  <button
                    type="button"
                    key={level}
                    className={form.difficulty === level ? "active" : ""}
                    onClick={() => updateField("difficulty", level)}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </label>

            <label>
              Quantity
              <input
                type="range"
                min="1"
                max="10"
                value={form.quantity}
                onChange={(event) => updateField("quantity", Number(event.target.value))}
              />
              <span className="range-value">{form.quantity} questions</span>
            </label>

            <label>
              Output
              <select value={form.mode} onChange={(event) => updateField("mode", event.target.value)}>
                <option value="questions-and-answers">Questions with answers</option>
                <option value="questions-only">Questions only</option>
                <option value="mock-test">Mock test style</option>
              </select>
            </label>

            <button className="primary-action" disabled={loading}>
              {loading ? <Loader2 className="spin" size={18} /> : <Sparkles size={18} />}
              Generate Practice Set
            </button>
          </form>

          <div className="status-strip">
            <span>
              <Brain size={16} />
              {health?.provider || "provider"}
            </span>
            <span>
              <Database size={16} />
              {health?.database || "database"}
            </span>
          </div>
        </aside>

        <section className="results-panel">
          <div className="results-header">
            <div>
              <p className="eyebrow">Practice Set</p>
              <h2>{result ? `${result.topic} · ${result.difficulty}` : "Generate a tailored interview round"}</h2>
            </div>
            <button className="icon-button" onClick={copySet} disabled={!result} title="Copy practice set">
              <Copy size={18} />
            </button>
          </div>

          {error && <div className="error-box">{error}</div>}

          {!result && !loading && (
            <div className="empty-state">
              <Sparkles size={26} />
              <p>Select a topic, difficulty, and count to create fresh placement practice questions.</p>
            </div>
          )}

          {loading && (
            <div className="empty-state">
              <Loader2 className="spin" size={30} />
              <p>Building a clean, non-repeating set...</p>
            </div>
          )}

          {result && !loading && (
            <div className="question-list">
              {result.questions.map((item, index) => (
                <article className="question-card" key={`${item.question}-${index}`}>
                  <div className="question-topline">
                    <span>Question {index + 1}</span>
                    <span>{item.difficulty}</span>
                  </div>
                  <h3>{item.question}</h3>
                  {form.mode !== "questions-only" && <p className="answer">{item.answer}</p>}
                  <p>{item.explanation}</p>
                  <div className="tag-row">
                    {item.tags.map((tag) => (
                      <span key={tag}>{tag}</span>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <aside className="history-panel">
          <div className="history-title">
            <History size={18} />
            Recent Sets
          </div>
          {sessions.length === 0 ? (
            <p className="muted">Saved sessions appear after MongoDB is connected.</p>
          ) : (
            sessions.map((session) => (
              <button key={session._id} className="history-item" onClick={() => setResult(session)}>
                <CheckCircle2 size={16} />
                <span>{session.topic}</span>
                <small>{session.difficulty}</small>
              </button>
            ))
          )}
        </aside>
      </section>
    </main>
  );
}
