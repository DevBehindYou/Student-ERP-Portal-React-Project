import mongoose from "mongoose";

const ExamSchema = new mongoose.Schema(
  {
    sectionId: { type: mongoose.Schema.Types.ObjectId, ref: "Section", required: true },
    name:      { type: String, required: true, trim: true },
    maxMarks:  { type: Number, default: 100 },
    examDate:  { type: Date, required: true },
  },
  { timestamps: true }
);

export const Exam = mongoose.models.Exam || mongoose.model("Exam", ExamSchema);
