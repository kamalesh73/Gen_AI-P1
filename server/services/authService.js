import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { createUser, findUserByEmail, toPublicUser } from "./userService.js";

const jwtSecret = process.env.JWT_SECRET || "dev-only-change-this-secret";

export async function registerUser({ name, email, password }) {
  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    const error = new Error("An account with this email already exists.");
    error.status = 409;
    throw error;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  return createAuthPayload(await createUser({ name, email, passwordHash }));
}

export async function authenticateUser({ email, password }) {
  const user = await findUserByEmail(email);
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    const error = new Error("Invalid email or password.");
    error.status = 401;
    throw error;
  }

  return createAuthPayload(user);
}

export function verifyToken(token) {
  return jwt.verify(token, jwtSecret);
}

function createAuthPayload(user) {
  const safeUser = toPublicUser(user);
  const token = jwt.sign({ sub: safeUser.id, email: safeUser.email }, jwtSecret, { expiresIn: "7d" });
  return { user: safeUser, token };
}
