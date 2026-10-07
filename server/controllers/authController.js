import { authenticateUser, registerUser } from "../services/authService.js";

export function signUp(req, res) {
  const name = String(req.body.name || "").trim();
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");

  if (!name || !email || password.length < 6) {
    return res.status(400).json({ error: "Name, email, and a 6+ character password are required." });
  }

  return registerUser({ name, email, password })
    .then((payload) => res.status(201).json(payload))
    .catch((error) => {
      if (!error.status) console.error(error);
      return res.status(error.status || 500).json({
        error: error.status ? error.message : "Could not create account."
      });
    });
}

export function logIn(req, res) {
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");

  return authenticateUser({ email, password })
    .then((payload) => res.json(payload))
    .catch((error) => {
      if (!error.status) console.error(error);
      return res.status(error.status || 500).json({
        error: error.status ? error.message : "Could not log in."
      });
    });
}

export function getCurrentUser(req, res) {
  return res.json({ user: req.user });
}
