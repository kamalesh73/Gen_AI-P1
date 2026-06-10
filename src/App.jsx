import { useEffect, useMemo, useState } from "react";
import {
  Brain,
  CheckCircle2,
  Copy,
  Database,
  GraduationCap,
  History,
  Loader2,
  LogOut,
  Mail,
  ShieldCheck,
  Sparkles,
  UserRound
} from "lucide-react";
import "./styles.css";

const topics = ["Data Structures", "Algorithms", "DBMS", "Operating Systems", "JavaScript", "System Design"];
const difficulties = ["easy", "intermediate", "hard"];
const tokenKey = "interview-generator-token";
const userKey = "interview-generator-user";
const apiBaseUrl = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
const apiUrl = (path) => `${apiBaseUrl}${path}`;

export default function App() {
  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState({ name: "", email: "", password: "" });
  const [token, setToken] = useState(() => localStorage.getItem(tokenKey) || "");
  const [user, setUser] = useState(() => readStoredUser());
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
  const [authLoading, setAuthLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(apiUrl("/api/health"))
      .then((res) => res.json())
      .then(setHealth)
      .catch(() => setHealth({ provider: "unknown", database: "unknown", auth: "unknown" }));
  }, []);

  useEffect(() => {
    if (!token) return;

    apiFetch("/api/auth/me")
      .then((data) => {
        saveSession(data.token || token, data.user);
        loadSessions(token);
      })
      .catch(() => logout());
  }, [token]);

  const providerLabel = useMemo(() => {
    if (!health) return "Checking";
    return health.provider === "groqcloud" ? "GroqCloud enabled" : "Local demo mode";
  }, [health]);

  const greetingName = user?.name?.split(" ")[0] || "there";

  async function apiFetch(url, options = {}) {
    const response = await fetch(apiUrl(url), {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {})
      }
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Request failed.");
    return data;
  }

  async function loadSessions(activeToken = token) {
    if (!activeToken) return;
    const response = await fetch(apiUrl("/api/sessions"), {
      headers: { Authorization: `Bearer ${activeToken}` }
    });
    if (response.ok) setSessions(await response.json());
  }

  async function handleAuth(event) {
    event.preventDefault();
    setAuthLoading(true);
    setError("");

    try {
      const endpoint = authMode === "signup" ? "/api/auth/signup" : "/api/auth/login";
      const body =
        authMode === "signup"
          ? authForm
          : { email: authForm.email, password: authForm.password };
      const response = await fetch(apiUrl(endpoint), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Authentication failed.");

      saveSession(data.token, data.user);
      setAuthForm({ name: "", email: "", password: "" });
      loadSessions(data.token);
    } catch (err) {
      setError(err.message);
    } finally {
      setAuthLoading(false);
    }
  }

  async function generateQuestions(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const data = await apiFetch("/api/generate", {
        method: "POST",
        body: JSON.stringify(form)
      });

      setResult(data);
      loadSessions();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function saveSession(nextToken, nextUser) {
    localStorage.setItem(tokenKey, nextToken);
    localStorage.setItem(userKey, JSON.stringify(nextUser));
    setToken(nextToken);
    setUser(nextUser);
  }

  function logout() {
    localStorage.removeItem(tokenKey);
    localStorage.removeItem(userKey);
    setToken("");
    setUser(null);
    setResult(null);
    setSessions([]);
  }

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function updateAuthField(field, value) {
    setAuthForm((current) => ({ ...current, [field]: value }));
  }

  function copySet() {
    if (!result) return;
    const text = result.questions
      .map((item, index) => `${index + 1}. ${item.question}\nAnswer: ${item.answer}`)
      .join("\n\n");
    navigator.clipboard.writeText(text);
  }

  if (!user || !token) {
    return (
      <main className="auth-shell">
        <section className="auth-card">
          <div className="auth-story">
            <div className="brand-row">
              <div className="brand-mark">
                <GraduationCap size={24} />
              </div>
              <div>
                <h1>Interview Practice Generator</h1>
                <p>{providerLabel}</p>
              </div>
            </div>
            <h2>Practice like someone is actually sitting across the table.</h2>
            <p>
              Create focused interview rounds, keep your recent sets, and come back to the topics
              that still need one more pass.
            </p>
            <div className="trust-row">
              <span>
                <ShieldCheck size={16} />
                JWT sessions
              </span>
              <span>
                <Brain size={16} />
                GroqCloud ready
              </span>
              <span>
                <Database size={16} />
                MongoDB optional
              </span>
            </div>
          </div>

          <form className="auth-form" onSubmit={handleAuth}>
            <div className="auth-tabs">
              <button type="button" className={authMode === "login" ? "active" : ""} onClick={() => setAuthMode("login")}>
                Login
              </button>
              <button type="button" className={authMode === "signup" ? "active" : ""} onClick={() => setAuthMode("signup")}>
                Sign up
              </button>
            </div>

            {authMode === "signup" && (
              <label>
                Name
                <div className="field-with-icon">
                  <UserRound size={17} />
                  <input value={authForm.name} onChange={(event) => updateAuthField("name", event.target.value)} />
                </div>
              </label>
            )}

            <label>
              Email
              <div className="field-with-icon">
                <Mail size={17} />
                <input
                  type="email"
                  value={authForm.email}
                  onChange={(event) => updateAuthField("email", event.target.value)}
                />
              </div>
            </label>

            <label>
              Password
              <input
                type="password"
                minLength="6"
                value={authForm.password}
                onChange={(event) => updateAuthField("password", event.target.value)}
              />
            </label>

            {error && <div className="error-box compact">{error}</div>}

            <button className="primary-action" disabled={authLoading}>
              {authLoading ? <Loader2 className="spin" size={18} /> : <ShieldCheck size={18} />}
              {authMode === "signup" ? "Create Account" : "Continue Practice"}
            </button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <section className="top-bar">
        <div className="brand-row">
          <div className="brand-mark">
            <GraduationCap size={22} />
          </div>
          <div>
            <h1>Interview Practice Generator</h1>
            <p>Welcome back, {greetingName}</p>
          </div>
        </div>
        <button className="ghost-action" onClick={logout}>
          <LogOut size={17} />
          Logout
        </button>
      </section>

      <section className="workspace">
        <aside className="control-panel">
          <div>
            <p className="eyebrow">Build Your Round</p>
            <h2>What should we sharpen today?</h2>
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
              {providerLabel}
            </span>
            <span>
              <Database size={16} />
              {health?.database || "database"}
            </span>
            <span>
              <ShieldCheck size={16} />
              Signed in
            </span>
          </div>
        </aside>

        <section className="results-panel">
          <div className="results-header">
            <div>
              <p className="eyebrow">Practice Set</p>
              <h2>{result ? `${result.topic} - ${result.difficulty}` : "Your next interview round is waiting"}</h2>
            </div>
            <button className="icon-button" onClick={copySet} disabled={!result} title="Copy practice set">
              <Copy size={18} />
            </button>
          </div>

          {error && <div className="error-box">{error}</div>}

          {!result && !loading && (
            <div className="empty-state">
              <Sparkles size={28} />
              <p>Pick a topic and generate a round. Keep it small, honest, and repeatable.</p>
            </div>
          )}

          {loading && (
            <div className="empty-state">
              <Loader2 className="spin" size={30} />
              <p>Writing questions that feel useful, not random...</p>
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
          <div className="profile-card">
            <div className="avatar">{greetingName.slice(0, 1).toUpperCase()}</div>
            <div>
              <strong>{user.name}</strong>
              <span>{user.email}</span>
            </div>
          </div>

          <div className="history-title">
            <History size={18} />
            Recent Sets
          </div>
          {sessions.length === 0 ? (
            <p className="muted">Your saved rounds will appear here after you generate one.</p>
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

function readStoredUser() {
  try {
    return JSON.parse(localStorage.getItem(userKey) || "null");
  } catch {
    return null;
  }
}
