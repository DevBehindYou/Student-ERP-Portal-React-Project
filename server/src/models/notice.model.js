import mongoose, { Schema } from "mongoose";
const NoticeSchema = new Schema({
  title: { type: String, required: true },
  body: { type: String, required: true },
  audience: { type: String, enum: ["ALL", "STUDENT", "TEACHER"], default: "ALL" },
  attachments: [String],
  createdBy: Number,
  createdAt: { type: Date, default: Date.now }
});
export const Notice = mongoose.model("Notice", NoticeSchema);
