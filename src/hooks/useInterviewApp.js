import { useEffect, useMemo, useState } from "react";
import {
  authenticate,
  generatePracticeSet,
  getCurrentUser,
  getHealth,
  getSessions
} from "../services/api.js";

const tokenKey = "interview-generator-token";
const userKey = "interview-generator-user";

export default function useInterviewApp() {
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
    getHealth()
      .then(setHealth)
      .catch(() => setHealth({ provider: "unknown", database: "unknown", auth: "unknown" }));
  }, []);

  useEffect(() => {
    if (!token) return;

    getCurrentUser(token)
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

  async function loadSessions(activeToken = token) {
    if (!activeToken) return;
    try {
      setSessions(await getSessions(activeToken));
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function handleAuth(event) {
    event.preventDefault();
    setAuthLoading(true);
    setError("");

    try {
      const data = await authenticate(authMode, authForm);
      saveSession(data.token, data.user);
      setAuthForm({ name: "", email: "", password: "" });
      loadSessions(data.token);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setAuthLoading(false);
    }
  }

  async function generateQuestions(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const data = await generatePracticeSet(form, token);
      setResult(data);
      loadSessions();
    } catch (requestError) {
      setError(requestError.message);
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

  return {
    authMode,
    setAuthMode,
    authForm,
    updateAuthField,
    token,
    user,
    form,
    result,
    setResult,
    sessions,
    health,
    loading,
    authLoading,
    error,
    providerLabel,
    greetingName,
    handleAuth,
    generateQuestions,
    logout,
    updateField,
    copySet
  };
}

function readStoredUser() {
  try {
    return JSON.parse(localStorage.getItem(userKey) || "null");
  } catch {
    return null;
  }
}
