import mongoose from "mongoose";

const ResultSchema = new mongoose.Schema(
  {
    examId:        { type: mongoose.Schema.Types.ObjectId, ref: "Exam", required: true },
    studentId:     { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    marksObtained: { type: Number, default: null },
  },
  { timestamps: true }
);

ResultSchema.index({ examId: 1, studentId: 1 }, { unique: true });

export const Result = mongoose.models.Result || mongoose.model("Result", ResultSchema);
