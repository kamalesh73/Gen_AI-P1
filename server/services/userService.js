import User from "../models/User.js";
import { isDatabaseConnected } from "../config/database.js";

const memoryUsers = new Map();

export async function findUserByEmail(email) {
  if (isDatabaseConnected()) return User.findOne({ email }).lean();
  return memoryUsers.get(email) || null;
}

export async function findUserById(id) {
  if (isDatabaseConnected()) return User.findById(id).lean();
  return [...memoryUsers.values()].find((user) => user.id === id) || null;
}

export async function createUser({ name, email, passwordHash }) {
  if (isDatabaseConnected()) {
    const user = await User.create({ name, email, passwordHash });
    return user.toObject();
  }

  const user = { id: createId(), name, email, passwordHash, createdAt: new Date().toISOString() };
  memoryUsers.set(email, user);
  return user;
}

export function toPublicUser(user) {
  return {
    id: String(user._id || user.id),
    name: user.name,
    email: user.email
  };
}

function createId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
