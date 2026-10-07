import mongoose from "mongoose";

export async function connectDatabase() {
  if (!process.env.MONGODB_URI) return false;

  await mongoose.connect(process.env.MONGODB_URI);
  return true;
}

export function isDatabaseConnected() {
  return mongoose.connection.readyState === 1;
}

export { mongoose };
