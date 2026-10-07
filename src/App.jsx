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
import useInterviewApp from "./hooks/useInterviewApp.js";
import "./styles.css";

const topics = ["Data Structures", "Algorithms", "DBMS", "Operating Systems", "JavaScript", "System Design"];
const difficulties = ["easy", "intermediate", "hard"];

export default function App() {
  const {
    authMode, setAuthMode, authForm, updateAuthField, token, user, form, result, setResult, sessions,
    health, loading, authLoading, error, providerLabel, greetingName, handleAuth, generateQuestions,
    logout, updateField, copySet
  } = useInterviewApp();

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
