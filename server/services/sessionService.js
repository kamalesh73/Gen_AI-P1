import Session from "../models/Session.js";
import { isDatabaseConnected } from "../config/database.js";

const memorySessions = [];

export async function createSession(payload) {
  if (isDatabaseConnected()) return Session.create(payload);

  const session = {
    ...payload,
    _id: createId(),
    createdAt: new Date().toISOString()
  };
  memorySessions.unshift(session);
  return session;
}

export async function listSessionsForUser(userId) {
  if (isDatabaseConnected()) {
    return Session.find({ userId }).sort({ createdAt: -1 }).limit(8).lean();
  }

  return memorySessions
    .filter((session) => session.userId === userId)
    .slice(0, 8)
    .map(({ userId: _userId, ...session }) => session);
}

function createId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
