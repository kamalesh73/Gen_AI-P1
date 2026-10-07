import { listSessionsForUser } from "../services/sessionService.js";

export async function listRecent(req, res) {
  try {
    const sessions = await listSessionsForUser(req.user.id);
    return res.json(sessions);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Could not load recent sessions." });
  }
}
