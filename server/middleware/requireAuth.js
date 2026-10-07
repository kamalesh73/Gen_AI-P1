import { findUserById, toPublicUser } from "../services/userService.js";
import { verifyToken } from "../services/authService.js";

export default async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";

    if (!token) return res.status(401).json({ error: "Authentication required." });

    const payload = verifyToken(token);
    const user = await findUserById(payload.sub);

    if (!user) return res.status(401).json({ error: "Account not found." });

    req.user = toPublicUser(user);
    return next();
  } catch {
    return res.status(401).json({ error: "Session expired. Please log in again." });
  }
}
