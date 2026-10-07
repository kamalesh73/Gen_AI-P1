const apiBaseUrl = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
const apiUrl = (path) => `${apiBaseUrl}${path}`;

async function request(path, options = {}, token = "") {
  const response = await fetch(apiUrl(path), {
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

export function getHealth() {
  return request("/api/health");
}

export function authenticate(mode, form) {
  const endpoint = mode === "signup" ? "/api/auth/signup" : "/api/auth/login";
  const body = mode === "signup" ? form : { email: form.email, password: form.password };
  return request(endpoint, { method: "POST", body: JSON.stringify(body) });
}

export function getCurrentUser(token) {
  return request("/api/auth/me", {}, token);
}

export function getSessions(token) {
  return request("/api/sessions", {}, token);
}

export function generatePracticeSet(form, token) {
  return request("/api/generate", { method: "POST", body: JSON.stringify(form) }, token);
}
