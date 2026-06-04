import mongoose, { Schema } from "mongoose";

const NoticeSchema = new Schema({
  title: { type: String, required: true, trim: true },
  body: { type: String, required: true, trim: true },
  audience: { type: String, enum: ["ALL", "STUDENT", "TEACHER"], default: "ALL" },
  attachments: [String],
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  createdAt: { type: Date, default: Date.now }
});

NoticeSchema.index({ audience: 1, createdAt: -1 });

export const Notice = mongoose.models.Notice || mongoose.model("Notice", NoticeSchema);
