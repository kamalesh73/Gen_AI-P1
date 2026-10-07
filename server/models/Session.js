import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    topic: String,
    difficulty: String,
    quantity: Number,
    mode: String,
    questions: Array
  },
  { timestamps: true }
);

export default mongoose.models.Session || mongoose.model("Session", sessionSchema);
